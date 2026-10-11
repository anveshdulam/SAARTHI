# SAARTHI — Developer Friction Log

This document records genuine friction, unexpected behaviors, and architectural learnings encountered during the development of SAARTHI for the Amazon Developer Hackathon 2026 (Alexa+ track).

---

### Friction Entry 001: MCP Server Idle Session Eviction (HTTP 404)

- **Attempted Task:** Maintain a stable connection between the Backend Express Agent and the MCP Server over Streamable HTTP transport during interactive development.
- **Steps to Reproduce:**
  1. Boot `mcp-server` on port 3002 and `backend` on port 3001.
  2. Perform an initial query (MCP session initialized).
  3. Wait 45 seconds without making tool calls.
  4. Submit a new chat request (`POST /chat`) that triggers `mcp.callTool()`.
- **Expected Result:** MCP connection remains alive or transparently handles heartbeat.
- **Actual Result:** MCP Server rejected the request with `404 Not Found: Session not found (session ID was evicted)`. The backend crashed into `MCP_UNAVAILABLE` fallback.
- **Root Cause:** `@modelcontextprotocol/sdk` Streamable HTTP transport defaults `SESSION_ABANDONED_TTL_MS` to a very short 30-second window if no SSE messages are streamed.
- **Severity:** High (intermittent failures in local dev and interactive evaluation).
- **Workaround:**
  1. Extended `SESSION_ABANDONED_TTL_MS` in `mcp-server/src/index.ts` to 3,600,000 ms (1 hour).
  2. Implemented auto-reconnect retry logic in `backend/src/mcpClient.ts` that detects 404 session eviction, re-runs `initMcpClient()`, and replays the tool call.
- **Actionable Suggestion:** The Model Context Protocol SDK should provide built-in keep-alive pinging or allow configuring session eviction policies through transport options.

---

### Friction Entry 002: AWS Bedrock Converse API Tool & History Format Strictness

- **Attempted Task:** Route agent conversations through AWS Bedrock using `anthropic.claude-sonnet-4-6` with tool calling.
- **Steps to Reproduce:**
  1. Pass conversational history from frontend directly to `ConverseCommand({ messages: history })`.
  2. Forward raw MCP tool schemas.
- **Expected Result:** Bedrock handles standard chat history objects (`{ role: 'user', content: 'string' }`).
- **Actual Result:** Bedrock throws schema validation errors because Converse API strictly requires `content: [{ text: string }]` for messages and nested `{ inputSchema: { json: schema } }` for tools.
- **Root Cause:** Converse API uses a structured multimodal content block format rather than flat strings.
- **Severity:** Medium (breaks conversation continuity if history isn't manually normalized).
- **Workaround:** Implemented defensive message normalization in `backend/src/agent.ts` to convert flat strings to Converse content blocks and exclude approval tools from LLM tool specs.
- **Actionable Suggestion:** AWS SDK Bedrock client should include convenience transformers for standard chat message formats and MCP tool declarations.

---

### Friction Entry 003: Cognitive Dissonance in Plan Approval Authority

- **Attempted Task:** Implement schedule proposal review and plan approval between the Alexa conversational interface and the Living Plans dashboard.
- **Steps to Reproduce:**
  1. Alexa flow generated a schedule proposal with 5 blocks.
  2. UI initially offered an inline "Approve Plan" button directly in the chat stream.
- **Expected Result:** Clear architectural separation between autonomous proposal generation and authoritative user approval.
- **Actual Result:** Inline chat approval blurred the boundary between assistant suggestions and the single authoritative approval interface, risking accidental one-click approvals without diff review.
- **Severity:** Medium (governance & safety concern).
- **Workaround:** Strict architectural correction: `/alexa` is restricted to proposal generation and inspection, linking to `/plans` as the sole authoritative gate where full before-and-after schedule diffs must be reviewed before committing.
- **Actionable Suggestion:** Maintain explicit UI separation between conversational intent engines and transactional commitment gates.

---

### Friction Entry 004: Windows PowerShell Escaping for JSON CLI Payloads

- **Attempted Task:** Test REST API endpoints using `curl.exe` from Windows terminal.
- **Steps to Reproduce:**
  1. Run `curl.exe -X POST http://localhost:3001/chat -d '{"message":"hello"}'`.
- **Expected Result:** Valid JSON sent to body-parser.
- **Actual Result:** PowerShell strips single quotes and fails JSON parsing on Node `body-parser`.
- **Severity:** Low (developer tooling friction).
- **Workaround:** Standardized PowerShell testing scripts on `Invoke-RestMethod` with hashtables converted using `ConvertTo-Json`.
- **Actionable Suggestion:** Include cross-platform PowerShell test snippets in README and documentation.
