import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import EventSource from "eventsource";
import { requestContext, logger } from "./logger.js";

// Polyfill EventSource for Node.js
(global as any).EventSource = EventSource;

let mcpClient: Client | null = null;

export const initMcpClient = async () => {
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const context = requestContext.getStore();
    const headers = new Headers(init?.headers);
    if (context?.requestId) {
      headers.set("X-Request-ID", context.requestId);
    }
    const start = performance.now();
    try {
      const res = await fetch(input, { ...init, headers });
      const duration_ms = performance.now() - start;
      logger.info("MCP transport request completed", { operation: "mcp.transport", duration_ms, success: true });
      return res;
    } catch (error) {
      const duration_ms = performance.now() - start;
      logger.error("MCP transport request failed", { operation: "mcp.transport", duration_ms, success: false, error });
      throw error;
    }
  };

  const transport = new StreamableHTTPClientTransport(new URL("http://localhost:3002/mcp"), {
    fetch: customFetch
  });

  mcpClient = new Client(
    { name: "saarthi-agent-client", version: "1.0.0" },
    { capabilities: {} }
  );

  const originalCallTool = mcpClient.callTool.bind(mcpClient);
  mcpClient.callTool = async (request, ...args) => {
    const start = performance.now();
    try {
      const res = await originalCallTool(request, ...args);
      const duration_ms = performance.now() - start;
      logger.info("MCP Tool request completed", { operation: "mcp.tool", duration_ms, tool_name: request.name, success: true });
      return res;
    } catch (error) {
      const duration_ms = performance.now() - start;
      logger.error("MCP Tool execution failed", { operation: "mcp.tool", duration_ms, tool_name: request.name, success: false, error });
      throw error;
    }
  };

  try {
    await mcpClient.connect(transport);
    logger.info("Connected to MCP Server via Streamable HTTP.");
    return mcpClient;
  } catch (error) {
    logger.error("MCP Client Connection Error", { error });
    throw error;
  }
};

export const getMcpClient = () => mcpClient;
