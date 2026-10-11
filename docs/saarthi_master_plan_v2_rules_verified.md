# SAARTHI — Master Plan v2 (Winning-Submission Edition)
*Build, Ship, Shape: Amazon Developer Hackathon 2026 · Alexa+ Track · Revised 10 Oct 2026 against the official Devpost rules (incl. the 16 Sept update)*

---

## 0. Read This First — What Changed and Why

The v1 plan treated **responsive CSS** as the main gap. Against the official rules, that is a low-value use of the 13 days left. The real gaps are:

| # | v1 blind spot | Why it matters (from the official rules) |
|---|---|---|
| 1 | No mapping to the **4 judging criteria** | Stage 2 = Tech Implementation, Design, Potential Impact, Quality of the Idea — **equally weighted**. v1 only optimises "Design" (and only the responsive part). |
| 2 | **Friction Log ignored** | Friction log entries give **up to a 10% bonus** on the final score. v1 only says "submit feedback" at the end. This is the cheapest points on the table. |
| 3 | **Mini challenges ignored** | One project can win a track prize **and** one mini-challenge prize. **AWS Builder** ($5k + $5k credits) fits SAARTHI already (Bedrock + Cognito). **Open Source** ($5k + $5k credits) is achievable. |
| 4 | **"Significantly updated" rule ignored** | If any part of SAARTHI existed before **31 Aug 2026**, you must *explain and demo what was significantly updated during the window*. Missing this is a disqualification risk. |
| 5 | **Judges may not run your app** | "Judges are not required to test the Project and may judge solely on the description, images, and video." The **video + description are the product**. A demo that needs Cognito + Bedrock to run is fragile. |
| 6 | **"Agent Skill" vs "MCP server" confusion** | v1 says "position as a Custom Self-Hosted Agent Skill." SAARTHI is a **self-hosted MCP server** (the track's primary path). Don't blur them in the submission. |
| 7 | **"AUDIT PASSED" is unverified** | The rule is MCP spec **2025-11-25 or later over Streamable HTTP**. Verify it with a real handshake instead of asserting it (see Gate 1). |
| 8 | Wrong deadline mental model | Deadline is **Fri 23 Oct 2026, 12:00 PM PDT = Sat 24 Oct, 12:30 AM IST**. Plan to submit by **Thu 22 Oct (IST evening)** at the latest. |

**Strategy in one line:** *SAARTHI = an agent that proposes, a human that approves — persistent, stateful scheduling over a standards-compliant MCP server, with a provable safety boundary and AWS-native reasoning.* Everything below serves that story and the four criteria.

---

## 1. Hard Requirements Checklist (Disqualification Guards)

Do these first. Failing any of them makes everything else irrelevant.

- [ ] **Track selected:** Alexa+ (primary). Mini challenges: **AWS Builder** + **Open Source**.
- [ ] **MCP 2025-11-25+ over Streamable HTTP** — verified by handshake (Gate 1).
- [ ] **Runtime use of required tech in code** — MCP SDK imported and actually called (already true: `mcp-server/src/index.ts`, `backend/src/mcpClient.ts`).
- [ ] **Public GitHub repo with a detectable OSS license** (visible in the repo's *About* section) — **or** private repo shared with the Amazon reviewers listed in the rules (`chris-trag, knmeiss, giolaq, anishamalde, mosesroth, emersonsklar`). Public + MIT/Apache-2.0 is recommended (also required for the Open Source mini challenge).
- [ ] **Clear setup + run instructions in the repo** (README) — required by the rules, not optional.
- [ ] **Demo video:** < 3:00, English, public on YouTube/Vimeo, shows the project *functioning*, **no copyrighted music, no third-party trademarks/logos**. Judges don't have to watch past 3:00.
- [ ] **Text description** covering features, functionality, and **what was significantly updated during the hackathon window** (if SAARTHI predates 31 Aug).
- [ ] **Product Feedback** answering all 5 prompts (tools used, what worked, what needs work, onboarding, build again Y/N).
- [ ] **AWS Builder:** AWS services and *how* they're used documented **inside the Product Feedback answer**.
- [ ] **Open Source mini:** contribution URL, repo URL, GitHub username, description (what / how / why).
- [ ] **No secrets in repo or git history** (run a scan — see Phase 5).
- [ ] **Submitted before Thu 22 Oct (target) / hard stop Fri 23 Oct 12:00 PM PDT.** No edits allowed after the deadline.

---

## 2. Judging-Criteria Scorecard (the actual scoring model)

Stage 1 is pass/fail ("reasonably fits the theme and reasonably applies the required APIs/SDKs"). Stage 2 scores four equally weighted criteria. The rules also spell out what judges call **obvious vs creative** for Alexa+:

> *Obvious:* single-turn Q&A bot, basic MCP wrapper around an existing API.
> *Creative:* agentic workflow orchestrating across services autonomously, **context-aware add-on that maintains state across sessions**, purchasing, media support (cards/carousels), **MCP Apps**, **Agent Skills**.

| Criterion | What SAARTHI already has | Gap to close | Planned action |
|---|---|---|---|
| **1. Tech Implementation** | Spec-compliant Streamable HTTP MCP server, Bedrock (Claude Sonnet 4.6) agent, SQLite state, Cognito + JWT verification, lifecycle tools withheld from the LLM | No tests, no proof of protocol version, demo depends on live AWS | Gate 1 verification, automated tests for the approval boundary, `DEMO_MODE`, tool-call trace view |
| **2. Design** | Full 9-screen app | Alexa+ is a **voice/ambient** platform; the demo is a dashboard. Interaction model must feel native to Alexa+ | Voice-first demo path (speech in/out), one beautiful hero flow, minimal responsive fix (not full 320px polish) |
| **3. Potential Impact** | Real problem (missed commitments, schedule drift) | Impact claim is generic | Name a specific persona, quantify the problem, show a *second-session* payoff, explain who it serves beyond the hackathon |
| **4. Quality of the Idea** | Persistent state + human approval gate + constraint memory → already in the "creative" column | Not yet *visibly* agentic/proactive; no MCP App or Skill packaging | Proactive risk detection scene, optional MCP App approval card, `SKILL.md` |

**Tie-breaking order is Tech → Design → Impact → Idea.** If scores tie, Tech Implementation decides. Do not neglect engineering rigour for polish.

---

## 3. Screen-by-Screen Status (re-prioritised)

Responsive work is demoted from "Phase 1" to "targeted fixes." The video will be recorded at desktop width; judges evaluate the *experience*, not 320px edge cases.

| Screen | Status | Priority | What to do |
| :--- | :--- | :--- | :--- |
| **Alexa+ (`/alexa`)** | Confirmed | 🔴 **Hero #1** | This *is* the Alexa+ experience. Add voice input/output (Web Speech API, Chrome), streaming responses, visible tool-call chips ("assess_commitment_risk ✓"), and a rich **plan card** inside the chat (the "card/carousel" media support the rules reward). |
| **Plans (`/plans`)** | Confirmed | 🔴 **Hero #2** | Plan **version diff** (before → after), clear "Approve / Reject" with consequences, status pills. This is the human-in-the-loop moment. |
| **Judge Mode (`/judge`)** | Confirmed | 🔴 **Hero #3** | Optionally rename in UI to **"Audit & Protocol"**. Show: negotiated `protocolVersion`, transport = Streamable HTTP, tool list, tool-call log with timestamps, and **proof the LLM cannot call lifecycle tools**. This is a Tech Implementation showcase. |
| **Today (`/`)** | Confirmed | 🟡 | Fix the `1fr 360px` grid overflow (single `@media (max-width: 1024px)` rule → one column). Make the "at-risk" card prominent. |
| **Commitments** | Confirmed | 🟡 | Seeded, realistic data; at-risk badge; 44px touch targets on action buttons (quick CSS pass). |
| **Memory** | Confirmed | 🟡 | Empty-state copy + 3 seeded constraints (e.g., "No study after 10 PM"). Memory is what makes the agent *context-aware across sessions*. |
| **Activity** | Confirmed | 🟢 | `overflow-wrap: anywhere` + contained scroll. Becomes the audit trail shown in the video. |
| **Landing / Login** | Confirmed | 🟢 | One mobile sanity check only. Add a **"Try demo"** path (see `DEMO_MODE`). |

---

## 4. Architecture (unchanged core) + Required Additions

Keep: React/Vite → Express (Cognito JWT) → MCP client → self-hosted MCP server (SQLite). Bedrock Converse for reasoning.

**Additions that raise the score:**

1. **`DEMO_MODE=true`** — seeds SQLite, bypasses Cognito with a fixed demo user, and optionally replays **recorded Bedrock tool-call fixtures** if AWS is unreachable. Benefits: judges can run the repo in 2 minutes; your video can be re-recorded safely; no quota surprises.
2. **MCP server is client-agnostic** — document how to connect *any* MCP client (e.g., MCP Inspector) directly to `/mcp`. In the video, show one tool call from a second client to prove it's a real MCP server and not a private API.
3. **Tool-call trace** — log every MCP request/response (tool name, args, duration, result status) and surface it in `/judge`.
4. **Approval boundary as a tested invariant** — lifecycle tools (`approve_*`, `execute_*`) are not in the LLM's tool list and require a user-authenticated HTTP action. Write tests proving (a) the LLM tool list excludes them, (b) an unapproved plan cannot mutate commitments, (c) approval is idempotent.
5. **Public HTTPS endpoint (recommended)** — deploy the MCP server on AWS (App Runner / ECS / small EC2 behind HTTPS). A real remote endpoint strengthens "self-hosted MCP server," supports the AWS Builder claim, and is how an Alexa+-style client would reach it. **Protect it** (auth header / `INTERNAL_SECRET`); never expose an unauthenticated write-capable MCP server.
6. **Stretch (only if Gate 2 is green by 14 Oct):**
   - **MCP App** approval card rendered in the chat (the rules explicitly name MCP Apps as "creative"). Read the extension spec first: modelcontextprotocol.io/extensions/apps/overview.
   - **`SKILL.md`** describing how an agent should use SAARTHI's tools (the rules also name Agent Skills). Check the Alexa+ Agent Skill format before investing; skip if unclear.

---

## 5. Verification Gates (do these before building anything new)

### Gate 1 — Protocol & platform truth (Sat 10 – Sun 11 Oct)
| Check | How | Pass condition |
|---|---|---|
| **MCP version** | Send `initialize` with `protocolVersion: "2025-11-25"` to `/mcp` (curl or MCP Inspector) | Response `protocolVersion` is `2025-11-25` or later. If not, upgrade `@modelcontextprotocol/sdk` and re-test. |
| **Transport** | Inspector connects via *Streamable HTTP*, lists tools, calls one | Works end-to-end; session handling OK |
| **Bedrock access** | Run one Converse call from the backend | Success in `us-east-1`. **Verify the exact model ID** — newer Claude models on Bedrock often require a cross-region *inference profile* ID rather than the bare model ID. |
| **Cognito** | Console check | "Generate client secret" **off**; Email allowed as sign-in; sign-up/confirm/reset flows work |
| **INTERNAL_SECRET** | Generate with `openssl rand -hex 32`; confirm same value in backend + MCP server `.env` | Requests without it are rejected |
| **Repo hygiene** | Check git history for keys/`.env` | Clean (or rewrite history before going public) |
| **Hackathon-window delta** | List commits since 31 Aug 2026 | You can articulate what is new/significantly updated |

### Gate 2 — Hero flow works unattended (by Tue 14 Oct)
The full scenario in Section 7 runs **10 times in a row** from a fresh seed with no manual fixes.

---

## 6. Phase Plan (13 days)

### Phase 1 — Verify & Stabilise (10–11 Oct)
Run Gate 1. Fix whatever fails. Add `DEMO_MODE` + seed script. Decide public vs private repo and add LICENSE.
**Deliverable:** green Gate 1, one-command local run.

### Phase 2 — Hero Flow Build (12–14 Oct)
Implement the demo scenario (Section 7) end-to-end. Add the tool-call trace, plan version diff, and approval invariants + tests. Add voice I/O to `/alexa`. **Start the friction log now** (Section 9).
**Deliverable:** Gate 2 passed.

### Phase 3 — Differentiators (15–17 Oct)
- Proactive risk scene (agent flags an at-risk commitment *before* the user asks).
- Cross-session memory scene (new session recalls a stored constraint).
- Deploy MCP server to AWS with HTTPS (AWS Builder evidence + diagram).
- Stretch: MCP App approval card, `SKILL.md`.
- **Open Source contribution** (Section 10).

**Deliverable:** feature list frozen. **🔒 Feature freeze: Sun 18 Oct, end of day.**

### Phase 4 — Polish (18–19 Oct)
Design pass on the 3 hero screens only (spacing, typography, motion, empty/loading/error states). Responsive minimum: `Home.tsx` grid collapse at ≤1024px, `MainLayout.tsx` sidebar collapse, 44px touch targets on Commitments/Plans buttons, no horizontal scroll at 390px on the hero screens. Skip pixel-perfect 320px work on secondary screens.
**Deliverable:** hero screens look "product-grade" at 1440px and don't break at 390px.

### Phase 5 — Submission Assembly (19–21 Oct)
README, architecture diagram, tests passing, secrets scan (gitleaks/trufflehog), LICENSE, Devpost text, screenshots, product feedback, friction log, video recording + upload (details in Sections 7–9).

### Phase 6 — Buffer & Submit (21–22 Oct)
Final run from a **fresh clone** on a clean machine/container following only the README. Submit **Thu 22 Oct**. Use 23 Oct only as emergency buffer (deadline = 24 Oct 12:30 AM IST).

---

## 7. The Demo Scenario (revised — shows state, proactivity, safety, and standards)

**Persona:** Aarav, a final-year student balancing study blocks, a part-time job, and gym. *(Rename to match your real target user; specificity scores on Impact.)*

**Seed state:** 5 commitments (one study block at 2 PM already past-due), 3 stored constraints in Memory ("No study after 10 PM", "Gym Tue/Thu", "Sleep by 11:30 PM").

**Script (target 2:50):**

| Time | Scene | What judges must see | Criterion |
|---|---|---|---|
| 0:00–0:15 | **Hook.** "Every assistant can set a reminder. None can safely *repair* your day." Show the SAARTHI logo only (no third-party marks). | Clear problem + one-line pitch | Impact |
| 0:15–0:45 | **Proactive.** Today screen shows an at-risk commitment flagged by the agent before the user asks. | Agentic behaviour, not Q&A | Idea |
| 0:45–1:25 | **Voice request** in `/alexa`: *"I missed my 2 PM study session. Fix my schedule."* Tool chips appear: `assess_commitment_risk` → `create_schedule_proposal`. A **plan card** renders in chat. | Voice-first interaction, live MCP tool calls, rich card | Design, Tech |
| 1:25–1:55 | **Human approval.** `/plans` shows the version diff honouring the stored constraints. Click **Approve**. Commitments update. | Human-in-the-loop, constraint-aware planning, state mutation | Idea, Design |
| 1:55–2:20 | **Proof.** `/judge` ("Audit & Protocol"): `protocolVersion 2025-11-25`, Streamable HTTP, tool-call log, "lifecycle tools not exposed to LLM." Flash a second MCP client (Inspector) calling the same server. | Standards compliance + safety boundary | Tech |
| 2:20–2:40 | **Cross-session.** New chat session: *"Why did you avoid 10 PM?"* → agent recalls the stored constraint. | Persistent memory across sessions | Idea |
| 2:40–2:55 | **Close.** Architecture diagram (React → Express/Cognito → MCP → SQLite; Bedrock). "Built on AWS Bedrock + MCP. Open source." | AWS Builder + open-source claims | Impact, mini challenges |

**Video rules:** public YouTube/Vimeo · English · captions on · original or properly licensed audio only (or none) · no logos of other companies · record at 1080p · keep the *real* app on screen, not slides.

**Failure plan:** record 3 full takes. If Bedrock is flaky on the day, record with fixtures — but only claim "Claude Sonnet 4.6 on Amazon Bedrock" for takes that used live calls.

---

## 8. Devpost Submission Content

**Title/tagline:** *SAARTHI — the agent that fixes your schedule, and asks before it acts.*

**Description structure (judges skim; front-load value):**
1. **Problem** (2–3 sentences, concrete persona, a number only if you can source it honestly)
2. **What it does** (the 6 demo beats above)
3. **How it's built** (diagram + 5 bullets: MCP 2025-11-25 / Streamable HTTP, Bedrock Claude Sonnet 4.6, SQLite domain model, Cognito, approval boundary)
4. **What's new during the hackathon** (explicit list — required if the project predates 31 Aug)
5. **Why it's not "obvious"** (state, proactivity, human approval, any MCP App/Skill) — map directly to the rules' "creative" examples
6. **Impact & what's next**
7. **Run it** (link to README; mention `DEMO_MODE` for judges)

**Assets:** 4–5 screenshots (Alexa chat with plan card, plan diff, audit view, memory, architecture diagram), video link, repo link.

**Form checklist:** track = Alexa+ · mini challenges = AWS Builder + Open Source · repo URL · video URL · feedback answers · friction log entries · open-source contribution fields.

---

## 9. Product Feedback & Friction Log (worth up to +10%)

**Start logging today.** Every snag in MCP SDK setup, Streamable HTTP session handling, Bedrock model access/IDs, Cognito config, or docs gaps is a friction entry. Write each one at the moment it happens.

**Friction log entry format (from the rules):**
`Task attempted · Steps taken · Expected vs actual · Severity · Workaround used · Actionable suggestion`

**Target:** 6–10 specific, honest, actionable entries. Quality beats quantity; vague complaints won't earn the bonus. (The bonus is applied by Amazon's review team and passed to the judging panel — it's discretionary, "up to" 10%.)

**Product Feedback form (answer for *each* tool/API/SDK used):** MCP SDK · Streamable HTTP · Amazon Bedrock · Cognito · any Alexa+/Amazon developer docs you read. Cover: what you used it for, what worked, what needs work, onboarding time-to-hello-world, would you build again (Y/N + why). Include the **AWS Builder** explanation (which services, how, why) here.

**Optional Feature Requests:** description · why it matters · priority (Critical / Important / Nice-to-have). Add 2–3.

---

## 10. Mini Challenges

### AWS Builder ($5,000 + $5,000 credits)
The judging note: *obvious* = single Bedrock call; *creative* = multi-service pipeline / agent orchestration. To rise above "obvious":
- Bedrock Converse **tool-use loop** driving MCP tools (already built)
- Cognito for auth (already built)
- MCP server **deployed on AWS** (App Runner/ECS/EC2 + HTTPS)
- *Optional if time allows:* CloudWatch logging of tool calls, or a Strands/AgentCore-based orchestration layer. Only attempt if it doesn't threaten the feature freeze.
- Document every service and its role in the Product Feedback answer. Watch costs — the organisers announced on 7 Oct that AWS credit codes are exhausted, so set a billing alarm.

### Open Source ($5,000 + $5,000 credits)
Must be **new work made during the window** (new repo with license, branch, fork, or PR). Avoid "obvious" contributions (typos, README tweaks). Options, in order of value:
1. **Extract the approval-gate pattern** into a small standalone MIT-licensed package (e.g., "propose → human approve → execute" middleware for MCP servers) with tests and a README. Reference it from SAARTHI.
2. **A PR fixing a real bug/doc gap you hit** (your friction log will tell you which) in the MCP SDK/docs or a related repo. PRs need not be merged.
3. A reusable example repo: "Stateful MCP server on AWS with Bedrock tool-use."

*Note: a project can win only one track prize and one mini-challenge prize.*

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Bedrock quota/model-ID failure | Hero flow dead | Gate 1 test now; request quota early; `DEMO_MODE` fixtures |
| Cognito misconfig | Can't log in on camera | Gate 1; demo-user bypass in `DEMO_MODE` |
| MCP SDK doesn't negotiate 2025-11-25 | Fails the core requirement | Upgrade SDK, re-test, log as friction entry if docs are unclear |
| Secrets leaked in git history | Disqualification / account abuse | Scan (gitleaks/trufflehog), rotate any exposed key, clean history |
| Pre-existing code, no "significant update" story | DQ risk | Commit log since 31 Aug + explicit "What's new" section + show new features in video |
| Over-building | No time to record | Feature freeze 18 Oct; stretch items are optional |
| Video exceeds 3:00 | Judges stop watching | Script to 2:50; time every take |
| Last-hour submission failure | Lose everything | Submit 22 Oct; Devpost allows draft saves — save early |
| Public MCP endpoint abused | Cost/security | Auth header, rate limit, read-only demo DB — or keep local and show only a tunnel in the video |

---

## 12. Day-by-Day Calendar (IST dates; today = Sat 10 Oct)

| Date | Focus | Exit criterion |
|---|---|---|
| **Sat 10** | Gate 1 verification, repo/license decision, start friction log | Protocol + Bedrock + Cognito confirmed |
| **Sun 11** | `DEMO_MODE`, seed data, one-command run | Fresh clone runs end-to-end |
| **Mon 12** | Hero flow: Alexa chat → tool chips → plan card | Scenario beats 1–3 work |
| **Tue 13** | Plan diff + approval + invariants + tests | Gate 2 (10/10 runs) |
| **Wed 14** | `/judge` audit view, tool-call trace, voice I/O | Beats 4–5 work |
| **Thu 15** | Proactive scene + cross-session memory | Beats 2 & 6 work |
| **Fri 16** | AWS deployment (HTTPS MCP endpoint) | Remote endpoint passes Inspector |
| **Sat 17** | Open Source contribution; optional MCP App / `SKILL.md` | Contribution URL live |
| **Sun 18** | 🔒 **Feature freeze.** Bug bash | No new features after today |
| **Mon 19** | Design polish (hero screens), minimal responsive | Screens video-ready |
| **Tue 20** | README, diagram, tests, secrets scan, LICENSE | Clean-clone test passes |
| **Wed 21** | **Record video** (3 takes) + upload; write Devpost text + feedback + friction log | Draft submission saved |
| **Thu 22** | Final review from a judge's perspective; **SUBMIT** | Confirmation received |
| **Fri 23** | Emergency buffer only | — |
| *Sat 24, 12:30 AM IST* | **Hard deadline** | — |

---

## 13. Final Submission Checklist (v2)

**Compliance**
- [ ] MCP handshake verified at 2025-11-25+ over Streamable HTTP
- [ ] Public repo + OSS license visible in About (or private + shared with listed Amazon reviewers)
- [ ] README: prerequisites, `.env.example`, install, run, `DEMO_MODE`, how to connect an MCP client, how to run tests
- [ ] No secrets in code or history; scan clean
- [ ] "Significantly updated during hackathon" explained in text and shown in video

**Product**
- [ ] Hero flow passes 10/10 from fresh seed
- [ ] Approval-boundary tests green
- [ ] `/judge` shows protocol version + tool-call log
- [ ] Hero screens polished; no horizontal scroll at 390px on hero screens
- [ ] Loading / empty / error states on hero screens

**Submission assets**
- [ ] Video < 3:00, public, English, captions, no copyrighted music/third-party marks
- [ ] Description follows the 7-part structure
- [ ] Architecture diagram + 4–5 screenshots
- [ ] Product Feedback (all 5 prompts) incl. AWS service explanation
- [ ] **6–10 friction log entries** (bonus up to 10%)
- [ ] Feature requests (optional, 2–3)
- [ ] Open Source mini: contribution URL, repo URL, GitHub username, description
- [ ] Track = Alexa+; mini challenges = AWS Builder + Open Source
- [ ] **Submitted by Thu 22 Oct; confirmation received**

---

## 14. Open Questions to Resolve Quickly

1. **Is SAARTHI's code older than 31 Aug 2026?** If yes, the "what's new" story is mandatory — share the commit range and I can help draft it.
2. **Alexa+ access:** Alexa+ availability is region-limited. The rules explicitly allow a **simulated Alexa+ experience in a web app**, which is what `/alexa` is. Confirm in the Alexa+/MCP docs whether a remote-MCP registration path exists for your account; if not, lean on the simulated path and say so honestly in the video and description.
3. **Public or private repo?** Public + license is simpler and unlocks the Open Source mini challenge.
4. **Budget:** estimate Bedrock + hosting costs for the next two weeks and set a billing alarm.
5. **Team roles:** who records the video, and who writes the feedback and friction log? Assign owners now.
