# Target and Activity Profile Validator Rules

## Universal gates

- Validate the exact active phase and phase-owned root.
- Material artifacts are separate from forensic artifacts.
- Reject downstream profiles, exposure outputs, challenge gates, compiler output and renderer payloads.
- Reject unsupported source claims, model memory, copied evidence and schema-shaped but ungrounded values.

## Target Profile Review

`target_profile` contains exactly:

```text
target_identity
jurisdiction_notice
business_context
product_service_wrapper
target_profile_limitations
```

Regulatory/licensing and grievance fields remain factual public-context signals, not legal conclusions.

## Internal Sector Derivation Layer

The internal artifact remains `domain_derivation_profile`. It is Registry-Key-led and domain-agnostic. Regulatory overlays are candidate-only and may not state legal applicability, licensing validity, compliance status or legal advice.

## Phase 5 Activity Profile Review — v9 Behavior Class canonical

`M8_TARGET_FEATURE_PROFILE` emits exactly one root:

```text
target_feature_profile
```

The profile contains exactly:

```text
activities
commercial_availability_posture
profile_level_limitations
mounted_taxonomy_ref
```

Each activity contains exactly:

```text
activity_reference
product_service_wrapper
activity_feature_name
activity_candidate_summary
mechanics_proof
autonomy_human_control_signal
data_content_object_touched
external_internal_action_signal
primary_classification
overlay_classifications
```

Primary classification contains exactly:

```text
package_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Each capability-overlay block contains exactly:

```text
package_id
overlay_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Validate independently for the primary block and every overlay block:

- package-scoped membership against that block's mounted Registry Key;
- every selected Behavior Class has exactly one matching basis entry;
- every selected Surface has exactly one matching basis entry;
- no basis exists for an unselected code or token;
- primary and overlay arrays may differ and must not be collapsed;
- no unresolved capability-overlay block;
- no regulatory-overlay block;
- no forced catch-all Behavior Class.

Each basis entry contains exactly:

```text
code_or_token
normalized_name
conditions_satisfied
trigger_if_applied
exclude_if_checked
material_basis
limitation
```

The backend stamps `mounted_taxonomy_ref`; the model may not override it.

Controlled empty-primary classification requires:

```text
PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<package_id>
```

or:

```text
NO_PRIMARY_BEHAVIOR_CLASS_MATCH:<activity_reference>
```

Forbidden in the material profile:

- URLs, source IDs and source pointers;
- candidate IDs and confidence;
- validation or lock status;
- ledgers and runtime traces;
- copied evidence or lossless text;
- forensic branches;
- retired Phase 5 classification paths or limitation tokens.
