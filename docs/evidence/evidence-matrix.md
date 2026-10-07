# Evidence Matrix

| Claim | Component | Evidence | Test | Log/Metric | Demo Proof | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| SAARTHI uses MCP | Architecture | `mcp-server` operates via SSE, distinct from `backend`. | Integration tests | `mcp-server` logs SSE connections | Developer Panel trace shows MCP calls. | VERIFIED |
| SAARTHI is a Living Plan | Planner | `backend/src/planner.ts` | Gap-finding test | Event logs `PLAN_INVALIDATED` | UI visually updates plan block status. | VERIFIED |
| No LLM Math | Planner | `backend/src/planner.ts` does all scheduling using deterministic date-fns logic. | Capacity exceeded test | Planner output trace | High-risk indicator explicitly explains constraint failure. | VERIFIED |
| Real Tool Calls | Agent Orchestrator | `backend/src/agent.ts` parses Bedrock `toolUse` and invokes `mcpClient.callTool()`. | Bedrock response test | Agent logs `[Agent] Executing tool:` | Trace timeline shows exact executed tools. | VERIFIED |
| Resilient to Failures | Architecture | `backend/src/index.ts` has connection retries. | Connection test | Server logs | Graceful degradation to simulated response if AWS keys missing. | VERIFIED |
