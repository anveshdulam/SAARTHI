# SAARTHI: From Intention to Action

## Problem
The core productivity problem is not "What should I do?"
The problem is: "I made commitments, reality changed, constraints exist, and I need an agent to keep the entire plan coherent."

## Product
SAARTHI is a context-aware execution agent that maintains a living model of a user's commitments, constraints, schedule, and progress — then continuously adapts the plan when reality changes. 

## Why Alexa+
SAARTHI leverages the Alexa+ Model Context Protocol (MCP) framework to ground conversational AI in real, persistent application state. Rather than treating voice/text requests as isolated Q&A sessions, it treats them as state-altering events in an execution timeline.

## Why this is not a generic assistant
- **No Chain-of-Thought Dump**: It exposes consequences (What changed, why) rather than LLM reasoning.
- **Living Plan**: It stores versioned plans that respond to missed sessions and conflicts.
- **Deterministic Math**: The LLM is prohibited from calculating time blocks. A strict deterministic gap-finding algorithm guarantees constraint safety.
- **Event-Driven Memory**: Every action emits an event, making memory highly structural and auditable.

## Core Workflow
1. **Intention**: User states a set of commitments.
2. **Context**: Agent retrieves constraints (e.g., "No work after 9 PM").
3. **Plan**: Deterministic planner builds a schedule.
4. **Action**: Tool execution via MCP.
5. **Memory**: Persistence of the commitment.
6. **Adaptation**: User reports a disruption -> Agent replans -> State transitions.

## Architecture
- **Frontend**: React/Vite using a custom editorial design system (No generic Tailwind or bento grids).
- **Agent API (Backend)**: Express + TypeScript orchestrating AWS Bedrock calls.
- **MCP Server**: Standalone Node process exposing tools over HTTP (SSE Transport).
- **Database**: SQLite (WAL mode) containing `commitments`, `constraints`, `plans`, and `events`.

## Model Context Protocol (MCP)
The boundary between the Agent's reasoning and the Application's execution is strictly enforced via MCP. The `mcp-server` runs on a separate port and exposes tools like `assess_commitment_risk` and `create_commitment`.

## Agent
Powered by **Amazon Bedrock** (Claude 3 Haiku). The agent maps intents to MCP tool calls. If AWS credentials are not present locally, it gracefully falls back to an explicit Simulation Mode to ensure demo continuity.

## Memory & Planning
- **Memory**: Stores recurring rules (e.g., 9 PM cutoffs) and fixed events.
- **Planning**: An internal `planner.ts` builds chronological blocks. If capacity is exceeded, it sets `riskState` to `HIGH` instead of hallucinating impossible blocks.

## Replanning & Security
When a commitment is missed, SAARTHI recalculates the gap. 
Security relies on strict MCP JSON schema validation and confirmation gates (explicit UI prompts) for consequential writes.

## Testing & AWS
Includes an adversarial test suite checking prompt injection and capacity limits. AWS Bedrock provides the core reasoning engine.

## Demo & Hackathon Compliance
Complies with the 2026 Amazon Developer Hackathon rules by supporting a self-hosted MCP server via Streamable HTTP (SSE) and providing a simulated Alexa+ frontend experience that interacts with the real MCP implementation.

## Limitations
- Planner currently utilizes simple chronological gap-finding; more complex bin-packing is future work.
- Authentication is mocked for local hackathon demo purposes.
