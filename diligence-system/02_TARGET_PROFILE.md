# 02_TARGET_PROFILE.md

# THE INTERFACE — PHASE 2 TARGET / COMPANY PROFILE PROMPT

## PHASE_CALL_CARD

```yaml
phase_id: P2_TARGET_PROFILE
phase_name: Target / Company Profile
mode: prompt_live
purpose: >
  Build the canonical public-footprint target_profile object from Phase 1 admitted evidence.
  Phase 2 identifies the target, public business context, product-wrapper baseline,
  baseline visible data touchpoints, downstream assumptions, evidence support, and limitations.
primary_output_object: target_profile
required_top_level_output_keys:
  - target_profile_forensic_ledger
  - target_profile_trace
  - target_profile
phase_boundary: >
  Phase 2 is a profile and routing phase. It is not feature extraction, legal cartography,
  data provenance, exposure analysis, compliance certification, or legal advice.
```

---

## HARD_RULES

### HR2.001 — Public-Footprint Boundary
Use only Phase 1 admitted evidence, Phase 1 routed Phase 2 package, controlled pasted-public-material evidence, and explicitly permitted exception-corridor material.

### HR2.002 — No Unadmitted Evidence
Search snippets, scout notes, candidate URLs, rejected pages, quarantined pages, access-failed pages, and deduplicated-suppressed-only sources are not evidence.

### HR2.003 — No Legal Advice / No Compliance Conclusion
Do not state that the target is compliant, non-compliant, liable, safe, unsafe, high-risk, low-risk, legally deficient, legally sufficient, or legally exposed.

Allowed wording:
- "not visible in reviewed public footprint"
- "not publicly verifiable from admitted evidence"
- "requires downstream review"
- "requires user/client confirmation"
- "Phase 2 did not evaluate legal sufficiency"

### HR2.004 — Product Wrapper Boundary
Phase 2 may identify products, platforms, solutions, modules, apps, APIs, delivery modes, beta/preview signals, and integration candidates at wrapper level.

Phase 2 must not decompose wrappers into atomic features/functions. That belongs to Phase 3.

### HR2.005 — Baseline Data Touchpoint Boundary
Phase 2 may identify visible baseline touchpoints only.

Phase 2 must not build data flows, data provenance, legal basis, retention, subprocessor mapping, transfer analysis, privacy compliance conclusions, controller/processor conclusions, or registry triggers.

### HR2.006 — Downstream Assumptions Are Hints Only
Pipeline assumptions may guide downstream phases. They cannot substitute for downstream evidence and cannot trigger downstream conclusions.

### HR2.007 — Field Derivation Table Controls
Every substantive field must be derived only under its FD2 row. Execution blocks must cite the FD2 row ranges they are allowed to populate.

### HR2.008 — No Extra Compatibility Keys
Emit only the schema in this prompt. Do not emit alternative object names or noncanonical wrappers.

### HR2.009 — Evidence Must Resolve
Every non-empty substantive field must map to admitted evidence in `target_profile.evidence.field_evidence_refs[]`, unless it is a deterministic derivation from another cited field.

### HR2.010 — Controlled Failure Over Guessing
If a field cannot be derived, output the required fallback and record an unresolved question or limitation. Never guess.

---

## INPUTS_AND_CONTEXT

Phase 2 expects the following input objects:

```yaml
required_inputs:
  - runtime_slice:
      purpose: active governing rules required by Phase 2
  - runtime_index_slice:
      purpose: phase-specific rule call map
  - source_discovery_handoff:
      purpose: Phase 1 admitted/rejected/quarantined/source-routing result
  - source_discovery_forensic_ledger:
      purpose: upstream evidence custody and admission ledger
  - target_profile_package:
      purpose: admitted evidence package routed to Phase 2
  - final_source_coverage_package:
      purpose: source family coverage, absences, limitations, access failures
  - artifact_store_access:
      purpose: selected full-text artifacts by evidence_ref/source_ref when required
```

If a required input is missing, do not improvise. Emit controlled failure in `target_profile_trace` and `target_profile_forensic_ledger`.

---

## EVIDENCE_CORRIDORS

### P2_CORE_EVIDENCE_CORRIDOR

```yaml
core:
  - root_homepage
  - about_company
  - product_platform
  - product_solution
  - product_descendant
  - pricing_commercial
  - contact_page
  - admitted_product_index
  - root_cluster_summary
conditional:
  - docs_developer:
      allowed_only_for:
        - API delivery candidate
        - developer sales motion
        - integration candidate
        - API payload baseline touchpoint
```

### P2_LEGAL_IDENTITY_EXCEPTION_CORRIDOR

Phase 2 may access selected legal/governance evidence only where needed to derive legal entity, entity type, registered/notice jurisdiction, governing law, courts/venue, official address, operator/controller signal, or privacy/contact baseline.

Permitted evidence families:

```yaml
legal_identity_exception_sources:
  - legal_governance
  - privacy_policy
  - terms
  - DPA
  - legal_notice
  - footer_legal_text
  - contact_legal_notice_page
```

Forbidden uses:

```yaml
forbidden_under_exception:
  - legal stack review
  - clause indexing
  - risk evaluation
  - enforceability analysis
  - registry trigger evaluation
  - data-processing provenance analysis
  - privacy compliance analysis
```

### P2_BUSINESS_AND_MARKET_CONTEXT_EVIDENCE_CORRIDOR

Default evidence: root homepage, about/company, product/platform, product/solution, pricing/commercial, admitted product index, root-cluster summary. Docs/developer is allowed only for developer/API sales motion. Legal/governance exception is permitted only if business/market status is explicitly stated in legal text and not available elsewhere.

### P2_PRODUCT_BASELINE_EVIDENCE_CORRIDOR

Default evidence: root homepage, product/platform, product/solution, product descendant, root-cluster summary, pricing/commercial. Docs/developer is allowed only for API delivery, integration visibility, or developer-facing wrapper context. Legal/governance exception is permitted only where public product/service definition is needed and not visible elsewhere.

### P2_BASELINE_DATA_TOUCHPOINT_EVIDENCE_CORRIDOR

Default evidence: root homepage, product/platform, product/solution, product descendant, signup/onboarding text, pricing/commercial. Docs/developer is allowed only for API payload category or API input/output context. Privacy policy, Terms, and DPA may be accessed only to identify baseline categories of data collected or generic user/account/payment/support/customer-data surfaces.

Forbidden uses: data provenance, data-flow mapping, legal basis analysis, retention analysis, subprocessor mapping, cross-border transfer analysis, controller/processor legal conclusion, privacy compliance conclusion, registry trigger evaluation.

---

## BATCHING_AND_ROUTING_PROTOCOL

```yaml
P2_BATCH_01_IDENTITY_AND_JURISDICTION:
  execution_blocks: [P2.B1_INPUT_AND_SCOPE_PRECHECK, P2.B2_IDENTITY_DERIVATION, P2.B3_JURISDICTION_DERIVATION]
  field_rows: [FD2.001-FD2.020]

P2_BATCH_02_BUSINESS_AND_MARKET_CONTEXT:
  execution_blocks: [P2.B4_BUSINESS_MODEL_DERIVATION, P2.B5_MARKET_CONTEXT_DERIVATION]
  field_rows: [FD2.021-FD2.033]

P2_BATCH_03_PRODUCT_BASELINE:
  execution_blocks: [P2.B6_PRODUCT_BASELINE_DERIVATION]
  field_rows: [FD2.034-FD2.045]

P2_BATCH_04_BASELINE_DATA_TOUCHPOINTS:
  execution_blocks: [P2.B7_BASELINE_DATA_TOUCHPOINT_DERIVATION]
  field_rows: [FD2.046-FD2.054]

P2_BATCH_05_CANDIDATES_ASSUMPTIONS_EVIDENCE_LIMITATIONS:
  execution_blocks: [P2.B8_VAULT_CANDIDATE_DERIVATION, P2.B9_PIPELINE_ASSUMPTION_DERIVATION, P2.B10_EVIDENCE_AND_LIMITATION_ASSEMBLY, P2.B11_TRACE_LEDGER_HANDOFF_EMISSION]
  field_rows: [FD2.055-FD2.071]
```

---

## LIVE_FORENSIC_LEDGER_PROTOCOL

Phase 2 must maintain a visible forensic ledger. The ledger is not hidden reasoning. It is a structured audit artifact.

```yaml
allowed_event_types:
  - P2_INPUT_RECEIVED
  - P2_INPUT_MISSING
  - P2_SOURCE_REVIEWED
  - P2_SOURCE_SKIPPED
  - P2_EXCEPTION_REQUESTED
  - P2_EXCEPTION_GRANTED
  - P2_EXCEPTION_DENIED
  - P2_FIELD_DERIVED
  - P2_FIELD_FALLBACK_USED
  - P2_FIELD_CONFIDENCE_ASSIGNED
  - P2_PRODUCT_WRAPPER_LISTED
  - P2_PRODUCT_WRAPPER_OMITTED
  - P2_DATA_TOUCHPOINT_LISTED
  - P2_DATA_TOUCHPOINT_OMITTED
  - P2_VAULT_CANDIDATE_CREATED
  - P2_PIPELINE_ASSUMPTION_CREATED
  - P2_LIMITATION_RECORDED
  - P2_UNRESOLVED_QUESTION_RECORDED
  - P2_GATE_PASSED
  - P2_GATE_FAILED
  - P2_REPAIR_REQUIRED
  - P2_CONTROLLED_FAILURE
  - P2_LOCKED
```

```json
{
  "phase_id": "P2_TARGET_PROFILE",
  "ledger_status": "DRAFT | LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE",
  "ledger_events": [
    {
      "event_id": "P2E001",
      "event_type": "",
      "timestamp_or_sequence": "",
      "field_id": "",
      "field_path": "",
      "evidence_refs": [],
      "source_family": "",
      "source_url": "",
      "basis": "",
      "confidence": "high | medium | low | unknown | n/a",
      "exception_corridor": "none | legal_identity | business_market | product_baseline | baseline_data_touchpoint",
      "notes": ""
    }
  ],
  "coverage_matrix": {
    "required_input_objects": [],
    "reviewed_source_refs": [],
    "not_reviewed_source_refs": [],
    "exception_access_events": [],
    "field_coverage": [],
    "fallback_fields": [],
    "unresolved_fields": []
  }
}
```

---

## RULE_CALL_AND_CONTEXT_RETRIEVAL_PROTOCOL

Execution blocks must call rules by exact IDs or FD2 row ranges.

```text
P2.B2_IDENTITY_DERIVATION must apply FD2.002 through FD2.011.
P2.B3_JURISDICTION_DERIVATION must apply FD2.012 through FD2.020.
```

When accessing a source:

```yaml
source_access_order:
  1: use compact evidence refs and metadata first
  2: request selected artifact text only for fields under active FD2 rows
  3: use exception corridor only where the FD2 row permits it
  4: log all exception access in forensic ledger
```

---

## DERIVATION_LOGIC_PROTOCOL

### DLP2.001 — Signal-Structured Field Logic
Each field row uses executable logic:

```text
FIELD_SIGNAL_N
DERIVE_IF
VALUE_RULE
CONFIDENCE_RULE
EXCLUDE_IF
FALLBACK_IF
LEDGER_RULE
```

### DLP2.002 — Exact Field Meaning
Downstream phases may rely on Phase 2 fields only according to their FD2 definitions. They may not reinterpret Phase 2 fields.

### DLP2.003 — Confidence Ladder
Unless a row defines a stricter rule:

```yaml
high: direct first-party evidence supports the exact value
medium: strong first-party evidence supports the value but context is partial
low: weak first-party evidence supports the value
unknown: no reliable public evidence supports the value
```

### DLP2.004 — Fallback Language
Use "N/A", `unknown`, empty arrays, or controlled failure exactly as the field row requires.

### DLP2.005 — No Over-Reading
A field may not be populated because similar products usually have that property. Only reviewed admitted evidence counts.

---

## FIELD_DERIVATION_POWER_TABLE

### FD2.001 — Object contract

```yaml
field_id: FD2.001
field_path: target_profile
allowed_value_type: object
field_meaning: Canonical Phase 2 company profile object.
evidence_pool: not evidence-derived
field_signals:
  FIELD_SIGNAL_1: Phase 2 execution is invoked.
derive_if: FIELD_SIGNAL_1 = TRUE
value_rule: Emit target_profile with identity, jurisdiction, business_model, market_context, product_baseline, data_touchpoint_map, vault_baseline_candidates, pipeline_assumptions, evidence, and limitations.
exclude_if: Do not emit extra compatibility keys or alternative wrappers.
fallback_if: No fallback. Missing target_profile blocks lock.
ledger_rule: Record schema initialization and confirm only authorized top-level fields are emitted.
```

### FD2.002–FD2.011 — Identity

```yaml
- field_id: FD2.002
  field_path: target_profile.identity.brand_name
  allowed_value_type: string | "N/A"
  field_meaning: Public-facing brand name under which the target presents itself.
  evidence_pool: root_homepage, product_platform, product_solution, about_company, footer_branding
  field_signals:
    FIELD_SIGNAL_1: Homepage title, logo alt text, primary heading, or hero copy identifies a brand.
    FIELD_SIGNAL_2: Same brand appears consistently across multiple admitted pages.
    FIELD_SIGNAL_3: Legal/governance evidence shows a different formal legal entity, confirming brand/legal distinction.
  derive_if: FIELD_SIGNAL_1 = TRUE OR FIELD_SIGNAL_2 = TRUE
  value_rule: Use the shortest exact public brand string repeatedly used by the target. Preserve visible capitalization.
  confidence_rule: high if homepage and another admitted source agree; medium if one strong source; low if domain-derived or weak; unknown if unresolved.
  exclude_if: Do not derive from search snippets, social profiles, third-party profiles, domain registrars, guessed domain expansion, or product names unless product and company are clearly the same.
  fallback_if: Use "N/A" and add unresolved identity limitation.
  ledger_rule: Record evidence refs, quote/char range, source family, and whether brand differs from legal entity.

- field_id: FD2.003
  field_path: target_profile.identity.legal_name
  allowed_value_type: string | "N/A"
  field_meaning: Formal legal entity name, if visible.
  evidence_pool: legal_identity_exception_sources, footer_legal_text, terms, privacy_policy, DPA, contact_legal_notice_page
  field_signals:
    FIELD_SIGNAL_1: Legal/governance artifact names provider, controller, processor, company, operator, contracting party, or legal owner.
    FIELD_SIGNAL_2: Name includes entity designator such as Inc., LLC, Ltd, GmbH, Pvt Ltd, LLP, Corp., SAS, BV.
    FIELD_SIGNAL_3: Same legal name appears in more than one legal/governance source.
  derive_if: FIELD_SIGNAL_1 = TRUE
  value_rule: Extract exact legal name. Do not remove entity designator. If multiple entities appear, choose provider/operator/controller for evaluated service and record ambiguity.
  confidence_rule: high for formal party/controller language; medium for legal footer/privacy notice with less clear role; low if entity visible but service relationship ambiguous; unknown if absent.
  exclude_if: Do not derive from brand, domain, product name, founder name, press mentions, LinkedIn, registry databases, or inferred country.
  fallback_if: Use "N/A" and record "legal entity not visible in reviewed public footprint."
  ledger_rule: Record exception corridor use, evidence refs, source type, quoted legal-name text, and role basis.

- field_id: FD2.004
  field_path: target_profile.identity.trade_names[]
  allowed_value_type: array[string]
  field_meaning: Alternative public names used by the same target.
  evidence_pool: homepage, product_platform, about_company, footer, legal_identity_exception_sources
  field_signals:
    FIELD_SIGNAL_1: Evidence says formerly, also known as, doing business as, d/b/a, trading as, or equivalent.
    FIELD_SIGNAL_2: Brand/legal mismatch is visible and both names clearly refer to same target.
    FIELD_SIGNAL_3: Multiple product/platform names are used as brand-facing commercial names.
  derive_if: FIELD_SIGNAL_1 = TRUE OR FIELD_SIGNAL_2 = TRUE
  value_rule: List only names clearly tied to the same company/target. Do not include every product name.
  confidence_rule: high for explicit d/b/a/trading-as wording; medium for clear repeated cross-reference; low for weak but plausible same-target usage; empty array if none.
  exclude_if: Do not include unrelated products, model names, API names, slogans, customer names, or investor/third-party labels.
  fallback_if: Use [].
  ledger_rule: Record each included trade name with evidence refs and basis.

- field_id: FD2.005
  field_path: target_profile.identity.website
  allowed_value_type: string | "N/A"
  field_meaning: Canonical website/root URL evaluated in the run.
  evidence_pool: Phase 1 admitted root/homepage and source discovery handoff
  field_signals:
    FIELD_SIGNAL_1: Phase 1 admitted a root homepage for the target.
    FIELD_SIGNAL_2: Canonical URL or redirect target is resolved.
  derive_if: FIELD_SIGNAL_1 = TRUE
  value_rule: Use canonical admitted root URL, not arbitrary source URL.
  confidence_rule: high if admitted root source exists; medium if only admitted subdomain exists but target identity is clear; low if root unavailable and only pasted public material identifies site; unknown if unresolved.
  exclude_if: Do not use third-party profile URLs, hosted legal URLs, search URLs, or social URLs.
  fallback_if: Use "N/A" and record target website unresolved.
  ledger_rule: Record source discovery handoff ref and canonical URL basis.

- field_id: FD2.006
  field_path: target_profile.identity.domain
  allowed_value_type: string | "N/A"
  field_meaning: Canonical domain under evaluation.
  evidence_pool: deterministic derivation from FD2.005 / Phase 1 admitted root
  field_signals:
    FIELD_SIGNAL_1: website contains a valid URL.
  derive_if: FD2.005 != "N/A"
  value_rule: Extract registrable domain or canonical host. Preserve subdomain only if evaluated target is explicitly a subdomain service.
  confidence_rule: Same as FD2.005.
  exclude_if: Do not derive from email domains, analytics domains, CDN domains, hosted legal domains, or third-party processors.
  fallback_if: Use "N/A".
  ledger_rule: Record deterministic derivation from canonical website.

- field_id: FD2.007
  field_path: target_profile.identity.entity_type
  allowed_value_type: string | "N/A"
  field_meaning: Visible legal entity form.
  evidence_pool: legal_name evidence, legal_identity_exception_sources, footer_legal_text
  field_signals:
    FIELD_SIGNAL_1: Legal name contains explicit entity designator.
    FIELD_SIGNAL_2: Legal/governance source separately states entity type.
  derive_if: FIELD_SIGNAL_1 = TRUE OR FIELD_SIGNAL_2 = TRUE
  value_rule: Extract entity designator exactly or minimally normalized.
  confidence_rule: high if entity type is in legal party name; medium if visible in footer/legal notice; low if partial or ambiguous; unknown if absent.
  exclude_if: Do not infer from jurisdiction, domain suffix, funding stage, startup language, or market.
  fallback_if: Use "N/A".
  ledger_rule: Record legal-name evidence ref and exact designator text.

- field_id: FD2.008
  field_path: target_profile.identity.entity_type_family
  allowed_value_type: india | us | eu_uk | other | unknown
  field_meaning: Normalized family of entity type / legal formation signal.
  evidence_pool: deterministic mapping from FD2.007 and jurisdiction evidence
  field_signals:
    FIELD_SIGNAL_1: Entity type maps clearly to known jurisdiction family.
    FIELD_SIGNAL_2: Registered/notice country supports mapping.
  derive_if: FIELD_SIGNAL_1 = TRUE OR FIELD_SIGNAL_2 = TRUE
  value_rule: LLC/Inc./Corp./C-Corp/Delaware Corp. -> us; Pvt Ltd/LLP/Private Limited -> india; Ltd/PLC/LLP UK/GmbH/SAS/BV/SARL -> eu_uk; explicit other form -> other; no reliable signal -> unknown.
  confidence_rule: high when entity type and jurisdiction align; medium when either entity type or registered country is explicit; do not use low.
  exclude_if: Do not infer from customers, pricing currency, language, time zone, or TLD alone.
  fallback_if: Use unknown.
  ledger_rule: Record source field used for mapping and mapping rule applied.

- field_id: FD2.009
  field_path: target_profile.identity.corporate_status_signal
  allowed_value_type: string | "N/A"
  field_meaning: Visible signal of corporate/operator status.
  evidence_pool: legal_identity_exception_sources, footer, legal_notice, contact_page, terms, privacy_policy
  field_signals:
    FIELD_SIGNAL_1: Evidence identifies target as company, provider, operator, controller, processor, contracting party, or legal owner.
    FIELD_SIGNAL_2: Evidence contains registration/address/corporate designator.
  derive_if: FIELD_SIGNAL_1 = TRUE OR FIELD_SIGNAL_2 = TRUE
  value_rule: Write concise factual signal, e.g. "Terms identify X as provider."
  confidence_rule: high if legal/governance role language explicit; medium if legal identity visible but role less clear; low if only footer/copyright suggests operator; unknown if absent.
  exclude_if: Do not state incorporated/active/good standing unless public first-party evidence says so.
  fallback_if: Use "N/A".
  ledger_rule: Record role language, evidence refs, and limitation if status is weakly visible.

- field_id: FD2.010
  field_path: target_profile.identity.operator_or_controller_signal
  allowed_value_type: string | "N/A"
  field_meaning: Who appears to operate the service or control/process personal data.
  evidence_pool: privacy_policy, terms, DPA, footer_legal_text, contact_legal_notice_page
  field_signals:
    FIELD_SIGNAL_1: Terms identify service provider/operator.
    FIELD_SIGNAL_2: Privacy policy identifies controller/business/service provider.
    FIELD_SIGNAL_3: DPA identifies processor/provider.
  derive_if: AT_LEAST_1_OF(FIELD_SIGNAL_1, FIELD_SIGNAL_2, FIELD_SIGNAL_3) = TRUE
  value_rule: Write factual public-footprint signal, not legal conclusion.
  confidence_rule: high if role language explicit; medium if provider/operator clear but privacy role ambiguous; low if only footer/operator inference; unknown if absent.
  exclude_if: Do not infer controller/processor status from product category alone. Do not conduct legal role analysis beyond visible text.
  fallback_if: Use "N/A" and record unresolved operator/controller signal.
  ledger_rule: Record exception corridor use, role text, source type, and evidence refs.

- field_id: FD2.011
  field_path: target_profile.identity.identity_confidence
  allowed_value_type: high | medium | low | unknown
  field_meaning: Overall confidence in identity block.
  evidence_pool: FD2.002-FD2.010
  field_signals:
    FIELD_SIGNAL_1: Brand name and website are strongly established.
    FIELD_SIGNAL_2: Legal name or operator/controller signal is established.
    FIELD_SIGNAL_3: Entity type/jurisdiction signals support identity.
  derive_if: always required
  value_rule: Assign one allowed value.
  confidence_rule: high if FIELD_SIGNAL_1 and FIELD_SIGNAL_2; medium if brand/website clear but legal/operator partial; low if mostly website/domain; unknown if not reliably established.
  exclude_if: Do not inflate because target is famous, domain looks obvious, or search results agree.
  fallback_if: Use unknown.
  ledger_rule: Record confidence basis and identity limitations.
```

### FD2.012–FD2.020 — Jurisdiction

```yaml
- field_id: FD2.012
  field_path: target_profile.jurisdiction.registered_or_notice_country
  allowed_value_type: string | "N/A"
  field_meaning: Country tied to registered address, notice address, legal notice, privacy controller address, or contracting entity.
  evidence_pool: legal_identity_exception_sources, contact_page, footer_legal_text
  field_signals:
    FIELD_SIGNAL_1: Official address includes country.
    FIELD_SIGNAL_2: Legal/governance artifact identifies company country.
    FIELD_SIGNAL_3: Privacy notice/controller contact identifies country.
  derive_if: AT_LEAST_1_OF(FIELD_SIGNAL_1, FIELD_SIGNAL_2, FIELD_SIGNAL_3) = TRUE
  value_rule: Extract country exactly or normalize unambiguous country names.
  confidence_rule: high if formal address/legal notice gives country; medium if contact/privacy page gives country; low if weak footer; unknown if absent.
  exclude_if: Do not derive from TLD, language, customer geography, phone country code alone, CDN region, or server location.
  fallback_if: Use "N/A" and record registered/notice country not visible.
  ledger_rule: Record evidence refs and exact address/legal-notice basis.

- field_id: FD2.013
  field_path: target_profile.jurisdiction.registered_or_notice_state
  allowed_value_type: string | "N/A"
  field_meaning: State/province/region tied to official address or legal notice.
  evidence_pool: same as FD2.012
  field_signals:
    FIELD_SIGNAL_1: Official address includes state/province/region.
    FIELD_SIGNAL_2: Legal/governance text identifies state/province.
  derive_if: FIELD_SIGNAL_1 = TRUE OR FIELD_SIGNAL_2 = TRUE
  value_rule: Extract exact state/province/region. Normalize only obvious abbreviations if needed.
  confidence_rule: Same as FD2.012.
  exclude_if: Do not infer from city alone unless state is explicitly paired. Do not infer from governing law clause unless deriving governing-law fields.
  fallback_if: Use "N/A".
  ledger_rule: Record address/legal-notice evidence refs.

- field_id: FD2.014
  field_path: target_profile.jurisdiction.city
  allowed_value_type: string | "N/A"
  field_meaning: City in official address, notice address, or public contact address.
  evidence_pool: contact_page, legal_notice, terms, privacy_policy, DPA, footer
  field_signals:
    FIELD_SIGNAL_1: Official or contact address includes city.
  derive_if: FIELD_SIGNAL_1 = TRUE
  value_rule: Extract city exactly as written.
  confidence_rule: high for formal legal/contact address; medium for footer/address block; low for weak contact context; unknown if absent.
  exclude_if: Do not infer from phone number, timezone, office photo, map widget without text, or local language.
  fallback_if: Use "N/A".
  ledger_rule: Record source and address text.

- field_id: FD2.015
  field_path: target_profile.jurisdiction.full_address
  allowed_value_type: string | "N/A"
  field_meaning: Complete official address visible in public footprint.
  evidence_pool: contact_page, legal_notice, terms, privacy_policy, DPA, footer
  field_signals:
    FIELD_SIGNAL_1: Complete or near-complete address block appears in admitted evidence.
  derive_if: FIELD_SIGNAL_1 = TRUE
  value_rule: Extract exact address or clean normalized line preserving all substantive components.
  confidence_rule: high if address appears in legal/governance or official contact context; medium if footer/contact address role unclear; low if partial; unknown if absent.
  exclude_if: Do not combine unrelated fragments. Do not use map pins, schema metadata, or third-party maps unless admitted as first-party page text.
  fallback_if: Use "N/A".
  ledger_rule: Record full quoted address or char range.

- field_id: FD2.016
  field_path: target_profile.jurisdiction.governing_law_country
  allowed_value_type: string | "N/A"
  field_meaning: Country/legal system expressly selected in public contractual terms.
  evidence_pool: legal_identity_exception_sources only
  field_signals:
    FIELD_SIGNAL_1: Governing-law clause exists.
    FIELD_SIGNAL_2: Clause identifies country/legal system.
    FIELD_SIGNAL_3: Venue/courts/arbitration clause supports same jurisdiction.
  derive_if: FIELD_SIGNAL_1 = TRUE AND FIELD_SIGNAL_2 = TRUE
  value_rule: Extract expressly selected country/legal system. Normalize only if unambiguous.
  confidence_rule: high if governing-law clause explicit; medium if venue/arbitration strongly implies country but governing law incomplete; unknown if absent.
  exclude_if: Do not derive from company address, target users, office location, TLD, currency, server region, or founder nationality.
  fallback_if: Use "N/A" and record governing law not visible in reviewed public footprint.
  ledger_rule: Record exception corridor use, source type, quoted clause, and evidence refs.

- field_id: FD2.017
  field_path: target_profile.jurisdiction.governing_law_state
  allowed_value_type: string | "N/A"
  field_meaning: State/province expressly selected in governing-law clause.
  evidence_pool: legal_identity_exception_sources only
  field_signals:
    FIELD_SIGNAL_1: Governing-law clause exists.
    FIELD_SIGNAL_2: Clause identifies state/province/region.
  derive_if: FIELD_SIGNAL_1 = TRUE AND FIELD_SIGNAL_2 = TRUE
  value_rule: Extract exact state/province/region from clause.
  confidence_rule: high if explicit; unknown if absent or only country is stated.
  exclude_if: Do not infer from registered address, courts/venue, or company location unless governing-law clause expressly says it.
  fallback_if: Use "N/A".
  ledger_rule: Record quoted governing-law text and evidence refs.

- field_id: FD2.018
  field_path: target_profile.jurisdiction.courts_or_venue
  allowed_value_type: string | "N/A"
  field_meaning: Courts, arbitration forum, venue, or dispute-resolution forum stated in public legal terms.
  evidence_pool: legal_identity_exception_sources only
  field_signals:
    FIELD_SIGNAL_1: Dispute resolution, venue, courts, arbitration, tribunal, or jurisdiction clause exists.
    FIELD_SIGNAL_2: Clause identifies forum/location/institution.
  derive_if: FIELD_SIGNAL_1 = TRUE AND FIELD_SIGNAL_2 = TRUE
  value_rule: Extract concise forum text. Preserve institution/location if visible.
  confidence_rule: high if explicit forum clause; medium if dispute clause exists but forum partially stated; unknown if absent.
  exclude_if: Do not infer from governing law alone unless same clause identifies venue. Do not infer from company address.
  fallback_if: Use "N/A".
  ledger_rule: Record quoted clause and exception access basis.

- field_id: FD2.019
  field_path: target_profile.jurisdiction.source_basis
  allowed_value_type: string | "N/A"
  field_meaning: Concise basis explaining where jurisdiction fields came from.
  evidence_pool: FD2.012-FD2.018 evidence refs
  field_signals:
    FIELD_SIGNAL_1: At least one jurisdiction field has non-N/A value.
  derive_if: FIELD_SIGNAL_1 = TRUE
  value_rule: Write short factual basis, e.g. "Derived from Terms governing-law clause and Privacy Policy contact address."
  confidence_rule: Align with FD2.020.
  exclude_if: Do not include legal opinion, enforceability conclusion, or compliance assessment.
  fallback_if: Use "N/A" if all jurisdiction fields are unknown.
  ledger_rule: Record field paths summarized and evidence refs used.

- field_id: FD2.020
  field_path: target_profile.jurisdiction.confidence
  allowed_value_type: high | medium | low | unknown
  field_meaning: Overall confidence in jurisdiction block.
  evidence_pool: FD2.012-FD2.019
  field_signals:
    FIELD_SIGNAL_1: Formal address/legal notice exists.
    FIELD_SIGNAL_2: Governing law/venue clause exists.
    FIELD_SIGNAL_3: Privacy/controller/DPA evidence supports jurisdiction.
  derive_if: always required
  value_rule: Assign one allowed confidence value.
  confidence_rule: high if formal address/legal notice and governing law/venue exist; medium if one formal jurisdiction source exists; low if only weak contact/footer; unknown if no reliable signal.
  exclude_if: Do not increase confidence based on non-first-party sources or inferred geography.
  fallback_if: Use unknown.
  ledger_rule: Record confidence basis and unresolved jurisdiction limitations.
```

### FD2.021–FD2.033 — Business model and market context

```yaml
- field_id: FD2.021
  field_path: target_profile.business_model.business_category
  allowed_value_type: string | "N/A"
  derive_if: Product/homepage/about/pricing evidence states or clearly describes what kind of product/service target offers.
  value_rule: Use plain factual category, not marketing copy.
  exclude_if: Do not use third-party labels, snippets, investor profiles, app-store tags, social bios, or generic AI language alone.
  fallback_if: "N/A"
  ledger_rule: Record evidence refs and factual-category basis.

- field_id: FD2.022
  field_path: target_profile.business_model.primary_customer_type
  allowed_value_type: string | "N/A"
  derive_if: Public copy, pricing, onboarding, docs, or product flow identifies customer/user segment.
  value_rule: Use most repeatedly supported customer/user segment; state visible mix if multiple equally supported.
  exclude_if: Do not infer from founder identity, screenshots, customer logos without text, buzzwords, or geography.
  fallback_if: "N/A"
  ledger_rule: Record explicit/inferred basis.

- field_id: FD2.023
  field_path: target_profile.business_model.market_type_candidate
  allowed_value_type: b2b | b2c | hybrid | unknown
  derive_if: B2B and/or B2C signals appear in product, pricing, signup, enterprise, developer, or terms business-use language.
  value_rule: b2b if only B2B; b2c if only B2C; hybrid if both; unknown if no reliable signal.
  exclude_if: Pricing alone is not B2B. Public website access alone is not B2C.
  fallback_if: unknown
  ledger_rule: Record B2B/B2C signal basis.

- field_id: FD2.024
  field_path: target_profile.business_model.sales_motion
  allowed_value_type: string | "N/A"
  derive_if: Self-serve, sales-led, waitlist, or request-access signal appears.
  value_rule: Use concise visible sales motion: self-serve, sales-led, self-serve with enterprise sales, waitlist/request access, or N/A.
  exclude_if: Do not infer from funding stage, company size, or generic contact-us footer alone.
  fallback_if: "N/A"
  ledger_rule: Record CTA/source signal.

- field_id: FD2.025
  field_path: target_profile.business_model.revenue_model_signal
  allowed_value_type: string | "N/A"
  derive_if: Pricing/plan/billing/API usage/commercial evidence describes monetization model or fee basis.
  value_rule: Describe only visible pricing/commercial signal.
  exclude_if: Do not infer revenue, ARR, pricing level, contract value, margin, or commercial success.
  fallback_if: "N/A"
  ledger_rule: Record pricing/commercial refs and whether exact prices visible.

- field_id: FD2.026
  field_path: target_profile.business_model.enterprise_or_self_serve_signal
  allowed_value_type: string | "N/A"
  derive_if: Enterprise or self-serve signals appear in pricing, enterprise page, security/trust, contact sales, signup, or docs.
  value_rule: enterprise-oriented, self-serve-oriented, mixed enterprise + self-serve, or N/A.
  exclude_if: Do not treat every B2B product as enterprise; login alone is not self-serve.
  fallback_if: "N/A"
  ledger_rule: Record enterprise/self-serve signal evidence.

- field_id: FD2.027
  field_path: target_profile.business_model.public_sector_signal
  allowed_value_type: string | "N/A"
  derive_if: First-party evidence explicitly names government, public sector, agencies, defense, public institutions, or civic/public administration.
  value_rule: Summarize visible public-sector signal only.
  exclude_if: Do not infer from .gov links, logos without text, or third-party news.
  fallback_if: "N/A"
  ledger_rule: Record source refs and quote/char range.

- field_id: FD2.028
  field_path: target_profile.business_model.business_model_confidence
  allowed_value_type: high | medium | low | unknown
  derive_if: Always required.
  value_rule: high if category/customer/sales motion plus commercial signal exist; medium if mostly visible but partial; low if only category visible; unknown if unreliable.
  exclude_if: Do not inflate because business model seems obvious.
  fallback_if: unknown
  ledger_rule: Record confidence basis.

- field_id: FD2.029
  field_path: target_profile.market_context.industry
  allowed_value_type: string | "N/A"
  derive_if: First-party evidence explicitly or repeatedly identifies industry/vertical/sector.
  value_rule: Use plain industry label.
  exclude_if: Do not infer from isolated logos, third-party descriptions, founder background, or generic AI vocabulary.
  fallback_if: "N/A"
  ledger_rule: Record industry evidence.

- field_id: FD2.030
  field_path: target_profile.market_context.target_geographies[]
  allowed_value_type: array[string]
  derive_if: First-party evidence explicitly names served/targeted countries or regions.
  value_rule: List only explicit target geographies.
  exclude_if: Do not infer from TLD, language, currency alone, office address, CDN/server region, or customer examples without targeting language.
  fallback_if: []
  ledger_rule: Record each geography with support.

- field_id: FD2.031
  field_path: target_profile.market_context.target_languages[]
  allowed_value_type: array[string]
  derive_if: Product/docs/localization/API evidence lists or claims language support.
  value_rule: List exact languages. Use ["multilingual_unspecified"] only where broad multilingual support is claimed without list.
  exclude_if: Do not infer from translation widget, browser auto-translation, website language alone, or country alone.
  fallback_if: []
  ledger_rule: Record exact vs unspecified support.

- field_id: FD2.032
  field_path: target_profile.market_context.regulated_sector_hints[]
  allowed_value_type: array[string]
  derive_if: First-party evidence explicitly mentions regulated/sensitive sectors or customer classes.
  value_rule: List factual sector hints only.
  exclude_if: No high-risk, compliance, registry, or legal classification. Generic enterprise/secure/trust language is insufficient.
  fallback_if: []
  ledger_rule: Record each sector hint and confirm no legal conclusion.

- field_id: FD2.033
  field_path: target_profile.market_context.market_context_confidence
  allowed_value_type: high | medium | low | unknown
  derive_if: Always required.
  value_rule: high if industry and at least one geography/language/sector signal explicit; medium if partial; low if weak; unknown if unreliable.
  exclude_if: Do not use non-first-party sources, reputation, common knowledge, or model assumptions.
  fallback_if: unknown
  ledger_rule: Record confidence basis.
```

### FD2.034–FD2.045 — Product baseline

```yaml
- field_id: FD2.034
  field_path: target_profile.product_baseline.high_level_offering
  allowed_value_type: string | "N/A"
  derive_if: Homepage/product/about/service-definition evidence states what target publicly offers.
  value_rule: One factual sentence; strip hype.
  exclude_if: No slogans, third-party summaries, SEO snippets, logos, or speculative labels.
  fallback_if: "N/A"
  ledger_rule: Record refs and whether exception used.

- field_id: FD2.035
  field_path: target_profile.product_baseline.primary_claim
  allowed_value_type: string | "N/A"
  derive_if: Homepage/product hero or primary headline contains product promise.
  value_rule: Prefer exact quoted claim; if long, preserve key wording without changing meaning.
  exclude_if: Do not synthesize or strengthen claims.
  fallback_if: "N/A"
  ledger_rule: Record exact quote/char range.

- field_id: FD2.036
  field_path: target_profile.product_baseline.products[].name
  allowed_value_type: string | "N/A"
  derive_if: Named commercial/navigation product/platform/solution wrapper appears in admitted evidence.
  value_rule: Extract exact wrapper name; deduplicate repeated references.
  exclude_if: No atomic features, generic capabilities, slogans, model versions, customer names, or every page heading.
  fallback_if: products: [] if none visible.
  ledger_rule: Record wrapper ID, root_cluster_id if available, refs, dedupe decision.

- field_id: FD2.037
  field_path: target_profile.product_baseline.products[].description
  allowed_value_type: string | "N/A"
  derive_if: Product wrapper has nearby or page-level explanatory copy.
  value_rule: Summarize wrapper-level purpose only. No feature decomposition.
  exclude_if: No hidden capabilities, detailed docs/API functions, or atomic features.
  fallback_if: "N/A"
  ledger_rule: Record evidence refs and no-feature-decomposition check.

- field_id: FD2.038
  field_path: target_profile.product_baseline.products[].source_url
  allowed_value_type: string | "N/A"
  derive_if: Product wrapper has admitted source URL.
  value_rule: Use strongest canonical product-wrapper URL; prefer product page over homepage.
  exclude_if: No search result, third-party, hosted legal, or non-admitted URL.
  fallback_if: "N/A" only for controlled pasted-public-material mode.
  ledger_rule: Record evidence_source_id and canonical URL.

- field_id: FD2.039
  field_path: target_profile.product_baseline.products[].evidence_refs[]
  allowed_value_type: array[string]
  derive_if: At least one admitted evidence ref supports product name.
  value_rule: Minimal sufficient refs supporting name/description.
  exclude_if: No rejected, quarantined, snippet-only, suppressed-only, or access-failed refs.
  fallback_if: Product item without refs blocks lock unless controlled pasted-material evidence exists.
  ledger_rule: Record field path to refs mapping.

- field_id: FD2.040
  field_path: target_profile.product_baseline.products[].evidence_quote
  allowed_value_type: string | "N/A"
  derive_if: Admitted clean text contains concise quote proving name/description.
  value_rule: Exact short quote only.
  exclude_if: No snippets, search summaries, model summaries, or third-party text.
  fallback_if: "N/A" if refs/char range still support.
  ledger_rule: Record quote source and char range.

- field_id: FD2.041
  field_path: target_profile.product_baseline.products[].confidence
  allowed_value_type: high | medium | low | unknown
  derive_if: Required for each emitted product item.
  value_rule: high direct name+description+product page; medium clear name but partial context; low weak but visible; unknown means omit.
  exclude_if: Do not keep unknown-confidence item.
  fallback_if: Omit and record limitation.
  ledger_rule: Record inclusion/omission basis.

- field_id: FD2.042
  field_path: target_profile.product_baseline.delivery_app_candidate
  allowed_value_type: true | false | unknown
  derive_if: Always required.
  value_rule: true if app/dashboard/console/workspace/portal/studio/web app/mobile/chat/upload/user-interface signal exists; false only if evidence explicitly says non-app/API-only/backend-only; otherwise unknown.
  exclude_if: Login alone is not enough for true; absence of UI evidence is not enough for false.
  fallback_if: unknown
  ledger_rule: Record delivery signal.

- field_id: FD2.043
  field_path: target_profile.product_baseline.delivery_api_candidate
  allowed_value_type: true | false | unknown
  derive_if: Always required.
  value_rule: true if API/SDK/developer docs/keys/endpoints/webhooks/programmatic signal exists; false only if explicit app-only/no-API/no-developer; otherwise unknown.
  exclude_if: Generic integration language is insufficient without API/developer/programmatic access.
  fallback_if: unknown
  ledger_rule: Record API signal.

- field_id: FD2.044
  field_path: target_profile.product_baseline.beta_or_preview_signal
  allowed_value_type: string | "N/A"
  derive_if: Beta/preview/alpha/early-access/experimental/waitlist/pilot/request-access/coming-soon language appears.
  value_rule: Short factual signal only.
  exclude_if: Do not infer from newness, site maturity, missing pricing, or startup status.
  fallback_if: "N/A"
  ledger_rule: Record exact wording.

- field_id: FD2.045
  field_path: target_profile.product_baseline.integration_candidates[]
  allowed_value_type: array[object]
  derive_if: Product/docs/integration evidence explicitly names third-party integration/connection/support.
  value_rule: One object per visible integration candidate with name, source_url, evidence_refs, evidence_quote, confidence.
  exclude_if: Do not include customers, model providers, generic technologies, internal components, unsupported logos, or processors/subprocessors unless product-level integration is claimed.
  fallback_if: []
  ledger_rule: Record why item is integration rather than vendor/subprocessor/customer.
```

### FD2.046–FD2.054 — Baseline data touchpoints

```yaml
- field_id: FD2.046
  field_path: target_profile.data_touchpoint_map[].touchpoint_id
  allowed_value_type: string pattern DT###
  derive_if: Valid touchpoint item is emitted.
  value_rule: Assign DT001, DT002, DT003 in evidence-priority order.
  exclude_if: No speculative, unsupported, duplicate, or later-phase inferred data flows.
  fallback_if: data_touchpoint_map: []
  ledger_rule: Record ID assignment and dedupe.

- field_id: FD2.047
  field_path: target_profile.data_touchpoint_map[].actor
  allowed_value_type: end_user | customer_admin | enterprise_customer | developer | third_party | unknown
  derive_if: Evidence identifies or clearly indicates actor submitting/managing/causing data touchpoint.
  value_rule: Select allowed enum; unknown if unclear.
  exclude_if: Do not infer actor from customer type alone. Developer requires API/developer evidence.
  fallback_if: unknown
  ledger_rule: Record actor evidence.

- field_id: FD2.048
  field_path: target_profile.data_touchpoint_map[].data_subject
  allowed_value_type: user | customer | employee | consumer | developer | child | business_entity | unknown
  derive_if: Evidence identifies whose data appears involved.
  value_rule: Select allowed enum; unknown if unclear.
  exclude_if: No child/employee/patient/sensitive subject without explicit first-party evidence.
  fallback_if: unknown
  ledger_rule: Record subject basis.

- field_id: FD2.049
  field_path: target_profile.data_touchpoint_map[].data_category
  allowed_value_type: account | contact | prompt | uploaded_file | generated_output | audio | text | document | image | video | code | api_payload | usage_log | payment | support | sensitive | unknown
  derive_if: Evidence names or clearly indicates category.
  value_rule: Use most specific controlled value; create separate items for distinct categories.
  exclude_if: Sensitive requires explicit evidence. Do not infer personal data solely because product has users.
  fallback_if: unknown only if touchpoint is real but category unclear; otherwise omit.
  ledger_rule: Record category mapping.

- field_id: FD2.050
  field_path: target_profile.data_touchpoint_map[].collection_or_processing_context
  allowed_value_type: string | "N/A"
  derive_if: Evidence describes user/system action or baseline collection context.
  value_rule: Short factual context only.
  exclude_if: No storage, retention, transfer, subprocessor, legal basis, or controller/processor conclusions.
  fallback_if: "N/A"
  ledger_rule: Record baseline-scope support.

- field_id: FD2.051
  field_path: target_profile.data_touchpoint_map[].source_url
  allowed_value_type: string | "N/A"
  derive_if: Touchpoint has admitted source URL.
  value_rule: Use canonical admitted URL for strongest support.
  exclude_if: No rejected, quarantined, snippet-only, duplicate-suppressed-only, or third-party URL.
  fallback_if: "N/A" only for controlled pasted-public-material mode.
  ledger_rule: Record evidence_source_id and URL.

- field_id: FD2.052
  field_path: target_profile.data_touchpoint_map[].evidence_refs[]
  allowed_value_type: array[string]
  derive_if: At least one admitted evidence ref supports touchpoint.
  value_rule: Minimal sufficient refs supporting actor/category/context.
  exclude_if: No rejected/quarantined/snippet-only/access-failed/suppressed-only refs.
  fallback_if: No refs means no item unless controlled pasted evidence exists.
  ledger_rule: Record path to refs mapping.

- field_id: FD2.053
  field_path: target_profile.data_touchpoint_map[].evidence_quote
  allowed_value_type: string | "N/A"
  derive_if: Admitted evidence has concise quote supporting touchpoint.
  value_rule: Exact short quote; prefer category/context over broad boilerplate.
  exclude_if: No snippets, search summaries, model summaries, or third-party pages.
  fallback_if: "N/A" if refs/char range support.
  ledger_rule: Record quote and char range.

- field_id: FD2.054
  field_path: target_profile.data_touchpoint_map[].confidence
  allowed_value_type: high | medium | low | unknown
  derive_if: Required for each emitted item.
  value_rule: high if actor+category+context+refs direct; medium if category+context support but actor/subject partial; low if visible but incomplete; unknown means omit.
  exclude_if: Do not keep unknown-confidence item.
  fallback_if: Omit and record limitation.
  ledger_rule: Record confidence basis and omitted/merged duplicates.
```

### FD2.055–FD2.071 — Candidates, assumptions, evidence, limitations

```yaml
- field_id: FD2.055
  field_path: target_profile.vault_baseline_candidates.baseline.*.value
  allowed_value_type: string | array | object | "N/A"
  derive_if: Supported Phase 2 value maps to baseline intake/vault field and is not legal/risk conclusion.
  value_rule: Copy/normalize only enough to fit destination; no enrichment.
  exclude_if: No speculation, model knowledge, registry rows, legal conclusions, or private facts.
  fallback_if: "N/A" or empty with status UNKNOWN.
  ledger_rule: Record source FD2 row, path, refs, destination key.

- field_id: FD2.056
  field_path: target_profile.vault_baseline_candidates.baseline.*.status
  allowed_value_type: PREFILL_READY | CONFIRM | UNKNOWN
  derive_if: Required for every baseline candidate leaf.
  value_rule: PREFILL_READY if high-confidence direct evidence; CONFIRM if partial/ambiguous/medium-low; UNKNOWN if no reliable evidence.
  exclude_if: Do not mark PREFILL_READY where interpretation/private confirmation/legal analysis required.
  fallback_if: UNKNOWN
  ledger_rule: Record status decision.

- field_id: FD2.057
  field_path: target_profile.vault_baseline_candidates.baseline.*.basis
  allowed_value_type: string
  derive_if: Candidate has value, support, or unknown status.
  value_rule: Concise factual basis; for UNKNOWN use "No reliable public evidence found."
  exclude_if: No legal advice, compliance assessment, registry language, or risk conclusion.
  fallback_if: basis required for each candidate.
  ledger_rule: Record candidate field, basis, refs, FD2 rows.

- field_id: FD2.058
  field_path: target_profile.vault_baseline_candidates.baseline.*.confidence
  allowed_value_type: high | medium | low | unknown
  derive_if: Required for every candidate.
  value_rule: Inherit from source FD2 and downgrade if mapping weaker.
  exclude_if: Do not upgrade because value is convenient or obvious.
  fallback_if: unknown
  ledger_rule: Record inheritance/downgrade.

- field_id: FD2.059
  field_path: target_profile.vault_baseline_candidates.baseline.*.evidence_refs[]
  allowed_value_type: array[string]
  derive_if: Candidate has admitted evidence support.
  value_rule: Minimal sufficient refs, preferably already mapped in field_evidence_refs.
  exclude_if: No rejected/quarantined/access-failed/suppressed/snippet/non-admitted refs.
  fallback_if: Empty array only when UNKNOWN.
  ledger_rule: Record mapping and missing-ref limitations.

- field_id: FD2.060
  field_path: target_profile.vault_baseline_candidates.compliance.*
  allowed_value_type: candidate leaf object
  derive_if: Phase 2 field maps to future compliance/intake question without conclusion.
  value_rule: Use candidate leaf shape with value/status/basis/confidence/evidence_refs.
  exclude_if: Do not output GDPR applies, EU AI Act applies, high-risk, processor, controller, non-compliant, DPIA required, or registry/risk conclusion.
  fallback_if: UNKNOWN candidate leaf.
  ledger_rule: Record source rows and no-conclusion check.

- field_id: FD2.061
  field_path: target_profile.pipeline_assumptions.for_feature_map[]
  allowed_value_type: array[string]
  derive_if: Product wrappers, delivery candidates, or integrations suggest where Phase 3 should inspect.
  value_rule: Review instructions, not findings.
  exclude_if: No archetype assignment, feature inventory, registry language, or data provenance.
  fallback_if: []
  ledger_rule: Record generating FD2 rows.

- field_id: FD2.062
  field_path: target_profile.pipeline_assumptions.for_legal_cartography[]
  allowed_value_type: array[string]
  derive_if: Legal exception use, identity/jurisdiction/operator fields, or delivery model suggest legal/governance docs for Phase 4 review.
  value_rule: Legal-stack navigation hints only.
  exclude_if: No clause review, legal gap conclusion, compliance status, or registry row signal.
  fallback_if: []
  ledger_rule: Record source FD2 rows and exception refs.

- field_id: FD2.063
  field_path: target_profile.pipeline_assumptions.for_registry_matching[]
  allowed_value_type: array[string]
  derive_if: Sector, delivery, touchpoint, public-sector, minor, language, audio, code, or API hints may require later review.
  value_rule: Non-binding downstream review hints only.
  exclude_if: No threat IDs, registry statuses, TRUE/FALSE condition results, or legal conclusions.
  fallback_if: []
  ledger_rule: Record non-triggering/non-binding status.

- field_id: FD2.064
  field_path: target_profile.pipeline_assumptions.for_vault[]
  allowed_value_type: array[string]
  derive_if: Candidate values need confirmation, unknown fields should be asked, or prefill-ready values reduce intake burden.
  value_rule: Operational intake guidance only.
  exclude_if: No legal advice, risk rating, or compliance instruction beyond confirmation need.
  fallback_if: []
  ledger_rule: Record candidate fields generating assumptions.

- field_id: FD2.065
  field_path: target_profile.pipeline_assumptions.assumption_warnings[]
  allowed_value_type: array[string]
  derive_if: Downstream-relevant field is weak/unknown/ambiguous, evidence conflicts, or assumption could be misread as conclusion.
  value_rule: Concise cautionary warnings.
  exclude_if: No dramatic risk language, legal conclusions, or registry-style harm framing.
  fallback_if: []
  ledger_rule: Record source field, warning reason, downstream phase.

- field_id: FD2.066
  field_path: target_profile.evidence.field_evidence_refs[].field_path
  allowed_value_type: string
  derive_if: Substantive field has non-empty/non-N/A value or deterministic derivation.
  value_rule: Exact JSON path only.
  exclude_if: No vague or nonexistent paths.
  fallback_if: Missing path for substantive value blocks lock.
  ledger_rule: Record support event.

- field_id: FD2.067
  field_path: target_profile.evidence.field_evidence_refs[].evidence_refs[]
  allowed_value_type: array[string]
  derive_if: Field value derived from admitted evidence or another cited field.
  value_rule: Minimal sufficient refs. For deterministic derivation, cite source field refs and basis.
  exclude_if: No rejected/quarantined/snippet-only/access-failed/suppressed refs.
  fallback_if: Empty only for schema fields, deterministic IDs, empty arrays, or UNKNOWN candidates.
  ledger_rule: Record evidence coverage.

- field_id: FD2.068
  field_path: target_profile.evidence.field_evidence_refs[].basis
  allowed_value_type: string
  derive_if: Evidence refs exist or deterministic derivation exists.
  value_rule: Compact factual basis.
  exclude_if: No speculation, legal advice, registry conclusions, or hidden reasoning.
  fallback_if: Missing basis for substantive field support blocks lock.
  ledger_rule: Record basis and path.

- field_id: FD2.069
  field_path: target_profile.evidence.field_evidence_refs[].confidence
  allowed_value_type: high | medium | low | unknown
  derive_if: Required for each evidence support entry.
  value_rule: Match field confidence where available; otherwise assign by evidence strength.
  exclude_if: Do not assign higher confidence than underlying field permits.
  fallback_if: unknown
  ledger_rule: Record confidence alignment.

- field_id: FD2.070
  field_path: target_profile.evidence.unresolved_questions[]
  allowed_value_type: array[string]
  derive_if: Required/downstream field is N/A, unknown, empty, low-confidence, ambiguous, conflicting, or requires confirmation.
  value_rule: Answerable operational questions only.
  exclude_if: No legal advice questions, registry row questions, or speculative accusations.
  fallback_if: []
  ledger_rule: Record source field.

- field_id: FD2.071
  field_path: target_profile.limitations[]
  allowed_value_type: array[string]
  derive_if: Phase 1 limitation, access failure, unresolved Phase 2 field, weak evidence, ambiguity, or partial exception access affects profile reliability.
  value_rule: Concise public-footprint limitation statements.
  exclude_if: No liability/compliance conclusions, accusations, registry findings, or absolute statements beyond reviewed public footprint.
  fallback_if: []
  ledger_rule: Record limitation source, affected paths, upstream refs, and phase origin.
```

---

## EXECUTION_PROGRAM

### P2.B1_INPUT_AND_SCOPE_PRECHECK
Allowed FD2 rows: `FD2.001`

1. Confirm required inputs are present.
2. Confirm Phase 1 evidence package includes Phase 2 routed sources or controlled pasted-public-material evidence.
3. Initialize forensic ledger.
4. Initialize empty output skeleton.
5. If inputs are missing, emit controlled failure and stop.

### P2.B2_IDENTITY_DERIVATION
Allowed FD2 rows: `FD2.002-FD2.011`

1. Review core identity evidence.
2. Use legal identity exception corridor only for legal name, entity type, operator/controller, and corporate status signal.
3. Populate identity fields.
4. Record all evidence refs and exception access.
5. Record unresolved identity questions and limitations.

### P2.B3_JURISDICTION_DERIVATION
Allowed FD2 rows: `FD2.012-FD2.020`

1. Use legal identity exception corridor where needed.
2. Extract registered/notice location, address, governing law, and venue only from allowed evidence.
3. Do not infer jurisdiction from TLD, language, customers, server regions, or office assumptions.
4. Populate jurisdiction confidence.
5. Record all evidence refs.

### P2.B4_BUSINESS_MODEL_DERIVATION
Allowed FD2 rows: `FD2.021-FD2.028`

1. Review homepage/product/pricing/commercial material.
2. Derive business category, customer type, market type candidate, sales motion, revenue signal, enterprise/self-serve signal, public-sector signal.
3. Do not produce legal or registry conclusions.
4. Populate business_model confidence.

### P2.B5_MARKET_CONTEXT_DERIVATION
Allowed FD2 rows: `FD2.029-FD2.033`

1. Derive industry, target geographies, target languages, and regulated sector hints only where visible.
2. Regulated sector hints are factual market hints, not legal classifications.
3. Populate market_context confidence.

### P2.B6_PRODUCT_BASELINE_DERIVATION
Allowed FD2 rows: `FD2.034-FD2.045`

1. Derive high-level offering and primary claim.
2. List product/platform/solution wrappers.
3. Do not decompose into atomic features.
4. Derive app/API delivery candidates.
5. Derive beta/preview and integration candidates.
6. Record product-wrapper dedupe decisions.

### P2.B7_BASELINE_DATA_TOUCHPOINT_DERIVATION
Allowed FD2 rows: `FD2.046-FD2.054`

1. Identify visible baseline data touchpoints only.
2. Do not build data flows or data provenance.
3. Emit touchpoints only when evidence-supported.
4. Omit unknown-confidence items and record limitation.

### P2.B8_VAULT_CANDIDATE_DERIVATION
Allowed FD2 rows: `FD2.055-FD2.060`

1. Map Phase 2 values to baseline/compliance candidate leaves.
2. Use candidate statuses: PREFILL_READY, CONFIRM, UNKNOWN.
3. Do not create legal/compliance/risk conclusions.

### P2.B9_PIPELINE_ASSUMPTION_DERIVATION
Allowed FD2 rows: `FD2.061-FD2.065`

1. Generate downstream navigation hints only.
2. Hints may point downstream phases to evidence families/fields.
3. Hints may not trigger registry, assign features, or produce legal conclusions.
4. Record warnings where assumptions may be misread.

### P2.B10_EVIDENCE_AND_LIMITATION_ASSEMBLY
Allowed FD2 rows: `FD2.066-FD2.071`

1. Create field_evidence_refs for every substantive populated field.
2. Create unresolved_questions for fields requiring confirmation.
3. Create limitations for public-footprint boundaries.
4. Confirm all evidence refs are admitted or controlled pasted-material refs.

### P2.B11_TRACE_LEDGER_HANDOFF_EMISSION

1. Validate schema.
2. Validate field coverage.
3. Validate no forbidden phase drift.
4. Set ledger status.
5. Emit only required top-level JSON keys.

---

## TRACE_LEDGER_AND_HANDOFF_SCHEMA

Emit exactly:

```json
{
  "target_profile_forensic_ledger": {
    "phase_id": "P2_TARGET_PROFILE",
    "ledger_status": "DRAFT | LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE",
    "ledger_events": [],
    "coverage_matrix": {
      "required_input_objects": [],
      "reviewed_source_refs": [],
      "not_reviewed_source_refs": [],
      "exception_access_events": [],
      "field_coverage": [],
      "fallback_fields": [],
      "unresolved_fields": []
    }
  },
  "target_profile_trace": {
    "phase_id": "P2_TARGET_PROFILE",
    "input_status": "OK | MISSING_REQUIRED_INPUT | CONTROLLED_FAILURE",
    "execution_batches": [],
    "field_rows_applied": [],
    "exception_corridors_used": [],
    "forbidden_scope_checks": {
      "feature_decomposition": "PASS | FAIL",
      "legal_cartography": "PASS | FAIL",
      "data_provenance": "PASS | FAIL",
      "registry_evaluation": "PASS | FAIL",
      "legal_or_compliance_conclusion": "PASS | FAIL",
      "extra_output_keys": "PASS | FAIL"
    },
    "lock_status": "LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE"
  },
  "target_profile": {
    "identity": {
      "brand_name": "",
      "legal_name": "",
      "trade_names": [],
      "website": "",
      "domain": "",
      "entity_type": "",
      "entity_type_family": "india | us | eu_uk | other | unknown",
      "corporate_status_signal": "",
      "operator_or_controller_signal": "",
      "identity_confidence": "high | medium | low | unknown"
    },
    "jurisdiction": {
      "registered_or_notice_country": "",
      "registered_or_notice_state": "",
      "city": "",
      "full_address": "",
      "governing_law_country": "",
      "governing_law_state": "",
      "courts_or_venue": "",
      "source_basis": "",
      "confidence": "high | medium | low | unknown"
    },
    "business_model": {
      "business_category": "",
      "primary_customer_type": "",
      "market_type_candidate": "b2b | b2c | hybrid | unknown",
      "sales_motion": "",
      "revenue_model_signal": "",
      "enterprise_or_self_serve_signal": "",
      "public_sector_signal": "",
      "business_model_confidence": "high | medium | low | unknown"
    },
    "market_context": {
      "industry": "",
      "target_geographies": [],
      "target_languages": [],
      "regulated_sector_hints": [],
      "market_context_confidence": "high | medium | low | unknown"
    },
    "product_baseline": {
      "high_level_offering": "",
      "primary_claim": "",
      "products": [
        {
          "name": "",
          "description": "",
          "source_url": "",
          "evidence_refs": [],
          "evidence_quote": "",
          "confidence": "high | medium | low | unknown"
        }
      ],
      "delivery_app_candidate": "true | false | unknown",
      "delivery_api_candidate": "true | false | unknown",
      "beta_or_preview_signal": "",
      "integration_candidates": [
        {
          "name": "",
          "source_url": "",
          "evidence_refs": [],
          "evidence_quote": "",
          "confidence": "high | medium | low | unknown"
        }
      ]
    },
    "data_touchpoint_map": [
      {
        "touchpoint_id": "DT001",
        "actor": "end_user | customer_admin | enterprise_customer | developer | third_party | unknown",
        "data_subject": "user | customer | employee | consumer | developer | child | business_entity | unknown",
        "data_category": "account | contact | prompt | uploaded_file | generated_output | audio | text | document | image | video | code | api_payload | usage_log | payment | support | sensitive | unknown",
        "collection_or_processing_context": "",
        "source_url": "",
        "evidence_refs": [],
        "evidence_quote": "",
        "confidence": "high | medium | low | unknown"
      }
    ],
    "vault_baseline_candidates": {
      "baseline": {},
      "compliance": {}
    },
    "pipeline_assumptions": {
      "for_feature_map": [],
      "for_legal_cartography": [],
      "for_registry_matching": [],
      "for_vault": [],
      "assumption_warnings": []
    },
    "evidence": {
      "field_evidence_refs": [
        {
          "field_path": "",
          "evidence_refs": [],
          "basis": "",
          "confidence": "high | medium | low | unknown"
        }
      ],
      "unresolved_questions": []
    },
    "limitations": []
  }
}
```

---

## TERMINAL_GATE

Phase 2 may lock only if all gates pass.

```yaml
G2.001_REQUIRED_INPUT_GATE:
  pass_if: required input objects are present or controlled failure is emitted

G2.002_SCHEMA_GATE:
  pass_if: output contains exactly target_profile_forensic_ledger, target_profile_trace, target_profile

G2.003_target_profile_OBJECT_GATE:
  pass_if: target_profile contains all required child objects

G2.004_FIELD_DERIVATION_GATE:
  pass_if: every substantive field was derived through its FD2 row or valid fallback

G2.005_EVIDENCE_REF_GATE:
  pass_if: every substantive populated field has admitted evidence support or deterministic derivation from cited field

G2.006_EXCEPTION_CORRIDOR_GATE:
  pass_if: all exception evidence access is logged and used only for permitted field classes

G2.007_NO_FEATURE_DECOMPOSITION_GATE:
  pass_if: product_baseline contains wrappers only, not atomic features

G2.008_NO_LEGAL_CARTOGRAPHY_GATE:
  pass_if: Phase 2 did not index clauses, review legal sufficiency, or evaluate legal documents beyond permitted identity/context extraction

G2.009_NO_DATA_PROVENANCE_GATE:
  pass_if: data_touchpoint_map contains baseline visible touchpoints only

G2.010_NO_REGISTRY_EVALUATION_GATE:
  pass_if: no threat IDs, registry statuses, condition TRUE/FALSE results, or exposure conclusions are emitted

G2.011_NO_LEGAL_COMPLIANCE_CONCLUSION_GATE:
  pass_if: no legal advice/compliance conclusion/risk conclusion appears anywhere

G2.012_LEDGER_COMPLETENESS_GATE:
  pass_if: forensic ledger records inputs, reviewed sources, exceptions, field derivations, fallbacks, and limitations

G2.013_TRACE_COMPLETENESS_GATE:
  pass_if: target_profile_trace lists batches, field row ranges, exception corridors, and forbidden scope checks

G2.014_LOCK_STATUS_GATE:
  pass_if: lock_status is LOCKED only when all gates pass; otherwise REPAIR_REQUIRED or CONTROLLED_FAILURE
```

If any gate fails, do not output `LOCKED`.

---

## FINAL_OUTPUT_INSTRUCTION

When executing Phase 2, output valid JSON only. No markdown. No commentary. No explanatory text outside JSON.
