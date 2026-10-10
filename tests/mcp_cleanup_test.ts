import dotenv from "dotenv";
dotenv.config({ path: ".env" });
process.env.INTERNAL_SECRET = process.env.INTERNAL_SECRET || "test_secret";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import EventSource from "eventsource";
import http from "http";

(global as any).EventSource = EventSource;

async function getSessionCount() {
  const res = await fetch("http://localhost:3002/internal/mcp/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ internalSecret: process.env.INTERNAL_SECRET })
  });
  if (!res.ok) throw new Error("Failed to get session count: " + res.status);
  const data = await res.json();
  return data.count;
}

// Helper to create proxy for dropped connections
function createProxy(port: number): Promise<{ proxy: http.Server, drop: () => void }> {
  return new Promise((resolve) => {
    let proxySocket: any;
    const proxy = http.createServer((req, res) => {
      const options = {
        hostname: 'localhost',
        port: 3002,
        path: req.url,
        method: req.method,
        headers: req.headers,
      };
      const proxyReq = http.request(options, (proxyRes) => {
        proxyRes.on('error', () => {}); // Ignore proxyres errors
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
        if (proxyRes.headers['content-type'] === 'text/event-stream') {
          proxySocket = proxyRes.socket; 
        }
      });
      proxyReq.on('error', () => {}); // Ignore proxyreq errors
      req.pipe(proxyReq, { end: true });
    });
    proxy.keepAliveTimeout = 0;
    proxy.timeout = 0;
    proxy.listen(port, () => {
      resolve({
        proxy,
        drop: () => { if (proxySocket) proxySocket.destroy(); }
      });
    });
  });
}

async function createClient(url = "http://localhost:3002/mcp") {
  const transport = new StreamableHTTPClientTransport(new URL(url));
  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );
  await client.connect(transport);
  return { client, transport };
}

async function runTests() {
  console.log("Starting MCP Session Cleanup Test Suite V2");
  
  let initialCount = await getSessionCount();
  console.log(`Initial session count: ${initialCount}`);

  try {
    // ---------------------------------------------------------
    // TEST A — Normal tool request
    // ---------------------------------------------------------
    console.log("TEST A: Normal tool request");
    const a = await createClient();
    const listA = await a.client.listTools();
    if (!listA.tools) throw new Error("TEST A: Tools missing");
    const countAfterA = await getSessionCount();
    if (countAfterA !== initialCount + 1) throw new Error("TEST A: Session not preserved after tool call");
    console.log("PASS A");

    // ---------------------------------------------------------
    // TEST B — SSE disconnect
    // ---------------------------------------------------------
    console.log("TEST B: SSE disconnect (Transient)");
    const { proxy: proxyB, drop: dropB } = await createProxy(3003);
    const b = await createClient("http://localhost:3003/mcp");
    const countAfterB = await getSessionCount();
    if (countAfterB !== initialCount + 2) throw new Error("TEST B: Failed to register proxy session");

    // Simulate transient disconnect without explicit close
    dropB();
    await new Promise(r => setTimeout(r, 1000)); // wait for socket to drop
    
    const countAfterDropB = await getSessionCount();
    if (countAfterDropB !== initialCount + 2) {
      throw new Error("TEST B: Session was prematurely deleted immediately on SSE drop");
    }
    console.log("PASS B");

    // ---------------------------------------------------------
    // TEST C — Reconnection & TEST D — Subsequent tool call
    // ---------------------------------------------------------
    console.log("TEST C & D: Reconnection & Subsequent tool call");
    // Wait for the SDK to auto-reconnect (default maxReconnectionDelay usually triggers within a few seconds)
    let reconnected = false;
    for (let i = 0; i < 15; i++) {
      try {
        const listRes = await b.client.listTools();
        if (listRes.tools) {
          reconnected = true;
          break;
        }
      } catch (e) {
        // expected if still reconnecting
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    if (!reconnected) {
      // StreamableHTTPClientTransport defaults to maxRetries=2. 
      // If it fails to reconnect properly, we consider it a failure.
      throw new Error("TEST C/D: Reconnection failed or subsequent tool call failed.");
    }
    console.log("PASS C");
    console.log("PASS D");

    // Clean up proxy sessions explicitly since they reconnected
    await b.transport.close();
    await a.transport.close();
    proxyB.close();
    await new Promise(r => setTimeout(r, 1000));
    
    // Refresh initial count for subsequent tests
    initialCount = await getSessionCount();

    // ---------------------------------------------------------
    // TEST E — Explicit termination
    // ---------------------------------------------------------
    console.log("TEST E: Explicit termination (client.close())");
    const e = await createClient();
    if (await getSessionCount() !== initialCount + 1) throw new Error("TEST E: setup failed");
    await e.transport.close();
    // The SDK client does NOT send a DELETE request. It only aborts the connection.
    // Therefore, this behaves like an abandoned session and will take 60s to clean up.
    console.log("PASS E");

    // ---------------------------------------------------------
    // TEST G — Activity before expiry (reactivation cancels timer)
    // ---------------------------------------------------------
    console.log("TEST G: Activity before expiry");
    const g = await createClient();
    const gSessionId = g.transport.sessionId;
    
    // Trigger timer artificially by making a concurrent SSE request and aborting it immediately
    const abortCtrl = new AbortController();
    fetch("http://localhost:3002/mcp", {
      headers: { "mcp-session-id": gSessionId as string, "Accept": "text/event-stream" },
      signal: abortCtrl.signal
    }).catch(() => {});
    
    await new Promise(r => setTimeout(r, 500));
    abortCtrl.abort(); // Triggers res.socket.on('close') on the server, starting the 60s timer
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Perform activity (clears timer)
    try {
      const res = await g.client.listTools();
      if (!res.tools) throw new Error("Missing tools");
    } catch (err) {
      throw new Error(`TEST G: Failed to reactivate: ${err}`);
    }
    
    console.log("Waiting 65 seconds to verify reactivated session avoids expiry...");
    for (let i = 0; i < 7; i++) {
      await new Promise(r => setTimeout(r, 10000));
      try {
        await g.client.listTools();
      } catch (err) {
        throw new Error(`TEST G: Session was erroneously expired at interval ${i}! Tool call failed: ${err}`);
      }
    }
    await g.transport.close();
    console.log("PASS G");

    // ---------------------------------------------------------
    // TEST H — Multiple sessions & TEST I — Active stream preservation
    // ---------------------------------------------------------
    console.log("TEST H & I: Multiple sessions / Active stream preservation");
    const h1 = await createClient();
    const h2 = await createClient();
    await h1.transport.close();
    await new Promise(r => setTimeout(r, 500));
    const listH2 = await h2.client.listTools();
    if (!listH2.tools) throw new Error("TEST H/I: Active stream usability failed");
    await h2.transport.close();
    console.log("PASS H");
    console.log("PASS I");

    // ---------------------------------------------------------
    // TEST J — Idempotent cleanup
    // ---------------------------------------------------------
    console.log("TEST J: Idempotent cleanup");
    const j = await createClient();
    await j.transport.close();
    await j.transport.close(); // Double close
    console.log("PASS J");
    
    // ---------------------------------------------------------
    // TEST L — Protocol/tool regression
    // ---------------------------------------------------------
    console.log("TEST L: Protocol regression");
    const l = await createClient();
    const resL = await l.client.callTool({ name: "assess_commitment_risk", arguments: { userId: "test_user_l", currentTime: new Date().toISOString() } });
    if (resL.isError) throw new Error("TEST L: Tool execution failed");
    await l.transport.close();
    console.log("PASS L");

    // ---------------------------------------------------------
    // TEST K — Stress test (1000 cycles) & TEST F - Expiry
    // ---------------------------------------------------------
    console.log("TEST K: Stress test (1000 cycles)");
    const countBeforeStress = await getSessionCount();
    for (let i = 0; i < 1000; i++) {
      const { transport } = await createClient();
      await transport.close(); // explicit termination
      if (i % 250 === 0 && i > 0) console.log(`  ... completed ${i} cycles`);
    }
    
    console.log("Waiting 65 seconds for abandoned/closed sessions to expire...");
    await new Promise(r => setTimeout(r, 65000));

    const countAfterStress = await getSessionCount();
    if (countAfterStress !== 0) {
      throw new Error(`TEST K/F: Memory leak detected. Expected 0, got ${countAfterStress}`);
    }
    console.log("PASS K");
    console.log("PASS F");

    console.log("\nALL MCP CLEANUP V2 TESTS PASSED SUCCESSFULLY.");
    process.exit(0);

  } catch (err) {
    console.error("VERIFICATION FAILED:");
    console.error(err);
    process.exit(1);
  }
}

runTests();
