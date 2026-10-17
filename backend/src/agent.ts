import { BedrockRuntimeClient, ConverseCommand, Message, Tool } from "@aws-sdk/client-bedrock-runtime";
import { getMcpClient } from "./mcpClient.js";
import { logger } from "./logger.js";
import { z } from "zod";
import { CreateScheduleProposalResultSchema } from "./schemas.js";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {})
  } : undefined
});
async function recordAgentEvent(userId: string, type: string, entity: string, newState: string) {
  try {
    await fetch("http://localhost:3002/internal/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalSecret: process.env.INTERNAL_SECRET, userId, type, entity, newState })
    });
  } catch (err) {
    logger.error("Failed to record agent event via internal API", { error: err });
  }
}
// Using Claude Sonnet 4.6 as the verified active model. EOL no sooner than Feb 17, 2027.
// AWS Documentation confirms Converse API and tool-use support for this model ID.
const MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are SAARTHI, a context-aware execution agent that maintains a living model of a user's commitments, constraints, schedule, and progress.
You are not a generic AI assistant. You manage consequences. You protect constraints.
You must use the provided tools to interact with the user's state. 
Do not expose internal chain of thought. If a commitment changes, evaluate the risk and propose replanning.`;

async function getMemoryContext(mcp: any, userId: string) {
  try {
    const commitmentsRes = await mcp.callTool({ name: "list_commitments", arguments: { userId } });
    const constraintsRes = await mcp.callTool({ name: "list_constraints", arguments: { userId } });
    const commitmentsText = commitmentsRes.content.find((c: any) => c.type === 'text')?.text || '[]';
    const constraintsText = constraintsRes.content.find((c: any) => c.type === 'text')?.text || '[]';
    
    let cutoffTime = "22:00";
    try {
      const parsedConstraints = JSON.parse(constraintsText);
      const timeLimitConstraint = parsedConstraints.find((c: any) => c.type === "time_limit" && c.value);
      if (timeLimitConstraint) {
        cutoffTime = timeLimitConstraint.value;
      }
    } catch {
      // ignore JSON parse error
    }

    return {
      memoryPrompt: `\n\nCURRENT STATE:\nActive Commitments: ${commitmentsText}\nActive Constraints & Preferences: ${constraintsText}`,
      cutoffTime
    };
  } catch (err) {
    logger.error("Failed to fetch memory context", { error: err });
    return { memoryPrompt: "", cutoffTime: "22:00" };
  }
}

export interface AgentResponse {
  success: boolean;
  errorCode?: string;
  reply: string;
  history: Message[];
  toolsExecuted: string[];
  actionPerformed: boolean;
}

export async function askAgent(userId: string, userMessage: string, history: Message[] = []): Promise<AgentResponse> {
  let mcp;
  try {
    mcp = getMcpClient();
    if (!mcp) throw new Error("MCP Client not initialized");
  } catch (err: any) {
    logger.error("Failed to get MCP", { error: err, error_code: "MCP_UNAVAILABLE" });
    return {
      success: false,
      errorCode: "MCP_UNAVAILABLE",
      reply: "AI and execution services are currently unavailable. No actions were performed.",
      history: [...history, { role: "user", content: [{ text: userMessage }] }],
      toolsExecuted: [],
      actionPerformed: false
    };
  }

  let mcpToolsRes;
  try {
    mcpToolsRes = await mcp.listTools();
  } catch (err: any) {
    logger.error("Failed to list MCP tools", { error: err, error_code: "MCP_UNAVAILABLE" });
    return {
      success: false,
      errorCode: "MCP_UNAVAILABLE",
      reply: "AI and execution services are currently unavailable. No actions were performed.",
      history: [...history, { role: "user", content: [{ text: userMessage }] }],
      toolsExecuted: [],
      actionPerformed: false
    };
  }
  
  // Exclude approval and completion tools so LLM cannot autonomously execute lifecycles
  const forbiddenTools = [
    "approve_commitment", "approve_plan", "reject_commitment", "reject_plan", "cancel_action",
    "complete_commitment", "miss_commitment", "cancel_commitment", "fail_commitment"
  ];
  
  // Transform MCP tools to Bedrock Tool format
  const tools: Tool[] = mcpToolsRes.tools
    .filter((t: any) => !forbiddenTools.includes(t.name))
    .map((t: any) => ({
      toolSpec: {
        name: t.name,
        description: t.description,
        inputSchema: {
          json: t.inputSchema
        }
      }
    }));

  const { memoryPrompt, cutoffTime } = await getMemoryContext(mcp, userId);
  
  // Fetch Timezone
  let userTimezone = "UTC";
  try {
    const tzRes: any = await mcp.callTool({ name: "get_user_preferences", arguments: { userId } });
    const tzData = JSON.parse(tzRes.content.find((c: any) => c.type === 'text')?.text || "{}");
    if (tzData.timezone) userTimezone = tzData.timezone;
  } catch (err) {
    logger.error("Failed to fetch user preferences", { error: err });
  }

  const nowUtc = new Date();
  const currentTimeUtcStr = nowUtc.toISOString();
  const localTime = toZonedTime(nowUtc, userTimezone);
  const localDateStr = format(localTime, "yyyy-MM-dd");
  const localTimeStr = format(localTime, "yyyy-MM-dd HH:mm");
  
  const timeContext = `\n\nCURRENT UTC: ${currentTimeUtcStr}\nUSER TIMEZONE: ${userTimezone}\nUSER LOCAL TIME: ${localTimeStr}\nLOCAL DATE: ${localDateStr}`;
  
  const fullSystemPrompt = SYSTEM_PROMPT + memoryPrompt + timeContext;

  const formattedHistory: Message[] = (history || []).map((h: any) => {
    if (Array.isArray(h.content)) return h;
    return {
      role: h.role === 'agent' ? 'assistant' : (h.role || 'user'),
      content: [{ text: typeof h.content === 'string' ? h.content : JSON.stringify(h.content) }]
    };
  });

  let messages: Message[] = [...formattedHistory, { role: "user", content: [{ text: userMessage }] }];
  const executedTools: string[] = [];
  let actionPerformed = false;

  const isAwsConfigured = Boolean(
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    process.env.AWS_PROFILE
  );

  const runDeterministicPlanner = async (reasonNotice: string, errorCode?: string, rawError?: any): Promise<AgentResponse> => {
    const isDemo = process.env.DEMO_MODE === "true";
    let simulatedReply = isDemo 
      ? "[DEMO MODE] Running via local deterministic agent. " 
      : "[DETERMINISTIC FALLBACK] Executing via deterministic MCP engine. ";
    const userMsgLower = userMessage.toLowerCase();
    let fallbackSuccess = false;

    if (userMsgLower.includes("missed") || userMsgLower.includes("change") || userMsgLower.includes("replan") || userMsgLower.includes("fix") || userMsgLower.includes("schedule")) {
      try {
        await mcp.callTool({ name: "assess_commitment_risk", arguments: { userId, currentTime: currentTimeUtcStr } });
        executedTools.push("assess_commitment_risk");
        const planRes: any = await mcp.callTool({ 
          name: "create_schedule_proposal", 
          arguments: { 
            userId, 
            currentTimeUtc: currentTimeUtcStr, 
            planningDate: localDateStr,
            cutoffLocalTime: cutoffTime
          } 
        });
        executedTools.push("create_schedule_proposal");
        actionPerformed = true;

        let planVersion = 1;
        let totalBlocks = 0;
        let explanation = "Rescheduled past-due sessions while preserving your cutoff time.";
        try {
          const rawPlanText = planRes.content?.find((c: any) => c.type === 'text')?.text || "{}";
          const planObj = JSON.parse(rawPlanText);
          if (planObj.version) planVersion = planObj.version;
          if (planObj.totalScheduledBlocks) totalBlocks = planObj.totalScheduledBlocks;
          if (planObj.explanation) explanation = planObj.explanation;
        } catch {
          // keep defaults
        }

        simulatedReply += `I assessed your schedule risks and generated proposed schedule Plan v${planVersion} (${totalBlocks} blocks). ${explanation}\n\nPlease review and authorize this proposal on the Living Plans page.`;
        fallbackSuccess = true;
      } catch (e: any) {
        logger.error("Deterministic planning failed", { error: e, tool_name: "create_schedule_proposal" });
        simulatedReply = "Execution services are currently unavailable. No actions were performed.";
      }
    } else {
      try {
        const commsRes: any = await mcp.callTool({ name: "list_commitments", arguments: { userId } });
        executedTools.push("list_commitments");
        const constraintsRes: any = await mcp.callTool({ name: "list_constraints", arguments: { userId } });
        executedTools.push("list_constraints");
        
        let commCount = 0;
        let constraintCount = 0;
        try {
          const comms = JSON.parse(commsRes.content?.find((c: any) => c.type === 'text')?.text || "[]");
          const constraints = JSON.parse(constraintsRes.content?.find((c: any) => c.type === 'text')?.text || "[]");
          commCount = comms.length;
          constraintCount = constraints.length;
        } catch {}

        simulatedReply += `You currently have ${commCount} active commitments and ${constraintCount} stored constraints in your living schedule model.`;
        fallbackSuccess = true;
      } catch (e: any) {
        logger.error("Deterministic query failed", { error: e, tool_name: "list_commitments" });
        simulatedReply = "Execution services are currently unavailable. No actions were performed.";
      }
    }

    if (fallbackSuccess) {
      await recordAgentEvent(userId, "FALLBACK_PLANNER_ACTIVATED", "agent", JSON.stringify({
        status: "SUCCESS",
        note: reasonNotice,
        toolsExecuted: executedTools
      }));
    } else {
      await recordAgentEvent(userId, "EXECUTION_ERROR", "agent", JSON.stringify({ 
        error: errorCode || "FALLBACK_FAILED", 
        details: rawError?.message || "Deterministic planner failed.",
        fallbackFailed: true 
      }));
    }

    return {
      success: fallbackSuccess,
      errorCode: fallbackSuccess ? undefined : (errorCode || "EXECUTION_FAILED"),
      reply: simulatedReply,
      history: messages,
      toolsExecuted: executedTools,
      actionPerformed
    };
  };

  if (!isAwsConfigured) {
    logger.info("Bedrock AWS credentials unconfigured in .env. Executing via local deterministic MCP engine.", {
      operation: "agent.deterministic",
      user_id: userId
    });
    return await runDeterministicPlanner("Amazon Bedrock AWS credentials unconfigured. Executed via deterministic MCP engine.");
  }

  const MAX_ITERATIONS = 5;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    let response;
    
    let bedrockStart = performance.now();
    try {
      bedrockStart = performance.now();
      response = await bedrock.send(new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: fullSystemPrompt }],
        messages,
        toolConfig: { tools }
      }));
      const duration_ms = performance.now() - bedrockStart;
      logger.info("Bedrock request completed", { operation: "bedrock.converse", duration_ms, success: true });
    } catch (error: any) {
      let errorCode = "BEDROCK_UNAVAILABLE";
      if (error.name === "AccessDeniedException" || error.name === "UnrecognizedClientException") errorCode = "BEDROCK_AUTH_FAILED";
      if (error.name === "TimeoutError") errorCode = "BEDROCK_TIMEOUT";

      const duration_ms = performance.now() - bedrockStart;
      logger.warn("Bedrock unavailable, failing over to deterministic MCP planner", { 
        error_code: errorCode, 
        error_name: error.name,
        error_message: error.message,
        operation: "bedrock.converse",
        duration_ms
      });

      return await runDeterministicPlanner(
        `Amazon Bedrock unavailable (${errorCode}). Failing over to deterministic MCP planner.`,
        errorCode,
        error
      );
    }

    const outputMessage = response.output?.message;
    if (!outputMessage || !outputMessage.content) {
      await recordAgentEvent(userId, "EXECUTION_ERROR", "agent", JSON.stringify({ error: "BEDROCK_INVALID_RESPONSE" }));
      return {
        success: false,
        errorCode: "BEDROCK_INVALID_RESPONSE",
        reply: "I encountered an internal error interpreting my state. No actions were performed.",
        history: messages,
        toolsExecuted: executedTools,
        actionPerformed
      };
    }

    const toolRequests = outputMessage.content.filter((c: any) => c.toolUse) || [];
    
    if (toolRequests.length === 0) {
      // Final response
      return {
        success: true,
        reply: outputMessage.content.find((c: any) => c.text)?.text || "",
        history: [...messages, outputMessage],
        toolsExecuted: executedTools,
        actionPerformed
      };
    }

    messages.push(outputMessage);
    const toolResults = [];

    for (const req of toolRequests) {
      const { toolUseId, name, input } = req.toolUse as any;
      logger.info("Executing tool", { tool_name: name });
      executedTools.push(name);
      
      try {
        const toolArgs: any = { ...(input as object), userId };

        // Deterministically enforce time values for critical tools
        if (name === "create_schedule_proposal") {
          toolArgs.currentTimeUtc = currentTimeUtcStr;
          toolArgs.planningDate = localDateStr;
          toolArgs.cutoffLocalTime = cutoffTime;
        }
        if (name === "assess_commitment_risk") {
          toolArgs.currentTime = currentTimeUtcStr;
        }

        let mcpResult: any;
        try {
          mcpResult = await mcp.callTool({ name, arguments: toolArgs }, undefined, { timeout: 5000 });
        } catch (e: any) {
          let errorCode = "MCP_TOOL_ERROR";
          if (e.code === "RequestTimeout" || e.message?.includes("timed out")) {
            errorCode = "MCP_TIMEOUT";
          }
          logger.error("MCP Tool execution failed", { error: e, tool_name: name, error_code: errorCode });
          await recordAgentEvent(userId, "EXECUTION_ERROR", "agent", JSON.stringify({ error: errorCode, details: e.message }));
          toolResults.push({
            toolResult: { toolUseId, content: [{ text: `Error: ${e.message}` }], status: "error" }
          });
          continue;
        }

        let resultText = mcpResult.content.map((c: any) => c.type === 'text' ? c.text : '').join('');
        
        if (mcpResult.isError) {
          logger.warn("Tool returned logic error", { error_message: resultText, tool_name: name, error_code: "TOOL_LOGIC_ERROR" });
          // e.g. PLANNER_ERROR or VALIDATION_ERROR but we feed it back to LLM so it learns it failed
          toolResults.push({
            toolResult: { toolUseId, content: [{ text: `Error: ${resultText}` }], status: "error" }
          });
          continue;
        }

        // Schema validation
        let schemaValid = true;
        if (name === "list_commitments" || name === "list_events" || name === "list_constraints") {
          try { z.array(z.record(z.string(), z.any())).parse(JSON.parse(resultText)); } 
          catch (e) { schemaValid = false; }
        }
        if (name === "assess_commitment_risk") {
          try { z.object({ riskState: z.string(), activeCommitments: z.number() }).parse(JSON.parse(resultText)); } 
          catch (e) { schemaValid = false; }
        }
        if (name === "create_schedule_proposal") {
          try { CreateScheduleProposalResultSchema.parse(JSON.parse(resultText)); } 
          catch (e) { schemaValid = false; }
          if (schemaValid) actionPerformed = true;
        }

        if (!schemaValid) {
          resultText = "Error: Output failed schema validation (TOOL_OUTPUT_INVALID).";
          toolResults.push({
            toolResult: { toolUseId, content: [{ text: resultText }], status: "error" }
          });
        } else {
          toolResults.push({
            toolResult: { toolUseId, content: [{ text: resultText }], status: "success" }
          });
        }

      } catch (e: any) {
        logger.error("Unexpected tool processing error", { error: e, tool_name: name });
        const isTimeout = e.message.includes("timed out");
        toolResults.push({
          toolResult: {
            toolUseId,
            content: [{ text: `Error: ${isTimeout ? 'MCP_TIMEOUT' : 'MCP_TOOL_ERROR'} - ${e.message}` }],
            status: "error"
          }
        });
      }
    }
    
    messages.push({ role: "user", content: toolResults as any });
  }

  // Loop breached MAX_ITERATIONS
  await recordAgentEvent(userId, "EXECUTION_ERROR", "agent", JSON.stringify({ error: "MAX_ITERATIONS_REACHED" }));
  return {
    success: false,
    errorCode: "MAX_ITERATIONS_REACHED",
    reply: "I needed too many steps to process this request. No further actions were performed.",
    history: messages,
    toolsExecuted: executedTools,
    actionPerformed
  };
}
