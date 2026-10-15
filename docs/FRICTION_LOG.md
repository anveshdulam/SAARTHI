# SAARTHI — Developer Friction Log

This document records genuine friction, unexpected behaviors, and architectural learnings encountered during the development of SAARTHI for the Amazon Developer Hackathon 2026 (Alexa+ track). It is maintained in accordance with official Devpost submission guidelines to provide actionable feedback for the Amazon developer platform, AWS Bedrock, Cognito, and the Model Context Protocol ecosystem.

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
- **Workaround:** Standardized testing scripts using `node -e` or Node-based test runners with explicit JSON.stringify payloads.
- **Actionable Suggestion:** Include cross-platform PowerShell test snippets in README and documentation.

---

### Friction Entry 005: Streamable HTTP SSE vs Frontend Server-Sent Events Disconnect

- **Attempted Task:** Surface live tool-execution progress in the React UI while Bedrock invokes MCP tools.
- **Steps to Reproduce:**
  1. Attempt to hook React directly to the MCP Streamable HTTP endpoint.
  2. Expected browser `EventSource` to consume raw MCP transport chunks.
- **Expected Result:** Seamless event streaming directly to the browser.
- **Actual Result:** MCP Streamable HTTP protocol is a bi-directional RPC session transport for agent-to-tool communication, not a public pub/sub event bus. Attempting to pipe it directly exposes internal RPC frames and security tokens.
- **Severity:** Medium (architectural ambiguity).
- **Workaround:** Strictly separated concerns: MCP remains a protected internal service on port 3002. Express agent orchestrates MCP calls, captures monotonic duration and tool telemetry, and returns an authoritative trace with the response, while audit events are persisted in SQLite.
- **Actionable Suggestion:** Clarify in the official Alexa+ MCP docs that Streamable HTTP is an agent-to-server RPC protocol, distinct from frontend UI event streaming.

---

### Friction Entry 006: Timezone & UTC Offset Inversion in Constraint Cutoffs

- **Attempted Task:** Enforce the "No study after 10 PM" constraint across differing user timezones.
- **Steps to Reproduce:**
  1. Seed constraint: `value: "22:00"`.
  2. Run schedule proposal planner for user in `Asia/Kolkata` (UTC+5:30).
  3. Evaluate cutoff using UTC `Date.getUTCHours()`.
- **Expected Result:** Schedule blocks end before 10:00 PM IST (16:30 UTC).
- **Actual Result:** A naive comparison against UTC hours (22:00 UTC) allowed slots up to 3:30 AM local time the next morning, violating the user's sleep boundary.
- **Severity:** High (violates core product promise of constraint protection).
- **Workaround:** Integrated `date-fns-tz` in `mcp-server/src/planner.ts`. Converted local date string (`2026-10-15 22:00`) directly to an absolute UTC instant using `fromZonedTime(dateStr, timezone)` before bounding candidate time slots.
- **Actionable Suggestion:** Time-sensitive agent tool frameworks should treat user IANA timezone as a first-class parameter for all scheduling and temporal reasoning tools.

---

### Friction Entry 007: Cognito App Client Secret Misconfiguration in Browser SPAs

- **Attempted Task:** Integrate AWS Amplify Auth with Amazon Cognito User Pool for React frontend authentication.
- **Steps to Reproduce:**
  1. Create Cognito User Pool and App Client in AWS Console.
  2. Leave default "Generate client secret" enabled.
  3. Configure Amplify Auth in Vite React frontend with `userPoolClientId`.
  4. Attempt sign-in with user credentials.
- **Expected Result:** Authentication succeeds and tokens are returned.
- **Actual Result:** AWS Amplify threw `NotAuthorizedException: Client secret is not supported for browser clients`.
- **Severity:** High (prevents browser sign-in).
- **Workaround:** Documented in setup instructions that browser-based SPAs require an App Client created without client secrets. Implemented a seamless `DEMO_MODE` bypass for judging environments without requiring live AWS Cognito setup.
- **Actionable Suggestion:** AWS Console Cognito User Pool creation wizard should default "Generate client secret" to OFF when "Single-Page Application (SPA)" is selected as the application type.

---

### Friction Entry 008: Multi-Tab Concurrency Collisions & Optimistic Locking

- **Attempted Task:** Approve schedule proposals when the user has multiple dashboard tabs open or performs concurrent interactions.
- **Steps to Reproduce:**
  1. Open `/alexa` in Tab A and generate a new plan proposal (Plan v1).
  2. In Tab B, request another replan (Plan v2).
  3. Return to Tab A and click "Approve Plan v1".
- **Expected Result:** System warns that Plan v1 is stale and prevents overwriting the newer schedule.
- **Actual Result:** Without concurrency checking, approving Plan v1 would silently overwrite commitments, creating phantom schedule regressions.
- **Severity:** Critical (schedule corruption and race conditions).
- **Workaround:** Added optimistic concurrency locking: `approve_plan` requires `expectedVersion`. If `plan.version !== expectedVersion`, the MCP server aborts the transaction with `Concurrency Error: Stale plan. Expected v..., found v...` and HTTP 400.
- **Actionable Suggestion:** Provide standard optimistic concurrency primitives in MCP server helper libraries for mutation tools.

---

### Friction Entry 009: Web Speech API Inconsistencies & Vendor Prefixes

- **Attempted Task:** Implement voice input for the Alexa+ conversational experience in `/alexa`.
- **Steps to Reproduce:**
  1. Invoke standard `window.SpeechRecognition`.
  2. Test in Google Chrome, Firefox, and Safari.
- **Expected Result:** Speech-to-text works out of the box across modern browsers.
- **Actual Result:** Firefox does not support standard speech recognition by default; Chrome requires `window.webkitSpeechRecognition`; and microphones require explicit HTTPS or `localhost` permissions.
- **Severity:** Low (voice is an optional ambient enhancement; text workflow remains primary).
- **Workaround:** Added defensive polyfill checking `(window.SpeechRecognition || window.webkitSpeechRecognition)`. If speech recognition is unsupported or denied, the UI displays a clear tooltip and seamlessly directs the user to keyboard input.
- **Actionable Suggestion:** Mention browser audio sandbox limitations in Alexa+ web simulation guidelines.

---

### Friction Entry 010: Bedrock Claude Sonnet Inference Profile IDs

- **Attempted Task:** Invoke Bedrock Claude Sonnet model in `us-east-1` from the Node backend.
- **Steps to Reproduce:**
  1. Call `ConverseCommand` with model ID `anthropic.claude-sonnet-4-6`.
- **Expected Result:** Successful inference response.
- **Actual Result:** On some AWS accounts or newly enabled Bedrock regions, invoking bare model IDs returns `ValidationException: Invocation of model ID is not supported. Use cross-region inference profile ID`.
- **Severity:** Medium (can block live demo if account uses inference profiles).
- **Workaround:** Made `BEDROCK_MODEL_ID` configurable via `.env` defaulting to `anthropic.claude-sonnet-4-6`, while supporting `us.anthropic.claude-3-5-sonnet-20241022-v2:0` cross-region profile IDs, backed by recorded replay fixtures in `DEMO_MODE`.
- **Actionable Suggestion:** AWS Bedrock documentation should clearly document when inference profile prefixes (`us.` or `eu.`) are required instead of standard model IDs.
