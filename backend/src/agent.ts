import { BedrockRuntimeClient, ConverseCommand, Message, Tool } from "@aws-sdk/client-bedrock-runtime";
import { getMcpClient } from "./mcpClient.js";
import { z } from "zod";
import { CreateScheduleProposalResultSchema } from "./schemas.js";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
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

export async function askAgent(userId: string, userMessage: string, history: Message[] = []) {
  const mcp = getMcpClient();
  if (!mcp) throw new Error("MCP Client not initialized");

  let mcpToolsRes;
  try {
    mcpToolsRes = await mcp.listTools();
  } catch (err: any) {
    console.error("Failed to list MCP tools:", err.message);
    throw new Error("Cannot orchestrate without MCP tools: " + err.message);
  }
  
  // Exclude approval tools so LLM cannot autonomously approve
  const forbiddenTools = ["approve_commitment", "approve_plan", "reject_commitment", "reject_plan", "cancel_action"];
  
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
  const fullSystemPrompt = SYSTEM_PROMPT + memoryContext;

  const messages: Message[] = [...history, { role: "user", content: [{ text: userMessage }] }];

  try {
    const response = await bedrock.send(new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: fullSystemPrompt }],
      messages,
      toolConfig: { tools }
    }));

    const outputMessage = response.output?.message;
    if (!outputMessage) throw new Error("No message returned from Bedrock");

    // Handle tool requests
    const toolRequests = outputMessage.content?.filter((c: any) => c.toolUse) || [];
    
    if (toolRequests.length > 0) {
      messages.push(outputMessage);
      
      const toolResults = [];
      for (const req of toolRequests) {
        const { toolUseId, name, input } = req.toolUse as any;
        console.log(`[Agent] Executing tool: ${name}`);
        
        try {
          // Force inject userId so LLM cannot bypass authorization
          const toolArgs = { ...(input as object), userId };

          // Circuit breaker: 5s timeout
          const mcpPromise = mcp.callTool({ name, arguments: toolArgs });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MCP Tool execution timed out")), 5000)
          );
          
          const mcpResult = await Promise.race([mcpPromise, timeoutPromise]) as any;
          let resultText = mcpResult.content.map((c: any) => c.type === 'text' ? c.text : '').join('');
          
          // Tool Output Validation using Zod
          if (name === "list_commitments" || name === "list_events" || name === "list_constraints") {
            const listSchema = z.array(z.record(z.string(), z.any()));
            try {
              const parsedJson = JSON.parse(resultText);
              listSchema.parse(parsedJson);
            } catch (err: any) {
              console.error("[Agent] Schema validation failed for list tool:", err.message);
              resultText = "Error: Output failed schema validation.";
            }
          }
          if (name === "assess_commitment_risk") {
            const riskSchema = z.object({ riskState: z.string(), activeCommitments: z.number() });
            try {
              riskSchema.parse(JSON.parse(resultText));
            } catch (err: any) {
              console.error("[Agent] Schema validation failed for risk assessment:", err.message);
              resultText = "Error: Output failed schema validation.";
            }
          }
          if (name === "create_schedule_proposal") {
            try {
              CreateScheduleProposalResultSchema.parse(JSON.parse(resultText));
            } catch (err: any) {
              console.error("[Agent] Schema validation failed for schedule proposal:", err.message);
              resultText = "Error: Output failed schema validation.";
            }
          }
          
          toolResults.push({
            toolResult: {
              toolUseId,
              content: [{ text: resultText }],
              status: "success"
            }
          });
        } catch (e: any) {
          console.error(`[Agent] Tool error (${name}):`, e);
          toolResults.push({
            toolResult: {
              toolUseId,
              content: [{ text: `Error: ${e.message}` }],
              status: "error"
            }
          });
        }
      }

      messages.push({ role: "user", content: toolResults as any });
      
      // Recursive call to get final response
      const followUp = await bedrock.send(new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: fullSystemPrompt }],
        messages,
        toolConfig: { tools }
      }));
      
      return {
        reply: followUp.output?.message?.content?.find((c: any) => c.text)?.text || "",
        history: [...messages, followUp.output?.message!],
        toolsExecuted: toolRequests.map(tr => tr.toolUse?.name)
      };
    }

    return {
      reply: outputMessage.content?.find((c: any) => c.text)?.text || "",
      history: [...messages, outputMessage],
      toolsExecuted: []
    };

  } catch (error: any) {
    console.error("[Agent Error] Falling back to Deterministic Local Agent (DEMO MODE):", error.message);
    
    // DEMO MODE must execute REAL tools, not fake the trace.
    const executedTools = [];
    let simulatedReply = "[DEMO MODE] Running via local deterministic agent. ";
    
    const userMsgLower = userMessage.toLowerCase();
    
      // Fallback intent parsing (No fake injected state!)
      if (userMsgLower.includes("missed") || userMsgLower.includes("change")) {
        try {
          console.log("[DEMO MODE] Triggering assess_commitment_risk");
          await mcp.callTool({ name: "assess_commitment_risk", arguments: { userId, currentTime: new Date().toISOString() } });
          executedTools.push("assess_commitment_risk");

          console.log("[DEMO MODE] Triggering create_schedule_proposal");
          await mcp.callTool({ name: "create_schedule_proposal", arguments: { userId, currentTime: new Date().toISOString(), cutoffTime: "21:00" } });
          executedTools.push("create_schedule_proposal");
          
          simulatedReply += "I've detected the intent to replan. I am replanning your schedule based on the real database commitments.";
        } catch (e: any) {
           console.error("[DEMO MODE] Tool execution failed:", e.message);
           simulatedReply = "I could not reach the execution engine. No actions were performed.";
        }
      } else {
        try {
          console.log("[DEMO MODE] Reading current state to answer");
          await mcp.callTool({ name: "list_commitments", arguments: { userId } });
          executedTools.push("list_commitments");
          simulatedReply += "I am listening and maintaining your actual commitments from the database.";
        } catch (e: any) {
           console.error("[DEMO MODE] Tool execution failed:", e.message);
           simulatedReply = "I could not reach the execution engine. No actions were performed.";
        }
      }

    return {
      reply: simulatedReply,
      history,
      toolsExecuted: executedTools
    };
  }
}
