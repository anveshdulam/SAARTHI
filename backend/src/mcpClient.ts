import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import EventSource from "eventsource";

// Polyfill EventSource for Node.js
(global as any).EventSource = EventSource;

let mcpClient: Client | null = null;

export const initMcpClient = async () => {
  const transport = new StreamableHTTPClientTransport(new URL("http://localhost:3002/mcp"));

  mcpClient = new Client(
    { name: "saarthi-agent-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    await mcpClient.connect(transport);
    console.log("Connected to MCP Server via Streamable HTTP.");
    return mcpClient;
  } catch (error) {
    console.error("MCP Client Connection Error Details:", error);
    throw error;
  }
};

export const getMcpClient = () => mcpClient;
