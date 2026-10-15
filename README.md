# SAARTHI — Context-Aware Living Schedule Agent

> **"Every assistant can set a reminder. None can safely repair your day."**  
> *Built for the Amazon Developer Hackathon 2026 · Alexa+ Track · Mini-Challenges: AWS Builder & Open Source*

---

## 1. Executive Summary

**SAARTHI** is an autonomous, context-aware execution agent that maintains a living model of a user's commitments, constraints, and schedule. When disruptions occur (e.g., a missed 2 PM study session), SAARTHI does not merely report failure; it repairs the schedule using a deterministic constraint planner, protects hard boundaries (such as a strict "No study after 10 PM" rule), and enforces an immutable **human-in-the-loop approval gate** before committing any mutations to persistent storage.

```
       ┌────────────────┐
       │   Alexa+ / UI  │  (Ambient voice & editorial web UI)
       └───────┬────────┘
               │ Authenticated REST / JWT
               ▼
       ┌────────────────┐
       │ Express Backend│  (AWS Bedrock Claude Sonnet 4.6 Orchestrator)
       └───────┬────────┘
               │ Streamable HTTP (MCP Spec 2025-11-25)
               ▼
       ┌────────────────┐
       │   MCP Server   │  (Authoritative Domain Tools & Invariants)
       └───────┬────────┘
               │ Parameterized SQL / ACID Transactions
               ▼
       ┌────────────────┐
       │ SQLite (WAL)   │  (commitments, constraints, plans, events)
       └────────────────┘
```

---

## 2. Key Architectural Invariants & Safety

1. **Non-Autonomous Approval Gate:**  
   Consequential mutations (`approve_plan`, `approve_commitment`, `complete_commitment`, `fail_commitment`) are **structurally withheld** from the Bedrock LLM tool manifest. The LLM can only evaluate risk and generate schedule proposals; mutation requires an explicit human action on `/plans`.
2. **Optimistic Concurrency Control:**  
   `approve_plan` requires `expectedVersion`. If another tab or session updated the plan, stale approvals abort with HTTP 400 concurrency errors.
3. **Idempotent Mutations:**  
   Replay approval attacks on accepted plans are rejected idempotently without duplicating commitment blocks.
4. **Deterministic Math & Hard Cutoffs:**  
   The LLM never calculates time slots. Scheduling is computed by an internal mathematical gap-finder that enforces local timezone cutoffs (e.g., converting 22:00 IST to UTC instants).

---

## 3. Technology Stack

- **AI Reasoning:** Amazon Bedrock (`anthropic.claude-sonnet-4-6` via Converse API tool-use loop)
- **Identity & Auth:** Amazon Cognito User Pool + AWS Amplify Auth (with seamless `DEMO_MODE` for evaluating judges)
- **Protocol:** Model Context Protocol (MCP) spec **2025-11-25** over **Streamable HTTP** (`/mcp` endpoint)
- **Backend:** Node.js, Express, TypeScript, `@aws-sdk/client-bedrock-runtime`, `@modelcontextprotocol/sdk`
- **Frontend:** React 19, Vite, custom editorial design system (Warm Ivory workspace `#F7F6F2`, dark shell `#15171A`, saffron accent `#C79536`, restrained blue `#5868D8`)
- **Persistence:** SQLite with Write-Ahead Logging (WAL) and ACID transactions

---

## 4. Quickstart Guide (Judge & Local Evaluation)

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm 10+
- (Optional) AWS Credentials configured with Bedrock access in `us-east-1` (or use `DEMO_MODE=true`)

### Installation & One-Command Run
```bash
# 1. Clone repository
git clone https://github.com/anveshdulam/SAARTHI.git
cd SAARTHI

# 2. Install dependencies across root, backend, frontend, and mcp-server
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd mcp-server && npm install && cd ..

# 3. Configure environment
cp .env.example .env
# Edit .env if you wish to provide AWS_ACCESS_KEY_ID or leave defaults for DEMO_MODE

# 4. Seed the database (Creates Aarav's demo scenario with 5 commitments and 3 stored constraints)
npm run seed

# 5. Launch all three services (MCP Server :3002, Backend :3001, Frontend :5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 5. Automated Verification & Invariant Tests

Run the dedicated test suite proving the 5 safety invariants, rejection governance, and protocol handshake:

```bash
# Run the automated approval-boundary & safety invariant test suite
npx tsx tests/approval_invariants.test.ts
```

**Expected Output:**
```
============================================================
  SAARTHI — Automated Approval-Boundary & Invariant Test Suite
============================================================

[INVARIANT 1] Verifying Bedrock Tool Manifest Withholding...
  ✓ Invariant 1 PASS: All 9 lifecycle tools are strictly withheld from model exposure.

[INVARIANT 2] Verifying Unapproved Plan Cannot Mutate Commitments...
  ✓ Invariant 2 PASS: Creation of proposal leaves persisted domain records untouched.

[INVARIANT 4] Verifying Optimistic Concurrency Guard (Stale Plan Rejection)...
  ✓ Invariant 4 PASS: Stale version (expectedVersion mismatch) successfully rejected.

[INVARIANT 3] Verifying Authorized Approval & Idempotency Boundary...
  ✓ Invariant 3 PASS: First approval commits transaction; second approval is rejected idempotently.

[INVARIANT 5] Verifying Plan Rejection & Non-Mutation Flow...
  ✓ Invariant 5 PASS: Rejection sets status to 'rejected', logs audit event, and locks out approval.

============================================================
  ALL APPROVAL-BOUNDARY & SAFETY INVARIANT TESTS PASSED (5/5)
============================================================
```

---

## 6. Verifying as an External MCP Client (MCP Inspector)

SAARTHI's MCP server is client-agnostic and spec-compliant. You can connect standard MCP clients directly to inspect tools and run commands:

```bash
# Connect the official MCP Inspector to SAARTHI's Streamable HTTP endpoint
npx @modelcontextprotocol/inspector http://localhost:3002/mcp
```

1. Select **Streamable HTTP** transport.
2. Verify protocol negotiation returns `2025-11-25`.
3. Call `list_commitments` with `{"userId":"demo-user-id"}` to see active commitments.

---

## 7. The Core Demo Walkthrough

1. **Beat 1 — Today (`/`):** Proactive hazard detection flags Aarav's missed 2:00 PM study session before any prompt is typed.
2. **Beat 2 — Alexa+ (`/alexa`):** Issue voice or text intent: *"I missed my 2 PM study session. Fix my schedule."*  
   The agent calls `assess_commitment_risk` → `create_schedule_proposal`. A proposal card renders in the conversation linking to `/plans`.
3. **Beat 3 — Living Plans (`/plans`):** View the before/after schedule diff. Commitments are safely scheduled to avoid conflicting with dinner or the part-time shift, while strictly respecting the **10:00 PM sleep cutoff**. Click **Approve Plan**. Commitments update authoritatively.
4. **Beat 4 — Audit & Protocol (`/judge`):** Review live protocol telemetry (v2025-11-25, Streamable HTTP, 9 withheld lifecycle tools, and immutable event logs).
5. **Beat 5 — Memory (`/memory`):** Inspect stored constraints ("No study after 10 PM", "Gym Tue/Thu", "Sleep by 11:30 PM") and add custom invariants.

---

## 8. Repository Structure

```
SAARTHI/
├── backend/               # Express API, Bedrock agent orchestrator, Cognito JWT verification
│   ├── src/agent.ts       # Bedrock Converse tool-loop & tool filtering
│   ├── src/mcpClient.ts   # Streamable HTTP MCP client with auto-reconnect
│   └── src/index.ts       # REST controllers & /api/audit/protocol endpoint
├── mcp-server/            # Self-hosted MCP Server (port 3002)
│   ├── src/index.ts       # Streamable HTTP transport, tool registrations, transactions
│   ├── src/planner.ts     # Deterministic constraint solver & timezone converter
│   └── src/seed.ts        # Hackathon scenario seed script
├── frontend/              # React 19 + Vite editorial dashboard
│   ├── src/pages/Alexa.tsx       # Alexa+ conversational hero flow with Web Speech
│   ├── src/pages/Plans.tsx       # Authoritative Before/After diff & approval gate
│   ├── src/pages/Judge.tsx       # Live Audit & Protocol telemetry showcase
│   ├── src/pages/Home.tsx        # Today screen with proactive hazard alerts
│   ├── src/pages/Memory.tsx      # Stored constraints & memory telemetry
│   ├── src/pages/Commitments.tsx # Filterable commitment ledger
│   └── src/pages/Activity.tsx    # Immutable audit trail with payload inspector
├── tests/                 # Automated test suites
│   └── approval_invariants.test.ts  # Tested safety invariants
├── docs/                  # Architecture references, friction logs & plans
│   └── FRICTION_LOG.md    # 10 genuine developer friction entries
├── LICENSE                # Open-source MIT License
└── package.json
```

---

## 9. License

This project is open-source under the terms of the [MIT License](LICENSE).
