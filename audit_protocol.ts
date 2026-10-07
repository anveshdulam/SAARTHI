import { initMcpClient } from "./backend/src/mcpClient.js";

async function main() {
  const mcp = await initMcpClient();
  const serverVersion = mcp.getServerVersion();
  console.log("ACTUAL NEGOTIATED PROTOCOL:", serverVersion);
  // Actually, mcp.getServerVersion() returns `{ name: string, version: string }`
  console.log("Server Info:", serverVersion);
  
  // Wait, Client exposes protocol details if any? Let's log it.
  console.log("Protocol details:", mcp);
  
  process.exit(0);
}
main();
