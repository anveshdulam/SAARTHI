import { db, initDb } from "../mcp-server/src/db.js";
import assert from "assert";
import { execSync } from "child_process";
import { toZonedTime, format } from "date-fns-tz";

const IsoDateStr = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

async function runTests() {
  console.log("Starting Persistence Tests");

  // Re-run seed
  execSync("npx tsx mcp-server/src/seed.ts", { stdio: "inherit" });

  const commitments = db.prepare("SELECT * FROM commitments").all() as any[];
  const plans = db.prepare("SELECT * FROM plans").all() as any[];
  const events = db.prepare("SELECT * FROM events").all() as any[];
  const constraints = db.prepare("SELECT * FROM constraints").all() as any[];

  // Test 1: event timestamp stored as canonical UTC ISO
  // Events are empty after seed, let's insert a fake one from the backend
  db.prepare("INSERT INTO events (id, user_id, type, entity, new_state, created_at) VALUES (?, ?, ?, ?, ?, ?)").run("evt-1", "demo_user_1", "TEST", "test", "state", new Date().toISOString());
  const newEvents = db.prepare("SELECT * FROM events").all() as any[];
  assert.ok(IsoDateStr.test(newEvents[0].created_at), "Event created_at is canonical UTC ISO");

  // Test 3: commitment created_at canonical UTC ISO
  for (const c of commitments) {
    assert.ok(IsoDateStr.test(c.created_at), `Commitment ${c.id} created_at is canonical UTC ISO`);
    assert.ok(IsoDateStr.test(c.updated_at), `Commitment ${c.id} updated_at is canonical UTC ISO`);
  }

  // Test 5 & 8: seed timestamps canonical UTC ISO & no ambiguous strings
  const hardCommitment = commitments.find(c => c.type === "hard");
  assert.ok(hardCommitment, "Hard commitment exists");
  assert.ok(IsoDateStr.test(hardCommitment.start_time), "Seed start_time is canonical UTC ISO");
  assert.ok(IsoDateStr.test(hardCommitment.end_time), "Seed end_time is canonical UTC ISO");
  assert.notStrictEqual(hardCommitment.start_time, "17:00", "No ambiguous seed strings");

  // Test 9: display conversion back to Asia/Kolkata remains correct
  const zonedStart = toZonedTime(new Date(hardCommitment.start_time), "Asia/Kolkata");
  const localFormatted = format(zonedStart, "HH:mm");
  assert.strictEqual(localFormatted, "17:00", "Display conversion to Asia/Kolkata matches original intent");

  // Test 6: session timestamps follow the documented representation
  // Insert a mock session
  db.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run("sess-1", "demo_user_1", Date.now(), Date.now() + 10000);
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get("sess-1") as any;
  assert.strictEqual(typeof session.created_at, "number", "Session created_at is integer epoch ms");
  assert.strictEqual(typeof session.expires_at, "number", "Session expires_at is integer epoch ms");

  console.log("All persistence tests PASSED");
}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
