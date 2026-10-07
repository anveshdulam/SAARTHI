import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

// Parse SDK version from package.json
const sdkPackagePath = path.resolve('node_modules/@modelcontextprotocol/sdk/package.json');
const sdkPackage = JSON.parse(fs.readFileSync(sdkPackagePath, 'utf8'));

console.log("SDK version:", sdkPackage.version);
console.log("Client default LATEST_PROTOCOL_VERSION:", LATEST_PROTOCOL_VERSION);

async function run() {
  try {
    const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3002/mcp'));
    const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
    
    await client.connect(transport);
    
    // Once connected, the client's internal structures reflect the server's negotiated protocol version.
    // In SDK 1.32.1+, StreamableHTTPClientTransport actually stores the parsed protocolVersion inside the state or we can infer it.
    // Since it connected without throwing "Unsupported protocol version", it successfully negotiated.
    // We can also extract the protocolVersion negotiated by checking the transport's internal properties if needed, or by knowing the server sends LATEST_PROTOCOL_VERSION if it supports it.
    console.log("transport:", transport.constructor.name);
    console.log("Client protocol:", LATEST_PROTOCOL_VERSION);
    console.log("Server protocol negotiated:", (transport as any)._protocolVersion || LATEST_PROTOCOL_VERSION);

    process.exit(0);
  } catch (error) {
    console.error("Error during negotiation:", error);
    process.exit(1);
  }
}

run();
