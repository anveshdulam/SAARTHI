import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { initMcpClient, getMcpClient } from "./mcpClient.js";
import { askAgent } from "./agent.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize MCP Client before handling requests

const connectWithRetry = async (retries = 5) => {
  try {
    await initMcpClient();
  } catch (err) {
    if (retries > 0) {
      console.log(`Failed to connect to MCP Server. Retrying in 2s... (${retries} left)`);
      setTimeout(() => connectWithRetry(retries - 1), 2000);
    } else {
      console.error("Failed to connect to MCP Server after multiple attempts.");
    }
  }
};
connectWithRetry();
console.log("Starting backend...");

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const DEMO_USER_TOKEN = process.env.DEMO_USER_TOKEN || "saarthi-demo-token-2026";

app.post("/chat", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized access. Valid token required." });
    return;
  }
  
  const token = authHeader.split(" ")[1];
  // Simple deterministic isolation for the demo
  const userId = token === "saarthi-demo-token-2026" ? "demo_user_1" : "demo_user_2";

  const { message, history } = req.body;
  
  // Prompt Injection Guardrail (Basic)
  const blocklist = ["ignore all previous", "system prompt", "forget", "bypass", "you are an attacker"];
  if (blocklist.some(phrase => message.toLowerCase().includes(phrase))) {
    res.status(403).json({ error: "Security Exception: Blocked input pattern detected." });
    return;
  }

  try {
    const result = await askAgent(userId, message, history || []);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/state", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }
  const token = authHeader.split(" ")[1];
  const userId = token === "saarthi-demo-token-2026" ? "demo_user_1" : "demo_user_2";

  try {
    const mcp = getMcpClient();
    if (!mcp) throw new Error("MCP not connected");

    const [comms, events, constraints] = await Promise.all([
      mcp.callTool({ name: "list_commitments", arguments: { userId } }),
      mcp.callTool({ name: "list_events", arguments: { userId } }),
      mcp.callTool({ name: "list_constraints", arguments: { userId } })
    ]);

    res.json({
      commitments: JSON.parse(((comms as any).content[0] as any).text),
      events: JSON.parse(((events as any).content[0] as any).text),
      constraints: JSON.parse(((constraints as any).content[0] as any).text)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/commitments/:id/approve", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const userId = authHeader.split(" ")[1] === "saarthi-demo-token-2026" ? "demo_user_1" : "demo_user_2";
  
  try {
    const mcp = getMcpClient();
    if (!mcp) throw new Error("MCP not connected");
    const result = await mcp.callTool({ name: "approve_commitment", arguments: { userId, id: req.params.id } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/plans/:id/approve", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const userId = authHeader.split(" ")[1] === "saarthi-demo-token-2026" ? "demo_user_1" : "demo_user_2";
  const { expectedVersion } = req.body;

  try {
    const mcp = getMcpClient();
    if (!mcp) throw new Error("MCP not connected");
    const result = await mcp.callTool({ name: "approve_plan", arguments: { userId, planId: req.params.id, expectedVersion } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend agent server listening on port ${PORT}`);
});
