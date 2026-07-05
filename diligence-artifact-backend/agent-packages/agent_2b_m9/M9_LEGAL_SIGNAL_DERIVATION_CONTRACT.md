# Legal Cartography and Index — Legal Signal Derivation Contract

This file belongs to the **Legal Cartography and Index** phase.

The compatibility filename retains the old internal identifier because existing package manifests still reference it.

It governs Job B:

```text
LEGAL_SIGNAL_DERIVATION
```

Job B is deterministic. It emits one artifact:

```text
legal_signal_derivation_profile
```

## Source Boundary

Job B may read only:

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
legal_cartography_index
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
field derivation registry contact/consent patch
```

Job B must not browse, crawl, fetch new URLs, infer private documents, or read Target Profile Review, Activity Profile Review, Data Provenance Profile, Exposure Profile, Operator Challenge, Compiler, or Renderer artifacts.

## Derivation Authority

The field derivation registry field ID is the derivation authority.

Reviewer question IDs, reviewer prompts, and UI copy are not derivation authority.

## Required Output Groups

```text
legal_notice_contact_signal_map
jurisdiction_dispute_signal_map
privacy_grievance_contact_signal_map
consent_manager_signal_map
```

## Required Field Rows

```text
LGC.NOT.010 legal_notice_email
LGC.NOT.011 legal_notice_contact_route
LGC.NOT.012 legal_notice_contact_evidence_basis
LGC.NOT.013 legal_notice_contact_limitation

TP.JUR.003 governing_law_country
TP.JUR.004 governing_law_state
TP.JUR.005 courts_venue
TP.JUR.007 jurisdiction_evidence_basis
TP.JUR.008 jurisdiction_uncertainty

DAP.CONTACT.001 privacy_contact_email
DAP.CONTACT.002 grievance_contact_email
DAP.CONTACT.003 officer_contact
DAP.CONTACT.004 evidence_basis
DAP.CONTACT.005 limitation

DAP.CM.001 applicability_signal
DAP.CM.002 public_flow_visible
DAP.CM.003 consent_artifact_route
DAP.CM.004 withdrawal_revocation_grievance_route
DAP.CM.005 third_party_route_signal
DAP.CM.006 evidence_basis
DAP.CM.007 limitation
```

Total required field rows: `21`.

## Allowed Statuses

Use only:

```text
DERIVED
DERIVED_WITH_LIMITATION
LOCATOR_FOUND_VALUE_NOT_VISIBLE
SOURCE_NOT_PUBLIC
SOURCE_CONFLICT
NOT_APPLICABLE_CONTEXTUAL
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN
```

Do not emit loose failure terms such as unknown, not found, not derived, unclear, N/A, or blank status.

## Required Row Fields

Each field row must include:

```text
field_id
field_key
field_family
derivation_status
value
evidence_basis
locator_basis
scanned_sources
failure_reason
limitation
confidence
downstream_consumers
```

## Evidence Gates

```text
DERIVED requires evidence_basis.
DERIVED_WITH_LIMITATION requires evidence_basis and limitation.
LOCATOR_FOUND_VALUE_NOT_VISIBLE requires locator_basis.
SOURCE_CONFLICT requires at least two evidence rows.
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN requires scanned_sources and failure_reason.
```

If a locator exists, Job B must not use `NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN`.

## Forbidden Output Content

Job B must not emit:

```text
question_id
reviewer_question
question_rows
question_index
qualified_review_legal_signals
m7_deterministic_legal_signal_overlay
m10_selected_legal_support_packet
target_profile
data_provenance_profile
renderer_payload
full_clause_text
```

The old support artifact names above are retained here only as forbidden compatibility artifact names.

## Downstream Boundary

Target Profile Review, Data Provenance Profile, and Qualified Review integration is controlled by their own phase contracts.

Job B may expose downstream consumer metadata, but it must not include reviewer question text or UI prompt text.
