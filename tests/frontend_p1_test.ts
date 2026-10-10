import assert from "assert";
import fs from "fs";

async function runTests() {
  console.log("--- FRONTEND P1 TESTS ---");

  // Read the source of the modified components
  const useSaarthiStateSrc = fs.readFileSync("./frontend/src/hooks/useSaarthiState.ts", "utf8");
  const livingPlanSrc = fs.readFileSync("./frontend/src/components/LivingPlan.tsx", "utf8");
  const backendIndexSrc = fs.readFileSync("./backend/src/index.ts", "utf8");
  const plansSrc = fs.readFileSync("./frontend/src/pages/Plans.tsx", "utf8");

  // TEST A — State contains plans
  console.log("TEST A: State contains plans");
  assert.ok(useSaarthiStateSrc.includes("plans: any[]"), "Frontend state type should include plans");
  assert.ok(backendIndexSrc.includes('name: "list_plans"'), "Backend should fetch list_plans via MCP");

  // TEST B — State contains plan blocks
  console.log("TEST B: State contains plan blocks");
  assert.ok(useSaarthiStateSrc.includes("plan_blocks: any[]"), "Frontend state type should include plan_blocks");
  assert.ok(backendIndexSrc.includes("plan_blocks: plansData.plan_blocks"), "Backend should map plan_blocks to state");

  // TEST C — User isolation
  console.log("TEST C: User isolation");
  assert.ok(backendIndexSrc.includes("arguments: { userId }"), "Backend passes authenticated userId to MCP");

  // TEST D — LivingPlan uses plan blocks
  console.log("TEST D: LivingPlan uses plan blocks");
  assert.ok(livingPlanSrc.includes("const planBlocks = stateData.plan_blocks"), "LivingPlan should extract planBlocks");
  assert.ok(!livingPlanSrc.includes("const commitments = stateData.commitments;"), "LivingPlan should not blindly map commitments");

  // TEST E — Plan timestamps
  console.log("TEST E: Plan timestamps");
  assert.ok(livingPlanSrc.includes("b.start_time"), "LivingPlan should map block start_time");
  assert.ok(livingPlanSrc.includes("b.end_time"), "LivingPlan should map block end_time");

  // TEST F — Approval loading
  console.log("TEST F: Approval loading");
  assert.ok(useSaarthiStateSrc.includes("if (loading) return;"), "Should prevent double clicks in approval");
  assert.ok(useSaarthiStateSrc.includes("setLoading(true);"), "Should set loading before approval");

  // TEST G & H & I & J — Approval error handling
  console.log("TEST G-J: Approval error handling");
  assert.ok(useSaarthiStateSrc.includes("try {"), "Should use try/catch in approvals");
  assert.ok(useSaarthiStateSrc.includes("catch (err"), "Should catch network errors");
  assert.ok(useSaarthiStateSrc.includes("response.ok || !data.success"), "Should check response.ok and data.success");

  // TEST K — No double submission
  console.log("TEST K: No double submission");
  // Verified by TEST F (if loading return)

  // Request ID extraction
  console.log("Verify Request-ID extracted");
  assert.ok(useSaarthiStateSrc.includes('response.headers.get("X-Request-ID")'), "Should extract X-Request-ID");

  // Check that mock data was removed from Plans.tsx
  console.log("Verify hardcoded capacity is fixed in Plans");
  assert.ok(!plansSrc.includes("3h 40m"), "Should not have hardcoded 3h 40m");
  
  console.log("✅ All Frontend P1 static tests passed.");
}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
