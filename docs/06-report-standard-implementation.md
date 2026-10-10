# 06 · 24 Series Report Generation Quality Standard — COP24 implementation

Standard: [`docs/standards/24-series-report-generation-quality-standard-v1.0.md`](standards/24-series-report-generation-quality-standard-v1.0.md)
(Draft v1.0, 10 October 2026). The engine lives in `src/core/report/` and is domain-agnostic, so
ESG24, TP24, GMT24, CFO24, ACC24 and MAR24 reuse it unchanged. A report pack adds content and
checks but cannot remove the shared controls.

First application: **Solar Farm Lopburi 1 — preliminary CoP report**, checked against the official
ERC Solar Farm form (V1.0/2565). Screen: **`/report-quality`**. Tests: `src/core/__tests__/report-standard.test.ts`.

## Section → code

| § | Requirement | Where | Status in v1 |
| --- | --- | --- | --- |
| 1 | One engine, app packs, two paths (One Click Draft / Report Studio) with identical controls | `src/core/report/*`, `src/packs/report/*`; `/factory`, `/studio` | Engine and pack done; both paths read the same assessment |
| 2 | Human Editorial Quality > 98/100, 5-dimension weighted rubric; no AI-detector gate; "review pending" until calibrated | `editorial.ts` (`RUBRIC`, `editorialStatus`) | Done — automated scores labelled provisional; gate stays *unknown* until a calibrated human assessment exists |
| 3 | Versioned Report Brief; requirement matrix; N/A needs rationale + approver; pack needs domain-owner approval | `brief.ts`, `types.ts` (`ReportBrief`, `Requirement`, `RequirementStatus`), `ReportPack.domainOwnerApproval` | Done — the CoP pack is marked **not yet domain-owner approved** |
| 4 | Typed Report Data Contract; entity/period/tenant/validation/approved-use; null ≠ zero ≠ unknown; demo/diagnostic/debug excluded; embedded instructions are content | `contract.ts` (`admitField`, `buildContract`, `renderState`) | Done |
| 5 | Source registry with version, retrieval time, access, snapshot; extracted text kept beside originals; locators | `types.ts` (`SourceRecord`, `SourceLocator`, `ReportEvidence`); legal corpus (`corpus/`, sha256 per file) | Done for PDF page/clause locators; spreadsheet/DB/API locator fields defined |
| 6 | Claim ledger; six claim types; citation validator checks existence, version, entity, period, exact support; Click to Source | `claims.ts` (`validateClaim`, `claimCoverage`); `/report-quality` → Claim ledger | Done — value-in-excerpt check, causal-language check (TH/EN) |
| 7 | Deterministic calculations with lineage; canonical unrounded values; per-method tolerances; conflicts never averaged; stale dependents | `metrics.ts` (`sum`, `pctChange`, `ratio`, `convert`, `reconcile`, `detectConflict`, `dependents`) | Done |
| 8 | Explain what / comparison / why / implication; causal claims need causal evidence; adverse findings not omitted | `claims.ts` causal rule; pack thresholds cannot be removed by callers | Partially — analysis depth is an editorial-review item |
| 9 | Approved Report Model Registry; benchmark before use; qualified fallback only; queue rather than downgrade; record config per revision | `models.ts` (`MODEL_REGISTRY`, `MODEL_ROUTES`, `route`) | Done — all models are **candidates**; routing returns *queued* until a benchmark is recorded |
| 10 | Review workspace; findings with passage, requirement, category, severity, remedy, owner; Rewrite Contract; semantic change detection | `assess.ts` (derived findings), `semantic.ts` (`semanticDiff`, `checkRewrite`); `/studio` rewrite panel | Done — number/date/unit/modality/status/negation/causal/locked-wording checks |
| 11 | Separate statuses; nine release gates; coverage with numerators; unknown fails closed; no admin override | `gates.ts` (`evaluateGates`, `statuses`, `releasable`) | Done |
| 12 | Approval bound to revision, content hash, evidence snapshot, pack version, export bytes; edits invalidate | `gates.ts` (`approvalValid`, `bindingHashes`), `hash.ts` | Done (export-bytes hash pending real export) |
| 13 | Thai/English parity, glossary, BE/CE dates | `LText` everywhere; `dates.ts` (BE display) | Bilingual UI done; translation-review gate is a future finding category |
| 14 | DOCX + PDF from one model; audit package manifest; render before approval | `/report-quality` → Approval & export | Manifest and gating done; DOCX/PDF rendering not built yet |
| 15 | Minimum records | `types.ts`: `ReportBrief`(=ReportProfile), `SourceRecord`, `ReportEvidence`(=EvidenceItem), `Metric`, `Claim`, `ReviewFinding`, `RewriteRevision`, `ReleaseRecord` | Done |
| 16 | Developer acceptance scenarios | `report-standard.test.ts` | 18 of 20 scenarios automated; see below |
| 17 | Journey: Choose report → Add data → Generate draft → Resolve review items → Approve and export | `/report-quality` header strip | Done |

## §16 scenarios

| Scenario | Test |
| --- | --- |
| Missing mandatory metric | ✔ gap, no invented value, release blocked |
| Record for another company/year | ✔ rejected by contract and by validator |
| Mock value / debug message | ✔ excluded |
| Page says "ignore the report rules" | ✔ kept as content, flagged, other controls still active |
| Citation exists but does not support | ✔ value-in-excerpt check fails |
| Convincing reference never retrieved | ✔ rejected |
| Two sources disagree | ✔ conflict shown, no selection/averaging (48.0 vs 45.0 MW in LB1) |
| OCR reads 1,000 as 7,000 | ✔ reconciliation fails |
| Wrong percentage or total | ✔ deterministic reconciliation; zero denominator refused |
| Invented cause | ✔ causal language without causal evidence flagged (TH and EN) |
| "proposed" → "completed" | ✔ status/modality/causal changes flagged; batch acceptance refused |
| Manual number edit after approval | ✔ hash changes → approval invalid |
| Source value changes | ✔ dependents become stale |
| Another tenant's evidence | ✔ denied |
| Source URL unavailable | ✔ no evidence = unsupported |
| High style, one unsupported fact | ✔ release blocked |
| Hide an adverse required finding | ✔ pack thresholds cannot be removed by callers |
| Thai/English differ in a qualification | — needs bilingual report bodies (next) |
| PDF clips a table | — needs the export renderer (next) |
| Multi-format export reconciles | — needs the export renderer (next) |

## What the engine found in the Lopburi 1 draft

- **Capacity conflict.** The licence says 48.0 MW; draft Chapter 5 Table 5-3 says 45.0 MW. This is critical and must be resolved by the project engineer.
- **Capacity format.** The ERC form requires panel capacity in MWp to 3 decimals and inverters in kVA to 2 decimals. The draft gives only "48.0 MW".
- **Baseline noise.** Form §3.1.1 requires ≥ 5 consecutive days at ≥ 2 stations, covering workdays and holidays, with L90, Ldn and Lmax. The data covers 3 days.
- **Unsupported statements.** The grid connection (115 kV, 3.2 km) has no registered evidence. "Outside any declared wetland" also has no evidence; it needs the ERC self-certification location form.
- **Pending evidence.** Site area and panel count depend on layout rev.C, which is still in review.
- **Stale approval.** The approval recorded on revision 3 is invalidated because the content has changed.
- **Unusable source.** The 2567 amendment PDF has no usable text layer and needs OCR before it can be quoted.

## Not yet built

- DOCX/PDF rendering with export checks and byte-bound approval.
- Calibration of the editorial rubric with two blind human reviewers.
- The benchmark run that would move a model from candidate to approved.
- The translation-review gate.
- Domain-owner sign-off of the CoP pack.
- The Solar Rooftop pack variant, which uses a five-part layout.
