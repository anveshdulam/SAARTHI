# SAARTHI — Visual QA & Cross-Screen Responsive Audit Report

**Audit Date:** 2026-10-15  
**Audited Target:** `http://localhost:5173` (Local Dev & Evaluation Server)  
**Evidence Artifacts:** Stored in `docs/evidence/screenshots/`  
**Browser Engine:** Chromium Headless via Browser Subagent  

---

## 1. Executive Summary

A comprehensive, live visual audit was conducted across all 9 application views and 4 target viewport tiers:
- **Mobile (320px – 390px):** iPhone SE to iPhone 14/15 Pro (`390x844`)
- **Tablet (768px):** iPad Mini / iPad Vertical (`768x1024`)
- **Small Desktop / Laptop (1024px):** iPad Pro / 13" MacBook (`1024x768`)
- **Full Desktop (1440px+):** Standard Wide Monitor (`1440x900`)

All 9 routes were evaluated in both unauthenticated landing and authenticated demo workspace states.

---

## 2. Screen-by-Screen Inspection Findings

### Screen 1: Landing Page (`/`)
- **Visual Appearance:** Editorial aesthetic with warm ivory backdrop, prominent serif typography (`clamp(2.5rem, 6vw, 4.5rem)`), dark product preview card, and 4-step workflow grid.
- **Responsiveness:**
  - On $\le 768$px, the fake sidebar in the product mockup is hidden via `.landing-mockup-sidebar { display: none !important; }`, preventing any horizontal page scroll.
  - The footer flexbox wraps cleanly with `flex-wrap: wrap` and `gap: 16px`.
- **Evidence:** `landing_page_1792046386286.png`
- **Result:** 🟢 **PASS**

### Screen 2: Authentication Modal (`AuthModal.tsx` / `LandingPage.tsx`)
- **Visual Appearance:** Clean card modal with tabbed sign-in/sign-up switching, live password rule indicators (8+ chars, number, symbol, upper, lower), and prominent "⚡ Continue in Demo Mode (No Login Required)" button.
- **Responsiveness:** Modal auto-scales to `maxWidth: 440px` and fits within 320px viewports with 16px side padding. Touch targets meet $\ge 44$px requirement.
- **Result:** 🟢 **PASS**

### Screen 3: Today Dashboard (`/`)
- **Visual Appearance:**
  - Header with personalized greeting, active commitment tally, and quick-action buttons (`Replan day`, `Open Alexa+ Voice ↗`).
  - **Beat 2 Proactive Hazard Alert Card:** Prominently highlights the missed 2:00 PM study session with danger-colored indicator and immediate repair actions.
  - At a glance KPIs: Total commitments, completed, and at risk.
- **Responsiveness:**
  - At 1440px: 2-column layout (`grid-template-columns: 1fr 360px`).
  - At 1024px, 768px, and 390px: Seamlessly reflows to a single column (`grid-template-columns: 1fr`).
- **Evidence:** `desktop_1440x900_1792046425742.png`, `mobile_390x844_1792046394593.png`, `today_dashboard_final_1792046606190.png`
- **Result:** 🟢 **PASS**

### Screen 4: Living Plans (`/plans`)
- **Visual Appearance:**
  - Authoritative governance card showing Plan version, reasoning, risk level, and dynamic stored constraints.
  - Authoritative action buttons: "Approve & Commit Plan (vX)" and "Reject Proposal ✕".
  - Tabbed schedule view: "Schedule Timeline" vs "Diff & Prior Comparison".
  - Diff table clearly differentiates rescheduled soft blocks vs fixed hard anchor blocks.
- **Responsiveness:**
  - Table is wrapped in an `overflow-x: auto` container, ensuring clean scrolling on 320px–390px screens without viewport blowout.
  - Action buttons wrap gracefully.
- **Evidence:** `plans_page_1792046435408.png`, `diff_tab_inspection_1791707646407.png`
- **Result:** 🟢 **PASS**

### Screen 5: Commitments (`/commitments`)
- **Visual Appearance:**
  - Quick-add intention input and button.
  - Functional filter tabs: `All Commitments (5)`, `Active`, `At Risk (1)`, `Completed (0)`.
  - Commitment cards show scheduled times or estimated duration, type badges (`HARD` vs `SOFT`), and inspect modal trigger.
- **Responsiveness:**
  - Quick-add form expands to full width on mobile viewports.
  - Filter tabs scroll horizontally on narrow screens.
- **Evidence:** `commitments_page_1792046450705.png`
- **Result:** 🟢 **PASS**

### Screen 6: Memory (`/memory`)
- **Visual Appearance:**
  - Stored constraints list showing real SQLite database records: "No study after 10 PM", "Gym Tue/Thu", "Sleep by 11:30 PM".
  - Direct persistence form for adding new time limits, habits, or preferences.
  - Scenario preset buttons for quick one-click constraints.
- **Responsiveness:**
  - Single column reflow on $\le 1024$px. Form fields wrap appropriately.
- **Evidence:** `memory_page_1792046499899.png`
- **Result:** 🟢 **PASS**

### Screen 7: Activity (`/activity`)
- **Visual Appearance:**
  - Chronological immutable audit trail.
  - Filter bar: `ALL`, `COMMITMENTS`, `PLANS`, `APPROVALS`, `MEMORY`, `SYSTEM`.
  - Colored timeline dots (green for accepted/approved, yellow for proposed, red for missed/failed).
- **Responsiveness:**
  - Timestamp column is fixed at 90px; event content wraps cleanly with `overflowWrap: 'anywhere'`.
- **Evidence:** `activity_page_1792046516333.png`
- **Result:** 🟢 **PASS**

### Screen 8: Alexa+ Execution Terminal (`/alexa`)
- **Visual Appearance:**
  - Conversational terminal with chat bubbles, system status indicator, verified tool execution pills (`assess_commitment_risk`, `create_schedule_proposal`), and unique Request ID.
  - Generated schedule proposal card with pending review badge, block count, risk state, and direct link to `/plans`.
  - Microphone button (44px min-height), hero preset chip, and ambient spoken audio toggle.
- **Responsiveness:**
  - Input bar pinned to bottom of container with flex wrap on preset buttons and audio toggle.
  - Tested hero trigger: `"I missed my 2 PM study session. Fix my schedule."` successfully triggered live tool trace and proposal card.
- **Evidence:** `alexa_page_1792046534699.png`, `alexa_terminal_1792046558192.png`
- **Result:** 🟢 **PASS**

### Screen 9: Judge Mode (`/judge`)
- **Visual Appearance:**
  - Live protocol telemetry KPIs: MCP Protocol `v2025-11-25` (Verified), Transport Layer `STREAMABLE HTTP` (`/mcp`), Safety Invariant `9 Lifecycle Tools Withheld from LLM`.
  - Tool catalog inspecting all 13 registered tools, input schemas, and access boundaries.
  - Invariants tab explaining optimistic concurrency, non-autonomous approval gate, and user isolation.
- **Responsiveness:**
  - 3-column KPI card grid reflows to 1 column on mobile and tablet.
- **Evidence:** `judge_page_1792046594406.png`
- **Result:** 🟢 **PASS**

---

## 3. Responsive Navigation & Mobile Drawer

- **Hamburger Menu Toggle:** Rendered in `Topbar` with `aria-label="Open navigation menu"` and $\ge 44$px touch target.
- **Drawer Behavior:**
  - On viewports $> 1024$px, the sidebar is fixed at 220px on the left.
  - On viewports $\le 1024$px, the sidebar is positioned off-canvas (`left: -220px`). Clicking the hamburger button triggers `mobile-open`, sliding the sidebar in smoothly with a semi-transparent `mobile-backdrop`.
  - Clicking any navigation link or the backdrop automatically closes the drawer.
- **Evidence:** `mobile_menu_open_1792046404292.png`, `mobile_menu_closed_1792046414074.png`
- **Result:** 🟢 **PASS**
