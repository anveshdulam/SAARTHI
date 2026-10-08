import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";
const memSessions = new Map<string, { user_id: string, expires_at: number }>();
import { initMcpClient, getMcpClient } from "./mcpClient.js";
import { askAgent } from "./agent.js";

dotenv.config({ path: '../.env' });

if (!process.env.INTERNAL_SECRET) {
  console.error("FATAL: INTERNAL_SECRET environment variable is missing.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.SAARTHI_ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

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

const SAARTHI_AUTH_TOKEN = process.env.SAARTHI_AUTH_TOKEN;
if (!SAARTHI_AUTH_TOKEN) {
  console.error("FATAL: SAARTHI_AUTH_TOKEN environment variable is missing.");
  process.exit(1);
}

function authenticateAndGetUser(req: express.Request, res: express.Response): string | null {
  const sessionId = req.cookies?.saarthi_session;
  
  if (!sessionId) {
    res.status(401).json({ error: "Unauthorized access. Valid session cookie required." });
    return null;
  }

  const session = memSessions.get(sessionId);
  if (!session) {
    res.status(401).json({ error: "Unauthorized access. Invalid session." });
    return null;
  }

  if (Date.now() > session.expires_at) {
    memSessions.delete(sessionId);
    res.status(401).json({ error: "Unauthorized access. Session expired." });
    return null;
  }

  return session.user_id;
}

app.post("/api/login", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });
  
  let userId = null;
  if (token === SAARTHI_AUTH_TOKEN) {
    userId = "demo_user_1";
  } else if (token === `${SAARTHI_AUTH_TOKEN}-user2`) {
    userId = "demo_user_2";
  }

  if (userId) {
    const sessionId = crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + 1000 * 60 * 60 * 24; // 24 hours

    memSessions.set(sessionId, { user_id: userId, expires_at: expiresAt });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("saarthi_session", sessionId, { httpOnly: true, sameSite: "lax", secure: isProd, maxAge: 1000 * 60 * 60 * 24 });
    res.json({ success: true });
    return;
  }
  
  res.status(401).json({ error: "Invalid token" });
});

app.post("/api/logout", (req, res) => {
  const sessionId = req.cookies?.saarthi_session;
  if (sessionId) {
    memSessions.delete(sessionId);
  }
  res.clearCookie("saarthi_session");
  res.json({ success: true });
});

app.put("/api/preferences/timezone", async (req, res) => {
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;

  const { timezone } = req.body;
  if (!timezone) return res.status(400).json({ error: "Missing timezone" });

  try {
    const internalRes = await fetch("http://localhost:3002/internal/preferences/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        internalSecret: process.env.INTERNAL_SECRET,
        userId,
        timezone
      })
    });
    const data = await internalRes.json();
    if (!internalRes.ok) {
      return res.status(internalRes.status).json(data);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to set timezone:", err.message);
    res.status(500).json({ error: "Failed to update timezone" });
  }
});

app.post("/chat", async (req, res) => {
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;

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
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;

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
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;
  
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

app.post("/api/commitments/:id/complete", async (req, res) => {
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;
  try {
    const mcp = getMcpClient();
    const result = await mcp!.callTool({ name: "complete_commitment", arguments: { userId, id: req.params.id } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/commitments/:id/miss", async (req, res) => {
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;
  try {
    const mcp = getMcpClient();
    const result = await mcp!.callTool({ name: "miss_commitment", arguments: { userId, id: req.params.id } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/commitments/:id/cancel", async (req, res) => {
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;
  try {
    const mcp = getMcpClient();
    const result = await mcp!.callTool({ name: "cancel_commitment", arguments: { userId, id: req.params.id } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/commitments/:id/fail", async (req, res) => {
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;
  try {
    const mcp = getMcpClient();
    const result = await mcp!.callTool({ name: "fail_commitment", arguments: { userId, id: req.params.id } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/plans/:id/approve", async (req, res) => {
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;
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
