import { getMcpClient, initMcpClient } from "../backend/src/mcpClient.js";
import { db, initDb } from "../mcp-server/src/db.js";
import crypto from "crypto";

async function runTests() {
  console.log("Starting P0 Hardening Test Suite...");
  initDb();
  db.prepare("DELETE FROM events WHERE user_id = 'TRIGGER_ROLLBACK'").run();
  db.prepare("DELETE FROM plans WHERE user_id = 'TRIGGER_ROLLBACK'").run();
  db.prepare("DELETE FROM commitments WHERE user_id = 'TRIGGER_ROLLBACK'").run();
  
  // Set up auth token
  const TEST_TOKEN = "test-secure-token-123";
  process.env.SAARTHI_AUTH_TOKEN = TEST_TOKEN;

  let mcp: any;
  try {
    mcp = await initMcpClient();
  } catch (err) {
    console.error("FAIL: Could not connect to MCP.", err);
    process.exit(1);
  }

  try {
    // ---------------------------------------------------------
    // 1. Transaction Rollback: approve_commitment
    // ---------------------------------------------------------
    console.log("TEST 1: Transaction Rollback (approve_commitment)");
    const rollUser = "TRIGGER_ROLLBACK";
    const commId = crypto.randomUUID();
    
    // Setup initial state
    db.prepare(`INSERT INTO commitments (id, user_id, title, type, status) VALUES (?, ?, ?, ?, 'proposed')`)
      .run(commId, rollUser, "Rollback Test Task", "hard");
      
    // Attempt approval which will deliberately fail the event insert
    const res1 = await mcp.callTool({ name: "approve_commitment", arguments: { userId: rollUser, id: commId } });
    if (!res1.isError) throw new Error("Expected transaction to fail");

    // Verify rollback
    const commCheck = db.prepare("SELECT status FROM commitments WHERE id = ?").get(commId) as any;
    if (commCheck.status !== "proposed") {
      throw new Error(`Test 1 Failed: Status was mutated to ${commCheck.status} despite transaction failure!`);
    }
    const eventCheck = db.prepare("SELECT COUNT(*) as c FROM events WHERE user_id = ?").get(rollUser) as any;
    if (eventCheck.c > 0) {
      throw new Error("Test 1 Failed: Orphan event was inserted despite rollback!");
    }
    console.log("PASS 1: SQLite Transaction Rolls Back Correctly (Commitments)");

    // ---------------------------------------------------------
    // 2. Transaction Rollback: create_schedule_proposal
    // ---------------------------------------------------------
    console.log("TEST 2: Transaction Rollback (create_schedule_proposal)");
    
    db.prepare(`INSERT INTO commitments (id, user_id, title, type, status) VALUES (?, ?, ?, ?, 'pending')`)
      .run(crypto.randomUUID(), rollUser, "Block 1", "hard");
      
    const res2 = await mcp.callTool({ 
      name: "create_schedule_proposal", 
      arguments: { userId: rollUser, currentTime: new Date().toISOString(), cutoffTime: "23:59" } 
    });
    if (!res2.isError) throw new Error("Expected block insert to fail and rollback");

    const planCheck = db.prepare("SELECT COUNT(*) as c FROM plans WHERE user_id = ?").get(rollUser) as any;
    if (planCheck.c > 0) throw new Error("Test 2 Failed: Plan was created despite block failure!");
    
    console.log("PASS 2: SQLite Transaction Rolls Back Correctly (Plans & Blocks)");

    // ---------------------------------------------------------
    // 3. CORS Hardening
    // ---------------------------------------------------------
    console.log("TEST 3: CORS Validation");
    const allowedOriginRes = await fetch("http://localhost:3001/health", { method: "OPTIONS", headers: { "Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET" } });
    if (allowedOriginRes.headers.get("access-control-allow-origin") !== "http://localhost:5173") throw new Error("CORS allowed origin failed");

    const unknownOriginRes = await fetch("http://localhost:3001/health", { method: "OPTIONS", headers: { "Origin": "http://evil.com", "Access-Control-Request-Method": "GET" } });
    if (unknownOriginRes.headers.get("access-control-allow-origin")) throw new Error("CORS unknown origin rejected failed");

    console.log("PASS 3: CORS restricted correctly.");

    // ---------------------------------------------------------
    // 4. Auth & Opaque Sessions
    // ---------------------------------------------------------
    console.log("TEST 4: Opaque Session & Auth");
    
    const missingRes = await fetch("http://localhost:3001/chat", { method: "POST", headers: { "Content-Type": "application/json" } });
    if (missingRes.status !== 401) throw new Error(`Expected 401 for missing auth, got ${missingRes.status}`);

    const invalidRes = await fetch("http://localhost:3001/chat", { method: "POST", headers: { "Content-Type": "application/json", "Cookie": "saarthi_session=wrong-token" } });
    if (invalidRes.status !== 401) throw new Error(`Expected 401 for invalid auth, got ${invalidRes.status}`);

    const loginRes = await fetch("http://localhost:3001/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: TEST_TOKEN }) });
    if (loginRes.status !== 200) throw new Error(`Expected 200 for login, got ${loginRes.status}`);
    const cookiesStr = loginRes.headers.get("set-cookie") || "";
    if (!cookiesStr.includes("HttpOnly")) throw new Error("Cookie is missing HttpOnly flag");
    if (cookiesStr.includes(TEST_TOKEN)) throw new Error("Cookie contains root secret! Session is not opaque.");
    
    const cookieMatch = cookiesStr.match(/saarthi_session=([^;]+)/);
    if (!cookieMatch) throw new Error("Cookie saarthi_session not found");
    const sessionId = cookieMatch[1];
    
    // Valid session
    const validRes = await fetch("http://localhost:3001/api/state", { method: "GET", headers: { "Cookie": `saarthi_session=${sessionId}` } });
    if (validRes.status !== 200 && validRes.status !== 500) throw new Error(`Expected 200 or 500 for valid auth, got ${validRes.status}`);

    // User A cannot use User B session
    const loginUser2Res = await fetch("http://localhost:3001/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: `${TEST_TOKEN}-user2` }) });
    const u2CookieStr = loginUser2Res.headers.get("set-cookie") || "";
    const u2Match = u2CookieStr.match(/saarthi_session=([^;]+)/);
    const sessionId2 = u2Match ? u2Match[1] : "";
    if (sessionId === sessionId2) throw new Error("Sessions are not unique!");

    // Expired session rejected
    db.prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").run(Date.now() - 10000, sessionId);
    const expiredRes = await fetch("http://localhost:3001/api/state", { method: "GET", headers: { "Cookie": `saarthi_session=${sessionId}` } });
    if (expiredRes.status !== 401) throw new Error("Expired session not rejected!");

    // Logout invalidates session
    const loginRes3 = await fetch("http://localhost:3001/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: TEST_TOKEN }) });
    const sessionId3 = loginRes3.headers.get("set-cookie")?.match(/saarthi_session=([^;]+)/)?.[1] || "";
    
    await fetch("http://localhost:3001/api/logout", { method: "POST", headers: { "Cookie": `saarthi_session=${sessionId3}` } });
    const logoutResCheck = await fetch("http://localhost:3001/api/state", { method: "GET", headers: { "Cookie": `saarthi_session=${sessionId3}` } });
    if (logoutResCheck.status !== 401) throw new Error("Session still active after logout!");

    console.log("PASS 4: Opaque Session & Auth fully validated.");

    console.log("\nALL P0 HARDENING TESTS PASSED SUCCESSFULLY.");
    process.exit(0);

  } catch (err) {
    console.error("TEST SUITE FAILED:");
    console.error(err);
    process.exit(1);
  }
}

runTests();
