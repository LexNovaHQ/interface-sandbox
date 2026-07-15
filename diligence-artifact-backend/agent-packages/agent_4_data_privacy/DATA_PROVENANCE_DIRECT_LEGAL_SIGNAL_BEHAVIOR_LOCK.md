# Data Provenance Profile — Direct Legal Signal Behavior Lock

This file is part of the Data Provenance Profile prompt stack.

It controls how Data Provenance Profile consumes `legal_signal_derivation_profile`.

## Active source boundary

Data Provenance Profile may use:

- D1-D5 data/privacy/security/control families as primary field-derivation material;
- `target_feature_profile` as the activity spine;
- `legal_cartography_index` as navigation and locator context only;
- `legal_signal_derivation_profile` as deterministic support for DAP.CONTACT and DAP.CM rows only.

Data Provenance Profile must not use:

- whole L-family artifacts;
- `m10_selected_legal_support_packet`;
- model memory for contact, consent, grievance, rights, governing-law, or legal notice values;
- legal conclusions, compliance conclusions, or legal sufficiency statements.

## Allowed direct-signal field families

From `legal_signal_derivation_profile`, Data Provenance Profile may use only:

```text
privacy_grievance_contact_signal_map
consent_manager_signal_map
```

Allowed field IDs:

```text
DAP.CONTACT.001
DAP.CONTACT.002
DAP.CONTACT.003
DAP.CONTACT.004
DAP.CONTACT.005
DAP.CM.001
DAP.CM.002
DAP.CM.003
DAP.CM.004
DAP.CM.005
DAP.CM.006
DAP.CM.007
```

## Forbidden direct-signal field families

Data Provenance Profile must not use these direct-signal groups for material derivation:

```text
legal_notice_contact_signal_map
jurisdiction_dispute_signal_map
```

Those are consumed by Target Profile Review or downstream review workflows, not by Data Provenance Profile material derivation.

## Status translation

```text
DERIVED -> use value when it fits the authorized nested object.
DERIVED_WITH_LIMITATION -> use value only with limitation.
LOCATOR_FOUND_VALUE_NOT_VISIBLE -> do not invent value; mark controlled not visible.
SOURCE_NOT_PUBLIC -> do not invent value; mark controlled not public.
SOURCE_CONFLICT -> do not choose a winner; mark controlled conflict.
NOT_APPLICABLE_CONTEXTUAL -> mark not applicable where the nested object permits.
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN -> do not invent value; mark controlled not found after scan.
```

## Output placement

Direct signal values may appear only inside the already-authorized nested homes:

```text
data_provenance_profile.privacy_governance_contact_accountability_signals[].contact_routes
```

```text
data_provenance_profile.consent_withdrawal_controls[].consent_manager_readiness
```

```text
data_provenance_profile.law_regulatory_readiness_matrix[] where readiness_area = consent_manager_readiness
```

They must not create new top-level fields.
