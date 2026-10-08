import Database from "better-sqlite3";
import { strict as assert } from "assert";

async function runTests() {
  console.log("Starting Lifecycle Tests...");
  const db = new Database("data.db");
  
  // Setup a test user
  const userId = "test_lifecycle_user";
  const user2Id = "test_lifecycle_other";
  
  // Helper to create commitment directly via DB
  const createCommitment = (id: string, uid: string = userId, state: string = "proposed") => {
    db.prepare(`
      INSERT OR REPLACE INTO commitments (id, user_id, title, type, estimated_minutes, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, uid, "Test Comm", "hard", 30, state);
  };
  
  const getCommitment = (id: string) => db.prepare("SELECT * FROM commitments WHERE id = ?").get(id) as any;
  const getEvents = (id: string) => db.prepare("SELECT * FROM events WHERE entity = 'commitment' AND JSON_EXTRACT(old_state, '$.id') = ? OR JSON_EXTRACT(new_state, '$.id') = ?").all(id, id) as any[];
  
  // We need to test via the MCP Server or via HTTP. Since MCP tools are in mcp-server process, we can actually test the DB transitions directly if we boot the server, but wait, the prompt says "run: npm run test".
  // Let me spin up the dev server and test via HTTP to be thorough, just like p0_hardening_test.
  
  const API = "http://localhost:3001/api";
  const HEADERS = { "Cookie": "saarthi_session=test_session_lifecycle", "Content-Type": "application/json" };
  
  // Setup session
  db.prepare("INSERT OR REPLACE INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run("test_session_lifecycle", userId, Date.now(), Date.now() + 10000);
  
  // 1. proposed -> pending
  createCommitment("c1", userId, "proposed");
  const r1 = await fetch(`${API}/commitments/c1/approve`, { method: "POST", headers: HEADERS });
  if (r1.status !== 200) {
    console.error("R1 Failed:", await r1.text());
  }
  assert.equal(r1.status, 200);
  assert.equal(getCommitment("c1").status, "pending");
  console.log("PASS: proposed -> pending");

  // 2. pending -> completed
  createCommitment("c2", userId, "pending");
  const r2 = await fetch(`${API}/commitments/c2/complete`, { method: "POST", headers: HEADERS });
  assert.equal(r2.status, 200);
  assert.equal(getCommitment("c2").status, "completed");
  console.log("PASS: pending -> completed");

  // 3. pending -> missed
  createCommitment("c3", userId, "pending");
  const r3 = await fetch(`${API}/commitments/c3/miss`, { method: "POST", headers: HEADERS });
  assert.equal(r3.status, 200);
  assert.equal(getCommitment("c3").status, "missed");
  console.log("PASS: pending -> missed");

  // 4. pending -> cancelled
  createCommitment("c4", userId, "pending");
  const r4 = await fetch(`${API}/commitments/c4/cancel`, { method: "POST", headers: HEADERS });
  assert.equal(r4.status, 200);
  assert.equal(getCommitment("c4").status, "cancelled");
  console.log("PASS: pending -> cancelled");

  // 5. invalid transition rejected
  createCommitment("c5", userId, "completed");
  const r5 = await fetch(`${API}/commitments/c5/complete`, { method: "POST", headers: HEADERS });
  assert.equal(r5.status, 200, "Idempotency should return 200"); // already completed -> idempotent
  
  const r5b = await fetch(`${API}/commitments/c5/miss`, { method: "POST", headers: HEADERS });
  assert.equal(r5b.status, 400); // completed -> missed not allowed
  assert.ok((await r5b.json()).error.includes("Cannot transition"));
  console.log("PASS: invalid transition rejected");

  // 6. cross-user transition rejected
  createCommitment("c6", user2Id, "pending");
  const r6 = await fetch(`${API}/commitments/c6/complete`, { method: "POST", headers: HEADERS });
  assert.equal(r6.status, 400); // not found or unauthorized
  console.log("PASS: cross-user transition rejected");

  // 7. duplicate transition idempotency
  createCommitment("c7", userId, "pending");
  await fetch(`${API}/commitments/c7/complete`, { method: "POST", headers: HEADERS });
  const countBefore = db.prepare("SELECT COUNT(*) as c FROM events WHERE type='COMMITMENT_COMPLETED' AND JSON_EXTRACT(new_state, '$.id')='c7'").get() as any;
  const r7 = await fetch(`${API}/commitments/c7/complete`, { method: "POST", headers: HEADERS });
  assert.equal(r7.status, 200);
  const countAfter = db.prepare("SELECT COUNT(*) as c FROM events WHERE type='COMMITMENT_COMPLETED' AND JSON_EXTRACT(new_state, '$.id')='c7'").get() as any;
  assert.equal(countBefore.c, 1);
  assert.equal(countAfter.c, 1); // no duplicate event
  console.log("PASS: duplicate transition idempotency");

  // 8. audit event created
  createCommitment("c8", userId, "pending");
  await fetch(`${API}/commitments/c8/cancel`, { method: "POST", headers: HEADERS });
  const eventRow = db.prepare("SELECT * FROM events WHERE type='COMMITMENT_CANCELLED' AND JSON_EXTRACT(new_state, '$.id')='c8'").get() as any;
  assert.ok(eventRow);
  assert.ok(eventRow.old_state.includes("pending"));
  assert.ok(eventRow.new_state.includes("cancelled"));
  console.log("PASS: audit event created");

  // 9. transaction rollback
  createCommitment("c9", "TRIGGER_ROLLBACK", "pending");
  db.prepare("INSERT OR REPLACE INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run("rollback_session", "TRIGGER_ROLLBACK", Date.now(), Date.now() + 10000);
  const r9 = await fetch(`${API}/commitments/c9/complete`, { method: "POST", headers: { "Cookie": "saarthi_session=rollback_session", "Content-Type": "application/json" } });
  assert.equal(r9.status, 400);
  assert.equal(getCommitment("c9").status, "pending"); // still pending
  console.log("PASS: transaction rollback");

  // 10. planner sees completed correctly
  // 11. planner sees missed correctly
  // 12. planner sees cancelled correctly
  createCommitment("p_comp", userId, "completed");
  createCommitment("p_miss", userId, "missed");
  createCommitment("p_canc", userId, "cancelled");
  createCommitment("p_pend", userId, "pending");

  const planRes = await fetch(`${API}/state`, { method: "GET", headers: HEADERS });
  const state = await planRes.json();
  const activeIds = state.commitments.map((c: any) => c.id);
  assert.ok(activeIds.includes("p_pend"), "pending is active");
  assert.ok(activeIds.includes("p_miss"), "missed is active");
  assert.ok(!activeIds.includes("p_comp"), "completed is inactive");
  assert.ok(!activeIds.includes("p_canc"), "cancelled is inactive");
  console.log("PASS: planner sees states correctly");

  console.log("ALL LIFECYCLE TESTS PASS.");
}

runTests().catch(e => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});


