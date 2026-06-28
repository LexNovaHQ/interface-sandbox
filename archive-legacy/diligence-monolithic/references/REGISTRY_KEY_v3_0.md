# LEX NOVA THREAT REGISTRY — KEY v3.0

Single source of truth for registry vocabulary, ID schema, classification rules, authoring standards, and the final registry CSV structure. All consumers (Hunter, Spear Report, Architect, Copywriter, Scanner, Forensic Report, Client Portal) read from this.

**Final registry:** 98 rows. 11 archetypes. 10 subcats. 19 columns. See §14 for full distribution.

> **v3.0 schema spine — LOCKED.** ID schema, archetype/surface/lane vocabularies, authority columns, and the 19-column layout are final. `Pain_Depth` values, `Authority` fills, and `Hunter_Trigger` strings are being populated in batches; distribution tables in §14 marked *(provisional)* until that work completes.

---

## 1. THREAT_ID SCHEMA

**Format:** `{ARCHETYPE}_{SUBCAT}_{VARIANT}`
**Regex:** `^(UNI|DOE|JDG|CMP|CRT|RDR|ORC|TRN|SHD|OPT|MOV)_(CNS|LIA|HAL|INF|PRV|BIO|DEC|HRM|FRD|TRD)_(\d{3}|IN\d|LB\d)$`

The legacy `I01`–`I10` numeric scope is retired. Scope is now a self-documenting 3-char archetype mnemonic (§5). All consumer code reads the mnemonic form.

### 1.1 ARCHETYPE (scope, 3 chars)

`UNI` (universal) or one of the 10 archetype mnemonics in §5. Answers: *which product archetype does this threat attach to?*

### 1.2 SUBCAT (harm mechanism, closed vocabulary — 10 codes)

Subcat answers one question: **what category of legal harm does this threat create?** Not *who enforces it*, not *what industry*, not *which jurisdiction*. Industry/context lives in `Surface` (§6). Jurisdiction lives in the `Authority_*` columns (§7).

| Code | Harm Mechanism |
|---|---|
| `CNS` | Consent & contract formation (browsewrap, dark patterns, cancellation, auto-renewal) |
| `LIA` | Liability caps, warranty disclaimers, product-vs-service classification, agent/credential misuse, runaway-agent financial commitment, wasted costs, negligence defense |
| `HAL` | Hallucination, defamation, false output, agent impersonation, bot accountability for fabricated promises |
| `INF` | IP infringement — copyright, training data, fair use collapse, RAG substitution, safe harbor loss, deepfake takedown, watermarking, internal IP contamination |
| `PRV` | Privacy & data protection — cross-border transfer, sub-processor liability, retention, breach notification, over-scope processing, CPRA service provider, DPDP duties |
| `BIO` | Biometric harvesting & consent (BIPA, CUBI, voiceprints, diarization) |
| `DEC` | Automated decision-making harms — bias, CRA classification, HR/healthcare decisions, high-risk AI, DPIA/FRIA failure, missing HITL, GDPR Art. 22 |
| `HRM` | Direct user harm — minors, companions, healthcare impersonation, wrongful death, psychological manipulation |
| `FRD` | Fraud & misrepresentation — AI washing, evidence fabrication, vendor-risk flow-down, SEC enforcement |
| `TRD` | Trading, pricing, market manipulation — algo trading, algorithmic collusion, SEBI, Sherman Act |

> **Closed-vocabulary discipline.** A candidate threat must fit one of these 10. If it doesn't, either it is not a distinct threat or the vocabulary needs an explicit amendment vote — never a silent 11th code. (The `FIN` code that briefly appeared on `DOE_FIN_001` was folded into `LIA` per this rule; a runaway agent's financial commitment is a liability harm.)

### 1.3 VARIANT (the threat counter)

| Pattern | Meaning |
|---|---|
| `NNN` | Standard 3-digit, zero-padded counter, scoped to `{ARCHETYPE}_{SUBCAT}`. Append-only. Retired threats keep their number. |
| `INn` | India-specific threat (DPDP / IT Act / CERT-In / MeitY origin). Single digit. |
| `LBn` | Lane B / Workplace Shield threat (internal-AI-use exposure). Single digit. |

`INn` and `LBn` are preserved as meaningful provenance signal — they tell a consumer at a glance that a threat is India-jurisdiction or internal-deployment in nature without reading the row.

### 1.4 Archetype vs UNI test (assignment rule)

For a threat flagged as archetype-specific, ask: *"Is this threat caused by something ONLY this archetype does, or by something any product could do?"*

- Caused by archetype-specific behavior → keep as archetype row
- Caused by universal behavior → collapse into UNI
- If two threats differ only in downstream consequence (same cause, different severity path) → keep both only if the archetype version carries materially different Pain_Tier or harm class; otherwise collapse

When a threat appears to fit two subcats, pick the **terminal harm** (what the plaintiff ultimately recovers on), not the method. DMCA §1201 circumvention → `INF` (end harm is IP extraction), not `FRD`. Regulatory-posture threats (high-risk classification, preemption) take the subcat of the *underlying regulated activity*, not a "REG" catchall.

---

## 2. PAIN_TIER

Orthogonal to legal severity. Measures business survival impact. **Architect Master Sort primary filter.**

| Tier | Name | Definition |
|---|---|---|
| `T1` | EXTINCTION | Business cannot continue. Forced teardown, permanent regulatory ban, total liquidation, model destruction, wrongful death. |
| `T2` | UNCAPPED MONEY | Business continues but financial exposure has no ceiling. Every incident adds uncapped cost. Revenue-percentage penalty structures land here. |
| `T3` | DEAL DEATH | Money is capped but enterprise deals stop closing. Regional market access narrows. Per-violation bounded penalties. |
| `T4` | REGULATORY HEAT | Fines, enforcement action, forced operational changes. Expensive but survivable. |
| `T5` | FRICTION | Pending legislation, documentation gaps, preemption uncertainty. Annoying, not existential. |

### 2.1 Ceiling rule (highest-leverage rule)

Push `Pain_Tier` and `Velocity` to the **highest defensible level** — not the safest, not the middle, the highest. The ceiling is: *if the founder Googles the case, statute, or enforcement action, or asks a lawyer to verify, the external source must confirm our characterization.* If not, step down one level. Never more than one.

**Confirmable** = (a) the case/statute/enforcement action is real and findable on Google in under 60 seconds, AND (b) a competent lawyer asked "does X create Y exposure?" would say "yes, potentially" — not "no" and not "only in edge cases."

**Tie-break:** when between two tiers, go higher. The ceiling rule already protects against overstatement.

### 2.2 Tier assignment pattern (learned during drafting)

- **Revenue-percentage penalty structures** (GDPR 4%, EU AI Act 7%/3%) → default T2 or T1 depending on cap
- **Per-unit statutory damages × unbounded user volume** (BIPA, FCRA, AIVAA) → default T2
- **Bounded per-violation civil penalties** (Colorado AI Act $20K, NYC LL 144) → default T3
- **Per-incident criminal exposure to named officer** → default T2 Criminal minimum, T1 Criminal if doctrine is settled
- **Outright prohibition with architectural implication** (EU AI Act Art. 5) → T1
- **Wrongful death / bodily injury tort** → T1
- **Model destruction / algorithmic disgorgement** → T1
- **Pending legislation without effective date** → T5 WATCH

### 2.3 Drift-down failure mode

The dominant drafting failure mode is unconsciously downgrading tiers when enforcement "feels quieter" (older statutes, slower regulators) even when penalty math is identical. When in doubt on tier calibration, apply the penalty-structure pattern in §2.2 before applying intuition about enforcement tempo. Same penalty math = same tier.

---

## 3. PAIN_DEPTH

Whose asset base is at risk. **Not a Master Sort input.** Consumed by Architect as Cost Anchor frame-selection; consumed by Copywriter for FU3 targeting. New column in v3.0 (col 11), migrated from legacy v1 for carried rows, derived for v2-new rows.

| Depth | Definition |
|---|---|
| `Corporate` | LLC shield holds. Business loses money but founder's personal assets safe. |
| `Personal` | Shield pierces. Founder personally on the hook. Personal guarantees, agency-theory principals, direct tort exposure. |
| `Criminal` | Beyond civil. Fraud charges, perjury, criminal negligence. |

Criminal depth only when criminal liability attaches **to the vendor's own side**. If criminal exposure flows to *customers* but not the vendor, Corporate stays correct. If criminal exposure reaches the vendor's leadership, principals, or named officers (grievance/data-protection officers under India IT rules & DPDP, Nate-pattern founders under SEC+DOJ, Sherman §1 antitrust), depth becomes Criminal.

---

## 4. VELOCITY

When the founder feels the pain.

| Velocity | Definition |
|---|---|
| `ACTIVE_NOW` | Law active AND immediate consequence on first incident. |
| `THIS_YEAR` | Law active but enforcement takes 6–18 months to materialize. |
| `INCOMING` | T3–T5 threats with known effective date 2+ months out, OR T1–T2 threats more than 12 months out. |
| `WATCH` | Pending legislation/advisory with no known effective date. Pairs with `Status = Pending`. |

### 4.1 T1/T2 Promotion Rule

Any `T1` or `T2` threat with an effective date **within 12 months** of today promotes to `ACTIVE_NOW` regardless of `Status`. T1/T2 exposure inside the founder's planning horizon is felt *now*, not on the effective date.

---

## 5. ARCHETYPE VOCABULARY (replaces legacy INT codes)

The `Archetype` column (col 4) carries exactly one of these. Replaces the legacy `INT_Trigger` field. This is the categorical gate the Hunter resolves *before* evaluating threat-specific `Hunter_Trigger` conditions.

Each row separates the **Detection Logic** (the single defining behavior the Hunter tests the product against — the thing that *makes* it this archetype) from **Examples** (illustrative product types only, never the test).

| Code | Archetype | Detection Logic — *the test* | Examples — *illustration only* | Legacy |
|---|---|---|---|---|
| `UNI` | Universal | No archetype gate — applies to every product regardless of behavior. | — | UNIVERSAL |
| `DOE` | The Doer | Product **takes autonomous actions in the world** on a user's behalf without per-action human approval. | bookings, transactions, sends, tool/API calls | INT.01 |
| `JDG` | The Judge | Product **outputs a consequential decision or score about a human** that gates access to something. | hiring, credit, healthcare, insurance, admissions | INT.02 |
| `CMP` | The Companion | Product **forms an ongoing emotional or relational bond** with the user as a primary function. | chatbots, therapy bots, AI companions, minors-facing chat | INT.03 |
| `CRT` | The Creator | Product **generates new copyrightable or synthetic output** as its primary output. | text, image, audio, video, code, voice clones | INT.04 |
| `RDR` | The Reader | Product **ingests third-party data it does not own** to function. | web scraping, RAG, training-corpus assembly, document Q&A | INT.05 |
| `ORC` | The Orchestrator | Product **routes requests across multiple models or sub-processors** dynamically. | multi-LLM routers, model gateways, agent frameworks | INT.06 |
| `TRN` | The Translator | Product **processes biometric or audio signals** as input. | voice, speech-to-text, diarization, face/voiceprint | INT.07 |
| `SHD` | The Shield | Product **is deployed to defend or monitor a system** for security purposes. | threat detection, SOC automation, incident response | INT.08 |
| `OPT` | The Optimizer | Product **runs high-stakes optimization where its output directly moves money or controls operations.** | trading, dynamic pricing, critical-infrastructure tuning | INT.09 |
| `MOV` | The Mover | Product **governs a physical system that can act on or in the physical world.** | robotics, autonomous vehicles, drones, spatial computing | INT.10 |

---

## 6. SURFACE VOCABULARY (replaces legacy EXT context codes)

The `Surface` column (col 5) carries one or more atomic tokens, pipe-combined (` | `) when several apply. Surface answers: *what kind of data, audience, or operational context does the product touch?* — the context dimension of the legacy `EXT_Trigger`. **Jurisdiction is NOT a Surface token; it lives in `Authority_*` (§7).**

| Token | Meaning |
|---|---|
| `Consumer-Public` | Product is consumer-facing / publicly accessible. |
| `Enterprise-Private` | Product sold B2B / behind enterprise contracts. |
| `PII` | Handles personally identifiable information. |
| `Employment` | Touches hiring, HR, or workforce decisions. |
| `Sensitive/Biometric` | Processes biometric or special-category data. |
| `Financial` | Touches financial markets, payments, or money movement. |
| `Content&IP` | Generates, ingests, or stores copyrightable content. |
| `Safety&Physical` | Can cause physical harm or governs physical systems. |
| `Infrastructure` | Operates critical or backbone infrastructure. |
| `Minors` | Accessible to or directed at users under 18. |

Example combinations from the live registry: `Consumer-Public | Safety&Physical`, `PII | Enterprise-Private | Content&IP`, `Sensitive/Biometric | Employment`.

---

## 7. AUTHORITY COLUMNS (replaces single Legal_Ammo column)

Legal anchor split across three jurisdiction columns: `Authority_IN` (col 6), `Authority_EU` (col 7), `Authority_US` (col 8). Each holds the named case, statute, regulation, or enforcement action that grounds the threat **in that jurisdiction**.

### 7.1 Fill rule — 100% surety or blank

A jurisdiction cell is filled **only** when the authority is:
1. **Real** — the case/statute/regulation/enforcement action verifiably exists.
2. **Findable** — confirmable from a primary or authoritative secondary source.
3. **On-point** — it actually grounds *this* threat's harm in *that* jurisdiction, not a loose thematic match.

If any of the three fails, the cell stays `—`. No speculative parallels. A pure-US FTC matter legitimately has blank IN and EU cells; that is correct, not incomplete.

### 7.2 Format

Named anchor with locator: case name + court + year, or statute/regulation + section + year. Examples: `Specht v. Netscape Communications Corp. (2d Cir. 2002)`, `DPDP Act 2023 §9`, `EU AI Act (Reg. 2024/1689) Art. 50`. Prose, single most-authoritative anchor per cell (mirror the Hunter §12 single-source rule — strongest instrument wins, no `/`-joined lists).

### 7.3 Relationship to Pain_Tier

Authority grounds the tier. The §2.1 ceiling rule's "confirmable" test is satisfied *by* the Authority cell — if a tier claims T1/T2, at least one Authority column must carry an anchor a lawyer would confirm supports that exposure.

---

## 8. LANE

The `Lane` column (col 3) routes a threat to the correct product line.

| Value | Meaning |
|---|---|
| `A` | Agentic Shield — exposure for external AI **product builders** (the thing they ship). |
| `B` | Workplace Shield — exposure from **internal AI use** inside an organization. |
| `Both` | Applies to both lanes. |

---

## 9. LEX_NOVA_FIX TONE RULE

### 9.1 The hybrid rule

Every Lex_Nova_Fix line must:
1. **Lead with the asset reference** — `DOC_XXX §X.X —`
2. **Name the asset, not the action** — "§2.2 module" / "clause set" / "playbook." Not "rewrite" / "flow that does X" / "framework that addresses Y."
3. **Ground in the legal anchor by name** — case, statute, or regulation *named*. "Vernor-proof," "against Soteria," "sized for the FTC rule," "§43A-aligned."
4. **Close with a founder-language consequence** — what the asset does for the business, not what it contains. "Keeps the product a service when the defect case lands." "Stops AI promises from binding the company."
5. **Imply pre-existence** — "pre-built," "pre-drafted," "ready to drop in," "off-the-shelf," "review-ready."

### 9.2 Forbidden vocabulary

"Architecture," "framework," "structure" as abstract nouns; "compliance," "defense," "exposure," "mitigation"; mechanical hints ("rewrite" / "flow that does X"); more than one prepositional phrase of mechanism hint.

### 9.3 Length

12–18 words after the DOC reference.

### 9.4 The trade-secret test

A founder reading the line should think *"this firm has the specific solution already built"* — not *"now I know exactly what to tell my own lawyer to do."* Asset-named framing preserves the credibility signal without exposing the drafting roadmap.

---

## 10. FOUNDERS_PAIN — 2-ELEMENT STRUCTURE

Live v2/v3 registry carries two Founders_Pain fields (the legacy 4-element split — Mechanism / Trigger / Impact / Stakes — was condensed to two during the v2 build; `FP_Trigger` and `FP_Stakes` are retired).

| Element | Column | Definition | Consumed by |
|---|---|---|---|
| Mechanism | `FP_Mechanism` | What fails mechanically in the product, ToS, or operation. The technical/legal hook. | Chisel component |
| Impact | `FP_Impact` | The concrete business outcome — deal killed, product pulled, customer churn, enforcement action. | Consequence component |

### 10.1 Coffee-test standard

Each element must read as a standalone sentence a founder would say to another founder across a table. Not a label + fragment, not lawyer register, not registry-ese.

- **Mechanism** — allows slight legal precision (it IS the legal hook).
- **Impact** — hard coffee test; must be observable, external, business-measurable.

**Rewrite checklist:** nominalizations → verbs ("reclassification" → "reclassifies it"); legal qualifiers → founder phrasing ("with no fault required" → "even if you did everything right, you still pay"); lawyer vocabulary → founder vocabulary ("negligence defense" → "'we were careful' defense"); long welded clauses → beats.

### 10.2 Banned vocabulary (both elements)

"Liability," "damages," "compliance," "exposure," "tort," "architecture," "framework," "mitigation," "remediation." Translate to founder language.

---

## 11. CSV STRUCTURE — 19 COLUMNS (FINAL)

Column order is stable. Hunter, Scanner, Architect, Copywriter all read from this structure.

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | `Threat_ID` | string | Primary key, regex-validated (§1) |
| 2 | `Threat_Name` | string | Founder-facing name, prose |
| 3 | `Lane` | enum | A / B / Both (§8) |
| 4 | `Archetype` | enum | UNI or one mnemonic (§5) — single value, not array |
| 5 | `Surface` | string | Pipe-combined atomic tokens (§6) |
| 6 | `Authority_IN` | string | Named anchor or `—` (§7) |
| 7 | `Authority_EU` | string | Named anchor or `—` (§7) |
| 8 | `Authority_US` | string | Named anchor or `—` (§7) |
| 9 | `Velocity` | enum | ACTIVE_NOW / THIS_YEAR / INCOMING / WATCH |
| 10 | `Pain_Tier` | enum | T1 / T2 / T3 / T4 / T5 |
| 11 | `Pain_Depth` | enum | Corporate / Personal / Criminal (§3) |
| 12 | `Status` | enum | Active / Upcoming / Pending |
| 13 | `Effective_Date` | date | YYYY-MM-DD or "TBD" |
| 14 | `Legal_Pain` | prose | Lawyer register |
| 15 | `FP_Mechanism` | prose | Coffee-test, founder register |
| 16 | `FP_Impact` | prose | Coffee-test, founder register |
| 17 | `Lex_Nova_Fix` | prose | Hybrid rule per §9 |
| 18 | `Hunter_Trigger` | pipe-delimited string | Detection logic (§12) |
| 19 | `Provenance` | string | Source/version trace (e.g. `v1:UNI_CNS_001`, `v2-new IN-01 · verified 2026-06`) |

### 11.1 Input vs Output fields

**Input fields** (Hunter reads to detect; must be structured): `Threat_ID`, `Archetype`, `Surface`, `Authority_IN/EU/US`, `Status`, `Effective_Date`, `Hunter_Trigger`.

**Output fields** (downstream consumers read; Hunter passes through verbatim): prose for creative agents — `Threat_Name`, `Legal_Pain`, `FP_Mechanism`, `FP_Impact`, `Lex_Nova_Fix`; structured enums for deterministic systems — `Velocity`, `Pain_Tier`, `Pain_Depth`, `Lane`.

---

## 12. HUNTER_TRIGGER FORMAT

Detection logic lives in a single pipe-delimited string inside one CSV cell (col 18). Format is fixed:

```
CONDITION_1: [detection criterion] | CONDITION_2: [detection criterion] | ... | TRIGGER_IF: [boolean combination] | EXCLUDE_IF: [exclusion criterion]
```

### 12.1 Required sections

Every `Hunter_Trigger` must contain:
- At least one `CONDITION_N:` (typically 2–3, sometimes 4)
- Exactly one `TRIGGER_IF:` stating the boolean combination
- Exactly one `EXCLUDE_IF:` naming the posture that excludes the threat

### 12.2 Relationship to Archetype + Surface (v3.0 rule)

`Archetype` and `Surface` are resolved **first**, as categorical gates. The `Hunter_Trigger` must NOT re-encode the archetype or jurisdiction — those are already columns. The trigger's job is the **threat-specific atomic test**: given that the prospect is the right archetype on the right surface, *what concrete, observable signals must be true for THIS threat to actually fire?* Conditions are the atomic facts that must hold; `TRIGGER_IF` combines them; `EXCLUDE_IF` names the posture that disarms the threat.

### 12.3 Writing rules

1. **Conditions must be LLM-parseable** — concrete detection criteria, not legal judgment calls. "ToS uses 'sale', 'purchase', or 'own'" ✓. "ToS language is ambiguous about ownership" ✗.
2. **Conditions reference observable signals** — things Hunter can see from scraping the prospect's public surface (ToS/PP/DPA/AUP text, product features, pricing, named functions, jurisdiction signals).
3. **TRIGGER_IF uses boolean combinators** — `AND`, `OR`, `AND (any sub-condition in CONDITION_N = TRUE)` for lists.
4. **EXCLUDE_IF names the excluding posture, not "unless Hunter determines"** — concrete exclusion criteria, not deferrals.
5. **Enumerated categories get expanded** — when a statute references "legal or similarly significant effects," Hunter needs the category list (credit scoring, hiring, insurance, housing, etc.), not the statutory abstraction.

### 12.4 Evidence source rule

One source per fired gap — the single most authoritative source that satisfies the trigger. Never combine sources with "/" or "and." Legal document (ToS/PP/DPA) outranks product/marketing page for the same fact.

---

## 13. DRAFTING STANDARDS

### 13.1 Labeled-block drafting format

During drafting (before CSV consolidation), use labeled-block format (`=== {Threat_ID} ===` then `Field | value` lines). Human-readable during review; mechanical conversion to CSV at consolidation. Never draft directly into CSV.

### 13.2 Batch-by-batch drafting, not registry-wide

Draft by archetype/subcat batch, not all-at-once. Voice and trigger calibration are batch-bound. Full-registry drafting produces tone and logic drift; batch drafting catches it.

### 13.3 Split vs merge criteria

Split a threat into multiple rows when: different Hunter triggers, same doctrine; or different Pain_Tier (but verify archetype test §1.4 first). Merge when: same harm, same trigger, same fix — only severity varies by scope; or archetype version is pure consequence-intensification of the UNI version without an archetype-specific cause.

### 13.4 Cross-batch tier consistency

Same penalty structure → same tier (§2.2). When two rows have identical penalty math, intuition about "enforcement tempo" is the drift signal — ignore it, apply the pattern.

### 13.5 Lex_Nova_Fix rewrites last

Lex_Nova_Fix lines are the most tone-sensitive field. Draft them last in the consolidation pass, after tier/depth are locked.

---

## 14. FINAL REGISTRY DISTRIBUTION *(provisional — locks after Authority + Pain_Depth + Hunter_Trigger fill)*

### 14.1 Rows per archetype

| Archetype | Rows |
|---|---|
| UNI | 37 |
| JDG | 16 |
| DOE | 7 |
| CMP | 7 |
| CRT | 6 |
| RDR | 6 |
| SHD | 5 |
| OPT | 4 |
| ORC | 4 |
| TRN | 4 |
| MOV | 2 |
| **TOTAL** | **98** |

### 14.2 Rows per subcat (FIN folded to LIA)

| Subcat | Rows |
|---|---|
| LIA | 18 |
| DEC | 15 |
| PRV | 15 |
| INF | 14 |
| CNS | 9 |
| HRM | 9 |
| HAL | 6 |
| BIO | 4 |
| FRD | 4 |
| TRD | 4 |
| **TOTAL** | **98** |

### 14.3 Tier distribution

| Tier | Count | % |
|---|---|---|
| T1 | 18 | 18% |
| T2 | 49 | 50% |
| T3 | 24 | 24% |
| T4 | 2 | 2% |
| T5 | 5 | 5% |

### 14.4 Lane distribution

| Lane | Count |
|---|---|
| A | 80 |
| Both | 10 |
| B | 8 |

### 14.5 Pending fill metrics (to be completed)

- **Authority fill:** IN 33/98, EU 37/98, US 77/98 at v3.0 lock. Target: every gap attempted, filled only at 100% surety (§7.1).
- **Pain_Depth:** column added, values pending (migrate 75 carried rows from v1, derive 23 v2-new rows).
- **Hunter_Trigger:** column added, all 98 strings pending (§12).

---

## 15. MIGRATION & PROVENANCE

Per-row lineage lives in the `Provenance` column (col 19), not a separate migration map.

- `v1:{OLD_ID}` — row carried from legacy v1 registry (75 rows).
- `v2-new {tag} · verified {date}` — row introduced in the v2 build (23 rows): 9 India-specific (`IN`), 8 Lane B (`LB`), 6 Doer/agentic (`DOER`).

Legacy `I01`–`I10` IDs and the legacy suffix codes (ROG, AGT, DIS, SUB, SLA, PHY, etc.) are fully retired. No legacy ID survives in the live registry.

---

## 16. VERSION HISTORY

- **v1.0** — Initial schema, 14-column structure, single-element Founders_Pain.
- **v1.1** — Founders_Pain 4-element structure + Stakes fill rule.
- **v2.0** — 17-column structure, FP split to 4, `I01`–`I10` scope, INT/EXT trigger columns, single `Legal_Ammo`. (Key only — registry build diverged past this.)
- **v3.0** — Reconciled to the live 98-row registry. **Schema spine locked:** archetype-mnemonic scope (UNI + 10) replacing `I01`–`I10`; `Archetype` + `Surface` columns replacing `INT_Trigger` + `EXT_Trigger`; three-jurisdiction `Authority_IN/EU/US` replacing single `Legal_Ammo`; `_INn`/`_LBn` ID variants blessed; `Lane` column documented; `FIN` subcat folded into `LIA`; Founders_Pain condensed to 2 elements (FP_Trigger/FP_Stakes retired); `Pain_Depth` (col 11) and `Hunter_Trigger` (col 18) re-introduced. Distribution tables provisional pending fill.
