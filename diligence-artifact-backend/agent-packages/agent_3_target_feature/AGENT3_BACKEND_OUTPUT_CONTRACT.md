# Agent 3 Backend Output Contract

Backend model responses are strict JSON only. Each active save event returns exactly one phase-owned artifact root. Combined material/forensic responses are forbidden.

## Target Profile Review

Return exactly:

```json
{"target_profile": {}}
```

`target_profile` contains only its five material branches:

```text
target_identity
jurisdiction_notice
business_context
product_service_wrapper
target_profile_limitations
```

Do not emit forensics, indexes, source ledgers, downstream profiles, challenge, compiler or renderer output.

## Sector derivation backend artifact

The internal artifact name remains `domain_derivation_profile`. Return exactly:

```json
{"domain_derivation_profile": {}}
```

The backend—not the model—writes `active_run_package_manifest` after validation. Regulatory overlay derivation remains candidate-only and does not make legal-applicability or compliance conclusions.

## Target Profile Forensics

Return exactly:

```json
{"target_profile_forensics": {}}
```

Do not re-emit the material profile.

## Activity candidate inventory

Return exactly:

```json
{"feature_candidate_inventory": {}}
```

This deterministic-led inventory is a separate save event from the material activity profile.

## Activity Profile Review material output

`M8_TARGET_FEATURE_PROFILE` returns exactly:

```json
{
  "target_feature_profile": {
    "activities": [],
    "commercial_availability_posture": {},
    "profile_level_limitations": [],
    "mounted_taxonomy_ref": {
      "primary_package_id": "",
      "primary_key_version": "",
      "overlays": []
    }
  }
}
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

`primary_classification` contains exactly:

```text
package_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Each `overlay_classifications[]` block contains exactly:

```text
package_id
overlay_id
behavior_class_codes
behavior_class_derivation_basis
surface_context_tokens
surface_derivation_basis
```

Primary and capability-overlay classifications are package-scoped and independent. Each has its own Behavior Class and Surface arrays and derivation bases. Regulatory overlays are forbidden from activity classification.

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

Controlled limitations are:

```text
PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<package_id>
NO_PRIMARY_BEHAVIOR_CLASS_MATCH:<activity_reference>
OVERLAY_HAS_NO_TAXONOMY_KEY:<overlay_id>
DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_ROUTED:<root>
DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_INDEXED:<root>
```

The backend stamps `mounted_taxonomy_ref`. The model must not override it.

Forbidden anywhere in `target_feature_profile`:

```text
URLs
source IDs or pointers
candidate IDs
confidence
validation or lock status
ledgers
runtime traces
copied evidence text
forensic artifacts
retired Phase 5 classification paths
```

## Activity Profile Forensics

Return exactly:

```json
{"target_feature_profile_forensics": {}}
```

Do not re-emit the material activity profile.

## Global response rule

Never wrap a phase-owned artifact inside `phase_output`, `output`, `result` or an array. Never return multiple production artifacts from one save event.
