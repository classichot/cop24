# 01 · Concept and positioning

## The decision

COP24 is built **separately from ESG24**, and ESG24 is architected to **run on top of the COP24
Compliance Engine**.

```
COP24  = horizontal Compliance ERP / infrastructure
  ↓
ESG24  = specialist ESG application
TP24   = Transfer Pricing application
GMT24  = Pillar Two application
TRADE24= Trade / FTA compliance application
ACC24  = Accounting / tax compliance application
…and future compliance products
```

**Why.** Scope. ESG compliance is one compliance domain. COP24 can eventually cover corporate,
tax, labour, privacy/PDPA, environmental, licensing, governance, industry-specific,
cybersecurity, trade, financial reporting, ESG and internal-policy compliance. Putting COP24
inside ESG24 would make ESG24 enormous while making COP24's positioning unnecessarily narrow.

**But** the COP24 experience is included *inside* ESG24. An ESG24 customer never feels they need
another product: they see ESG-specific versions of the shared capabilities.

## Product strategy

> **COP24 = Compliance ERP**
> **ESG24 = ESG Compliance & Sustainability OS, powered by COP24**

- Do **not** delay ESG24 waiting for COP24.
- Build the reusable compliance components already being developed for ESG24 as **COP24 Core v1**
  (this repository), while ESG24 remains the first major vertical implementation.
- Later, expose COP24 itself as a standalone product.

Result: COP24 becomes the **common compliance layer of the entire 24 ecosystem**, not another
isolated 24 app — and the 24 series stops rebuilding the same compliance machinery per product.

## The ten shared capabilities

Every 24 app gets these from COP24, skinned for its domain:

| # | Capability | What it means for the customer |
| --- | --- | --- |
| 1 | Compliance Universe | every law that binds, by domain and entity, on one map |
| 2 | Applicability Engine | *which* rules bind *which* entity, with reasons and assumptions |
| 3 | Obligation Register | one row per duty, with owner, frequency, evidence, status |
| 4 | Evidence Pipeline | exists · valid · proves — files are not compliance |
| 5 | Compliance Calendar | every deadline on one timeline |
| 6 | Control Testing | obligations are met because a control runs, and the test proves it |
| 7 | Gap & Remediation | derived gaps with owner, due, remediation; closed only by people |
| 8 | Regulatory Change Monitor | a notice becomes affected obligations, chapters, entities |
| 9 | Audit Trail | who / what / which engine / which rulepack version |
| 10 | Execution Engine | missions, agents, the release gate |

## What COP24 is not

COP24 prepares and checks before filing. It does not file with regulators on the customer's
behalf, does not fabricate measurements, does not certify laboratory results, and does not
approve its own output — humans do, and the Audit Trail records it.
