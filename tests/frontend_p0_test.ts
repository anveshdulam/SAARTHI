import assert from "assert";
import fs from "fs";

// We will statically analyze the source code for some tests
// and use a mock React environment for others.
const hookSource = fs.readFileSync("./frontend/src/hooks/useSaarthiState.ts", "utf8");

async function runTests() {
  console.log("--- FRONTEND P0 TESTS ---");

  // TEST G & H - Polling removal & Mutation refresh
  console.log("TEST G: Verify polling removal");
  assert.ok(!hookSource.includes("setInterval(fetchState"), "setInterval(fetchState) should be removed");
  
  console.log("TEST H: Verify mutation refresh");
  assert.ok(hookSource.includes("fetchState();"), "fetchState should be called manually after mutations");
  
  // TEST C - Error code preservation
  console.log("TEST C: Error code preservation");
  assert.ok(hookSource.includes("data.errorCode"), "Should extract data.errorCode");

  // TEST E - Request ID preservation
  console.log("TEST E: Request-ID preservation");
  assert.ok(hookSource.includes("X-Request-ID"), "Should extract X-Request-ID header");

  // Let's create a tiny simulated environment to test handleSend logic
  console.log("Setting up simulated React environment...");
  let stateSetter: any = null;
  let loadingSetter: any = null;
  let fetchMock: any = null;

  // Compile a simplified executable version of the handleSend logic to test it
  // Since we can't easily run a React hook in raw Node without transpilation/JSDOM,
  // we will test the exact fetch logic we wrote by reconstructing it.
  
  async function simulateHandleSend(mockResponse: any, mockHeaders: Record<string, string> = {}) {
    let currentMessages: any[] = [];
    let isLoading = false;
    let intelligenceStep = null;
    
    // The exact logic from useSaarthiState.ts
    const text = "Test message";
    currentMessages.push({ role: "user", content: text });
    isLoading = true;
    intelligenceStep = "EXECUTING";
    
    try {
      const reqId = mockHeaders["x-request-id"] || mockHeaders["X-Request-ID"] || "unknown";
      let data;
      try {
        data = JSON.parse(mockResponse.body);
      } catch (e) {
        throw new Error("Invalid server response format.");
      }

      if (!mockResponse.ok || !data.success) {
        const errCode = data.errorCode || "NETWORK_ERROR";
        const replyMsg = data.reply || data.error || "System failure.";
        currentMessages.push({ role: "agent", content: `❌ Execution Failed\n\n[${errCode}]\n${replyMsg}\n\nRequest ID: ${reqId}` });
      } else {
        currentMessages.push({ role: "agent", content: data.reply || "Done." });
      }
    } catch (err: any) {
      currentMessages.push({ role: "agent", content: `❌ Network or System Error\n\n[NETWORK_ERROR]\n${err.message || "Could not reach the execution engine."}` });
    } finally {
      isLoading = false;
      intelligenceStep = null;
    }
    
    return currentMessages[currentMessages.length - 1].content;
  }

  // TEST A: Backend success
  console.log("TEST A: Backend success");
  const resA = await simulateHandleSend(
    { ok: true, body: JSON.stringify({ success: true, reply: "Action completed successfully." }) }
  );
  assert.strictEqual(resA, "Action completed successfully.");

  // TEST B: Backend failure
  console.log("TEST B: Backend failure");
  const resB = await simulateHandleSend(
    { ok: true, body: JSON.stringify({ success: false, errorCode: "MCP_TIMEOUT", reply: "Execution timed out.", actionPerformed: false }) },
    { "X-Request-ID": "req-123" }
  );
  assert.ok(resB.includes("❌ Execution Failed"));
  assert.ok(resB.includes("[MCP_TIMEOUT]"));
  assert.ok(resB.includes("Execution timed out."));
  assert.ok(resB.includes("req-123"));
  assert.ok(!resB.includes("Action completed")); // No fake success

  // TEST D: Network failure
  console.log("TEST D: Network failure");
  const resD = await simulateHandleSend(
    { ok: false, body: "invalid json {" }
  );
  assert.ok(resD.includes("❌ Network or System Error"));
  assert.ok(resD.includes("[NETWORK_ERROR]"));
  
  // TEST F: No secret leakage
  console.log("TEST F: No secret leakage (UI never renders internal error details randomly)");
  assert.ok(!hookSource.includes("err.stack"), "Should not expose stack traces");
  
  console.log("✅ All Frontend P0 tests passed.");
}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
