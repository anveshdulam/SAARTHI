# Technical References

## Bedrock Model Verification

Based on the official AWS Bedrock documentation (as of October 7, 2026), the following model is verified and active for the SAARTHI project:

- **Model Name:** Claude Sonnet 4.6
- **Exact Model ID:** `anthropic.claude-sonnet-4-6`
- **Lifecycle Status:** Active
- **EOL Date:** No sooner than February 17, 2027
- **Converse API Support:** Verified
- **Tool-Use Support:** Verified
- **Configurability:** Supported via `BEDROCK_MODEL_ID` environment variable.

*Note: Regional availability applies. The model should be instantiated in regions supporting Anthropic Claude Sonnet 4.6. "All regions" is not claimed; runtime availability will depend on the exact AWS region configuration in `AWS_REGION`.*

## Architecture
- **MCP Transport Client:** StreamableHTTPClientTransport
- **MCP Transport Server:** StreamableHTTPServerTransport (Stateful Session Mapping)
