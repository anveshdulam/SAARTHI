import dotenv from "dotenv";
dotenv.config({ path: ".env" });
process.env.INTERNAL_SECRET = process.env.INTERNAL_SECRET || "test_secret";

import { initMcpClient } from "../backend/src/mcpClient.js";
import { db, initDb } from "../mcp-server/src/db.js";
import crypto from "crypto";

async function runApprovalInvariantsTests() {
  console.log("============================================================");
  console.log("  SAARTHI — Automated Approval-Boundary & Invariant Test Suite");
  console.log("============================================================\n");

  initDb();
  const testUserId = "invariant_test_user_" + Date.now();

  let mcp: any;
  try {
    mcp = await initMcpClient();
  } catch (err) {
    console.error("FAIL: Could not connect to MCP server on port 3002.", err);
    process.exit(1);
  }

  const FORBIDDEN_LIFECYCLE_TOOLS = [
    "approve_commitment",
    "approve_plan",
    "reject_commitment",
    "reject_plan",
    "cancel_action",
    "complete_commitment",
    "miss_commitment",
    "cancel_commitment",
    "fail_commitment"
  ];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Invariant 1 — Tool Filter Withholding (Bedrock Manifest Defense)
    // -------------------------------------------------------------------------
    console.log("[INVARIANT 1] Verifying Bedrock Tool Manifest Withholding...");
    
    // Check 1A: Query MCP tools
    const mcpToolsRes = await mcp.listTools();
    const availableToolNames = mcpToolsRes.tools.map((t: any) => t.name);
    
    // Verify that lifecycle tools exist on MCP server (authoritative backend)
    for (const forbidden of ["approve_plan", "approve_commitment", "complete_commitment"]) {
      if (!availableToolNames.includes(forbidden)) {
        throw new Error(`MCP Server must provide '${forbidden}' as an authoritative tool.`);
      }
    }

    // Check 1B: Verify Backend Audit API reports all forbidden tools as NOT model exposed
    const testAuthToken = process.env.SAARTHI_AUTH_TOKEN || "test-secure-token-123";
    const auditRes = await fetch("http://localhost:3001/api/audit/protocol", {
      headers: { Authorization: `Bearer ${testAuthToken}` }
    });
    if (!auditRes.ok) {
      throw new Error(`Failed to query /api/audit/protocol (HTTP ${auditRes.status})`);
    }
    const auditData = await auditRes.json();
    
    for (const tool of auditData.tools) {
      if (FORBIDDEN_LIFECYCLE_TOOLS.includes(tool.name)) {
        if (tool.isModelExposed !== false) {
          throw new Error(`SECURITY VIOLATION: Tool '${tool.name}' is marked as model exposed!`);
        }
        if (tool.category !== "LIFECYCLE_PROTECTED") {
          throw new Error(`Tool '${tool.name}' must be categorized as LIFECYCLE_PROTECTED.`);
        }
      }
    }
    console.log("  ✓ Invariant 1 PASS: All 9 lifecycle tools are strictly withheld from model exposure.\n");

    // -------------------------------------------------------------------------
    // TEST 2: Invariant 2 — Unapproved Plan Proposal Isolation
    // -------------------------------------------------------------------------
    console.log("[INVARIANT 2] Verifying Unapproved Plan Cannot Mutate Commitments...");
    
    // Seed test commitment
    const originalStart = "2026-10-15T08:30:00.000Z";
    const originalEnd = "2026-10-15T10:00:00.000Z";
    const commId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO commitments (id, user_id, title, type, estimated_minutes, start_time, end_time, status, created_at, updated_at)
      VALUES (?, ?, ?, 'hard', 90, ?, ?, 'pending', ?, ?)
    `).run(commId, testUserId, "Invariant Test Session", originalStart, originalEnd, nowIso, nowIso);

    // Generate schedule proposal through MCP
    const proposalRes = await mcp.callTool({
      name: "create_schedule_proposal",
      arguments: {
        userId: testUserId,
        currentTimeUtc: "2026-10-15T09:00:00.000Z",
        planningDate: "2026-10-15",
        cutoffLocalTime: "22:00"
      }
    });

    if (proposalRes.isError) {
      throw new Error(`create_schedule_proposal failed: ${proposalRes.content[0]?.text}`);
    }

    const proposalJson = JSON.parse(proposalRes.content[0]?.text || "{}");
    if (!proposalJson.planId) {
      throw new Error("No planId returned from create_schedule_proposal.");
    }
    const planId = proposalJson.planId;

    // Verify plan is in 'proposed' state
    const planRow = db.prepare("SELECT * FROM plans WHERE id = ?").get(planId) as any;
    if (!planRow || planRow.status !== "proposed") {
      throw new Error(`Expected plan ${planId} to have status 'proposed', got: ${planRow?.status}`);
    }

    // Verify commitment record in SQLite is completely UNTOUCHED
    const commRow = db.prepare("SELECT * FROM commitments WHERE id = ?").get(commId) as any;
    if (commRow.start_time !== originalStart || commRow.end_time !== originalEnd) {
      throw new Error(`SECURITY VIOLATION: Unapproved proposal mutated commitment times!`);
    }
    if (commRow.status !== "pending") {
      throw new Error(`Commitment status was unexpectedly modified to '${commRow.status}'.`);
    }
    console.log("  ✓ Invariant 2 PASS: Creation of proposal leaves persisted domain records untouched.\n");

    // -------------------------------------------------------------------------
    // TEST 3: Invariant 4 — Optimistic Concurrency Version Guard
    // -------------------------------------------------------------------------
    console.log("[INVARIANT 4] Verifying Optimistic Concurrency Guard (Stale Plan Rejection)...");
    
    // Attempt approval with wrong expectedVersion (e.g. 99 vs actual version 1)
    const staleApprovalRes = await mcp.callTool({
      name: "approve_plan",
      arguments: {
        userId: testUserId,
        planId: planId,
        expectedVersion: 99
      }
    });

    if (!staleApprovalRes.isError) {
      throw new Error("Expected stale plan approval to fail, but it returned success!");
    }
    const staleErrMsg = staleApprovalRes.content[0]?.text || "";
    if (!staleErrMsg.includes("Concurrency Error") && !staleErrMsg.includes("Stale plan")) {
      throw new Error(`Expected Concurrency Error message, got: '${staleErrMsg}'`);
    }

    // Ensure plan is still 'proposed'
    const planAfterStale = db.prepare("SELECT * FROM plans WHERE id = ?").get(planId) as any;
    if (planAfterStale.status !== "proposed") {
      throw new Error(`Plan status mutated during rejected stale approval to '${planAfterStale.status}'`);
    }
    console.log("  ✓ Invariant 4 PASS: Stale version (expectedVersion mismatch) successfully rejected.\n");

    // -------------------------------------------------------------------------
    // TEST 4: Invariant 3 — Idempotent Plan Approval & Consequential Mutation
    // -------------------------------------------------------------------------
    console.log("[INVARIANT 3] Verifying Authorized Approval & Idempotency Boundary...");

    // First Approval (Valid)
    const validApprovalRes = await mcp.callTool({
      name: "approve_plan",
      arguments: {
        userId: testUserId,
        planId: planId,
        expectedVersion: planRow.version
      }
    });

    if (validApprovalRes.isError) {
      throw new Error(`Valid approval failed: ${validApprovalRes.content[0]?.text}`);
    }

    // Verify Plan is now 'accepted'
    const acceptedPlan = db.prepare("SELECT * FROM plans WHERE id = ?").get(planId) as any;
    if (acceptedPlan.status !== "accepted") {
      throw new Error(`Expected plan status 'accepted', found '${acceptedPlan.status}'`);
    }

    // Verify PLAN_ACCEPTED audit event recorded
    const eventRow = db.prepare("SELECT * FROM events WHERE user_id = ? AND type = 'PLAN_ACCEPTED'").get(testUserId) as any;
    if (!eventRow) {
      throw new Error("Audit event PLAN_ACCEPTED was not recorded in events table.");
    }

    // Second Approval Attempt (Replay/Duplicate Attack)
    const replayApprovalRes = await mcp.callTool({
      name: "approve_plan",
      arguments: {
        userId: testUserId,
        planId: planId,
        expectedVersion: planRow.version
      }
    });

    if (!replayApprovalRes.isError) {
      throw new Error("SECURITY VIOLATION: Second approval of accepted plan succeeded instead of failing!");
    }
    const replayErrMsg = replayApprovalRes.content[0]?.text || "";
    if (!replayErrMsg.includes("already accepted")) {
      throw new Error(`Expected 'already accepted' error on replay, got: '${replayErrMsg}'`);
    }

    console.log("  ✓ Invariant 3 PASS: First approval commits transaction; second approval is rejected idempotently.\n");

    // -------------------------------------------------------------------------
    // TEST 5: Invariant 5 — Authoritative Plan Rejection Flow
    // -------------------------------------------------------------------------
    console.log("[INVARIANT 5] Verifying Plan Rejection & Non-Mutation Flow...");
    
    // Create another proposed plan to test rejection
    const proposalRes2 = await mcp.callTool({
      name: "create_schedule_proposal",
      arguments: {
        userId: testUserId,
        currentTimeUtc: "2026-10-15T09:00:00.000Z",
        planningDate: "2026-10-15",
        cutoffLocalTime: "22:00"
      }
    });
    const proposalJson2 = JSON.parse(proposalRes2.content[0]?.text || "{}");
    const planId2 = proposalJson2.planId;
    const planRow2 = db.prepare("SELECT * FROM plans WHERE id = ?").get(planId2) as any;

    // Reject the proposed plan
    const rejectRes = await mcp.callTool({
      name: "reject_plan",
      arguments: {
        userId: testUserId,
        planId: planId2,
        expectedVersion: planRow2.version,
        reason: "User rejected proposal"
      }
    });

    if (rejectRes.isError) {
      throw new Error(`reject_plan failed: ${rejectRes.content[0]?.text}`);
    }

    const rejectedPlan = db.prepare("SELECT * FROM plans WHERE id = ?").get(planId2) as any;
    if (rejectedPlan.status !== "rejected") {
      throw new Error(`Expected plan status 'rejected', found '${rejectedPlan.status}'`);
    }

    // Verify PLAN_REJECTED audit event recorded
    const rejectEvent = db.prepare("SELECT * FROM events WHERE user_id = ? AND type = 'PLAN_REJECTED'").get(testUserId) as any;
    if (!rejectEvent) {
      throw new Error("Audit event PLAN_REJECTED was not recorded in events table.");
    }

    // Ensure rejected plan cannot subsequently be approved
    const approveRejectedRes = await mcp.callTool({
      name: "approve_plan",
      arguments: {
        userId: testUserId,
        planId: planId2,
        expectedVersion: planRow2.version
      }
    });
    if (!approveRejectedRes.isError) {
      throw new Error("SECURITY VIOLATION: Approving an already rejected plan succeeded!");
    }

    console.log("  ✓ Invariant 5 PASS: Rejection sets status to 'rejected', logs audit event, and locks out approval.\n");

    // Clean up test data
    db.prepare("DELETE FROM events WHERE user_id = ?").run(testUserId);
    db.prepare("DELETE FROM plan_blocks WHERE plan_id IN (?, ?)").run(planId, planId2);
    db.prepare("DELETE FROM plans WHERE user_id = ?").run(testUserId);
    db.prepare("DELETE FROM commitments WHERE user_id = ?").run(testUserId);

    console.log("============================================================");
    console.log("  ALL APPROVAL-BOUNDARY & SAFETY INVARIANT TESTS PASSED (5/5)");
    console.log("============================================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ TEST SUITE FAILED:", err.message);
    process.exit(1);
  }
}

runApprovalInvariantsTests();
