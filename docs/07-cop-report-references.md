# 07 · CoP report references

Two documents are kept as drafting references, not as legal sources. The files are stored
locally in `corpus/reference/` (git-ignored) and indexed in the legal corpus.

## 1. Official ERC form — Solar Rooftop, Version 1.0/2567 (13 pages)

`erc-cop-checklist-solar-rooftop` — <https://www.erc.or.th/web-upload/200xf869baf82be74c18cc110e974eea8d5c/202409/m_laws/8504/2528/file_download/ba72fa752ca196585d6c278a282b2f92.pdf>

It is annexed to the ERC Regulation on CoP reports B.E. 2565 and its amendment.

| Part | Content | Annexes |
| --- | --- | --- |
| Cover, Part 1 | Operator: applicant, request type (new / expansion / technology change), project, licence no., location (own building / another's), **capacity: panels in MWp to 3 dp, inverters in kVA to 2 dp**, expansion A, B, A+B | — |
| Cover, Part 2 | CoP preparer (≥ 1 year solar or EIA experience) + evidence; certification signed by preparer, applicant and authorised signatory | — |
| Certification | Measures become **licence conditions**; non-compliance can lead to suspension or revocation. ✓/✗ consistency marks; underlined text = added measures (e.g. from the hearing); equivalent-or-better measures allowed with explanation | — |
| Part 1 Introduction | Background, objective, need, scope, study method; sales: own use (MW/kV), EGAT/MEA/PEA PPA (max MW, kV, contract no.), direct customers | 1-1, 1-2 |
| Part 2 Project | 2.1 site legality (zoning, NEQA, heritage, cabinet resolutions, industrial estate; aviation; other-law permits) · 2.2 layout + land-use table = 100% · 2.3 electrical design & safety signed by a **licensed control engineer**: panels, inverters, transformers, trackers, BESS/PCS, TIS/IEC certificates, SLD, structure, anti-glare, fire (EIT), engineer list · 2.4 damaged/end-of-life equipment (MoI notification 2566): storage, method, contingency | 2-1 … 2-17 |
| Part 3 Environment | Study radius; coordinates and boundaries in 4 directions; dated photos; structures within **300 m**; sensitive areas (communities, temples, schools, hospitals); distance table **0–100 m / 101–300 m / 301 m–1/3/5 km** (hearing radius) | 3-1, 3-2 |
| Part 4 Measures | General (comply strictly; put in contractor contracts; notify the ERC office of problems or complaints; notify changes before acting with a ≥ 3-year compliance summary) · construction · operation (glare; EOL equipment — monthly records, annual report, **notify within 30 days of export**; complaint channel) · decommissioning | 4-1 |
| Part 5 Participation | Final report only: ERC regional-office letter on the preliminary report, hearing checklist, hearing summary, evidence under the hearing regulation 2565 | 5-1 … 5-4 |

Every page carries **four signature blocks** (preparer, applicant ×2, ERC officer) and a column headed **"พิจารณาแล้ว (เจ้าหน้าที่)"** (reviewed by officer). COP24 mirrors this column as the review-findings layer.

The **Solar Farm** form (V1.0/October 2565) is the one the Lopburi 1 pack uses. It has a different layout:

1. General measures.
2. Pre-construction: site, layout, electrical design and safety, then environment (noise, water use, wastewater, waste).
3. Baseline monitoring: noise needs **≥ 2 stations and ≥ 5 consecutive days covering workdays and holidays**, reporting Leq24, L90, Ldn and Lmax. Soil and methods are also covered.
4. Construction: sections 4.1–4.7.
5. Operation: sections 5.1–5.5.
6. Decommissioning: sections 6.1–6.8.

## 2. Real report — EGAT floating solar 250 kW, Sirindhorn Dam (May 2017, 127 pages)

`example-egat-minicop-srt-floating-250kw` — <https://www.egat.co.th/home/wp-content/uploads/2021/08/MiniCoP-6005_SRT-floatingsolar-250kW.pdf>

Prepared by ERM-Siam for EGAT under the **2557 notification for licence-exempt PV**. That regime predates the 2565 regulation, so the report is a writing model and not a template for current structure.

**Structure.**

1. Project description: objective, need for the CoP, nature and capacity, components, schedule table.
2. Baseline within a 1 km radius: flora, wildlife and landscape.
3. Measures: design (pre-construction) and waste (construction, operation, decommissioning).
4. Annexes: layout, wind data, TIS/IEC equipment standards, PCF/PR calculation, structural design.

**Patterns COP24 adopts in the Report Factory.**

- **Each study topic follows a fixed sequence.** It runs scope → method → analysis criteria → results with field-survey dates → impact prediction. Legal status checks are named explicitly, for example protected-tree categories and IUCN or Red Data status.
- **Each measure is a requirement → compliance pair with a number and an annex.** For example, "PCF ≥ 15%" is answered with "designed 16.83% (Annex 4)". "PR > 75%" is answered with "77.26%", and "wind ≥ 30 m/s" with "designed for 35 m/s (Annex 5)".
- **Standards are cited by number**, for example TIS 1843-2553, TIS 2580, IEC 60502, IEC 60947-2, IEC 61643-1, IEC 60364-7-712 and IEC 61727/62116.
- **Visual impact uses before/after photomontages** from named viewpoints, with distances stated.
- **The project schedule is a table**, and end-of-life equipment handling is a stated plan with a licensed disposer.

These patterns line up with standard §8: what the evidence shows, the comparison or requirement, why it matters, and the implication.
