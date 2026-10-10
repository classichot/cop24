# COP24 — Compliance ERP

> **COP24 = Compliance ERP.**
> **ESG24 = ESG Compliance & Sustainability OS, powered by COP24.**

COP24 is the horizontal compliance engine of the 24 series. It owns the machinery every
compliance product needs — one Compliance Universe, an Applicability Engine, an Obligation
Register, an Evidence Pipeline, a Compliance Calendar, Control Testing, Gap & Remediation,
a Regulatory Change Monitor, an Audit Trail and an Execution Engine — so that ESG24, TP24,
GMT24, TRADE24, ACC24 and future products stop rebuilding the same compliance machinery and
instead bring only their own packs, UI, calculations and domain intelligence.

```
COP24  = horizontal Compliance ERP / infrastructure
  ↓
ESG24  = specialist ESG application          (SET/SEC 56-1, IFRS S1/S2, GRI, GHG/TGO)
TP24   = Transfer Pricing application        (s.71 bis/ter, disclosure form, local file)
GMT24  = Pillar Two application              (top-up tax, GloBE Information Return)
TRADE24= Trade / FTA compliance application  (customs, rules of origin)
ACC24  = Accounting / tax compliance         (PND.50/51, PP.30, DBD filings)
```

This repository is **COP24 Core v1** plus a working, design-faithful product surface: a
Thai-first, bilingual (TH/EN) Next.js app whose every screen is driven by the core engines
rather than by hand-written numbers.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine tests (node:test + tsx)
npm run typecheck
npm run lint
npm run build
npm run corpus:fetch   # download in-force ERC regulation files listed in corpus/manifest.json
npm run corpus:ingest  # extract, repair Thai text, split into clauses, index
npm run ingest:eval    # real ERC files through the ingestion engine: must invent 0 measurements
```

## Repository layout

```
src/core/          COP24 Core Engine — pure TypeScript, knows no domain
  types.ts           shared vocabulary (Entity, RulePack, Obligation, Evidence, Gap …)
  applicability.ts   Applicability Engine (explainable: matched / failed / excluded / assumptions)
  register.ts        Regulation / Obligation Engine → ObligationInstance per entity
  evidence.ts        Evidence Engine — 3-layer model (exists · valid · proves) + Evidence Guard
  controls.ts        Control / Test Engine — effectiveness derived from the latest test
  gaps.ts            Gap & Remediation — gaps are derived, never typed
  calendar.ts        Workflow & Execution — dated events across every domain
  changes.ts         Regulatory Change Engine — impact propagation to obligations/chapters/entities
  preflight.ts       Reporting / Submission — 9-layer preflight + 4-stage release gate
  nba.ts             Next Best Action — the one thing that moves the draft to the next gate
  engine.ts          ENGINES catalogue + createSnapshot() that wires everything together
  __tests__/         node:test suite
src/packs/         Domain knowledge (rule packs) consumed by the engines
  erc-cop.ts         ERC Code of Practice — ground-mounted solar (the original prototype's domain)
  esg24.ts           ESG24 pack: SET 56-1 One Report, IFRS S1/S2, TGO GHG
  thai-general.ts    PDPA, Labour/OSH, Corporate/DBD, Cybersecurity CII
  tax-apps.ts        ACC24 periodic tax, TP24 transfer pricing, GMT24 Pillar Two, TRADE24 customs
  domains.ts         The 13-domain Compliance Universe + the 24-app catalogue
src/core/report/   Report Engine — 24 Series Report Generation Quality Standard v1.0 (brief, data
                   contract, claim ledger, calculations, semantic rewrite checks, editorial rubric,
                   model registry/routing, 9 release gates, approval binding)
src/core/ingest/   Smart Data Ingestion & AI Handoff Engine (COP24-DI-001): classify, extract and
                   normalise Thai/English evidence, regulation-driven checklist, validation, missing
                   register, evidence requests, checkpointed AI missions, document control, audit,
                   handoff to the Report Engine
src/lib/ingest/    Browser side: PDF/OCR/Word/Excel/image/ZIP parsing and IndexedDB persistence
src/core/corpus*.ts Legal corpus types + Thai PDF text repair and clause chunking
src/packs/report/  Report packs (ERC CoP Solar Farm form V1.0/2565 requirement matrix)
corpus/            Legal corpus: manifest (52 sources, 36 from the ERC catalogue), index, scripts in
                   scripts/corpus/ (fetch, ingest); raw files and extracted text stay local
src/data/          Demo tenant (Lopburi Green Power group) — entities, evidence, controls, tests,
                   regulatory changes, report draft, audit trail, agents, missions, portfolio
src/state/         App state (language, role, mode, Evidence Guard, active entity) + snapshot
src/components/    AppShell (header / nav / footer) and the UI primitives of the design system
src/app/           Next.js App Router pages — one route per capability (see below)
design/            The design file this UI strictly follows (prototype + Modernist design system)
docs/              Concept, architecture, features and wow features, design system, roadmap
```

## Screens

| Route | Capability | Engine |
| --- | --- | --- |
| `/` | Home / ASK 24 — goal in plain language, missions by role, attention list, Next Best Action | Agent, all |
| `/ingest` | Data Preparation — **Import Everything** (files, folders, ZIP; no naming or tagging) and **Hand Off to AI** (instruction → authorised mission); checklist, side-by-side review, missing evidence and requests, findings, mission log, project profile, audit | Evidence, Document, Agent |
| `/start` | Easy Start — explainable applicability across every domain at once | Applicability |
| `/missions` | AGI Mission Mode — Regulation / Document / Report / QA agents with guardrails and QA veto | Agent |
| `/evidence` | Document Control Center — 3-layer evidence, AI-drafted evidence requests | Evidence, Document |
| `/factory` | One-Click Report Factory — any pack's report template, same pipeline | Reporting |
| `/calendar` | Compliance Calendar — one timeline for tax, CoP, PDPA, labour, 56-1; measure-to-evidence register; Smart Carry Forward | Workflow |
| `/gaps` | Gap & Remediation — derived gaps with owner, due date, remediation | Gaps |
| `/studio` | AI Report Studio — chapter editor with the binding obligation and evidence beside the text; Evidence Guard blocks closing | Reporting, Evidence |
| `/preflight` | 9-layer Preflight Validator and the 4-stage release gate | Control, Reporting |
| `/xray` | Compliance X-Ray — audit an existing report against the binding pack | Reporting |
| `/portfolio` | Portfolio & Advisor Center — many entities, sorted by risk | Workflow |
| `/universe` | Compliance Universe — 13 domains × entities heat map; which app owns which column | Applicability, Gaps |
| `/obligations` | Obligation Register — one row per entity × obligation | Regulation |
| `/controls` | Control Testing — effectiveness from tests; failed controls open gaps | Control |
| `/changes` | Regulatory Change Monitor — impact to obligations, chapters, entities; proposed new obligations | Change |
| `/audit` | Audit Trail — every AI / human / system action with the engine that did it | all |
| `/report-quality` | Report Quality — the standard applied: 9 gates, requirement matrix from the ERC form, claim ledger with Click to Source, numbers and conflicts, findings, data contract, model registry and routing, approval binding, audit package | Report Engine |
| `/corpus` | Legal Corpus — ERC catalogue (in force / repealed), clause index, extraction-quality flags, reference reports | Regulation |
| `/packs` | Packs & 24 apps — installed packs; the **COP24 experience inside ESG24 / TP24 / GMT24** (same snapshot, app-skinned) | all |
| `/engine` | COP24 Core Engine — the nine engines with live metrics and the snapshot data flow | all |

The header switches **role** (owner / advisor / executive), **mode** (easy / pro / AGI — easy
hides expert modules without removing them) and **language** (ไทย / EN). The side nav switches
the **active entity**; every engine output re-filters.

## Design

The UI strictly follows `design/COP24 prototype design.zip`: the **Modernist** design system
(Archivo + Chakra Petch, zero radius, strong 2px rules, a visible modular grid of cells
separated by 1px rules, flush-left labels) with the prototype's own tokens (navy ink `#101c3a`,
yellow accent `#f5c518`, status tokens ok/warn/bad/info). `src/app/globals.css` reproduces the
design-system stylesheet verbatim, then the prototype's `:root` overrides, then the small set of
utility classes the prototype expressed as repeated inline styles. See `docs/04-design-system.md`.

## Wow features

1. **ASK 24** — a goal in plain language becomes a mission plan; you never learn the menu.
2. **Explainable applicability** — data used, assumptions, alternatives ruled out, for every pack, every domain, at once.
3. **Three-layer evidence + Evidence Guard** — exists · valid · proves. No upload counts automatically; the AI fills no number it cannot source; unresolved slots never disappear on their own.
4. **One-Click Report Factory** with a **9-layer Preflight** and a **4-stage release gate**.
5. **Compliance X-Ray** of any existing report.
6. **AGI Mission Mode** — four agents bound to four engines; the QA agent can veto release.
7. **Regulatory Change → impact propagation** — a notice becomes affected obligations, chapters, entities and proposed new register rows.
8. **Smart Carry Forward** — the next period starts from approved data and flags only what changed.
9. **Next Best Action** — computed from gaps and preflight, never hand-written.
10. **Compliance Universe** — 13 domains × every entity on one map; ESG24 sees one column, COP24 sees the sheet.
11. **The COP24 experience inside every 24 app** — the same snapshot, filtered to the app's packs, in the app's brand.
12. **Audit Trail with rulepack pinning** — every output traceable to a rulepack version and an evidence snapshot.

## Report Generation Quality Standard

The 24 Series Report Generation Quality Standard (Draft v1.0, `docs/standards/`) is implemented as the shared
Report Engine in `src/core/report/`. It is applied first to the Lopburi 1 preliminary CoP report and tested
against the standard’s §16 acceptance scenarios. See `docs/06-report-standard-implementation.md` for the
section-by-section mapping and what is not built yet, and `docs/07-cop-report-references.md` for the
official ERC form and the EGAT example report.

## Smart Data Ingestion & AI Handoff

The COP24-DI-001 spec is implemented in `src/core/ingest/` and the `/ingest` screen. Files are read in
the browser and never leave it. See `docs/08-smart-data-ingestion.md` for the requirement mapping, the
§9 acceptance results and what still needs a backend.

## Deploy

The app is a standard Next.js project; the Vercel project is named `cop24`.

```bash
npx vercel --prod
```
