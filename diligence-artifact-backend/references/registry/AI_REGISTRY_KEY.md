# AI_REGISTRY_KEY  ·  v4.0

**Supersedes `REGISTRY_KEY v3.2`.** This document is no longer a passive reference — it is a **derivation specification**. Every classifiable dimension carries (a) a **Normalized Name** written for external counsel (a corporate/TMT partner should understand it cold, with no Lex Nova vocabulary), and (b) a **Derivation Trigger** in the `CONDITION_N → TRIGGER_IF → EXCLUDE_IF` grammar, so a model or reviewer can *derive* a row's classification rather than look it up. The `EXCLUDE_IF` clauses carry the boundary logic that keeps neighbouring categories disjoint.

> **IMPLEMENTATION STATUS (read first).** This key defines the **target v4.0 taxonomy**. The live registry on disk is `AI_THREAT_REGISTRY_v3_2.csv` — **11 archetypes, 100 rows**. The three new archetypes (`CUR`, `MOD`, `ORA`), the Lane re-tag/split, the `Anti_Discrimination` framework token, and the Lane B expansion batch are **pending build against this spec** (§18). This forward-spec gap is intentional and tracked — it is not silent drift.

---

## 1. IDENTIFIERS — UID vs THREAT_ID

| Field | Col | Normalized Name | Role | Mutable? |
|---|---|---|---|---|
| `UID` | 1 | Permanent Record ID | Stable opaque primary key (`LN-0001`…). Assigned once, never reused or reordered. Cite this in every delivered artifact. | Never |
| `Threat_ID` | 2 | Classification Handle | Semantic `{ARCHETYPE}_{SUBCAT}_{VARIANT}`. Human-readable and sortable; **changes on reclassification** (e.g. `DOE_FIN_001`→`DOE_LIA_001`). | Yes |

**Rule:** reclassification changes `Threat_ID` only; `UID` is untouched. Retired rows keep their `UID` forever.

---

## 2. HOW TO USE THIS KEY (DERIVATION ORDER)

To classify a candidate threat or scope a prospect, resolve dimensions in this order — each later step may read the output of an earlier one:

1. **Archetype** (§4) — what the AI *does* (function). Categorical gate.
2. **Lane** (§6) — whose operational role creates the exposure (provider vs deployer). Independent of archetype.
3. **Surface** (§7) — what data/audience/context it touches.
4. **Subcat** (§5) — the terminal legal harm mechanism.
5. **Authority** (§13) + **Compliance_Framework** (§8) — the named legal anchor and its regime.
6. **Pain_Tier** (§9) → **Pain_Category** (derived label) → **Pain_Depth** (§10).
7. **Status** (§12) + **Effective_Date** → **Velocity** (§11, derived).
8. **Threat_Trigger** (§14) — the row-specific detection logic on the public surface.

Archetype, Lane, Surface, and Framework are resolved **first** as categorical gates; the row's `Threat_Trigger` must NOT re-encode them.

---

## 3. FIELD DICTIONARY (22 COLUMNS)

| # | Field | Normalized Name (counsel-facing) | Meaning |
|---|---|---|---|
| 1 | `UID` | Permanent Record ID | Stable key (§1) |
| 2 | `Threat_ID` | Classification Handle | Semantic handle (§1) |
| 3 | `Threat_Name` | Risk Title | Plain-language name of the exposure |
| 4 | `Lane` | Exposure Role | Provider / Deployer / Both (§6) |
| 5 | `Archetype` | AI Function Class | What the system does (§4) |
| 6 | `Surface` | Data & Audience Context | Data types, audience, operational context (§7) |
| 7 | `Authority_IN` | India Legal Basis | Named IN statute/case/action or `—` |
| 8 | `Authority_EU` | EU/UK Legal Basis | Named EU/UK instrument or `—` |
| 9 | `Authority_US` | US Legal Basis | Named US statute/case/action or `—` |
| 10 | `Compliance_Framework` | Regulatory Regime | Normalized regime tokens (§8) |
| 11 | `Velocity` | Enforcement Timing | When the exposure bites (§11) |
| 12 | `Pain_Tier` | Severity Class (internal) | T1–T5 (§9) |
| 13 | `Pain_Category` | Severity (client-facing) | Derived label of Pain_Tier (§9) |
| 14 | `Pain_Depth` | Who Bears the Liability | Entity / Principal / Individual-criminal (§10) |
| 15 | `Status` | Legal Status | Enforceable / Enacted-pending / Proposed (§12) |
| 16 | `Effective_Date` | Effective Date | `YYYY-MM-DD` / `TBD` / `Ongoing` |
| 17 | `Legal_Pain` | Legal Basis (detailed) | The exposure in lawyer register |
| 18 | `FP_Mechanism` | Failure Mode | What breaks, in founder language |
| 19 | `FP_Impact` | Business Consequence | The observable business outcome |
| 20 | `Lex_Nova_Fix` | Remediation Asset | The pre-built asset that resolves it (§15) |
| 21 | `Threat_Trigger` | Detection Logic | Public-surface detection rule (§14) |
| 22 | `Provenance` | Source & Version Trace | Lineage |

---

## 4. ARCHETYPE — AI FUNCTION CLASS (14)

Classifies **what the AI does**, not its industry (industry → §7 Surface) and not who runs it (→ §6 Lane). Resolve archetype first; if no functional gate fires, the row is `UNI`.

| Code | Internal Name | Normalized Name (counsel-facing) | Derivation Trigger | Primary Legal Surface |
|---|---|---|---|---|
| `UNI` | Universal | Cross-Cutting (any AI system) | `TRIGGER_IF:` the exposure arises from something any AI product could do, with no function unique to a single archetype. Default residual. `EXCLUDE_IF:` a specific functional gate below fires. | Applies across the board |
| `DOE` | The Doer | Autonomous-Action / Agentic System | `C1:` executes actions affecting the outside world (transactions, bookings, sends, tool/API calls, system changes). `C2:` at least some actions occur without per-action human approval. `TRIGGER_IF: C1 AND C2.` `EXCLUDE_IF:` only produces output for a human to act on. | Agency & authority, UETA §14, contract formation, runaway-agent liability |
| `JDG` | The Judge | Automated Decision System (person-affecting, access-gating) | `C1:` outputs a decision/score/classification about an identifiable person. `C2:` that output materially gates access to an opportunity or entitlement (employment, credit, housing, insurance, healthcare, education, benefits). `TRIGGER_IF: C1 AND C2.` `EXCLUDE_IF:` subject is a non-person (→ `ORA`) OR it ranks/curates content for consumption rather than gating a person (→ `CUR`). | GDPR Art. 22, EU AI Act Annex III, CCPA ADMT, anti-discrimination |
| `CMP` | The Companion | Relational / Companion System | `C1:` forms an ongoing, personalized emotional or relational interaction with a user as a primary function. `TRIGGER_IF: C1.` `EXCLUDE_IF:` interaction is transactional/task-scoped with no relational bond. | Minors safety, companion-harm, duty of care, addictive design |
| `CRT` | The Creator | Generative / Synthetic-Output System | `C1:` generates new content (text, image, audio, video, code, voice) as its primary output. `TRIGGER_IF: C1.` `EXCLUDE_IF:` only classifies, ranks, or retrieves existing content without generating new content. | Copyright (training + output), synthetic-media disclosure, NCII/CSAM, work-product ownership |
| `RDR` | The Reader | Data-Ingestion / Training-Corpus System | `C1:` ingests third-party data it does not own or licence in order to function (scraping, RAG, corpus assembly, fine-tuning on external data). `TRIGGER_IF: C1.` `EXCLUDE_IF:` only processes data owned/supplied by the operator or user. | Copyright/TDM, database rights, scraping/CFAA, RAG substitution, ingested-PII privacy |
| `ORC` | The Orchestrator | Model-Routing / Multi-Provider System | `C1:` dynamically routes requests across multiple models, providers, or sub-processors. `TRIGGER_IF: C1.` `EXCLUDE_IF:` single fixed model with no downstream sub-processor routing. | Sub-processor liability, transfer chains, DPA flow-down gaps |
| `TRN` | The Translator | Biometric / Signal-Processing System | `C1:` processes biometric identifiers or human voice/face signals as input (voice, STT, diarization, face, voiceprint). `TRIGGER_IF: C1.` `EXCLUDE_IF:` no biometric or human-signal input. | BIPA/CUBI, DPDP sensitive data, voiceprint consent |
| `SHD` | The Shield | Security / Monitoring System | `C1:` its function is to defend, detect threats in, or monitor another system or environment. `TRIGGER_IF: C1.` `EXCLUDE_IF:` it adjudicates content against a policy (→ `MOD`). | Security duty of care, monitoring/surveillance limits, false-negative liability |
| `OPT` | The Optimizer | High-Stakes Optimization System (operator outcomes) | `C1:` optimization whose output directly moves the operator's money or controls its operations (trading, dynamic pricing, infra/resource tuning). `TRIGGER_IF: C1.` `EXCLUDE_IF:` it decides what a person is shown (→ `CUR`) or gates a person's access (→ `JDG`). | Market manipulation, algorithmic collusion, pricing/antitrust, SEC/SEBI |
| `MOV` | The Mover | Cyber-Physical / Embodied System | `C1:` governs a physical machine that can act in the physical world (robotics, AV, drone, spatial). `TRIGGER_IF: C1.` `EXCLUDE_IF:` purely digital output with no physical actuation. | Product liability, bodily-injury tort, wrongful death, safety regulation |
| `CUR` | The Curator *(new v4.0)* | Recommendation / Ranking / Amplification System | `C1:` ranks, recommends, personalizes, or amplifies content/products/information shown to a person. `C2:` selection is driven by relevance, engagement, or targeting. `TRIGGER_IF: C1 AND C2.` `EXCLUDE_IF:` output gates access to an entitlement (→ `JDG`) OR adjudicates whether content is permitted (→ `MOD`). | DSA systemic risk, minors/addictive design, ad-delivery discrimination, amplification liability |
| `MOD` | The Moderator *(new v4.0)* | Content-Moderation / Adjudication System | `C1:` decides whether user content is permitted — removes, flags, restricts, or approves it against a policy or legal standard. `TRIGGER_IF: C1.` `EXCLUDE_IF:` it ranks/amplifies already-permitted content (→ `CUR`) OR defends infrastructure against security threats (→ `SHD`). | DSA notice-and-action & appeals, intermediary safe harbour (IT Rules §3/§79, CDA 230), wrongful-takedown vs failure-to-remove |
| `ORA` | The Oracle *(new v4.0)* | Predictive / Forecasting System (non-person subject) | `C1:` outputs a prediction/forecast that others rely on. `C2:` **the subject is a non-person system or aggregate** — demand, risk pool, equipment, weather, market — NOT an identifiable individual's gated outcome. `TRIGGER_IF: C1 AND C2.` `EXCLUDE_IF:` the prediction concerns an identifiable person's access/eligibility (→ `JDG`). *[This is the fence: person-prediction is always `JDG`, never `ORA`.]* | Negligent misstatement/reliance, accuracy warranties, actuarial/underwriting, predictive-maintenance failure |

**Archetype-vs-UNI test:** *"Is this caused by something only this function does, or by something any AI could do?"* Function-unique → keep; universal → `UNI`. When two functional gates fire, assign the archetype whose **terminal harm** the plaintiff recovers on, and note the secondary in `Provenance`.

---

## 5. SUBCAT — TERMINAL HARM MECHANISM (10, closed)

Classifies **what category of legal harm** the threat creates (not enforcer, not industry, not jurisdiction). Closed vocabulary — a new code requires an amendment vote.

| Code | Internal Name | Normalized Name (counsel-facing) | Derivation Trigger |
|---|---|---|---|
| `CNS` | Consent | Consent & Contract-Formation Defect | `TRIGGER_IF:` harm arises from how the user did/didn't enter an enforceable agreement — browsewrap, dark pattern, defective disclosure, auto-renewal, cancellation. |
| `LIA` | Liability | Liability, Warranty & Authority Allocation | `TRIGGER_IF:` harm arises from mis-allocated liability/warranty, product-vs-service classification, or an agent exceeding authority / making a runaway commitment. |
| `HAL` | Hallucination | False-Output & Defamation Exposure | `TRIGGER_IF:` harm arises from false, fabricated, or defamatory output, or an unaccountable bot promise. |
| `INF` | Infringement | Intellectual-Property Infringement | `TRIGGER_IF:` harm arises from IP/copyright infringement in training data or output, safe-harbour loss, or IP contamination/ownership. |
| `PRV` | Privacy | Data-Protection & Privacy | `TRIGGER_IF:` harm arises from unlawful processing, transfer, retention, breach, or over-scope handling of personal data. |
| `BIO` | Biometric | Biometric Data & Consent | `TRIGGER_IF:` harm arises from capture/use of biometric identifiers without lawful consent. |
| `DEC` | Decision | Automated-Decision & Bias Harm | `TRIGGER_IF:` harm arises from a consequential automated decision about a person — bias, missing assessment/oversight, unlawful automated processing. |
| `HRM` | Harm | Direct User & Safety Harm | `TRIGGER_IF:` harm arises from direct injury to a user — minors, health, psychological, physical, or prohibited synthetic content. |
| `FRD` | Fraud | Fraud & Misrepresentation | `TRIGGER_IF:` harm arises from deceptive claims about the AI, fabricated evidence, or misrepresentation to markets/investors/regulators. |
| `TRD` | Trading | Market, Pricing & Trading Harm | `TRIGGER_IF:` harm arises from trading, pricing, or market-manipulation conduct. |

**Tie-break:** pick the terminal harm (what the plaintiff recovers on), not the method. Regulatory-posture threats take the subcat of the underlying regulated activity, not a catch-all.

---

## 6. LANE — EXPOSURE ROLE (derivable dimension)

Lane answers: **whose operational role creates the exposure?** It is resolved by the entity's relationship to the AI and is **independent of archetype** — the same `JDG` system can be Lane A for its builder and Lane B for its deployer.

| Code | Normalized Name (counsel-facing) | Derivation Trigger |
|---|---|---|
| `A` | AI Provider / Product Exposure | `C1:` the entity develops, sells, licenses, or makes an AI system available to external users or customers. `C2:` the threat arises from the product as shipped, its terms, or its outputs to third parties. `TRIGGER_IF: C1 AND C2.` `EXCLUDE_IF:` the exposure exists only through the entity's own internal use or employer role (→ `B`). |
| `B` | Deployer / Employer Exposure | `C1:` the entity operates or deploys AI internally, OR uses AI to make/inform decisions about its own workers, operations, or governance. `C2:` the threat arises from that internal deployment or employer role, not from a product sold to others. `TRIGGER_IF: C1 AND C2.` `EXCLUDE_IF:` the exposure exists only through an external product the entity ships (→ `A`). |
| `Both` | Provider & Deployer Exposure | `TRIGGER_IF:` the identical threat — same authority, same fix, same detection trigger — fires under **both** the A and B triggers. `EXCLUDE_IF:` the facets differ in authority, fix, or trigger by role (→ **split**, see resolution rule). |

### 6.1 A / B / Both resolution rule (the un-bundling discipline)

For each candidate threat, apply the A trigger and the B trigger **independently**:

- Fires **A only** → `Lane A`.
- Fires **B only** → `Lane B`.
- Fires **both, and authority + fix + trigger are identical across roles** → one row, `Lane Both`.
- Fires **both, but authority / fix / trigger differ by role** → **split into two rows** (an A-facet and a B-facet), each with its own `UID`. Do **not** collapse a genuine two-facet risk into a single `Both` row.

> `Both` means one genuinely shared row. A split means two rows for one underlying technology. This rule is what corrects the historical over-tagging of provider-only (`A`) on threats that actually carry a distinct deployer facet — the cause of the thin Lane B footprint.

### 6.2 Lane A vs Lane B — worked contrast

| Same technology | Lane A facet (builder) | Lane B facet (deployer) |
|---|---|---|
| AI hiring tool | Product-defect / warranty-disclaimer failure in what's shipped | Bias-audit mandate + employer discrimination exposure on use |
| Generative model | Output-watermarking / NCII provider duty | Employee AI-use IP contamination & work-product ownership |
| Recommender (`CUR`) | DSA systemic-risk duty as platform provider | Amplification/targeting risk when run on own workforce/customers |

---

## 7. SURFACE — DATA & AUDIENCE CONTEXT

One or more atomic tokens, pipe-combined. Jurisdiction and regime are **not** Surface tokens.

| Token | Normalized Name | Derivation Trigger |
|---|---|---|
| `Consumer-Public` | Consumer / Public-Facing | `TRIGGER_IF:` product is offered to the general public. |
| `Enterprise-Private` | Enterprise / B2B | `TRIGGER_IF:` product is sold to businesses under negotiated terms. |
| `PII` | Personal Data | `TRIGGER_IF:` processes data identifying a person. |
| `Employment` | Employment / Workforce | `TRIGGER_IF:` touches hiring, management, or worker data. |
| `Sensitive/Biometric` | Sensitive / Biometric Data | `TRIGGER_IF:` processes special-category or biometric data. |
| `Financial` | Financial Data / Money Movement | `TRIGGER_IF:` handles payments, credit, or financial data. |
| `Content&IP` | Content & Intellectual Property | `TRIGGER_IF:` ingests or generates copyrightable/creative content. |
| `Safety&Physical` | Safety-Critical / Physical | `TRIGGER_IF:` output can cause physical harm. |
| `Infrastructure` | Infrastructure / Systems | `TRIGGER_IF:` governs or secures IT/operational infrastructure. |
| `Minors` | Children / Minors | `TRIGGER_IF:` accessible to or targeting under-18 users. |

---

## 8. COMPLIANCE_FRAMEWORK — REGULATORY REGIME

The regime axis the Diligence Engine slices audits on. Multi-value, pipe-combined. **Derivation:** emit a token when its instrument appears in any `Authority_*` cell or in `Legal_Pain`.

| Token | Normalized Name (counsel-facing) | Derivation Trigger (named instrument present) |
|---|---|---|
| `EU_AI_Act` | EU Artificial Intelligence Act (Reg. 2024/1689) | AI Act / Annex III/I / Art. 5/50/14/27 / GPAI / FRIA |
| `GDPR` | EU General Data Protection Regulation | GDPR / Arts. 5, 17, 22, 32, 35, 83 |
| `DPDP` | India Digital Personal Data Protection Act 2023 | DPDP Act / DPDP Rules 2025 / SDF duties |
| `CCPA/CPRA` | California Consumer Privacy Act / CPRA | CCPA / CPRA / CPPA / ADMT |
| `IT_Act` | India Information Technology Act 2000 & Rules | IT Act §43A/§66/§70B/§72A / SPDI / IT Rules / CERT-In |
| `BIPA` | Illinois Biometric Information Privacy Act | BIPA / CUBI / state biometric statutes |
| `Anti_Discrimination` | Anti-Discrimination / Equal-Opportunity Law *(new v4.0)* | Title VII / ADA / ADEA / NYC LL144 / Illinois HB 3773 / RPwD Act 2016 / EU non-discrimination |
| `Copyright` | Copyright & Neighbouring Rights | Copyright Act / DMCA §1201 / fair use / TDM / RAGHAV / Bartz |
| `FCRA` | US Fair Credit Reporting Act | FCRA / consumer-reporting |
| `FTC_Act` | US FTC Act §5 (Unfair/Deceptive) | FTC / Section 5 |
| `SEC` | US Securities Regulation | SEC / securities / Reg S-K |
| `Colorado_AI_Act` | Colorado AI Act (SB 24-205) | Colorado / SB 24-205 |
| `Minors_COPPA_AADC` | Children's Privacy & Age-Appropriate Design | COPPA / AADC / SB 243 |
| `HIPAA` | US Health Data (HIPAA) | HIPAA |
| `Consumer_Protection_IN` | India Consumer Protection Act 2019 | CPA 2019 / dark-pattern guidelines |
| `SOC2_ISO` | SOC 2 / ISO 27001 (control posture — not a threat source) | ISO 27001 / SOC 2 (§8.1) |
| `Contract_Tort` | Common Law — Contract & Tort | tort / negligence / UCC / UETA / defamation / agency (residual) |

### 8.1 SOC 2 is posture, not threat
SOC 2 is an AICPA attestation framework and enterprise-sales assurance gate, **not** a source of legal liability. It appears only as the `SOC2_ISO` tag on rows whose statutory fix also satisfies a control; SOC 2 readiness itself is a Diligence-Engine **posture** dimension, never a `Legal_Pain` row.

---

## 9. PAIN_TIER & PAIN_CATEGORY — SEVERITY

`Pain_Tier` (internal, T1–T5) measures business-survival impact, orthogonal to legal severity. `Pain_Category` is its **client-facing label, derived on write** and never hand-edited.

| Tier | Pain_Category (client label) | Normalized Name (counsel-facing) | Derivation Trigger |
|---|---|---|---|
| `T1` | Existential | Business-Ending Exposure | `TRIGGER_IF:` forced teardown, permanent ban, model destruction/disgorgement, wrongful death, OR an outright prohibition with architectural implication. |
| `T2` | Uncapped Money | Uncapped Financial Exposure | `TRIGGER_IF:` no financial ceiling — revenue-percentage penalties (GDPR 4%, EU AI Act 7%/3%), or per-unit statutory damages × unbounded volume (BIPA, FCRA). |
| `T3` | Deal Death | Market-Access / Deal Loss | `TRIGGER_IF:` money is capped but enterprise deals stall or regional market access narrows — bounded per-violation civil penalties (Colorado AI Act, NYC LL144). |
| `T4` | Regulatory Heat | Regulatory Enforcement | `TRIGGER_IF:` fines, enforcement action, or forced operational change — expensive but survivable. |
| `T5` | Friction | Latent / Documentation Risk | `TRIGGER_IF:` pending legislation, documentation gap, or preemption uncertainty. |

**Ceiling rule:** push tier and velocity to the highest **defensible** level — if the founder Googles the anchor or asks a lawyer, the external source must confirm it. If not, step down exactly one level. Same penalty math ⇒ same tier regardless of enforcement tempo.

---

## 10. PAIN_DEPTH — WHO BEARS THE LIABILITY

| Value | Normalized Name (counsel-facing) | Derivation Trigger |
|---|---|---|
| `Corporate` | Entity-Level (limited-liability shield holds) | `TRIGGER_IF:` exposure lands on the entity; the shield holds; personal assets safe. Default. |
| `Personal` | Principal-Level (shield pierced) | `TRIGGER_IF:` personal guarantees, agency-theory principals, or direct tort exposure reach an individual's assets. |
| `Criminal` | Individual Criminal Exposure | `TRIGGER_IF:` criminal liability (fraud, perjury, criminal negligence, statutory officer duties) attaches **to the vendor's own leadership/principals** — not merely to customers. |

---

## 11. VELOCITY — ENFORCEMENT TIMING (derived)

**Derivation** from `Status`, `Effective_Date`, and `Pain_Tier`:

| Value | Normalized Name | Derivation Trigger |
|---|---|---|
| `ACTIVE_NOW` | In Force — Immediate Consequence | `TRIGGER_IF:` law is in force AND first-incident consequence is immediate; OR promotion rule fires. |
| `THIS_YEAR` | In Force — Near-Term (6–18 mo) | `TRIGGER_IF:` in force but exposure typically materializes over 6–18 months. |
| `INCOMING` | Scheduled — Future Effective Date | `TRIGGER_IF:` `Effective_Date` is 2+ months out AND tier is T3–T5; OR tier is T1–T2 and date is >12 months out. |
| `WATCH` | Proposed — Not Yet Law | `TRIGGER_IF:` `Status = Pending` / proposed legislation with no effective date. |

**Promotion rule:** any T1/T2 threat with an `Effective_Date` within 12 months of today promotes to `ACTIVE_NOW` regardless of `Status`.

---

## 12. STATUS — LEGAL STATUS

| Value | Normalized Name | Derivation Trigger |
|---|---|---|
| `Active` | Currently Enforceable | `TRIGGER_IF:` law/regulation is in force and enforceable today. |
| `Upcoming` | Enacted — Not Yet Effective | `TRIGGER_IF:` enacted with a future effective date. |
| `Pending` | Proposed / Under Consideration | `TRIGGER_IF:` proposed, in consultation, or otherwise not yet law; pairs with `Velocity = WATCH`. |

`Effective_Date` vocabulary: `YYYY-MM-DD` / `TBD` (pending/no date) / `Ongoing` (common-law doctrine with no enactment date).

---

## 13. AUTHORITY COLUMNS (IN / EU / US)

**Fill rule — 100% surety or blank.** A cell is filled only when the authority is Real, Findable, and On-point; otherwise `—`. A pure-US matter legitimately has blank IN/EU cells. **Format:** single most-authoritative instrument per cell with a locator (no `/`-joined lists); e.g. `DPDP Act 2023 §9`, `Specht v. Netscape (2d Cir. 2002)`, `EU AI Act (Reg. 2024/1689) Art. 50`. Authority grounds the tier — a T1/T2 claim needs at least one anchor a lawyer would confirm.

---

## 14. THREAT_TRIGGER FORMAT (col 21)

```
CONDITION_1: [criterion] | CONDITION_2: [criterion] | ... | TRIGGER_IF: [boolean] | EXCLUDE_IF: [exclusion]
```
≥1 `CONDITION_N`, exactly one `TRIGGER_IF`, exactly one `EXCLUDE_IF`. Archetype, Surface, Lane, and Framework are resolved first as categorical gates; the trigger must **not** re-encode them — it tests the threat-specific atomic signal on the observable public surface. Conditions must be LLM-parseable concrete criteria, not judgment calls. One authoritative evidence source per fired gap (legal doc > marketing page).

---

## 15. LEX_NOVA_FIX & FOUNDERS_PAIN TONE

**`Lex_Nova_Fix` (col 20):** lead with `DOC_XXX §X.X —`; name the asset (module/clause-set/playbook), not the action; ground in the legal anchor by name; close with a founder-language consequence; imply pre-existence ("pre-built"). 12–18 words after the DOC ref. Forbidden: "architecture/framework/compliance/exposure/mitigation" as abstract nouns; mechanical hints. Trade-secret test: founder thinks *"this firm already built the fix,"* not *"now I know what to tell my lawyer."*

**`FP_Mechanism` / `FP_Impact` (cols 18–19):** each a standalone sentence a founder would say to another founder. `FP_Mechanism` = what breaks mechanically; `FP_Impact` = the observable business outcome (deal killed, product pulled, enforcement). Banned in both: liability, damages, compliance, exposure, tort, architecture, framework, mitigation, remediation — translate to founder language.

---

## 16. CSV STRUCTURE — 22 COLUMNS

`UID` · `Threat_ID` · `Threat_Name` · `Lane` · `Archetype` · `Surface` · `Authority_IN` · `Authority_EU` · `Authority_US` · `Compliance_Framework` · `Velocity` · `Pain_Tier` · `Pain_Category` · `Pain_Depth` · `Status` · `Effective_Date` · `Legal_Pain` · `FP_Mechanism` · `FP_Impact` · `Lex_Nova_Fix` · `Threat_Trigger` · `Provenance`

Every row = exactly 22 fields. **Input** (engine reads to detect): `Threat_ID`, `Archetype`, `Lane`, `Surface`, `Authority_*`, `Compliance_Framework`, `Status`, `Effective_Date`, `Threat_Trigger`. **Output** (passed to consumers): the prose + severity/depth/velocity fields. Delivered artifacts cite `UID`, never `Threat_ID`.

---

## 17. DISTRIBUTION

Frozen from the live file will be recomputed at the close of the v4.0 build (archetype expansion + Lane re-tag/split + Lane B batch). Until then, the authoritative live counts are those of `AI_THREAT_REGISTRY_v3_2.csv` (100 rows, 11 archetypes) in `REGISTRY_KEY v3.2 §14`. **Do not treat any distribution table as current until the v4.0 build closes.**

---

## 18. VERSION HISTORY & BUILD QUEUE

**v4.0 — derivation spec + taxonomy expansion (this document):**
1. Reframed the key as a **derivation specification** — every dimension gains a counsel-facing **Normalized Name** and a **Derivation Trigger** (§3–§12); added the Field Dictionary (§3) and the derivation order (§2).
2. **Archetypes 11 → 14:** added `CUR` (Curator — recommendation/ranking/amplification), `MOD` (Moderator — content adjudication), `ORA` (Oracle — non-person forecasting, fenced against `JDG`).
3. **Lane promoted to a derivable dimension** (§6) with A/B/Both triggers and the **un-bundling resolution rule** (§6.1) that splits genuine two-facet risks instead of over-tagging `A`.
4. Added framework token **`Anti_Discrimination`** (§8) to home the employment-bias / ADA / RPwD threats.

**Pending build against this spec (in order):**
1. **Lane B expansion batch** — draft the mapped new rows (six-vector territory: people-in, people-decisions, data-movement, governance, representations, sector-overlay) in labeled blocks, tagged with correct Lane per §6.1.
2. **A → Both re-tag / split pass** — audit existing `A` rows, re-tag the true `Both` rows, split the two-facet ones (§6.1).
3. **Archetype re-classification sweep** — reassign any existing rows that now belong in `CUR` / `MOD` / `ORA`.
4. **Recompute §17 distribution** and re-baseline the CSV to v4.0.

*Carried forward from v3.x: UID/Threat_ID split (v3.2), Compliance_Framework bridge + SOC2-as-posture (v3.1), reconciliation fixes (v3.1), schema spine (v3.0).*
