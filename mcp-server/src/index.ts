import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import crypto from "crypto";
import { db, initDb } from "./db.js";

dotenv.config({ path: '../.env' });
initDb();

const app = express();
const PORT = process.env.PORT || 3002;
app.use(cors());
app.use(express.json());

const INTERNAL_SECRET = process.env.INTERNAL_SECRET;
if (!INTERNAL_SECRET) {
  console.error("FATAL: INTERNAL_SECRET environment variable is missing.");
  process.exit(1);
}

app.post("/internal/events", (req, res) => {
  const { internalSecret, userId, type, entity, newState } = req.body;
  if (internalSecret !== INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const id = crypto.randomUUID();
  try {
    const nowIso = new Date().toISOString();
    db.prepare("INSERT INTO events (id, user_id, type, entity, new_state, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      id, userId, type, entity, newState || null, nowIso
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to record event" });
  }
});

app.post("/internal/preferences/timezone", (req, res) => {
  const { internalSecret, userId, timezone } = req.body;
  if (internalSecret !== INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  if (!userId || !timezone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate IANA timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch (e) {
    return res.status(400).json({ error: "INVALID_TIMEZONE" });
  }

  try {
    const nowIso = new Date().toISOString();
    db.prepare(`
      INSERT INTO user_preferences (user_id, timezone, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET timezone=excluded.timezone, updated_at=excluded.updated_at
    `).run(userId, timezone, nowIso);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to update timezone:", err);
    res.status(500).json({ error: "Database error" });
  }
});

import { buildPlan } from "./planner.js";

const ListCommitmentsArgs = z.object({ userId: z.string() });
const IsoDateStr = z.string().regex(/Z|[+-]\d{2}:\d{2}$/, "Must be a fully-qualified ISO timestamp with Z or offset");

const CreateCommitmentArgs = z.object({
  userId: z.string(),
  title: z.string(),
  type: z.enum(["hard", "soft"]),
  estimated_minutes: z.number().positive("Duration must be positive").optional(),
  start_time: IsoDateStr.optional(),
  end_time: IsoDateStr.optional(),
  deadline: IsoDateStr.optional(),
  idempotency_key: z.string().optional()
}).refine(data => {
  if (data.start_time && data.end_time) {
    return new Date(data.start_time) < new Date(data.end_time);
  }
  return true;
}, { message: "end_time must be after start_time", path: ["end_time"] });

const AssessCommitmentRiskArgs = z.object({ userId: z.string(), currentTime: IsoDateStr });
const CreateScheduleProposalArgs = z.object({ userId: z.string(), currentTimeUtc: IsoDateStr, planningDate: z.string(), cutoffLocalTime: z.string() });
const ApproveCommitmentArgs = z.object({ userId: z.string(), id: z.string() });
const ApprovePlanArgs = z.object({ userId: z.string(), planId: z.string(), expectedVersion: z.number() });

const getServer = () => {
  const mcpServer = new Server(
    { name: "saarthi-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_commitments",
          description: "List all current commitments",
          inputSchema: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] }
        },
        {
          name: "list_events",
          description: "List audit events for the user",
          inputSchema: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] }
        },
        {
          name: "list_constraints",
          description: "List memory and constraints for the user",
          inputSchema: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] }
        },

        {
          name: "save_constraint",
          description: "Save a persistent constraint or preference",
          inputSchema: { 
            type: "object", 
            properties: { 
              userId: { type: "string" },
              type: { type: "string" },
              value: { type: "string" },
              description: { type: "string" }
            }, 
            required: ["userId", "type", "value"] 
          }
        },
        {
          name: "create_commitment",
          description: "Create a new commitment.",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "string" },
              title: { type: "string" },
              type: { type: "string", description: "'hard' or 'soft'" },
              estimated_minutes: { type: "number" },
              start_time: { type: "string" },
              end_time: { type: "string" },
              deadline: { type: "string" },
              idempotency_key: { type: "string" }
            },
            required: ["userId", "title", "type"]
          }
        },
        {
          name: "assess_commitment_risk",
          description: "Assess the risk state of commitments.",
          inputSchema: {
            type: "object",
            properties: { userId: { type: "string" }, currentTime: { type: "string" } },
            required: ["userId", "currentTime"]
          }
        },
        {
          name: "create_schedule_proposal",
          description: "Generate a new feasible schedule.",
          inputSchema: {
            type: "object",
            properties: { 
              userId: { type: "string" }, 
              currentTimeUtc: { type: "string" }, 
              planningDate: { type: "string" },
              cutoffLocalTime: { type: "string" } 
            },
            required: ["userId", "currentTimeUtc", "planningDate", "cutoffLocalTime"]
          }
        },
        {
          name: "approve_commitment",
          description: "Approve a proposed commitment.",
          inputSchema: {
            type: "object",
            properties: { userId: { type: "string" }, id: { type: "string" } },
            required: ["userId", "id"]
          }
        },
        {
          name: "approve_plan",
          description: "Approve a proposed schedule plan with optimistic concurrency.",
          inputSchema: {
            type: "object",
            properties: { userId: { type: "string" }, planId: { type: "string" }, expectedVersion: { type: "number" } },
            required: ["userId", "planId", "expectedVersion"]
          }
        },
        {
          name: "complete_commitment",
          description: "Mark a pending commitment as completed.",
          inputSchema: {
            type: "object",
            properties: { userId: { type: "string" }, id: { type: "string" } },
            required: ["userId", "id"]
          }
        },
        {
          name: "miss_commitment",
          description: "Mark a pending commitment as missed.",
          inputSchema: {
            type: "object",
            properties: { userId: { type: "string" }, id: { type: "string" } },
            required: ["userId", "id"]
          }
        },
        {
          name: "cancel_commitment",
          description: "Cancel a proposed or pending commitment.",
          inputSchema: {
            type: "object",
            properties: { userId: { type: "string" }, id: { type: "string" } },
            required: ["userId", "id"]
          }
        },
        {
          name: "fail_commitment",
          description: "Mark a pending commitment as failed.",
          inputSchema: {
            type: "object",
            properties: { userId: { type: "string" }, id: { type: "string" } },
            required: ["userId", "id"]
          }
        },
        {
          name: "get_user_preferences",
          description: "Get user preferences including timezone.",
          inputSchema: {
            type: "object",
            properties: { userId: { type: "string" } },
            required: ["userId"]
          }
        }
      ],
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    
    if (name === "get_user_preferences") {
      const parsed = z.object({ userId: z.string() }).safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const tzRow = db.prepare("SELECT timezone FROM user_preferences WHERE user_id=?").get(parsed.data.userId) as any;
      return { content: [{ type: "text", text: JSON.stringify({ timezone: tzRow?.timezone || "UTC" }) }] };
    }

    if (name === "list_commitments") {
      const parsed = ListCommitmentsArgs.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const rows = db.prepare("SELECT * FROM commitments WHERE user_id = ? AND status IN ('proposed', 'pending', 'missed')").all(parsed.data.userId);
      return { content: [{ type: "text", text: JSON.stringify(rows) }] };
    }

    if (name === "list_events") {
      const parsed = ListCommitmentsArgs.safeParse(rawArgs); // Use same schema since it's just userId
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const rows = db.prepare("SELECT * FROM events WHERE user_id = ? ORDER BY created_at DESC").all(parsed.data.userId);
      return { content: [{ type: "text", text: JSON.stringify(rows) }] };
    }

    if (name === "list_constraints") {
      const parsed = ListCommitmentsArgs.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const rows = db.prepare("SELECT * FROM constraints WHERE user_id = ?").all(parsed.data.userId);
      return { content: [{ type: "text", text: JSON.stringify(rows) }] };
    }

    if (name === "save_constraint") {
      const schema = z.object({ userId: z.string(), type: z.string(), value: z.string(), description: z.string().optional() });
      const parsed = schema.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const id = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      db.prepare("INSERT INTO constraints (id, user_id, type, value, description, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, parsed.data.userId, parsed.data.type, parsed.data.value, parsed.data.description || null, nowIso);
      return { content: [{ type: "text", text: `Constraint saved with ID ${id}` }] };
    }

    if (name === "create_commitment") {
      const parsed = CreateCommitmentArgs.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const { userId, title, type, estimated_minutes, start_time, end_time, deadline, idempotency_key } = parsed.data;
      
      if (idempotency_key) {
        const existing = db.prepare("SELECT id FROM commitments WHERE user_id = ? AND idempotency_key = ?").get(userId, idempotency_key) as any;
        if (existing) {
          return { content: [{ type: "text", text: `Idempotent duplicate ignored. Existing ID: ${existing.id}` }] };
        }
      }

      const id = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      
      const tx = db.transaction(() => {
        db.prepare(`
          INSERT INTO commitments (id, user_id, title, type, estimated_minutes, start_time, end_time, deadline, status, idempotency_key, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?, ?)
        `).run(id, userId, title, type, estimated_minutes || null, start_time || null, end_time || null, deadline || null, idempotency_key || null, nowIso, nowIso);
        
        db.prepare("INSERT INTO events (id, user_id, type, entity, new_state, request_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(eventId, userId, "COMMITMENT_PROPOSED", "commitment", JSON.stringify({ id, title, type, status: 'proposed' }), idempotency_key || null, nowIso);
      });
      
      try {
        tx();
        return { content: [{ type: "text", text: `Commitment ${id} proposed. Awaiting user confirmation.` }] };
      } catch (err: any) {
        return { content: [{ type: "text", text: `Transaction Error: ${err.message}` }], isError: true };
      }
    }

    if (name === "approve_commitment") {
      const parsed = ApproveCommitmentArgs.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      const { userId, id } = parsed.data;

      const current = db.prepare("SELECT status FROM commitments WHERE id = ? AND user_id = ?").get(id, userId) as any;
      if (!current) return { content: [{ type: "text", text: "Commitment not found or unauthorized." }], isError: true };
      if (current.status === 'pending') return { content: [{ type: "text", text: "Idempotent duplicate ignored. Already pending." }] };
      if (current.status !== 'proposed') return { content: [{ type: "text", text: `Cannot approve commitment in state: ${current.status}` }], isError: true };

      const tx = db.transaction(() => {
        const nowIso = new Date().toISOString();
        db.prepare("UPDATE commitments SET status = 'pending', updated_at = ? WHERE id = ? AND user_id = ?").run(nowIso, id, userId);
        if (userId === "TRIGGER_ROLLBACK") throw new Error("Intentional Rollback Trigger");
        db.prepare("INSERT INTO events (id, user_id, type, entity, old_state, new_state, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(crypto.randomUUID(), userId, "COMMITMENT_APPROVED", "commitment", JSON.stringify({ id, status: 'proposed' }), JSON.stringify({ id, status: 'pending' }), nowIso);
      });

      try {
        tx();
        return { content: [{ type: "text", text: `Commitment ${id} approved and is now pending.` }] };
      } catch (err: any) {
        return { content: [{ type: "text", text: `Transaction Error: ${err.message}` }], isError: true };
      }
    }

    const transitionCommitment = (userId: string, id: string, newState: string, allowedCurrentStates: string[], eventType: string) => {
      const current = db.prepare("SELECT status FROM commitments WHERE id = ? AND user_id = ?").get(id, userId) as any;
      if (!current) return { content: [{ type: "text", text: "Commitment not found or unauthorized." }], isError: true };
      if (current.status === newState) return { content: [{ type: "text", text: `Idempotent duplicate ignored. Already ${newState}.` }] };
      if (!allowedCurrentStates.includes(current.status)) return { content: [{ type: "text", text: `Cannot transition from ${current.status} to ${newState}.` }], isError: true };

      const tx = db.transaction(() => {
        const nowIso = new Date().toISOString();
        db.prepare("UPDATE commitments SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(newState, nowIso, id, userId);
        if (userId === "TRIGGER_ROLLBACK") throw new Error("Intentional Rollback Trigger");
        db.prepare("INSERT INTO events (id, user_id, type, entity, old_state, new_state, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(crypto.randomUUID(), userId, eventType, "commitment", JSON.stringify({ id, status: current.status }), JSON.stringify({ id, status: newState }), nowIso);
      });

      try {
        tx();
        return { content: [{ type: "text", text: `Commitment ${id} transitioned to ${newState}.` }] };
      } catch (err: any) {
        return { content: [{ type: "text", text: `Transaction Error: ${err.message}` }], isError: true };
      }
    };

    if (name === "complete_commitment") {
      const parsed = z.object({ userId: z.string(), id: z.string() }).safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      return transitionCommitment(parsed.data.userId, parsed.data.id, "completed", ["pending"], "COMMITMENT_COMPLETED");
    }

    if (name === "miss_commitment") {
      const parsed = z.object({ userId: z.string(), id: z.string() }).safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      return transitionCommitment(parsed.data.userId, parsed.data.id, "missed", ["pending"], "COMMITMENT_MISSED");
    }

    if (name === "cancel_commitment") {
      const parsed = z.object({ userId: z.string(), id: z.string() }).safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      return transitionCommitment(parsed.data.userId, parsed.data.id, "cancelled", ["proposed", "pending"], "COMMITMENT_CANCELLED");
    }

    if (name === "fail_commitment") {
      const parsed = z.object({ userId: z.string(), id: z.string() }).safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      return transitionCommitment(parsed.data.userId, parsed.data.id, "failed", ["pending"], "COMMITMENT_FAILED");
    }

    if (name === "approve_plan") {
      const parsed = ApprovePlanArgs.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      const { userId, planId, expectedVersion } = parsed.data;

      const plan = db.prepare("SELECT version, status FROM plans WHERE id = ? AND user_id = ?").get(planId, userId) as any;
      if (!plan) return { content: [{ type: "text", text: "Plan not found." }], isError: true };
      if (plan.status !== 'proposed') return { content: [{ type: "text", text: `Plan is already ${plan.status}.` }], isError: true };
      if (plan.version !== expectedVersion) return { content: [{ type: "text", text: `Concurrency Error: Stale plan. Expected v${expectedVersion}, found v${plan.version}.` }], isError: true };

      const tx = db.transaction(() => {
        const nowIso = new Date().toISOString();
        // Invalidate all other proposed plans
        db.prepare("UPDATE plans SET status = 'invalidated' WHERE user_id = ? AND status = 'proposed' AND id != ?").run(userId, planId);
        
        // Approve this plan
        db.prepare("UPDATE plans SET status = 'accepted' WHERE id = ?").run(planId);
        db.prepare("INSERT INTO events (id, user_id, type, entity, plan_version, new_state, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(crypto.randomUUID(), userId, "PLAN_ACCEPTED", "plan", plan.version, JSON.stringify({ id: planId, status: 'accepted' }), nowIso);
      });

      try {
        tx();
        return { content: [{ type: "text", text: `Plan v${plan.version} accepted successfully.` }] };
      } catch (err: any) {
        return { content: [{ type: "text", text: `Transaction Error: ${err.message}` }], isError: true };
      }
    }

    if (name === "assess_commitment_risk") {
      const parsed = AssessCommitmentRiskArgs.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const rows = db.prepare("SELECT * FROM commitments WHERE status IN ('pending', 'missed') AND user_id=?").all(parsed.data.userId);
      let risk = "LOW";
      if (rows.length > 5) risk = "MEDIUM";
      return { content: [{ type: "text", text: JSON.stringify({ riskState: risk, activeCommitments: rows.length }) }] };
    }

    if (name === "create_schedule_proposal") {
      const parsed = CreateScheduleProposalArgs.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const { userId, currentTimeUtc, planningDate, cutoffLocalTime } = parsed.data;
      
      const tzRow = db.prepare("SELECT timezone FROM user_preferences WHERE user_id=?").get(userId) as any;
      const userTimezone = tzRow?.timezone || "UTC"; // fallback only if not set, but user flow should set it

      const activeCommitments = db.prepare("SELECT * FROM commitments WHERE status IN ('pending', 'missed') AND user_id=?").all(userId) as any[];
      
      const mapped = activeCommitments.map(c => ({
        id: c.id,
        type: c.type,
        startTime: c.start_time,
        endTime: c.end_time,
        estimatedMinutes: c.estimated_minutes,
        deadline: c.deadline
      }));

      const planResult = buildPlan(mapped, currentTimeUtc, userTimezone, planningDate, cutoffLocalTime);
      
      // Determine version
      const maxVersionRow = db.prepare("SELECT MAX(version) as maxV FROM plans WHERE user_id=?").get(userId) as any;
      const newVersion = (maxVersionRow?.maxV || 0) + 1;
      
      const planId = crypto.randomUUID();
      
      const tx = db.transaction(() => {
        const nowIso = new Date().toISOString();
        // Save plan
        db.prepare(`
          INSERT INTO plans (id, user_id, version, status, reasoning, risk_state, supersedes_version, created_at)
          VALUES (?, ?, ?, 'proposed', ?, ?, ?, ?)
        `).run(planId, userId, newVersion, planResult.explanation, planResult.riskState, maxVersionRow?.maxV || null, nowIso);
        
        // Save blocks
        const insertBlock = db.prepare("INSERT INTO plan_blocks (id, plan_id, commitment_id, start_time, end_time) VALUES (?, ?, ?, ?, ?)");
        if (userId === "TRIGGER_ROLLBACK") throw new Error("Intentional Blocks Failure");
        for (const block of planResult.blocks) {
          insertBlock.run(crypto.randomUUID(), planId, block.commitmentId, block.startTime, block.endTime);
        }

        db.prepare("INSERT INTO events (id, user_id, type, entity, new_state, plan_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(crypto.randomUUID(), userId, "PLAN_PROPOSED", "plan", JSON.stringify(planResult), newVersion, nowIso);
      });
      
      try {
        tx();
      } catch (err: any) {
        return { content: [{ type: "text", text: `Transaction Error: ${err.message}` }], isError: true };
      }

      const responseObj = {
        status: "success",
        planId: planId,
        version: newVersion,
        supersedes_version: maxVersionRow?.maxV || null,
        explanation: planResult.explanation,
        totalScheduledBlocks: planResult.blocks.length,
        conflictsCount: planResult.conflicts.length,
        blocks: planResult.blocks.map(b => ({
          commitmentId: b.commitmentId,
          startTime: b.startTime,
          endTime: b.endTime
        }))
      };

      return { content: [{ type: "text", text: JSON.stringify(responseObj) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return mcpServer;
};

const sessions = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  let transport: StreamableHTTPServerTransport;

  try {
    if (sessionId && sessions.has(sessionId)) {
      transport = sessions.get(sessionId)!;
    } else {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (sid) => {
          sessions.set(sid, transport);
        }
      });
      const server = getServer();
      await server.connect(transport);
    }
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("Transport error:", err);
    res.status(500).send("Transport error");
  }
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  if (!sessionId) {
    res.status(400).send("Missing session ID");
    return;
  }
  const transport = sessions.get(sessionId);
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }
  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("GET Transport error:", err);
  }
});

app.listen(PORT, () => {
  console.log(`MCP Server listening on port ${PORT} (Streamable HTTP at /mcp)`);
});
