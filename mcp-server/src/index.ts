import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import crypto from "crypto";
import { db, initDb } from "./db.js";

dotenv.config();
initDb();

const app = express();
const PORT = process.env.PORT || 3002;
app.use(cors());

import { buildPlan } from "./planner.js";

const ListCommitmentsArgs = z.object({ userId: z.string() });
const CreateCommitmentArgs = z.object({
  userId: z.string(),
  title: z.string(),
  type: z.enum(["hard", "soft"]),
  estimated_minutes: z.number().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  deadline: z.string().optional(),
  idempotency_key: z.string().optional()
});
const AssessCommitmentRiskArgs = z.object({ userId: z.string(), currentTime: z.string() });
const CreateScheduleProposalArgs = z.object({ userId: z.string(), currentTime: z.string(), cutoffTime: z.string() });
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
            properties: { userId: { type: "string" }, currentTime: { type: "string" }, cutoffTime: { type: "string" } },
            required: ["userId", "currentTime", "cutoffTime"]
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
        }
      ],
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    
    if (name === "list_commitments") {
      const parsed = ListCommitmentsArgs.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const rows = db.prepare("SELECT * FROM commitments WHERE user_id = ?").all(parsed.data.userId);
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
      db.prepare("INSERT INTO constraints (id, user_id, type, value, description) VALUES (?, ?, ?, ?, ?)").run(id, parsed.data.userId, parsed.data.type, parsed.data.value, parsed.data.description || null);
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
      
      const tx = db.transaction(() => {
        db.prepare(`
          INSERT INTO commitments (id, user_id, title, type, estimated_minutes, start_time, end_time, deadline, status, idempotency_key)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?)
        `).run(id, userId, title, type, estimated_minutes || null, start_time || null, end_time || null, deadline || null, idempotency_key || null);
        
        db.prepare("INSERT INTO events (id, user_id, type, entity, new_state, request_id) VALUES (?, ?, ?, ?, ?, ?)")
          .run(eventId, userId, "COMMITMENT_PROPOSED", "commitment", JSON.stringify({ id, title, type, status: 'proposed' }), idempotency_key || null);
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
      if (current.status !== 'proposed') return { content: [{ type: "text", text: `Cannot approve commitment in state: ${current.status}` }], isError: true };

      const tx = db.transaction(() => {
        db.prepare("UPDATE commitments SET status = 'pending' WHERE id = ? AND user_id = ?").run(id, userId);
        if (userId === "TRIGGER_ROLLBACK") throw new Error("Intentional Rollback Trigger");
        db.prepare("INSERT INTO events (id, user_id, type, entity, new_state) VALUES (?, ?, ?, ?, ?)")
          .run(crypto.randomUUID(), userId, "COMMITMENT_APPROVED", "commitment", JSON.stringify({ id, status: 'pending' }));
      });

      try {
        tx();
        return { content: [{ type: "text", text: `Commitment ${id} approved and is now pending.` }] };
      } catch (err: any) {
        return { content: [{ type: "text", text: `Transaction Error: ${err.message}` }], isError: true };
      }
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
        // Invalidate all other proposed plans
        db.prepare("UPDATE plans SET status = 'invalidated' WHERE user_id = ? AND status = 'proposed' AND id != ?").run(userId, planId);
        
        // Approve this plan
        db.prepare("UPDATE plans SET status = 'accepted' WHERE id = ?").run(planId);
        db.prepare("INSERT INTO events (id, user_id, type, entity, plan_version, new_state) VALUES (?, ?, ?, ?, ?, ?)")
          .run(crypto.randomUUID(), userId, "PLAN_ACCEPTED", "plan", plan.version, JSON.stringify({ id: planId, status: 'accepted' }));
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
      
      const rows = db.prepare("SELECT * FROM commitments WHERE status='pending' AND user_id=?").all(parsed.data.userId);
      let risk = "LOW";
      if (rows.length > 5) risk = "MEDIUM";
      return { content: [{ type: "text", text: JSON.stringify({ riskState: risk, activeCommitments: rows.length }) }] };
    }

    if (name === "create_schedule_proposal") {
      const parsed = CreateScheduleProposalArgs.safeParse(rawArgs);
      if (!parsed.success) return { content: [{ type: "text", text: `Validation Error: ${parsed.error.message}` }], isError: true };
      
      const { userId, currentTime, cutoffTime } = parsed.data;
      
      const activeCommitments = db.prepare("SELECT * FROM commitments WHERE status='pending' AND user_id=?").all(userId) as any[];
      
      const mapped = activeCommitments.map(c => ({
        id: c.id,
        type: c.type,
        startTime: c.start_time,
        endTime: c.end_time,
        estimatedMinutes: c.estimated_minutes,
        deadline: c.deadline
      }));

      const planResult = buildPlan(mapped, currentTime, cutoffTime);
      
      // Determine version
      const maxVersionRow = db.prepare("SELECT MAX(version) as maxV FROM plans WHERE user_id=?").get(userId) as any;
      const newVersion = (maxVersionRow?.maxV || 0) + 1;
      
      const planId = crypto.randomUUID();
      
      const tx = db.transaction(() => {
        // Save plan
        db.prepare(`
          INSERT INTO plans (id, user_id, version, status, reasoning, risk_state, supersedes_version)
          VALUES (?, ?, ?, 'proposed', ?, ?, ?)
        `).run(planId, userId, newVersion, planResult.explanation, planResult.riskState, maxVersionRow?.maxV || null);
        
        // Save blocks
        const insertBlock = db.prepare("INSERT INTO plan_blocks (id, plan_id, commitment_id, start_time, end_time) VALUES (?, ?, ?, ?, ?)");
        if (userId === "TRIGGER_ROLLBACK") throw new Error("Intentional Blocks Failure");
        for (const block of planResult.blocks) {
          insertBlock.run(crypto.randomUUID(), planId, block.commitmentId, block.startTime, block.endTime);
        }

        db.prepare("INSERT INTO events (id, user_id, type, entity, new_state, plan_version) VALUES (?, ?, ?, ?, ?, ?)")
          .run(crypto.randomUUID(), userId, "PLAN_PROPOSED", "plan", JSON.stringify(planResult), newVersion);
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
