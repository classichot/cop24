This standard defines a shared report generation engine for the 24 series, including ESG24, TP24, GMT24, CFO24, ACC24, MAR24, COP24 and other applications. Its purpose is to produce clear, professional reports whose facts, calculations, analysis and references can be checked against their sources.

**Draft v1.0 — 10 October 2026.** Audience: product owners, developers, designers, domain reviewers and QA. MUST means a release requirement; SHOULD means a preferred design. Thresholds below are proposed product acceptance targets, not measured performance or promises of error-free AI.

## 1 Core product requirement

Build one reusable report engine with application-specific report packs. Each pack defines the recipient, required content, approved data mappings, calculation methods, language, terminology, validation rules and output layout. Packs MUST inherit the shared controls and MUST NOT weaken factual integrity, traceability or approval requirements.

The engine MUST explain the evidence and its significance in natural professional language. It MUST NOT invent missing information, manufacture explanations, mix unrelated data into the report or treat fluent writing as proof of correctness.

Provide two equivalent paths: **One Click Draft**, which prepares a complete draft and identifies gaps, and **Report Studio**, which allows drafting, reviewing and editing section by section. Both paths use identical data, evidence, review and finalization controls. One click does not imply automatic approval or submission.

## 2 Human writing quality target

The business ambition “above 98% human-written-like” MUST be implemented as a **Human Editorial Quality score above 98 out of 100**, assessed against an agreed human review rubric. The score measures writing quality; it is not a probability that a human wrote the text.

Use five dimensions scored from 0 to 100: natural professional language (25%); clarity of data explanations (25%); logical flow and coherence (20%); specificity and concision (15%); and audience, tone and terminology fit (15%). The final score is the weighted mean. The rubric MUST define anchored examples, scoring increments and unacceptable defects before evaluation.

During product acceptance, two qualified reviewers independently score a held-out benchmark without seeing which writer or system produced it. Resolve disagreements through an editor and retain both original scores. Evaluate Thai and English, each application pack, tables and long reports separately. Report sample sizes, score distributions and failures; do not present a small test as proof of a population-wide 98% success rate.

For individual final reports, an authorized editor MUST confirm the target is met. Automated editorial scores are provisional assistance and MUST be labelled as such. Until the rubric is calibrated, show “editorial review pending” instead of a precise human-quality percentage.

Reports MUST use natural sentence structure, explain unfamiliar terms, connect paragraphs logically and remove generic praise, repetitive summaries, unsupported certainty and empty filler. Preserve required regulatory wording and approved quotations. Do not introduce mistakes or conceal AI involvement to imitate a human.

OpenAI withdrew its 2023 AI text classifier because of low accuracy. This supports using direct editorial assessment rather than making an AI detector score the acceptance gate. [OpenAI source](https://openai.com/index/new-ai-classifier-for-indicating-ai-written-text/)

## 3 Report brief and requirement mapping

Before drafting, create a versioned Report Brief containing: report purpose and type; intended audience or authority; applicable jurisdiction and report-pack version; entity and consolidation boundary; reporting period and data cut-off; language; currency and units; required sections and disclosures; materiality rules; acceptable sources; permitted estimates; template and citation style; and named preparers, reviewers and approvers.

Provide defaults and plain-language choices so the user does not need to understand the underlying schema. Missing essential scope information MUST be resolved before it can support factual drafting.

Build a requirement matrix linking each applicable requirement to its report section, required evidence, validation result and reviewer. A requirement may be marked not applicable only with a recorded rationale and authorized review. An omission permitted by a reporting framework requires the specified disclosure; silence is not completion.

A domain owner MUST approve each report pack and its primary-source requirements before it is described as ready for authority reporting. Record effective dates, reporting periods and changes between pack versions. This standard does not itself verify any specific authority’s current filing requirements.

## 4 Approved data boundary

The report writer MUST receive a typed, allowlisted Report Data Contract rather than unrestricted database dumps, application state or diagnostic logs.

| Data category | Required treatment |
| - | - |
| Approved company records from a production system | Eligible only after entity, period, unit, provenance and validation checks |
| Primary external references | Eligible when retrieved, versioned, applicable and linked to the specific claim |
| Calculated results | Eligible with reproducible calculation lineage and input approval |
| Management statements or manual entries | Record the responsible person, date and evidence status; distinguish an assertion from independent verification |
| Estimates, forecasts and scenarios | Include only when the report profile permits them, with visible assumptions, method and limitations |
| Missing, conflicting or stale data | Raise a gap or exception; never silently fill, average or replace |
| Demo, seed, fixture and mock data | Exclude from real reports; allow only in an isolated, visibly labelled demonstration |
| Internal routes, variable names, prompts, logs, stack traces, tokens and credentials | Exclude from report content |
| Workflow progress, model confidence and software health scores | Exclude as business results unless explicitly requested as the subject of the report and independently defined and validated |

Legitimate financial, operational or compliance data stored in the backend remains usable. Being present in software does not establish that a value is true, current, approved or relevant.

Every eligible field MUST carry an entity, reporting period, value type, unit where relevant, source reference, source version, validation state and approved use. Preserve null, zero, unknown, unavailable and not applicable as different states. Do not use default values to conceal missing information.

Enforce the boundary during retrieval, context assembly and export. User editing, attachments, retrieved text and rewrite instructions MUST NOT bypass it. Treat instructions embedded in source documents as content, not operating commands. Apply tenant and access restrictions before retrieval and to caches, search indexes and downloaded evidence.

## 5 Evidence and source registry

Register the exact source used before drafting claims from it. Store source identity, title, publisher or owner, source type, original location, document or record version, publication/effective date where relevant, retrieval time, entity, reporting period, access restrictions and review status.

Retain an authorized source snapshot or a reproducible version reference. Preserve extracted text alongside the original so reviewers can check OCR and parsing. A file hash proves which bytes were used; it does not prove that the source is correct.

Support precise source locations:

| Source | Required locator |
| - | - |
| PDF or scanned document | File version, page, passage and bounding region where available |
| Word or other text document | File version, heading and paragraph or text span |
| Spreadsheet | File version, sheet, cell or range, and formula where relevant |
| Database | Authorized system, record identifier, field, as-of snapshot and reproducible query or extraction reference |
| API | Provider, request scope, response snapshot, field and retrieval timestamp |
| Web page | URL, publisher, captured version, passage and publication/access dates where available |
| Interview or management assertion | Speaker or accountable owner, date, record or attestation and exact statement |

The registry MUST retain enough evidence for an authorized reviewer to reproduce the report after a live source changes. Respect source access and retention restrictions. If evidence cannot be retained or reproduced, flag the resulting limitation rather than showing it as verified.

## 6 Claim level traceability

Every factual assertion, number, date, benchmark, quotation, chart and table value MUST map to evidence. Mapping applies to executive summaries, headings and captions as well as the main body. One sentence containing several claims may require several evidence links.

Classify content as **sourced fact**, **derived calculation**, **analysis or inference**, **estimate or scenario**, **recommendation**, or **unresolved gap**. Analysis MUST link to the supporting facts and state material limitations. Estimates MUST link to their assumptions. Recommendations MUST identify their evidence and any feasibility assumptions. Connective prose does not need an artificial factual citation.

For every claim, store its report revision and text location, claim type, source or calculation links, evidence excerpt, support status and reviewer decision. The citation validator MUST check that a source exists, is the right version and supports the exact claim with the stated entity, period, unit, scope and degree of certainty. A plausible title or working URL is insufficient.

Do not fabricate references, page numbers, quotations, standards or source IDs. A generated report is not independent evidence for the claims copied into a later report; preserve the original source chain.

Provide **Click to Source** from a sentence, table cell or chart point to the supporting passage or calculation. Show unresolved links and conflicting sources clearly. Permissions MUST still apply: clicking a citation cannot grant access to restricted evidence.

Public exports use readable citations and an appropriately redacted source register. Keep internal record keys, private paths and diagnostics in the controlled audit package. If the intended recipient requires evidence they cannot access, resolve permitted disclosure before release.

## 7 Numerical integrity

Use versioned deterministic calculation functions or reviewed formulas for totals, ratios, percentages, conversions, tax calculations, emissions calculations and financial metrics. The language model may explain approved results, but MUST NOT be the authoritative calculation engine.

Each derived value MUST record its formula or method version, approved input versions, units, conversions, aggregation boundary, rounding policy, result and any assumptions. Keep the unrounded canonical value and derive display values consistently.

Check totals, subtotals, denominators, percentage changes, negative values, missing periods, duplicate records, boundary changes, currencies, scale differences, unit conversions and zero denominators. Set numerical tolerances by method and report pack; do not use an arbitrary universal tolerance.

Narrative, tables, charts and summary metrics MUST be bound to the same canonical metric objects. If a source value changes, identify every dependent number, sentence, chart and conclusion that requires review.

For an illustrative test fixture only: revenue moves from THB 100 million to THB 120 million. The report may state a THB 20 million increase and 20% growth. It may not say the increase was caused by marketing unless separate evidence supports that explanation.

## 8 Explanation and analytical depth

For each material finding, the report MUST explain what the evidence shows, the relevant comparison or requirement, why it matters and the practical implication. Include a recommendation where the report purpose calls for one.

Support causal explanations with appropriate evidence. Distinguish measured drivers, management explanations and untested hypotheses. Do not turn a correlation into a cause or a plan into an achieved result.

Material recommendations SHOULD include proposed action, responsible role, timing, dependencies, resources and a success measure. Unprovided costs, savings, owners or deadlines MUST remain proposals or open items; do not present them as agreed company facts.

Check that conclusions are proportionate to the evidence and that adverse findings, contradictory evidence and limitations are not omitted merely to make the report read better. Executive summaries MUST remain consistent with the detailed analysis.

Use charts only where they clarify evidence. Display units, periods, boundaries and sources, and explain the main finding in text. Avoid decorative precision, misleading scales and comparisons of incompatible datasets.

## 9 Shared generation architecture

### Model capability and selection

The system MUST select the best-performing qualified LLM and generation configuration for the specific report, prioritizing factual integrity, analytical depth and professional writing quality. “Smart enough” means demonstrated performance on representative report tasks. Model brand, size, price, advertised intelligence or a general leaderboard score alone MUST NOT establish suitability.

The default drafting model MUST be the highest-quality validated option available within the organization’s approved data-processing and deployment constraints. Cost and speed are secondary selection factors among options with equivalent demonstrated quality. Do not route demanding report drafting to a cheaper model merely to reduce token cost.

### Required model evaluation

Maintain a versioned Approved Report Model Registry. Compare leading eligible models using the same approved evidence, report brief, report pack, tools and comparable generation settings. Use held-out report cases and qualified human assessment; repeat representative cases to assess reliability rather than selecting a model from one impressive output.

Evaluate each candidate for:

- Correct use of evidence, faithful citations, uncertainty handling and recognition of missing or conflicting data.

- Multi-step reasoning, domain understanding, analytical depth and conclusions proportionate to the evidence.

- Natural professional Thai and English, accurate technical terminology and compliance with the Human Editorial Quality target.

- Long-document coherence, effective use of lengthy evidence, cross-section consistency and completeness.

- Reliable instruction following, structured output, tool use and preservation of approved facts during rewriting.

Assess the complete report pipeline as well as model output. A strong model does not replace source validation, deterministic calculations or human approval. All existing factual and release gates remain mandatory. Passing a model benchmark does not automatically approve an individual report.

Record the benchmark dataset and version, evaluation date, model version, settings, reviewer scores, failure cases, ranking method and selection rationale. Define ranking criteria before evaluation. Where score differences are too uncertain to establish a winner, use domain-editor adjudication and document the decision; do not claim an objectively best model without supporting evidence.

### Task routing and generation configuration

Select models and settings by application, report type, language, subject complexity, evidence volume and output length. A model approved for short English summaries is not automatically approved for a long Thai authority report.

Provide approved configurations for drafting, complex analysis, editorial rewriting and evidence review. Supporting tasks may use lower-cost models only after task-specific validation. Where the preferred drafting model is also used for review, use a separate review pass with the source evidence; model agreement is not proof of correctness.

Allocate enough context, output capacity and reasoning resources for the task. For lengthy reports, use an approved section-by-section process followed by full-report consistency review. Never silently truncate evidence or required sections to fit a model limit. If capacity is insufficient, restructure the job or escalate to an approved capable configuration.

Keep calculations in the deterministic calculation layer. Access to a calculator or retrieval tool MUST NOT be described as evidence that an otherwise unsuitable drafting model meets the writing or analytical standard.

### Model changes and fallback policy

Pin model versions where supported and record the actual provider, model/version identifier, generation settings, prompt-template version, routing decision and review configuration for every report revision. When a provider cannot guarantee a fixed version, record that limitation and monitor for regression.

Reassess the approved registry at least quarterly and whenever a new candidate, model retirement, provider change or quality regression could materially affect the preferred choice. Newly released models MUST pass evaluation before production use; “newest” is not automatic approval. Keep the routing configuration replaceable without changing report data or evidence contracts.

If the preferred model is unavailable, use only a fallback qualified for that report category and the same quality gates. Record and display the substitution in the report workspace. If no qualified fallback exists, pause or queue the job and explain the reason. Do not silently downgrade model quality or relax review requirements. If the required configuration exceeds the approved budget, follow the existing budget policy without substituting an unqualified model.

### Model selection acceptance checks

Before enabling a report category, developers MUST demonstrate a documented candidate comparison, an approved model/configuration, representative Thai/English and long-report results where applicable, and successful factual and editorial checks. Simulate model unavailability and confirm that only a qualified fallback runs. Verify that insufficient context is detected, every report records its actual configuration, and a failed model regression prevents its use for the affected category.

### Shared components

Implement the following components as a common service or reusable library. A particular AI provider or agent framework is not required.

| Component | Responsibility |
| - | - |
| Report Brief and Pack Registry | Scope, template, requirements and versioned validation rules |
| Source Registry and Evidence Store | Authorized source snapshots, locators and retention |
| Data Validation and Calculation Layer | Approved structured facts and reproducible metrics |
| Claim Ledger | Claim classification and evidence relationships |
| Drafting and Editorial Layer | Outline, section writing, coherent analysis and language |
| Review and Rewrite Layer | Findings, suggested edits, comparison and correction |
| Release and Export Layer | Approval, final rendering, immutable versions and audit package |

Before drafting a section, assemble a bounded evidence packet containing its approved facts, required disclosures, glossary, relevant passages and unresolved gaps. The writer MUST reference only registered evidence for factual assertions. If additional evidence is needed, request it through the controlled ingestion workflow.

Validate the draft’s claims, citations, numbers and requirement coverage; conduct a separate editorial review; apply permitted corrections; and run cross-report consistency checks. Automated semantic reviewers assist with support checks but cannot establish certainty by agreeing with one another.

Keep sources and calculations independent of prompts and model output. Log the model and prompt-template versions used, without exposing prompts or credentials in the business report. Generation and validation jobs MUST be resumable and must not mix outputs from different report snapshots.

Reuse the same engine across all 24 apps. Domain-specific packs add content and checks; tenant-specific styles may change wording and appearance but cannot remove the shared controls.

## 10 Review and rewrite workspace

Provide one workspace with the report, source evidence and prioritized review findings available together. Each finding MUST identify the affected passage, requirement, issue category, severity, evidence, suggested remedy, owner and status.

Required review categories are factual support; source reliability and freshness; numerical consistency; requirement coverage; analytical reasoning; editorial quality; translation consistency; confidentiality; and export presentation.

Required actions:

- **Review full report** or **Review this section**.

- **Explain this issue** and **Open supporting source**.

- **Rewrite for clarity**, **Improve analysis**, **Shorten**, **Expand explanation**, and **Adjust tone for this reader**.

- **Check against selected requirements** and **Request missing evidence**.

- **Compare versions**, **Accept change**, **Reject change**, and **Restore prior version**.

- **Lock approved wording**, **Lock approved facts**, and **Reopen for correction**.

Every rewrite MUST follow a Rewrite Contract: target section, desired outcome, applicable requirements, allowed sources, approved facts, locked wording, length/tone constraints and acceptance checks.

Show before-and-after text and a meaningful change summary. Flag changes to values, dates, entities, units, qualifications, obligations, causal claims, conclusions and recommendations. Exact-text checks alone are insufficient: changing “may” to “will” can materially change meaning.

Rewrites MUST preserve evidence relationships and may not introduce facts from model memory. New factual content requires new evidence and review. Run the same factual, numerical, citation and requirement checks after both AI rewrites and manual edits.

Offer batch acceptance only for validated low-risk language changes. Substantive changes require explicit reviewer acceptance. Repeated automatic revisions MUST stop at a configured limit and return unresolved issues; reaching that limit cannot lower the quality threshold.

If a requested requirement cannot be met with the available evidence, create a visible gap and describe the needed input. Never optimize a score by deleting a mandatory disclosure or weakening an adverse finding.

## 11 Quality gates and report status

Maintain separate statuses for data readiness, evidence coverage, requirement completeness, editorial review, approval and submission. “Generated,” “ready for review,” “approved,” and “submitted” are different states.

| Release gate | Required condition |
| - | - |
| Data boundary | No unauthorized, test, diagnostic or cross-entity data in the report |
| Evidence | Every factual claim has valid support; every estimate, inference and recommendation has appropriate lineage and labelling |
| Numbers | All numerical assertions reconcile to approved inputs or calculations within defined tolerances |
| References | No fabricated, unresolved or mismatched citations |
| Requirements | Every applicable requirement is fulfilled, or an expressly permitted omission is disclosed and approved |
| Writing | Human Editorial Quality above 98/100 under the agreed rubric |
| Review findings | Zero unresolved critical or major issues; minor issues meet the editorial target |
| Approval | Required reviewers approve this exact report and evidence snapshot |
| Export | Rendered output passes layout, content and citation checks |

Coverage MUST be computed from a complete claim and requirement inventory, not just items the model happens to cite. Show numerators, denominators, exclusions and unresolved items. Reviewers MUST be able to correct the inventory.

A high average quality score MUST NOT override a failed factual, confidentiality or mandatory-disclosure gate. Unknown validation results fail closed. These are acceptance rules for detected and reviewed defects, not a guarantee that automated checks can discover every possible error.

Allow incomplete draft previews and draft exports with a visible DRAFT marking and unresolved-issues notice. Block final export and authority submission until the gates pass. Product administrators cannot silently override a failure and retain “approved” status.

## 12 Approval and change control

Require a named human approver for final business reports, with specialist review determined by the report pack. Authority, financial, tax and legal reports MUST follow their configured qualified-review requirements.

Bind approval to the report revision, source snapshot, calculation versions, report-pack version and exact export artifact. Any later manual or AI edit invalidates final approval. A source correction marks dependent content stale and requires renewed validation and approval.

Record preparer, reviewer, approver, timestamps, comments, accepted/rejected changes, exceptions, generation versions and release history. A locked section cannot be silently overwritten by regeneration.

When correcting an issued report, create a new version with the correction reason and a link to the superseded version. Preserve the originally released artifact. Respect authorized retention and deletion rules; where evidence is no longer retained, disclose that traceability is unavailable rather than implying it remains reproducible.

## 13 Thai and English support

Each report pack MUST specify permitted output languages and the default for its audience. Apply an approved bilingual glossary for technical terms, entities, standards and defined terms.

Both language versions MUST use the same facts, calculations, reporting boundaries and evidence snapshot. Review translation for meaning, omissions, certainty and obligations; matching numbers alone is insufficient.

Check Thai and English dates, Buddhist Era and Common Era conversion where used, units, currencies, footnotes, Thai fonts, word wrapping, table widths and page breaks. Do not force English phrasing into unnatural Thai or replace mandatory wording solely to improve the style score.

Require qualified language review for final bilingual reports and separate evaluation of the two language variants. A changed translation is a new report revision requiring the relevant checks.

## 14 Export and audit package

Support editable DOCX and final PDF as the common baseline, with report-pack-specific spreadsheet or structured authority outputs where required. Export from the same validated report model so formats do not contain different facts.

The release package MUST contain the readable report, source register, reproducible calculation workpapers where applicable, requirement matrix, review findings and dispositions, approval record, and a manifest connecting these to the report revision. Distribute only the evidence the intended recipient is authorized to receive.

Validate the rendered artifact for missing or clipped text, tables, charts, page numbers, contents links, citations, appendices and Thai fonts. Reconcile extracted export text and values with the approved report model. Keep internal diagnostic details out of the reader-facing document.

Render a candidate final artifact inside the restricted review workspace before approval; enable its final release only after approval. Bind approval to those exact bytes. Check the exact artifact the approver will release, not only the text editor view. Export failures MUST preserve the draft and MUST NOT produce a final success status. Re-importing an edited DOCX creates a new revision and reruns validation.

## 15 Minimum implementation records

| Record | Minimum information |
| - | - |
| ReportProfile | Application, report type, entity/boundary, period, audience, language, pack version, requirements, approval policy |
| SourceRecord | Source/version, locator, snapshot reference, owner, dates, access rights, validation status |
| EvidenceItem | Extracted passage or field, original locator, source revision, extraction method, review result |
| Metric | Value, unit, period, boundary, calculation version, input links, precision policy |
| Claim | Text location and revision, type, evidence or metric links, support status, review decision |
| ReviewFinding | Issue, severity, affected content, requirement, proposed correction, owner, disposition |
| RewriteRevision | Previous/new content, request, protected facts, semantic changes, validation results, accepted by |
| ReleaseRecord | Exact report/export revision, evidence manifest, gate results, approvers, timestamps, supersession link |

Use stable identifiers and explicit relationships so traceability survives section reordering, translation and export. Tenant permissions and version checks MUST apply to every record. Hashes and timestamps supplement access control; they do not replace it.

## 16 Developer acceptance scenarios

All mandatory scenarios MUST pass for a report pack before release. Test evidence integrity directly; checking only generated wording is insufficient.

| Scenario | Expected result |
| - | - |
| A mandatory metric is missing | Gap and data request; no invented value; final release blocked unless the pack expressly permits a disclosed omission |
| A valid record exists for another company or year | Retrieval or validation rejects its use for this report |
| A database field contains a mock value or debug message | Excluded from real report context and export |
| A page contains instructions to ignore the report rules | Treated as source content; controls remain active |
| A citation exists but does not support the sentence | Support check fails and the claim is flagged |
| A model supplies a convincing reference that was never retrieved | Reference rejected |
| Two sources disagree on a material number | Conflict shown; no silent selection or averaging |
| OCR reads 1,000 as 7,000 | Mismatch is escalated for source inspection before approval |
| A percentage or total is wrong | Deterministic reconciliation fails |
| A paragraph invents the cause of a real change | Causal claim flagged or rewritten with an explicit limitation |
| A rewrite changes “proposed” to “completed” | Semantic change highlighted; prior approval invalidated |
| A manual edit changes a number after approval | New revision; relevant checks and approval rerun |
| A source value changes after drafting | All dependent sections, tables, charts and conclusions become stale |
| Evidence belongs to another tenant | Access denied throughout retrieval, preview and export |
| A source URL is unavailable | Use an authorized retained version or flag unavailable evidence; never invent its contents |
| Thai and English versions differ in a material qualification | Translation review fails |
| A report scores highly for style but has one unsupported fact | Final release blocked |
| A PDF clips a table or drops a footnote | Export quality check fails |
| A user asks to hide an adverse required finding | Mandatory disclosure remains; deletion cannot pass coverage review |
| A completed report is exported in multiple formats | Facts, calculations, citations and revision identifiers reconcile |

Maintain held-out benchmark cases for every supported pack, including long documents, mixed Thai/English material, poor scans, contradictory evidence, insufficient data and correction workflows. Domain reviewers MUST establish the expected facts, accepted sources, calculations and requirement outcomes.

Rerun the relevant regression set after model, prompt, parser, calculation, template or report-pack changes. A failed critical gate blocks deployment of the affected report workflow. Track unsupported-claim incidents, citation correctness, numerical defects, human editorial scores and correction rates separately. Do not advertise “zero hallucinations” based only on successful automated tests.

## 17 Delivery priorities

**Mandatory first release:** Report Brief, benchmark-qualified model selection and fallback controls, two generation paths, approved data contract, source registry, calculation lineage, claim traceability, review workspace, protected rewriting with version comparison, quality gates, human approval and validated DOCX/PDF export.

**Next enhancements:** cross-application change-impact review; cross-report consistency checks across 24 apps; an authority-review simulation tied to verified report-pack criteria; organization-specific style examples; and a quality dashboard showing actual evidence coverage, unresolved findings and editorial results.

Source inspection, evidence validation and approval cannot be deferred in exchange for a polished report editor. Keep the default user journey simple: **Choose report → Add or connect data → Generate draft → Resolve review items → Approve and export.** Provide advanced controls only where the user needs them.

## 18 Reference basis

The numerical targets and implementation requirements in this draft are proposed internal standards for the 24 series.

NIST’s Generative AI Profile identifies risks from confidently incorrect content, invented logic and fabricated citations. It provides a risk-management basis for evidence controls and review, but it does not certify this architecture or prescribe the 98/100 target. [NIST AI 600-1, section 2.2](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

OpenAI’s historical classifier notice describes its withdrawal and limitations, supporting the decision not to use a detector result as proof of human authorship or report quality. [OpenAI classifier notice](https://openai.com/index/new-ai-classifier-for-indicating-ai-written-text/)

