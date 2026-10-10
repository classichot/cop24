# 05 · Roadmap

## v1 (this repo) — COP24 Core v1 + product surface
- Nine engines as pure TypeScript with tests.
- 12 packs across 9 domains; ESG24, TP24, GMT24, TRADE24, ACC24 represented as apps on the engine.
- 18 screens, bilingual, role- and mode-aware, every number derived from the snapshot.
- Design strictly from the prototype design file.

## v1.1 — ESG24 first vertical on COP24 Core
- Lift `src/core` and `src/packs` into `@24/cop24-core` / `@24/cop24-packs`.
- ESG24 consumes the packages; ESG24-specific UI (materiality workspace, GHG inventory, scenario analysis) sits on top.
- Replace demo `TenantData` with a persistence layer behind the same shape.

## v1.2 — Real evidence and agents
- Connectors: SharePoint, Google Drive, ERP, HRIS; OCR + extraction fills `facts` with page-level citations.
- Agents become tool-using LLM agents bound to the engines with the same guardrails; QA veto enforced server-side.
- Regulatory feeds for ERC, SEC/SET, PDPC, DLPW, Revenue Department, NCSA.

## v2 — COP24 standalone
- Multi-tenant, roles/permissions, e-signature for the certification step.
- Full packs (ERC CoP 61 obligations, 56-1 48, PDPA 31 …) with authority-maintained versioning.
- TP24 / GMT24 / TRADE24 / ACC24 go live on the same engine.
