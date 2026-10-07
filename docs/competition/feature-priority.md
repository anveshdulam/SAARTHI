# Feature Priority

## P0 = Absolutely Necessary
* **Deterministic Planning Engine**: Mathematical constraint solver, no LLM math.
* **Real MCP Server**: Streamable HTTP (SSE) transport.
* **Context-Aware Agent Orchestrator**: Intent -> Context -> Tool -> Confirm -> Execute.
* **Living Plan Visualization**: UI showing what changed, why, and how.
* **Structured Memory Engine**: Explicit preferences and recurring constraints.
* **Confirmation Gates**: Separate read vs. consequential write flows.
* **Judge Mode (/judge)**: High-polish demonstration environment.

## P1 = High-Value
* **Risk Engine (At-Risk Detection)**: Proactively identifying deadline risks.
* **Replanning Engine**: Adapting to missed sessions or new conflicts.
* **Demo Reset Mechanism**: Deterministic seed restoration.
* **Adversarial Test Suite**: Protection against prompt injection and tool poisoning.
* **Action Trace UI**: Calm operational timeline (not a terminal).
* **Performance Benchmarks**: Latency tracking.

## P2 = Optional
* **Multi-Agent Orchestration**: Only if a single orchestrator struggles.
* **Complex Optimization**: Advanced heuristics for planning (keep it simple first).
* **Developer Panel**: Hidden panel for MCP and latency stats.

## P3 = Remove / Do Not Build
* **Chain-of-thought UI**: Never show internal reasoning.
* **Generic AI Visuals**: Glowing orbs, neon colors, typing indicators without meaning.
* **Fake Data/Mocked Tools**: Everything must be a real tool call.
* **Unused Tool Parameters**: Tool schemas must be tight and accurate.
