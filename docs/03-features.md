# 03 · Features and wow features

## Universal UX standard (24 Series)

- **Three roles** — owner, advisor, executive — change missions and the attention list, not the data.
- **Three modes** — easy (expert modules hidden, never removed), professional, AGI.
- **Bilingual** — Thai first, English on a toggle; dates in Buddhist era for Thai.
- **One entity switcher** — every engine output re-filters.
- **Exceptions, not task lists** — the attention list shows only risks, missing data, conflicts and approvals.

## Feature map

| Screen | Core features |
| --- | --- |
| Home / ASK 24 | goal box, three primary actions, missions by role (AI-can-do %, data readiness, your time), attention list, executive KPIs, Next Best Action |
| Easy Start | entity profile → applicability across all packs; "why?" with criteria matched, assumptions, alternatives ruled out; one-time bulk ingest |
| Document Control Center | overall readiness, 3-layer counts, filterable evidence table, AI-drafted evidence request in site language |
| Report Factory | pick any applicable pack's report; 6-step pipeline; result card with sourced facts and unresolved count |
| Report Studio | chapters with state and lock; prose with unresolved markers; binding obligation; bound evidence with worst layer; missing items; AI actions; release gate |
| Preflight | 9 layers with expandable detail and references; gate stage; blockers/observations |
| X-Ray | upload → overall score, missing headings, unsupported statements, contradictions, plain-words interpretation, chapter gaps |
| Mission Mode | mission order; four agents with engine binding, logs and guardrails; mission result; cross-app catalogue |
| Calendar | 12-month strip across domains; due within 90 days; measure-to-evidence register; Smart Carry Forward |
| Gaps | counts; filters by severity and source; cause / remediation / owner / due |
| Portfolio | risk-sorted entities, readiness bars, batch drafting |
| Universe | 13 domains × entities heat map; app ownership of columns |
| Obligation Register | filters by entity, domain, app, status; expandable rows with required and bound evidence |
| Control Testing | effectiveness KPIs; last test and finding per control; cross-domain chain example |
| Regulatory Change | tracked changes with severity, affected obligations, entities, chapters; proposed new obligations to accept |
| Audit Trail | AI / human / system filter; engine chip per event; export |
| Packs & apps | installed packs with tenant status; the COP24 experience inside ESG24 / TP24 / GMT24 / TRADE24 / ACC24; the ten shared capabilities |
| Core Engine | nine engines with live metrics; the snapshot data flow |

## Wow features — and where the engine makes them real

1. **ASK 24** (`/`) — natural-language intent routes into missions.
2. **Explainable Applicability** (`/start`) — `ApplicabilityResult` carries matched/failed/excluded criteria and assumptions; the UI renders "why".
3. **Evidence Guard** (`/studio`, `/evidence`) — `evidenceGuard()` blocks "approve & lock" while any cited item fails a layer; unresolved slots are rendered in red and cannot be deleted by AI.
4. **9-layer Preflight + 4-stage gate** (`/preflight`) — `runPreflight()` derives every layer from data (applicability, structure, evidence, conflicts, dataset quality, history, traceability, review, output).
5. **Compliance X-Ray** (`/xray`).
6. **AGI Mission Mode with QA veto** (`/missions`) — agents are bound to engines and carry guardrails; the QA agent's last log is "release vetoed".
7. **Regulatory Change propagation** (`/changes`) — `assessImpact()` returns obligations, chapters and entities; a change can propose a brand-new obligation (SET-OR-3.3-S3) that opens a gap before it is even accepted.
8. **Smart Carry Forward** (`/calendar`).
9. **Next Best Action** (`/`, `/packs`) — `nextBestAction()` from gaps + preflight.
10. **Compliance Universe heat map** (`/universe`).
11. **COP24 inside every 24 app** (`/packs`) — the same snapshot, app-filtered and app-themed.
12. **Audit Trail with rulepack pinning** (`/audit`, preflight layer 9).
13. **Cross-domain control chain** (`/controls`) — one failed control cascades to evidence → gap → preflight → next action, identically for an ERC lab certificate or an ESG24 GHG verifier.
