import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";
const memSessions = new Map<string, { user_id: string, expires_at: number }>();
import { initMcpClient, getMcpClient } from "./mcpClient.js";
import { askAgent } from "./agent.js";
import { requestContext, logger } from "./logger.js";

dotenv.config({ path: '../.env' });

if (!process.env.INTERNAL_SECRET) {
  logger.error("FATAL: INTERNAL_SECRET environment variable is missing.");
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

app.use((req, res, next) => {
  // Always generate a canonical ID; never trust client headers fully for this
  const reqId = crypto.randomUUID();
  res.setHeader("X-Request-ID", reqId);
  const start = performance.now();
  
  requestContext.run({ requestId: reqId }, () => {
    res.on("finish", () => {
      const duration_ms = performance.now() - start;
      const isError = res.statusCode >= 400;
      logger[isError ? "error" : "info"]("HTTP request completed", {
        operation: "http.request",
        method: req.method,
        route: req.originalUrl || req.url,
        status_code: res.statusCode,
        duration_ms,
        success: !isError
      });
    });
    next();
  });
});

// Initialize MCP Client before handling requests

const connectWithRetry = async (retries = 5) => {
  try {
    await initMcpClient();
  } catch (err) {
    if (retries > 0) {
      logger.info(`Failed to connect to MCP Server. Retrying in 2s... (${retries} left)`);
      setTimeout(() => connectWithRetry(retries - 1), 2000);
    } else {
      logger.error("Failed to connect to MCP Server after multiple attempts.");
    }
  }
};
connectWithRetry();
logger.info("Starting backend...");

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const SAARTHI_AUTH_TOKEN = process.env.SAARTHI_AUTH_TOKEN;
if (!SAARTHI_AUTH_TOKEN) {
  logger.error("FATAL: SAARTHI_AUTH_TOKEN environment variable is missing.");
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

  const userId = session.user_id;
  const context = requestContext.getStore();
  if (context) context.userId = userId;
  return userId;
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
    logger.error("Failed to set timezone", { error: err });
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

  const agentStart = performance.now();
  try {
    const result = await askAgent(userId, message, history || []);
    const duration_ms = performance.now() - agentStart;
    logger[result.success ? "info" : "error"]("Agent execution completed", { operation: "agent.execute", user_id: userId, duration_ms, success: result.success });
    res.json(result);
  } catch (error: any) {
    const duration_ms = performance.now() - agentStart;
    logger.error("Chat agent execution failed", { operation: "agent.execute", user_id: userId, duration_ms, success: false, error });
    res.status(500).json({ error: "Chat execution failed." });
  }
});

app.get("/api/state", async (req, res) => {
  const userId = authenticateAndGetUser(req, res);
  if (!userId) return;

  try {
    const mcp = getMcpClient();
    if (!mcp) throw new Error("MCP not connected");

    const [comms, events, constraints, plansResult] = await Promise.all([
      mcp.callTool({ name: "list_commitments", arguments: { userId } }),
      mcp.callTool({ name: "list_events", arguments: { userId } }),
      mcp.callTool({ name: "list_constraints", arguments: { userId } }),
      mcp.callTool({ name: "list_plans", arguments: { userId } })
    ]);

    const plansData = JSON.parse(((plansResult as any).content[0] as any).text);

    res.json({
      commitments: JSON.parse(((comms as any).content[0] as any).text),
      events: JSON.parse(((events as any).content[0] as any).text),
      constraints: JSON.parse(((constraints as any).content[0] as any).text),
      plans: plansData.plans,
      plan_blocks: plansData.plan_blocks
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
  logger.info(`Backend agent server listening on port ${PORT}`);
});
