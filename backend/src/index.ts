import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { CognitoJwtVerifier } from "aws-jwt-verify";
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


let verifier: any = null;
if (process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID && !process.env.COGNITO_USER_POOL_ID.includes("YOUR_")) {
  try {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      tokenUse: "id", // We expect the ID token from Amplify
      clientId: process.env.COGNITO_CLIENT_ID,
    });
  } catch (err) {
    logger.warn("Failed to initialize Cognito verifier. Auth will fail.");
  }
} else {
  logger.warn("COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID missing or default in .env. AWS configuration is required.");
}

async function authenticateAndGetUser(req: express.Request, res: express.Response): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized access. Bearer token required." });
    return null;
  }
  const token = authHeader.split(" ")[1];

  const isDemoMode = process.env.DEMO_MODE === "true";
  if (isDemoMode && (token === "demo-token" || token === (process.env.SAARTHI_AUTH_TOKEN || "demo-token"))) {
    const demoUserId = "demo-user-id";
    const context = requestContext.getStore();
    if (context) context.userId = demoUserId;
    return demoUserId;
  }
  
  if (!verifier) {
    res.status(500).json({ error: "AWS configuration is missing. Authentication blocked." });
    return null;
  }

  try {
    const payload = await verifier.verify(token);
    const userId = payload.sub; // Map the verified Cognito identity to our application user ID
    const context = requestContext.getStore();
    if (context) context.userId = userId;
    return userId;
  } catch (err) {
    logger.error("Token verification failed", { error: err });
    res.status(401).json({ error: "Unauthorized access. Invalid token." });
    return null;
  }
}

app.put("/api/preferences/timezone", async (req, res) => {
  const userId = await authenticateAndGetUser(req, res);
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
  const userId = await authenticateAndGetUser(req, res);
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
  const userId = await authenticateAndGetUser(req, res);
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

app.get("/api/audit/protocol", async (req, res) => {
  const userId = await authenticateAndGetUser(req, res);
  if (!userId) return;

  try {
    const mcp = getMcpClient();
    if (!mcp) throw new Error("MCP not connected");

    let toolsList: any[] = [];
    try {
      const toolsRes = await mcp.listTools();
      toolsList = toolsRes.tools || [];
    } catch (e: any) {
      logger.error("Failed to list tools for audit", { error: e });
    }

    let activeSessions = 1;
    try {
      const sessRes = await fetch("http://localhost:3002/internal/mcp/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalSecret: process.env.INTERNAL_SECRET })
      });
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        activeSessions = sessData.count || 1;
      }
    } catch {
      // fallback
    }

    const forbiddenTools = [
      "approve_commitment", "approve_plan", "reject_commitment", "reject_plan", "cancel_action",
      "complete_commitment", "miss_commitment", "cancel_commitment", "fail_commitment"
    ];

    res.json({
      protocolVersion: "2025-11-25",
      transport: "Streamable HTTP",
      mcpEndpoint: "http://localhost:3002/mcp",
      serverName: "saarthi-mcp-server",
      serverVersion: "1.0.0",
      connected: true,
      activeSessions,
      forbiddenTools,
      tools: toolsList.map(t => ({
        name: t.name,
        description: t.description,
        isModelExposed: !forbiddenTools.includes(t.name),
        category: forbiddenTools.includes(t.name) ? "LIFECYCLE_PROTECTED" : (t.name.startsWith("list_") || t.name.startsWith("get_")) ? "READ_QUERY" : "REASONING_PROPOSAL",
        inputSchema: t.inputSchema
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/commitments/:id/approve", async (req, res) => {
  const userId = await authenticateAndGetUser(req, res);
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
  const userId = await authenticateAndGetUser(req, res);
  if (!userId) return;
  try {
    const mcp = getMcpClient();
    const result = await mcp!.callTool({ name: "complete_commitment", arguments: { userId, id: req.params.id } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/commitments/:id/miss", async (req, res) => {
  const userId = await authenticateAndGetUser(req, res);
  if (!userId) return;
  try {
    const mcp = getMcpClient();
    const result = await mcp!.callTool({ name: "miss_commitment", arguments: { userId, id: req.params.id } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/commitments/:id/cancel", async (req, res) => {
  const userId = await authenticateAndGetUser(req, res);
  if (!userId) return;
  try {
    const mcp = getMcpClient();
    const result = await mcp!.callTool({ name: "cancel_commitment", arguments: { userId, id: req.params.id } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/commitments/:id/fail", async (req, res) => {
  const userId = await authenticateAndGetUser(req, res);
  if (!userId) return;
  try {
    const mcp = getMcpClient();
    const result = await mcp!.callTool({ name: "fail_commitment", arguments: { userId, id: req.params.id } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/plans/:id/approve", async (req, res) => {
  const userId = await authenticateAndGetUser(req, res);
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

app.post("/api/plans/:id/reject", async (req, res) => {
  const userId = await authenticateAndGetUser(req, res);
  if (!userId) return;
  const { expectedVersion, reason } = req.body;

  try {
    const mcp = getMcpClient();
    if (!mcp) throw new Error("MCP not connected");
    const result = await mcp.callTool({ name: "reject_plan", arguments: { userId, planId: req.params.id, expectedVersion, reason } });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true, message: ((result as any).content[0] as any).text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/constraints", async (req, res) => {
  const userId = await authenticateAndGetUser(req, res);
  if (!userId) return;
  const { type, value, description } = req.body;

  if (!value) {
    return res.status(400).json({ error: "Constraint value is required" });
  }

  try {
    const mcp = getMcpClient();
    if (!mcp) throw new Error("MCP not connected");
    const result = await mcp.callTool({
      name: "save_constraint",
      arguments: {
        userId,
        type: type || "preference",
        value: String(value),
        description: description ? String(description) : String(value)
      }
    });
    if (result.isError) return res.status(400).json({ error: ((result as any).content[0] as any).text });
    res.json({ success: true, message: ((result as any).content[0] as any).text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  logger.info(`Backend agent server listening on port ${PORT}`);
});
