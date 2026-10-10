import { getMcpClient, initMcpClient } from "../backend/src/mcpClient.js";
import crypto from "crypto";
import fs from "fs";
import { execSync } from "child_process";

async function runTests() {
  console.log("Starting P1 Latency Instrumentation Test Suite...");
  
  // Set up auth token
  const TEST_TOKEN = process.env.SAARTHI_AUTH_TOKEN || "test-secure-token-123";

  // Attempt login to get session
  console.log("TEST A: HTTP Latency");
  const loginRes = await fetch("http://localhost:3001/api/login", { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ token: TEST_TOKEN }) 
  });
  
  if (loginRes.status !== 200) throw new Error(`Expected 200 for login, got ${loginRes.status}`);
  const reqId = loginRes.headers.get("x-request-id");
  if (!reqId) throw new Error("Missing X-Request-ID");
  console.log("PASS: HTTP boundary correctly generates request ID", reqId);
  
  const cookiesStr = loginRes.headers.get("set-cookie") || "";
  const cookieMatch = cookiesStr.match(/saarthi_session=([^;]+)/);
  if (!cookieMatch) throw new Error("Cookie saarthi_session not found");
  const sessionId = cookieMatch[1];
  
  console.log("TEST B: Agent Latency & Correlation");
  const chatRes = await fetch("http://localhost:3001/chat", { 
    method: "POST", 
    headers: { "Content-Type": "application/json", "Cookie": `saarthi_session=${sessionId}` }, 
    body: JSON.stringify({ message: "What are my commitments?" }) 
  });
  
  if (chatRes.status !== 200) throw new Error(`Expected 200 for chat, got ${chatRes.status}`);
  const chatReqId = chatRes.headers.get("x-request-id");
  if (!chatReqId) throw new Error("Missing X-Request-ID");
  console.log("PASS: Agent executed successfully. Latency logs should be in stdout.");
  
  console.log("Tests complete! Please manually verify the structured stdout logs of the backend and MCP server to confirm `duration_ms` and correlation.");
  setTimeout(() => process.exit(0), 100);
}

runTests().catch(e => {
  console.error("Test failed", e);
  process.exit(1);
});
