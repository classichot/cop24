# 02 · Architecture

## Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│  24 apps      ESG24 · TP24 · GMT24 · TRADE24 · ACC24 · (COP24 UI)    │  own UI, calculations,
│                                                                      │  domain missions
├──────────────────────────────────────────────────────────────────────┤
│  Packs        src/packs — RulePack = criteria + obligations +        │  domain knowledge,
│               report templates + authority + version                 │  versioned
├──────────────────────────────────────────────────────────────────────┤
│  COP24 Core   src/core — nine engines, pure TypeScript, no domain    │  built once, shared
└──────────────────────────────────────────────────────────────────────┘
```

## The nine engines (`src/core`)

| Engine | Module | Powers | Input → Output |
| --- | --- | --- | --- |
| Regulation / Obligation | `register.ts` | Obligation Register, Compliance Universe | packs → `ObligationInstance[]` per entity |
| Applicability | `applicability.ts` | Easy Start, Universe | entity profile + pack criteria → `ApplicabilityResult` (matched, failed, excluded, assumptions, confidence) |
| Workflow & Execution | `calendar.ts`, gate in `preflight.ts` | Calendar, release gate, missions | register + events → `CalendarEvent[]`, gate stage |
| Evidence | `evidence.ts` | Evidence Pipeline, Evidence Guard | items → `EvidenceScore` (exists / valid / proves), guard verdict |
| Document Control | tenant data + `evidence.ts` | Document Control Center | documents + owners → requests, pinned versions |
| Control / Test | `controls.ts`, `preflight.ts` | Control Testing, Preflight | controls + tests → effectiveness; report → 9 layers |
| Regulatory Change | `changes.ts` | Regulatory Change Monitor | `RegChange` → `ChangeImpact` (obligations, chapters, entities, severity) |
| Reporting / Submission | `preflight.ts`, report templates | Factory, Studio, X-Ray | template + evidence + facts → `ReportDraft`, bundle |
| Agent / AGI | `AGENTS` + mission catalogue | ASK 24, Mission Mode | goal → mission plan; decisions left to humans |

`engine.ts#createSnapshot(tenant)` wires them in order:

```
packs → evaluateApplicability(entity) → buildRegister → ObligationInstance[]
evidence → scoreEvidence → status per obligation → evidenceGuard
controls + tests → buildControlViews → effectiveness
register + controls → deriveGaps → Gap[]
register + events → buildCalendar → CalendarEvent[]
RegChange → assessImpact → obligations · chapters · entities · proposed obligations
report + evidence + conflicts → runPreflight (9 layers) → gate 1–4
gaps + preflight → nextBestAction
```

Every screen reads from this one snapshot. Nothing on screen is a hand-typed number except the
demo tenant's source data.

## Packs (`src/packs`)

A `RulePack` carries:

- identity: `id`, `app` (which 24 app owns it), `domain`, `authority`, `source`, `version`, `effectiveFrom`
- `criteria` (all must match) and `exclusions` (any match rules the pack out), both human-labelled so the UI can explain
- `assumptions` that lower confidence until confirmed
- `obligations` with frequency, due rule, required evidence, owner role, severity, report destination
- `reports` with chapter templates (mandatory headings are `locked`)

Installed in this tenant: ERC CoP (solar, ground), SET 56-1 One Report, IFRS S1/S2, TGO GHG,
PDPA, Labour/OSH, Corporate/DBD, Cyber CII, Revenue Code periodic tax, Transfer Pricing,
Pillar Two (monitored — below threshold), Customs/FTA (monitored — no trade).

## Apps on the engine

An app = a set of packs + a theme + its own screens, calculations and missions. `/packs` shows
the same snapshot filtered to an app's packs and tinted in the app's brand — this is how the
COP24 experience appears *inside* ESG24 without the customer buying another product.

## Extraction path

`src/core` and `src/packs` have no React or Next.js imports. When the 24 series moves to a
monorepo they lift out as `@24/cop24-core` and `@24/cop24-packs` unchanged; the app keeps
`src/app`, `src/components`, `src/state`.

## Multi-tenant / production notes (not in v1)

- Tenant data becomes a database (entities, evidence, tests, audit) behind the same `TenantData` shape.
- Agents become real tool-using LLM agents bound to the same engines and the same guardrails.
- Connectors (SharePoint, Google Drive, ERP, HRIS) feed the Evidence Engine; OCR/extraction fills `facts`.
- Regulatory feeds (ERC, SEC, PDPC, Revenue Department …) feed the Change Engine.
