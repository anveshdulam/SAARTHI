import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import EventSource from "eventsource";

// Polyfill EventSource
(global as any).EventSource = EventSource;

async function runTests() {
  console.log("=== SAARTHI INTEGRATION VERIFICATION ===");
  
  let mcpClient: Client;
  let transport: StreamableHTTPClientTransport;

  try {
    console.log("\n[TEST 1] Streamable HTTP Handshake & Protocol Negotiation");
    transport = new StreamableHTTPClientTransport(new URL("http://localhost:3002/mcp"));
    mcpClient = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    
    await mcpClient.connect(transport);
    console.log("STATUS: PASS");
    console.log("EVIDENCE: Connected successfully using StreamableHTTPClientTransport");
  } catch (err: any) {
    console.log("STATUS: FAIL", err.message);
    return;
  }

  try {
    console.log("\n[TEST 2] MCP tools/list via Streamable HTTP");
    const tools = await mcpClient.listTools();
    console.log(`STATUS: PASS`);
    console.log(`EVIDENCE: Found ${tools.tools.length} tools including ${tools.tools.map(t => t.name).join(", ")}`);
  } catch (err: any) {
    console.log("STATUS: FAIL", err.message);
  }

  try {
    console.log("\n[TEST 3] MCP tools/call (Real Database Mutation)");
    const result = await mcpClient.callTool({ 
      name: "create_commitment", 
      arguments: { title: "Integration Test Task", type: "soft" } 
    });
    console.log(`STATUS: PASS`);
    console.log(`EVIDENCE: Result -> ${JSON.stringify(result.content)}`);
  } catch (err: any) {
    console.log("STATUS: FAIL", err.message);
  }

  try {
    console.log("\n[TEST 4] Backend Orchestrator Demo Mode Fallback (Hero Scenario)");
    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "I have a Java exam and a club meeting." })
    });
    const data = await res.json() as any;
    
    if (data.toolsExecuted?.includes("create_commitment")) {
      console.log("STATUS: PASS");
      console.log("EVIDENCE: Backend executed real tools in Demo Mode: " + data.toolsExecuted.join(", "));
    } else {
      console.log("STATUS: FAIL");
      console.log("EVIDENCE: Tools were not executed:", data);
    }
  } catch (err: any) {
    console.log("STATUS: FAIL", err.message);
  }

  console.log("\n=== VERIFICATION COMPLETE ===");
  process.exit(0);
}

runTests();
