# 08 — Smart Data Ingestion & AI Handoff Engine (COP24-DI-001)

**Route:** `/ingest` · **Engine:** `src/core/ingest/` (pure TypeScript, tested) · **Browser side:** `src/lib/ingest/`
**Rule versions:** classifier `classify-rules@1`, extractor `rule-extract@1`, evidence rules `cop-evidence-rules@2026.10-r1`,
standards `th-env-standards@2026.10-r1 (unverified)`.

The user does two things. **A · Import Everything** — drop files, folders or a ZIP, no naming or tagging.
**B · Hand Off to AI** — write what report is needed; COP24 turns it into a mission the user authorises
(sources, recipients, external sends, spend limit) before it runs. Files are parsed in the browser and are
never uploaded anywhere by this build.

## Requirement mapping

| ID | Requirement | Where | Status |
| --- | --- | --- | --- |
| COP-DI-01 | Project recognition | `analyze.ts` `recognize()` — majority vote across documents, licence wins ties, conflicts kept as `conflict`, never overwritten | Built |
| COP-DI-02 | Regulation-driven checklist | `rules.ts` — 18 evidence types; applicability by report type, phase, technology, regulation version (2565 / 2565+2567) and prior report; every row cites its ERC source and clause | Built |
| COP-DI-03 | Universal ingestion | `src/lib/ingest/parse.ts` — PDF text layer (pdf.js), Thai+English OCR on demand (tesseract.js), Word (mammoth), Excel/CSV (SheetJS), images + EXIF (exifr), ZIP recursion (jszip), folder drop | Built (local files) |
| COP-DI-04 | Classification | `classify.ts` — multi-label, explainable cues; blank ERC forms and regulations are recognised as reference material | Built |
| COP-DI-05 | Extraction & normalisation | `extract.ts`, `normalize.ts` — Thai digits, Buddhist Era → CE, units, value states (value / zero / ND / not measured / not provided / unclear), every field has a page or cell locator | Built |
| COP-DI-06 | Compliance mapping | `analyze.ts` `mapEvidence()` — evidence ↔ requirement with period (current / historical / standing) and rule version; user confirms each link | Built |
| COP-DI-07 | Prior-report intelligence | Prior CoP reports are classified, their stations and values become historical evidence, never current | Built |
| COP-DI-08 | Validation | 15 finding codes: unreadable, superseded, expired, other entity, missing pages, no signature, embedded instruction, capacity conflict, unit mismatch, unclear value, out of period, exceedance, station mismatch, insufficient noise baseline, duplicate | Built |
| COP-DI-09 | Missing-evidence register | `missingRegister()` — owner, method (authorised source, internal request, supplier request, declaration, reuse prior), deadline | Built |
| COP-DI-10 | Handoff mission | `mission.ts` — 12 checkpointed steps, deterministic Thai/English instruction parser, authorisation, pause/resume/revoke/cancel, retry ×3, spend limit, waits for replies | Built (in-browser) |
| COP-DI-11 | Evidence request assistant | `requests.ts` — Thai/English messages with what, why, period, format, deadline and a scoped upload link; external recipients always need approval | Built (no mailer) |
| COP-DI-12 | Confidence & review | Five confidence dimensions; side-by-side review with accept / correct (rationale required, original kept) / reject / clarify | Built |
| COP-DI-13 | Smart document control | `control.ts` — permanent IDs from SHA-256, duplicate-safe, supersession by revision, nothing deleted | Built |
| COP-DI-14 | Trace & record | Append-only audit; `trace()` returns file, page/cell, method, corrections and approvals for any field | Built |
| COP-DI-15 | ReportCore integration | `handoff.ts` `toReportInput()` — feeds the Report Engine's 9 gates; missing items stay explicit gaps | Built |
| COP-DI-16 | Continuous reuse | Approved snapshots are frozen and hashed; new data creates proposed updates, never silent edits | Built |

## §9 acceptance results

Measured by `npm test` (`src/core/__tests__/ingest.test.ts`) on a seeded, intentionally flawed Thai dataset
(`src/data/ingest-samples.ts`), plus `npm run ingest:eval` on real ERC files.

| Criterion | Result |
| --- | --- |
| Document classification ≥ 95% | 11 / 11 gold documents |
| Critical-field accuracy ≥ 98% | 11 / 11 gold fields; ND, not measured and not provided stay distinct |
| Every seeded defect detected | 11 / 11 |
| Missing mandatory evidence detected | Pass |
| Checklist differs by plant type, phase, regulation version | Pass (ground solar, rooftop, wind, monitoring, 2565 vs 2565+2567) |
| Historical evidence never presented as current | Pass |
| 100% of fields traceable to file + page/cell | Pass |
| No invented values | Pass; on 30 real ERC regulations and blank forms, 0 measurements extracted from limits or fill-in lines |
| Mission survives pause / resume / app restart | Pass — checkpointed in IndexedDB |
| No unapproved external message | Pass — external recipients are held until approved; out-of-scope recipients are blocked |
| Revocation enforced | Pass — a revoked mission cannot resume; a revoked source cannot ingest |
| No cross-tenant access | Pass — ingest from another tenant's source is rejected |
| Approved snapshots immutable | Pass — frozen and hash-bound; changes become proposals |

Real files: the ERC rooftop form, the Solar Farm form and the licensing regulation parse to clean Thai text.
Of 30 real ERC documents, 25 are classified as regulation or blank form. The other five (a garbled 2567
amendment scan, the fee regulation, the MiniCoP form, the fuel self-certification and the wind table) get a
topic label instead, but still yield no measurements.

## Not built yet — needs a decision

- **Backend worker and database.** Missions run in the browser and resume after the tab is reopened, but
  they cannot run while the app is closed. That needs a durable queue and PostgreSQL (paid services).
- **Mailer.** Approved requests open in the user's mail client (`mailto`) and are then marked as sent.
  Until then the mission waits and the log says which requests a person still has to send.
- **Upload-link endpoint.** Links are generated and scoped, but `/upload/{token}` does not accept files yet.
  Returned files are added on the request card instead.
- **Cloud connectors (P1).** Google Drive, SharePoint and email inbox are not connected. The Google Drive
  connector in this workspace also needs to be reconnected with file-read permission.
- **Model router for OCR and extraction.** The rule baseline is what the acceptance set measures. A
  benchmarked LLM extractor can be added through the Report Engine's model registry.
- **Numeric standards.** Noise, air and water limits in `rules.ts` are marked unverified, so every
  exceedance is labelled provisional until they are checked against the gazetted notifications.
