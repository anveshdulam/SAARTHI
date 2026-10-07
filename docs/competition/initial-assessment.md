# Initial Assessment

## 1. Verified Current Rules
* The 2026 Amazon Developer Hackathon includes an Alexa+ track.
* Submissions are due Oct 23, 2026.
* Projects must demonstrate technology in actual runtime code.
* The Alexa+ track supports self-hosted MCP (Model Context Protocol) servers.

## 2. Current Technical Requirements
* **MCP Server**: Must use Streamable HTTP (Server-Sent Events) for the transport.
* **Architecture**: Must separate the agentic/web implementation (simulated Alexa+ experience) from the MCP server.
* **AWS Integration**: Meaningful use of Amazon Bedrock is highly recommended for the agent engine.

## 3. Known Ambiguities
* Is there a specific subset of Bedrock models expected, or can we use any model available in the region?
* Does "Streamable HTTP" imply standard MCP SSE transport, or are there Amazon-specific extensions? (We will assume standard MCP SSE until proven otherwise).

## 4. Competitive Risks
* **Genericity**: Building a generic AI assistant or productivity chatbot.
* **Cosmetic Integration**: Using MCP just as a proxy without meaningful tool separation.
* **Aesthetic**: Looking like a standard Vercel/Tailwind/Framer SaaS template.

## 5. Product Risks
* The planning engine relies on LLM reasoning and hallucinates arithmetic or constraints.
* The system silently overwrites old plans without user confirmation.

## 6. Architecture Risks
* Overcomplicating with a multi-agent system when a strong single orchestrator would suffice.
* Coupling the UI too tightly to the LLM instead of the application state.

## 7. Recommended Implementation Path
* **Frontend**: React (Vite or Next.js) with a restrained, custom CSS design system.
* **Agent Backend**: Node.js or Python backend that coordinates the LLM, application state, and MCP client.
* **MCP Server**: A separate Node.js/Python server exposing tools via HTTP (SSE).
* **Database**: SQLite or PostgreSQL for deterministic state storage (Commitments, Events, Memory).

## 8. Top 10 Ways the Project Could Lose
1. Looks and feels like a generic AI wrapper/chatbot.
2. The UI relies on trendy, generic visuals (gradients, glowing orbs, bento boxes).
3. The "living plan" is just a standard calendar UI.
4. MCP integration is fake or merely cosmetic.
5. Fails to gracefully handle disruptions or replanning.
6. Silent failures or corruption of application state.
7. Lack of a clear "wow" moment in the first 30 seconds of the demo.
8. Unverifiable claims in the README or presentation.
9. No mechanism to easily reset the demo for the judges.
10. Exposing LLM chain-of-thought to the user.

## 9. Top 10 Ways to Make it Stronger
1. Build a strict, deterministic planning engine for constraints.
2. Use a "calm", highly customized editorial design system.
3. Make the action trace visually clear but abstract.
4. Implement explicit confirmation gates for consequential writes.
5. Create a dedicated `/judge` route with a tailored demo flow.
6. Provide a 1-click "Reset Demo" button.
7. Log an auditable history of all application state changes.
8. Maintain a strict division between Agent Policy and MCP Execution.
9. Build an adversarial test suite for safety and reliability.
10. Ensure the core problem ("I made commitments, reality changed") is addressed directly.

## 10. Questions Requiring Organizer Clarification
* Are there strict performance/latency SLA requirements for the simulated path, or just for production Alexa+?
* What are the specific AWS regions available for Bedrock during the hackathon judging?
