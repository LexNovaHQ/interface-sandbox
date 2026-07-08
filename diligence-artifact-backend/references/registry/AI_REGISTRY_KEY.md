# AI_REGISTRY_KEY · v4.0

Supersedes REGISTRY_KEY v3.2. This document is no longer a passive reference. It is a derivation specification. Every classifiable dimension carries a counsel-facing Normalized Name and a Derivation Trigger in CONDITION_N -> TRIGGER_IF -> EXCLUDE_IF grammar so a model or reviewer can derive a row classification rather than merely look it up.

IMPLEMENTATION STATUS: This key defines the target v4.0 taxonomy. The live registry on disk remains AI_THREAT_REGISTRY_v3_2 / AI_THREAT_REGISTRY.yaml until the v4 registry build closes. The three new archetypes CUR, MOD, ORA; Lane re-tag/split; Anti_Discrimination framework token; and Lane B expansion batch are pending build against this specification. This forward-spec gap is intentional and must not be treated as silent drift.

---

## 1. IDENTIFIERS — UID vs THREAT_ID

| Field | Normalized Name | Role | Mutable? |
|---|---|---|---|
| UID | Permanent Record ID | Stable opaque primary key, e.g. LN-0001. Assigned once, never reused or reordered. Cite this in every delivered artifact. | Never |
| Threat_ID | Classification Handle | Semantic ARCHETYPE_SUBCAT_VARIANT handle. Human-readable and sortable; changes on reclassification. | Yes |

Rule: reclassification changes Threat_ID only. UID is untouched. Retired rows keep their UID forever.

---

## 2. HOW TO USE THIS KEY — DERIVATION ORDER

Resolve dimensions in this order:

1. Archetype — what the AI does.
2. Lane — whose operational role creates the exposure.
3. Surface — what data, audience, or context it touches.
4. Subcat — the terminal legal harm mechanism.
5. Authority and Compliance_Framework — the named legal anchor and regime.
6. Pain_Tier -> Pain_Category -> Pain_Depth.
7. Status + Effective_Date -> Velocity.
8. Threat_Trigger — row-specific detection logic on the public surface.

Archetype, Lane, Surface, and Framework are resolved first as categorical gates. Threat_Trigger must not re-encode them.

---

## 3. FIELD DICTIONARY — 22 COLUMNS

| # | Field | Normalized Name | Meaning |
|---|---|---|---|
| 1 | UID | Permanent Record ID | Stable key |
| 2 | Threat_ID | Classification Handle | Semantic handle |
| 3 | Threat_Name | Risk Title | Plain-language name of the exposure |
| 4 | Lane | Exposure Role | Provider / Deployer / Both |
| 5 | Archetype | AI Function Class | What the system does |
| 6 | Surface | Data & Audience Context | Data types, audience, operational context |
| 7 | Authority_IN | India Legal Basis | Named IN statute/case/action or dash |
| 8 | Authority_EU | EU/UK Legal Basis | Named EU/UK instrument or dash |
| 9 | Authority_US | US Legal Basis | Named US statute/case/action or dash |
| 10 | Compliance_Framework | Regulatory Regime | Normalized regime tokens |
| 11 | Velocity | Enforcement Timing | When the exposure bites |
| 12 | Pain_Tier | Severity Class internal | T1-T5 |
| 13 | Pain_Category | Severity client-facing | Derived label of Pain_Tier |
| 14 | Pain_Depth | Who Bears the Liability | Corporate / Personal / Criminal |
| 15 | Status | Legal Status | Active / Upcoming / Pending |
| 16 | Effective_Date | Effective Date | YYYY-MM-DD / TBD / Ongoing |
| 17 | Legal_Pain | Legal Basis detailed | Lawyer-register exposure |
| 18 | FP_Mechanism | Failure Mode | What breaks in founder language |
| 19 | FP_Impact | Business Consequence | Observable business outcome |
| 20 | Lex_Nova_Fix | Remediation Asset | Pre-built asset that resolves it |
| 21 | Threat_Trigger | Detection Logic | Public-surface detection rule |
| 22 | Provenance | Source & Version Trace | Lineage |

---

## 4. ARCHETYPE — AI FUNCTION CLASS

Archetype classifies what the AI does, not its industry and not who runs it. Resolve archetype first. If no functional gate fires, use UNI.

| Code | Normalized Name | Derivation Trigger | Primary Legal Surface |
|---|---|---|---|
| UNI | Cross-Cutting any AI system | TRIGGER_IF exposure arises from something any AI product could do, with no function unique to one archetype. EXCLUDE_IF a specific functional gate fires. | Cross-cutting |
| DOE | Autonomous-Action / Agentic System | C1 executes actions affecting the outside world. C2 at least some actions occur without per-action human approval. TRIGGER_IF C1 AND C2. EXCLUDE_IF only produces output for a human to act on. | Agency, authority, UETA, contract formation |
| JDG | Automated Decision System, person-affecting access-gating | C1 outputs a decision, score, or classification about an identifiable person. C2 output materially gates access to employment, credit, housing, insurance, healthcare, education, benefits, or similar entitlement. TRIGGER_IF C1 AND C2. EXCLUDE_IF subject is non-person -> ORA, or ranks/curates content -> CUR. | GDPR Art. 22, EU AI Act Annex III, CCPA ADMT, anti-discrimination |
| CMP | Relational / Companion System | C1 forms ongoing personalized emotional or relational interaction as a primary function. TRIGGER_IF C1. EXCLUDE_IF transactional or task-scoped with no relational bond. | Minors safety, companion harm |
| CRT | Generative / Synthetic-Output System | C1 generates new text, image, audio, video, code, or voice as primary output. TRIGGER_IF C1. EXCLUDE_IF only classifies, ranks, or retrieves existing content. | Copyright, synthetic-media disclosure |
| RDR | Data-Ingestion / Training-Corpus System | C1 ingests third-party data it does not own or license to function, including scraping, RAG, corpus assembly, or fine-tuning. TRIGGER_IF C1. EXCLUDE_IF only processes operator/user supplied data. | Copyright, TDM, scraping, privacy |
| ORC | Model-Routing / Multi-Provider System | C1 dynamically routes requests across multiple models, providers, or sub-processors. TRIGGER_IF C1. EXCLUDE_IF single fixed model with no downstream routing. | Sub-processor and transfer-chain liability |
| TRN | Biometric / Signal-Processing System | C1 processes biometric identifiers or human voice/face signals as input. TRIGGER_IF C1. EXCLUDE_IF no biometric or human-signal input. | BIPA, CUBI, voiceprint consent |
| SHD | Security / Monitoring System | C1 defends, detects threats in, or monitors another system/environment. TRIGGER_IF C1. EXCLUDE_IF content-policy adjudication -> MOD. | Security duty, monitoring limits |
| OPT | High-Stakes Optimization System | C1 optimization output directly moves operator money or controls operations, such as trading, dynamic pricing, infrastructure tuning. TRIGGER_IF C1. EXCLUDE_IF decides what a person is shown -> CUR or gates person access -> JDG. | Market manipulation, pricing, antitrust |
| MOV | Cyber-Physical / Embodied System | C1 governs a physical machine that acts in the physical world. TRIGGER_IF C1. EXCLUDE_IF purely digital output. | Product liability, bodily injury |
| CUR | Recommendation / Ranking / Amplification System | C1 ranks, recommends, personalizes, or amplifies content/products/information shown to a person. C2 selection is driven by relevance, engagement, or targeting. TRIGGER_IF C1 AND C2. EXCLUDE_IF gates access to an entitlement -> JDG or adjudicates whether content is permitted -> MOD. | DSA systemic risk, minors, ad discrimination |
| MOD | Content-Moderation / Adjudication System | C1 decides whether user content is permitted, removed, flagged, restricted, or approved against policy/legal standard. TRIGGER_IF C1. EXCLUDE_IF ranks/amplifies already-permitted content -> CUR or defends infrastructure -> SHD. | DSA notice/action, intermediary safe harbour |
| ORA | Predictive / Forecasting System, non-person subject | C1 outputs a prediction/forecast others rely on. C2 subject is a non-person system or aggregate, such as demand, risk pool, equipment, weather, market. TRIGGER_IF C1 AND C2. EXCLUDE_IF prediction concerns an identifiable person's access/eligibility -> JDG. | Negligent misstatement, warranties, forecasting failure |

Archetype-vs-UNI test: Is this caused by something only this function does, or by something any AI could do? Function-unique stays in that archetype. Universal risk becomes UNI. If two gates fire, assign the archetype whose terminal harm the plaintiff recovers on and note the secondary in Provenance.

---

## 5. SUBCAT — TERMINAL HARM MECHANISM

Closed vocabulary:

| Code | Normalized Name | Derivation Trigger |
|---|---|---|
| CNS | Consent & Contract-Formation Defect | Harm arises from how user did or did not enter an enforceable agreement. |
| LIA | Liability, Warranty & Authority Allocation | Harm arises from misallocated liability/warranty, product-vs-service classification, or agent authority/runaway commitment. |
| HAL | False-Output & Defamation Exposure | Harm arises from false, fabricated, defamatory output or unaccountable bot promise. |
| INF | Intellectual-Property Infringement | Harm arises from IP/copyright infringement in training data or output, safe-harbour loss, IP contamination or ownership. |
| PRV | Data-Protection & Privacy | Harm arises from unlawful processing, transfer, retention, breach, or over-scope personal-data handling. |
| BIO | Biometric Data & Consent | Harm arises from biometric capture/use without lawful consent. |
| DEC | Automated-Decision & Bias Harm | Harm arises from consequential automated decision about a person. |
| HRM | Direct User & Safety Harm | Harm arises from direct user injury, minors, health, psychological, physical, or prohibited synthetic content. |
| FRD | Fraud & Misrepresentation | Harm arises from deceptive AI claims, fabricated evidence, or misrepresentation to markets/investors/regulators. |
| TRD | Market, Pricing & Trading Harm | Harm arises from trading, pricing, or market-manipulation conduct. |

Tie-break: pick terminal harm, not method. Regulatory-posture threats take the subcat of the underlying regulated activity.

---

## 6. LANE — EXPOSURE ROLE

Lane answers whose operational role creates the exposure. It is resolved by the entity relationship to the AI and is independent of archetype.

| Code | Normalized Name | Derivation Trigger |
|---|---|---|
| A | AI Provider / Product Exposure | C1 entity develops, sells, licenses, or makes an AI system available to external users/customers. C2 threat arises from product as shipped, terms, or outputs to third parties. TRIGGER_IF C1 AND C2. EXCLUDE_IF exposure exists only through internal use or employer role -> B. |
| B | Deployer / Employer Exposure | C1 entity operates or deploys AI internally, or uses AI to make/inform decisions about its own workers, operations, or governance. C2 threat arises from internal deployment or employer role, not product sold to others. TRIGGER_IF C1 AND C2. EXCLUDE_IF exposure exists only through external product shipped -> A. |
| Both | Provider & Deployer Exposure | TRIGGER_IF identical threat, same authority, same fix, same detection trigger fires under both A and B. EXCLUDE_IF facets differ in authority, fix, or trigger by role -> split. |

Resolution rule: apply A and B independently. A only -> Lane A. B only -> Lane B. Both with identical authority/fix/trigger -> one row Both. Both but authority/fix/trigger differ -> split into two rows, each with its own UID.

Worked contrast: AI hiring tool can be Lane A for product-defect/warranty-disclaimer failure in what is shipped and Lane B for bias-audit/employer discrimination exposure on use. Generative model can be Lane A for provider disclosure duties and Lane B for employee AI-use IP contamination. Recommender can be Lane A as platform provider and Lane B when run on own workforce/customers.

---

## 7. SURFACE — DATA & AUDIENCE CONTEXT

Surface is one or more atomic tokens, pipe-combined. Jurisdiction and regime are not Surface tokens.

| Token | Normalized Name | Derivation Trigger |
|---|---|---|
| Consumer-Public | Consumer / Public-Facing | Product offered to general public. |
| Enterprise-Private | Enterprise / B2B | Product sold to businesses under negotiated terms. |
| PII | Personal Data | Processes data identifying a person. |
| Employment | Employment / Workforce | Touches hiring, management, or worker data. |
| Sensitive/Biometric | Sensitive / Biometric Data | Processes special-category or biometric data. |
| Financial | Financial Data / Money Movement | Handles payments, credit, or financial data. |
| Content&IP | Content & Intellectual Property | Ingests or generates copyrightable/creative content. |
| Safety&Physical | Safety-Critical / Physical | Output can cause physical harm. |
| Infrastructure | Infrastructure / Systems | Governs or secures IT/operational infrastructure. |
| Minors | Children / Minors | Accessible to or targeting under-18 users. |

---

## 8. COMPLIANCE_FRAMEWORK — REGULATORY REGIME

Emit a token when its named instrument appears in an Authority cell or Legal_Pain.

Tokens: EU_AI_Act, GDPR, DPDP, CCPA/CPRA, IT_Act, BIPA, Anti_Discrimination, Copyright, FCRA, FTC_Act, SEC, Colorado_AI_Act, Minors_COPPA_AADC, HIPAA, Consumer_Protection_IN, SOC2_ISO, Contract_Tort.

SOC2_ISO is posture, not a threat source. SOC 2 is an AICPA attestation/control posture and enterprise-sales assurance gate, not a source of legal liability.

---

## 9. PAIN_TIER AND PAIN_CATEGORY

Pain_Tier is internal severity. Pain_Category is derived and client-facing.

| Tier | Pain_Category | Derivation Trigger |
|---|---|---|
| T1 | Existential | Forced teardown, permanent ban, model destruction/disgorgement, wrongful death, or outright prohibition with architectural implication. |
| T2 | Uncapped Money | No financial ceiling: revenue percentage penalties or per-unit statutory damages times unbounded volume. |
| T3 | Deal Death | Money capped but enterprise deals stall or regional market access narrows. |
| T4 | Regulatory Heat | Fines, enforcement action, forced operational change; survivable but expensive. |
| T5 | Friction | Pending legislation, documentation gap, or preemption uncertainty. |

Ceiling rule: push tier and velocity to highest defensible level. If external source cannot confirm, step down exactly one level.

---

## 10. PAIN_DEPTH

| Value | Normalized Name | Trigger |
|---|---|---|
| Corporate | Entity-Level | Exposure lands on entity; limited-liability shield holds. Default. |
| Personal | Principal-Level | Personal guarantees, agency-theory principals, or direct tort exposure reaches individual assets. |
| Criminal | Individual Criminal Exposure | Criminal liability attaches to vendor leadership/principals, not merely customers. |

---

## 11. VELOCITY

Derived from Status, Effective_Date, and Pain_Tier.

ACTIVE_NOW when law is in force and first-incident consequence is immediate, or promotion rule fires. THIS_YEAR when in force but exposure typically materializes over 6-18 months. INCOMING when enacted future effective date applies. WATCH when proposed and not yet law. Any T1/T2 with effective date within 12 months promotes to ACTIVE_NOW.

---

## 12. STATUS

Active = currently enforceable. Upcoming = enacted but not yet effective. Pending = proposed or consultation/no law. Effective_Date vocabulary: YYYY-MM-DD, TBD, Ongoing.

---

## 13. AUTHORITY COLUMNS

Fill only when the authority is real, findable, and on-point. Otherwise use dash. Format as a single most-authoritative instrument with locator. Authority grounds tier; T1/T2 needs at least one lawyer-confirmable anchor.

---

## 14. THREAT_TRIGGER FORMAT

CONDITION_1: criterion | CONDITION_2: criterion | TRIGGER_IF: boolean | EXCLUDE_IF: exclusion

At least one CONDITION_N. Exactly one TRIGGER_IF. Exactly one EXCLUDE_IF. Archetype, Surface, Lane, and Framework are resolved first and must not be re-encoded in the trigger. Conditions must be LLM-parseable concrete criteria.

---

## 15. LEX_NOVA_FIX AND FOUNDERS_PAIN TONE

Lex_Nova_Fix leads with DOC_XXX §X.X, names the asset, grounds in legal anchor, and closes with founder consequence. It should imply the asset is pre-built.

FP_Mechanism and FP_Impact are standalone founder-language sentences. Banned terms include liability, damages, compliance, exposure, tort, architecture, framework, mitigation, remediation.

---

## 16. CSV STRUCTURE

UID · Threat_ID · Threat_Name · Lane · Archetype · Surface · Authority_IN · Authority_EU · Authority_US · Compliance_Framework · Velocity · Pain_Tier · Pain_Category · Pain_Depth · Status · Effective_Date · Legal_Pain · FP_Mechanism · FP_Impact · Lex_Nova_Fix · Threat_Trigger · Provenance

Input dimensions: Threat_ID, Archetype, Lane, Surface, Authority_*, Compliance_Framework, Status, Effective_Date, Threat_Trigger.

Output dimensions: prose plus severity, depth, and velocity fields. Delivered artifacts cite UID, never Threat_ID.

---

## 17. DISTRIBUTION

Distribution will be recomputed at the close of the v4.0 build. Until then authoritative live counts remain the v3.2 live registry counts. Do not treat any distribution table as current until v4.0 build closes.

---

## 18. VERSION HISTORY AND BUILD QUEUE

v4.0 changes:

1. Reframed key as derivation specification with counsel-facing normalized names and derivation triggers.
2. Archetypes expanded 11 -> 14: CUR, MOD, ORA.
3. Lane promoted to derivable dimension with A/B/Both and un-bundling resolution rule.
4. Added Anti_Discrimination framework token.

Pending build:

1. Lane B expansion batch.
2. A -> Both re-tag / split pass.
3. Archetype re-classification sweep into CUR/MOD/ORA.
4. Recompute distribution and re-baseline CSV to v4.0.
