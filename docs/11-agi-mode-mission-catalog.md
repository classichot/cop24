# 11 — AGI Mode & Mission Catalog (Developer Requirements v1.0)

**Route:** `/agi` · **Engine:** `src/core/agi/` (pure TypeScript) · **Tests:** `src/core/__tests__/agi.test.ts` (24)

COP24 runs as a virtual CoP compliance department. The user picks an outcome and sees a mission
preview. The AI team then identifies requirements, collects and checks evidence, drafts, runs
independent QA and prepares the package. People approve, certify and file.

## What is built

| Requirement | Implementation |
| --- | --- |
| §2 regulatory rules | `regulatory.ts`: a versioned, configurable ruleset (`erc-cop-rules@2565+2567-r1`) |
| REQ-AGI-001 Single Bot, Team, Swarm | `engine.ts` recommends a mode and explains it. Several sites require Swarm. A Team has a Lead Agent plus specialists and runs dependency levels in parallel. A Swarm runs one workstream per site, cross-checks centrally and builds a group dashboard |
| REQ-AGI-002 Draft, Supervised, Autopilot | Set independently of mode. Under Draft the AI takes no outbound action and the user gets the task. Supervised sends permitted internal requests once. Certification and filing are always human |
| REQ-AGI-003 15 agents, Build My AI Team | `agents.ts` and the team builder on `/agi`. You can switch agents off and choose the model provider and certifier. Lead, QA and Cost Governor cannot be switched off |
| §4 108 missions in 12 categories | `catalog.ts`. 65 are marked available and link to the screen or flagship that performs them; 43 are planned and cannot be started (§13) |
| §5 flagships F01–F07 | `flagship.ts`, each with every REQ-AGI-004 field |
| REQ-AGI-004 Universal Mission Engine | One state machine covers every mission, plus failed, cancelled and retrying states. Runs are checkpointed and resumable, and approvals and actions are idempotent |
| REQ-AGI-005 Cooperative Swarm | Each workstream sees only its own site. A central consolidation step detects findings that recur across sites and produces the group dashboard |
| REQ-AGI-006 routing and cost | `routing.ts` holds the routing table. The Cost Governor estimates cost in the preview and pauses at the budget. Only an owner or executive can approve more spending |
| REQ-AGI-007 triggers | `triggers.ts` covers deadline, exception, condition change, new evidence, regulator letter, overdue corrective work and amendment triggers. What each trigger does depends on autonomy |
| REQ-DATA-002 evidence statuses | Verified, Needs Review, Missing, Conflicting and Not Applicable. Missing or unreviewed evidence never passes |
| REQ-EXEC-002/003 work types, CAPA | Each task is labelled AI, human, licensed professional, third-party laboratory or formal approval. Corrective work closes only with evidence and a verifier other than the person who did the work |
| REQ-GOV-001–005 | See the governance list below |
| REQ-UX-001–004 | The home page asks "What would you like COP24 to do?". `/agi` has the Mission Preview, Mission Control, links to the Report Studio and trace views. The Copilot's "Do it for me" opens the matching flagship |

The §2 ruleset contains:

- Clause 21 reporting cycles, checked against the corpus. Combustion plants report every 6 months, due July and January. Non-combustion plants report yearly, due January.
- The rooftop checklist and the 2567 amendment.
- The clause 19 laboratory rule.
- EIA and EHIA thresholds, flagged as unverified.
- `determineRoute()` flags EIA, EHIA or IEE projects instead of generating a CoP report.

The governance list covers REQ-GOV-001 to 005:

- No measure passes without verified evidence, and a violation is kept separate from an unverified status.
- Every run records the ruleset version it used.
- QA checks that every compliance statement has a source.
- The audit trail is SHA-256 hash-chained and `verifyAudit()` detects tampering.
- `trace()` reconstructs how a report was produced.
- Filing succeeds only with an authorised role, an authenticated channel and the regulator's acknowledgement.

## §14 acceptance tests

| Test | Result |
| --- | --- |
| Rooftop project gets the rooftop checklist | Pass |
| An EIA project is flagged and no CoP report is generated | Pass. The run ends Blocked |
| Conflicting capacities are detected and need a human decision | Pass. The test case is 48 MW against 45 MW |
| A lab with missing credentials is flagged and its results are not validated | Pass. Missing and expired accreditation are both caught |
| Missing evidence: supported sections are drafted, unsupported ones are blocked | Pass. The mission ends Needs Human Action |
| Limited history: only available years are shown and the gaps are explained | Pass |
| A new permit condition identifies the affected obligations and sections | Pass |
| A multi-site swarm keeps site data separate and produces per-site deliverables | Pass |
| Rewriting a verified section keeps the approved data | Pass, using the Report Engine's rewrite check |
| Submitting without authorisation is refused | Pass |
| A resumed mission does not repeat approved actions | Pass |
| The audit history can be reconstructed | Pass, including tamper detection |

The browser check confirmed both outcomes on screen. A run with open evidence ends "Blocked / Needs
Human Action". A run with every gate approved and its evidence confirmed ends "Completed".

## Not built yet

- **Language-model drafting.** Drafting, QA and every determination are deterministic. A report is assembled only from verified evidence, so nothing is invented. Prose written by a model through the connected provider is the next step. Paul's provider set-up is already in place.
- **Running in the background.** Runs and triggers are stored in the browser. Background execution while the app is closed, scheduled triggers and multi-user approvals need a backend worker and database.
- **Authenticated ERC filing.** COP24 prepares the package. A person files through the ERC's channel and records the acknowledgement.
- **The 43 planned missions.** These include maps, GIS, consultation workflow, final CoP generation, PDF export, the regulator-letter workflow and budget forecasting. They are listed but cannot be started.
- **Demo data.** The sites are the illustrative tenant (Lopburi 1 and 2) plus two demonstration projects, rooftop and biomass. Environmental limits are unverified, so exceedances are provisional.
