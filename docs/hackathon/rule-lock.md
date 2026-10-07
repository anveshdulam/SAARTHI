# Rule Lock

| Source URL | Date Checked | Requirement | Exact Interpretation | Route Affected | Implementation Consequence | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| https://amazonappdev2026.devpost.com | 2026-10-07 | Alexa+ track supports a self-hosted MCP server or Agent Skill. | The submission must use MCP or other Alexa+ integration tools. The prompt explicitly mentions "Streamable HTTP is the relevant MCP transport." | Backend, Architecture | Must implement a real MCP server over HTTP (Server-Sent Events) rather than stdio. | Verified |
| https://amazonappdev2026.devpost.com | 2026-10-07 | Simulated Alexa+ experience is accepted. | The normal Alexa+ MCP path requires a remotely reachable server, but the simulation route can use the entrant's own web implementation. | Frontend, Demo | We will build a web-based simulation environment that integrates with our MCP server. | Verified |
