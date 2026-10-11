# 09 — 24 Series Universal UX Standard, applied to COP24

**Master rule:** don't ask the user to learn the software; let the software learn what the user is
trying to achieve. Complex underneath, simple on top.

The standard is implemented as an experience layer above the existing modules. No module was
rebuilt; each became a capability that the Copilot and missions call (§19).

| Layer | Where |
| --- | --- |
| Experience (Copilot, Easy mode, journey, home A–E) | `src/components/ux/`, `src/app/page.tsx` |
| Mission orchestration (intent → mission → plan) | `src/core/ux/` (pure TypeScript, tested) |
| Application services | every existing route in `src/app/*` |
| AI / AGI (single · team · swarm) | `/missions` → Do it for me |
| Data + evidence | the engine snapshot and the ingestion store |

## Section-by-section

| § | Requirement | COP24 implementation |
| --- | --- | --- |
| 1 | Goal → AI understands → Mission → Guided execution → Review → Outcome | Copilot → `understand()` → mission catalog → guided journey → My work → Reports & outputs |
| 2 | Easy / Goal mode as default | Home asks "What would you like to achieve?" with natural-language input, 5 role-based goal cards, "I don't know where to start", and in-progress missions |
| 3 | 24 Copilot, an orchestrator not a chatbot | Header button on every screen, Ctrl+K, and home Section A. It detects intent, picks the entity, report type and year, shows the plan, the data needed and the data missing, then routes by assistance level. It never sends or files anything |
| 4 | Goal-to-Mission engine | `src/core/ux/catalog.ts`: 17 missions across COP24, ESG24 and TP24, each with cues, roles, plan (AI and human steps), requirements and reasons |
| 5 | Guided journey | `GuidedJourney`: only the stages a mission needs, in standard order. It shows where you are, what's next, what the AI needs from you and what the AI is doing |
| 6 | Progressive disclosure | Easy mode shows the five primary items; every module stays under "All modules ▾". `AdvancedSettings` hides expert options, such as OCR and rule versions on Data preparation |
| 7 | Do It Myself, Guide Me, Do It For Me | `AssistLevel` in the Copilot and on every mission. Do it for me lists what the AI does and the few things it asks of you |
| 8 | Explain This | `ExplainThis` on every module heading: 16 terms, each answering what, why, what it means for us (from live figures) and what to do |
| 9 | Role-based experience | Owner, Advisor, Executive and the new Contributor role. Contributors see "Things you need to do" first and no management view |
| 10 | Easy, Pro and AGI modes on one data model | Header mode switch. AGI adds the Swarm option to Do it for me |
| 11 | Complexity Guard | `detectStruggle()` checks 8 signals, ignoring hub screens. It shows an inline, dismissible strip that offers Guide me or Do it for me for the mission it infers. Session-only and never sent anywhere |
| 12 | AI translates results | `ResultInterpreter` covers readiness, release gate, gaps, controls and sourced claims. Each shows what happened, what it means, whether it is good or bad, how it compares, why, what next and a fix button |
| 13 | Exception-based human work | My work lists only decisions, approvals, missing-data requests and exceptions |
| 14 | Universal home | Home has five parts: A Ask 24, B Recommended actions (3–6, derived), C My missions (filters for in progress, waiting for me, AI working, completed), D Attention required, E Management snapshot (explained) |
| 15 | Universal Mission Card | `MissionCard` shows status, AI share, data readiness, involvement, user time, the current step and requirements. Every value is derived from the plan |
| 16 | Next Best Action on every screen | `NextStepBar` in the shell, from `nextStepFor(route, context)` for every route and role |
| 17 | Shared UX components | `src/components/ux/` (listed on `/ux-standard`) |
| 18 | Intent-first navigation | Primary nav: Home, Ask 24, My missions, My work, Reports & outputs, then All modules |
| 20 | Never hide important decisions | `WhyAI` on every mission and Copilot answer covers reasoning (with the words that matched), data used, assumptions, sources and alternatives. Conflicting values are never auto-picked |
| 21 | UX acceptance test | `src/core/ux/acceptance.ts` and `/ux-standard`: seven tests per screen. Result: 24 of 24 screens are UX-complete, some with honest "partial" marks on expert screens |
| 22 | Capability and experience layers per feature | Each screen's register entry records both layers. The test suite fails when a route is unregistered, or when a screen claims a component its page does not use |

Tests: `src/core/__tests__/ux.test.ts` (15 tests, part of `npm test`).

## Not built yet

- **Language-model intent.** The Copilot uses deterministic bilingual rules (`intent-rules@1`), so it is predictable and testable. Unusual phrasing falls back to a clarifying question. A Claude-backed intent step can sit in front of the same `Understanding` shape once an API key and server route are provisioned.
- **Executing missions without a backend.** Do it for me hands the Data preparation missions to the real ingestion mission engine. The other missions show the plan and a visual run of the agent team, but no backend worker performs them yet.
- **Persisted decisions.** A decision on a conflicting value in My work is kept in the page for the prototype. It is not yet written to the audit trail or the report.
- **Complexity Guard telemetry.** Signals stay in the browser session by design. Product analytics, such as aggregate struggle hot-spots, would need consent and a backend.
- **Peer comparison.** Result interpretation compares against regulatory thresholds and targets. Peer benchmarks need cross-tenant data, which this prototype does not have.
