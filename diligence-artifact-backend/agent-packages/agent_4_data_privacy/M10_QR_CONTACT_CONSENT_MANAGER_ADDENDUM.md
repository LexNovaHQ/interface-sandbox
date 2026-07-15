# Data Provenance Profile — Contact Routes and Consent Manager Readiness Addendum

This addendum is part of the **Data Provenance Profile** phase.

Compatibility note: the file name is retained because the current backend still references it.

It authorizes two nested material derivation objects without expanding the locked 34 top-level Data Provenance Profile material-field contract.

## Hard lock

Data Provenance Profile remains a 34 top-level field material profile.

Do not add top-level fields named:

```text
contact_routes
consent_manager_readiness
```

Do not expand Data Provenance Profile to 36 top-level material fields.

The authorized locations are:

```text
data_provenance_profile.privacy_governance_contact_accountability_signals[].contact_routes
```

```text
data_provenance_profile.consent_withdrawal_controls[].consent_manager_readiness
```

```text
data_provenance_profile.law_regulatory_readiness_matrix[] where readiness_area = "consent_manager_readiness"
```

## Source boundary

Derive these objects only from Data Provenance Profile-approved sources:

- D1-D5 data/privacy/security/control families;
- `legal_cartography_index` as navigation/context only;
- `legal_signal_derivation_profile` as deterministic support for DAP.CONTACT and DAP.CM rows only;
- `target_feature_profile` as activity spine only.

Do not use whole L-family artifacts.

Do not use `m10_selected_legal_support_packet`.

Do not browse, fetch, crawl, search, or infer from model memory.

## Direct legal signal status translation

When using `legal_signal_derivation_profile`, translate source-row status into Data Provenance Profile behavior as follows:

```text
DERIVED -> use value when it fits the authorized nested object.
DERIVED_WITH_LIMITATION -> use value only with limitation.
LOCATOR_FOUND_VALUE_NOT_VISIBLE -> do not invent value; mark controlled not visible.
SOURCE_NOT_PUBLIC -> do not invent value; mark controlled not public.
SOURCE_CONFLICT -> do not choose a winner; mark controlled conflict.
NOT_APPLICABLE_CONTEXTUAL -> mark not applicable where the nested object permits.
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN -> do not invent value; mark controlled not found after scan.
```

The direct signal profile is support material only. It is not legal advice, not compliance proof, not legal sufficiency, and not permission to read legal-family source text.

## contact_routes object

Registry authority:

```text
DAP.CONTACT.001
DAP.CONTACT.002
DAP.CONTACT.003
DAP.CONTACT.004
DAP.CONTACT.005
```

Authorized nested shape:

```json
{
  "contact_routes": {
    "privacy_contact_email": "",
    "grievance_contact_email": "",
    "dpo_or_privacy_officer_contact": "",
    "rights_request_contact_route": "",
    "evidence_basis": [],
    "anti_unknown_status": "",
    "limitation": ""
  }
}
```

Derivation rules:

- `privacy_contact_email` must be a visible privacy/data-protection contact email or a controlled Anti-Unknown value.
- `grievance_contact_email` must be a visible grievance/redressal contact email or a controlled Anti-Unknown value.
- `dpo_or_privacy_officer_contact` must be a visible DPO, privacy officer, grievance officer, or accountable contact route, or a controlled Anti-Unknown value.
- `rights_request_contact_route` must be a visible access/correction/deletion/export/objection/restriction/rights-request route, or a controlled Anti-Unknown value.
- `evidence_basis[]` must be short business-readable basis notes from approved material. No source URLs, source IDs, excerpts, trace, or forensic rows.
- `anti_unknown_status` must use the active Data Provenance Profile Anti-Unknown vocabulary.
- `limitation` must state what still requires qualified review/private confirmation.

Forbidden inference:

- Do not invent privacy@, dpo@, grievance@, legal@, support@, or contact@ addresses.
- Do not treat a general sales/support route as a privacy/grievance/DPO route unless the source says so.
- Do not state DPDP/GDPR compliance or legal role conclusions.

## consent_manager_readiness object

Registry authority:

```text
DAP.CM.001
DAP.CM.002
DAP.CM.003
DAP.CM.004
DAP.CM.005
DAP.CM.006
DAP.CM.007
```

Authorized nested shape:

```json
{
  "consent_manager_readiness": {
    "applicability_signal": "",
    "public_flow_visible": "",
    "consent_collection_artefact_route": "",
    "withdrawal_revocation_grievance_route": "",
    "third_party_route_signal": "",
    "evidence_basis": [],
    "anti_unknown_status": "",
    "limitation_private_confirmation_required": ""
  }
}
```

Derivation rules:

- `applicability_signal` is a readiness signal only. It must not state that DPDP or any law applies.
- `public_flow_visible` must say whether a public Consent Manager / consent-management flow is visible, not visible, access-failed, or not searched.
- `consent_collection_artefact_route` must identify visible consent collection, consent artifact, consent dashboard, consent preference, privacy controls, or equivalent route where supported.
- `withdrawal_revocation_grievance_route` must identify visible withdrawal, revocation, opt-out, grievance, or rights route where supported.
- `third_party_route_signal` must identify visible third-party Consent Manager / consent platform / integration signal where supported.
- `evidence_basis[]` must be short business-readable basis notes from approved material. No source URLs, source IDs, excerpts, trace, or forensic rows.
- `anti_unknown_status` must use the active Data Provenance Profile Anti-Unknown vocabulary.
- `limitation_private_confirmation_required` must state what Qualified Review/private confirmation must verify.

Forbidden inference:

- Do not infer a Consent Manager flow from a generic cookie banner, privacy policy, opt-out, or consent wording unless the source identifies an actual consent-management route or equivalent public control flow.
- Do not state India DPDP applicability, compliance, violation, or legal sufficiency.
- Do not convert readiness labels into legal conclusions.

## Readiness matrix row

`law_regulatory_readiness_matrix[]` should include a row with:

```text
readiness_area: consent_manager_readiness
```

The row is readiness-only and must use the locked nested row schema.

The row must not say DPDP applies, does not apply, is complied with, or is violated.

## Report and Qualified Review use

These nested objects are material-profile values.

They are eligible for report display under Data Provenance & Controls and Qualified Review prefill after mapping is updated.

They are not forensic-only notes and not placeholder labels.
