import { BedrockRuntimeClient, ConverseCommand, Message, Tool } from "@aws-sdk/client-bedrock-runtime";
import { getMcpClient } from "./mcpClient.js";
import { z } from "zod";
import { CreateScheduleProposalResultSchema } from "./schemas.js";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
async function recordAgentEvent(userId: string, type: string, entity: string, newState: string) {
  try {
    await fetch("http://localhost:3002/internal/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalSecret: process.env.INTERNAL_SECRET, userId, type, entity, newState })
    });
  } catch (err) {
    console.error("Failed to record agent event via internal API:", err);
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
    
    return `\n\nCURRENT STATE:\nActive Commitments: ${commitmentsText}\nActive Constraints & Preferences: ${constraintsText}`;
  } catch (err) {
    console.error("Failed to fetch memory context", err);
    return "";
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
    console.error("Failed to get MCP:", err.message);
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
    console.error("Failed to list MCP tools:", err.message);
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

  const memoryContext = await getMemoryContext(mcp, userId);
  
  // Fetch Timezone
  let userTimezone = "UTC";
  try {
    const tzRes: any = await mcp.callTool({ name: "get_user_preferences", arguments: { userId } });
    const tzData = JSON.parse(tzRes.content.find((c: any) => c.type === 'text')?.text || "{}");
    if (tzData.timezone) userTimezone = tzData.timezone;
  } catch (err) {
    console.error("Failed to fetch user preferences:", err);
  }

  const nowUtc = new Date();
  const currentTimeUtcStr = nowUtc.toISOString();
  const localTime = toZonedTime(nowUtc, userTimezone);
  const localDateStr = format(localTime, "yyyy-MM-dd");
  const localTimeStr = format(localTime, "yyyy-MM-dd HH:mm");
  
  const timeContext = `\n\nCURRENT UTC: ${currentTimeUtcStr}\nUSER TIMEZONE: ${userTimezone}\nUSER LOCAL TIME: ${localTimeStr}\nLOCAL DATE: ${localDateStr}`;
  
  const fullSystemPrompt = SYSTEM_PROMPT + memoryContext + timeContext;

  let messages: Message[] = [...history, { role: "user", content: [{ text: userMessage }] }];
  const executedTools: string[] = [];
  let actionPerformed = false;

  const MAX_ITERATIONS = 5;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    let response;
    
    try {
      response = await bedrock.send(new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: fullSystemPrompt }],
        messages,
        toolConfig: { tools }
      }));
    } catch (error: any) {
      console.error("[Agent Error] Bedrock failed:", error.name, error.message);
      
      let errorCode = "BEDROCK_UNAVAILABLE";
      if (error.name === "AccessDeniedException" || error.name === "UnrecognizedClientException") errorCode = "BEDROCK_AUTH_FAILED";
      if (error.name === "TimeoutError") errorCode = "BEDROCK_TIMEOUT";

      // DEMO MODE RULE: Deterministic fallback allowed ONLY if MCP is available and it doesn't fabricate success.
      let simulatedReply = "[DEMO MODE] Running via local deterministic agent. ";
      const userMsgLower = userMessage.toLowerCase();
      let fallbackSuccess = false;

      // Log failure event
      await recordAgentEvent(userId, "EXECUTION_ERROR", "agent", JSON.stringify({ error: errorCode, details: error.message }));

      if (userMsgLower.includes("missed") || userMsgLower.includes("change")) {
        try {
          await mcp.callTool({ name: "assess_commitment_risk", arguments: { userId, currentTime: currentTimeUtcStr } });
          executedTools.push("assess_commitment_risk");
          await mcp.callTool({ 
            name: "create_schedule_proposal", 
            arguments: { 
              userId, 
              currentTimeUtc: currentTimeUtcStr, 
              planningDate: localDateStr,
              cutoffLocalTime: "21:00"
            } 
          });
          executedTools.push("create_schedule_proposal");
          actionPerformed = true; // generated a proposal
          simulatedReply += "I've detected the intent to replan. I am replanning your schedule based on the real database commitments.";
          fallbackSuccess = true;
        } catch (e: any) {
          console.error("[DEMO MODE] Tool execution failed:", e.message);
          simulatedReply = "Execution services are currently unavailable. No actions were performed.";
        }
      } else {
        try {
          await mcp.callTool({ name: "list_commitments", arguments: { userId } });
          executedTools.push("list_commitments");
          simulatedReply += "I am listening and maintaining your actual commitments from the database.";
          fallbackSuccess = true;
        } catch (e: any) {
          console.error("[DEMO MODE] Tool execution failed:", e.message);
          simulatedReply = "Execution services are currently unavailable. No actions were performed.";
        }
      }

      return {
        success: fallbackSuccess,
        errorCode: fallbackSuccess ? undefined : errorCode,
        reply: simulatedReply,
        history: messages,
        toolsExecuted: executedTools,
        actionPerformed
      };
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
      console.log(`[Agent] Executing tool: ${name}`);
      executedTools.push(name);
      
      try {
        const toolArgs: any = { ...(input as object), userId };

        // Deterministically enforce time values for critical tools
        if (name === "create_schedule_proposal") {
          toolArgs.currentTimeUtc = currentTimeUtcStr;
          toolArgs.planningDate = localDateStr;
          toolArgs.cutoffLocalTime = "21:00"; // fallback default for cutoff time
        }
        if (name === "assess_commitment_risk") {
          toolArgs.currentTime = currentTimeUtcStr;
        }

        let mcpResult: any;
        try {
          mcpResult = await mcp.callTool({ name, arguments: toolArgs }, undefined, { timeout: 5000 });
        } catch (e: any) {
          console.warn("[Agent] Tool error:", e.message);
          let errorCode = "MCP_TOOL_ERROR";
          if (e.code === "RequestTimeout" || e.message?.includes("timed out")) {
            errorCode = "MCP_TIMEOUT";
          }
          await recordAgentEvent(userId, "EXECUTION_ERROR", "agent", JSON.stringify({ error: errorCode, details: e.message }));
          toolResults.push({
            toolResult: { toolUseId, content: [{ text: `Error: ${e.message}` }], status: "error" }
          });
          continue;
        }

        let resultText = mcpResult.content.map((c: any) => c.type === 'text' ? c.text : '').join('');
        
        if (mcpResult.isError) {
          console.warn("[Agent] Tool returned logic error:", resultText);
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
        console.error(`[Agent] Tool error (${name}):`, e.message);
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
