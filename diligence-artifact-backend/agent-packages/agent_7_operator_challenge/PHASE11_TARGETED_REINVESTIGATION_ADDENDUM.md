# PHASE 11 TARGETED REINVESTIGATION ADDENDUM

This addendum applies only when the runtime packet contains:

```text
upstream_artifacts.phase11_reinvestigation_context
```

The owning phase must treat that object as the controlling Phase 11 directive. Do not rely on `contract.phase11_reinvestigation_context`; ordinary runtime packets do not serialize that object.

## Scope lock

The owning phase must reconsider only the exact material identified in:

```text
upstream_artifacts.phase11_reinvestigation_context
```

The controlling fields are:

```text
schema_version
dispatch_id
challenge_candidate_id
attempt_number
owning_phase
owner_internal_job
artifact_names[]
field_paths[]
affected_row_identity[]
problem
required_reinvestigation
baseline_artifact_versions
packet_fingerprint
```

## Mandatory rules

1. Preserve every unaffected field and row from the currently saved canonical artifact.
2. Do not broaden the inquiry beyond the listed field paths or affected row identities.
3. Do not rerun downstream phases.
4. Do not create a new activity, obligation, exposure, data field, domain, package or registry row unless Phase 11 later authorizes a critical systemic reconstruction protocol.
5. Do not alter compound `registry_row_key` identity.
6. Do not use forensic profiles.
7. Re-evaluate the challenged field against the phase's existing lawful evidence and routing contract.
8. Return only the owner-phase artifact/proposal required by the Phase 11 targeted adapter, changing only the challenged material and mechanically dependent fields.
9. The owner phase does not decide whether the challenge is resolved. Phase 11 rebuilds Layer 1 and makes that determination deterministically.
10. The owner phase must not emit `challenge_gate`, a blocking decision, or a reinvestigation-attempt result.
11. The owner phase must not change the `dispatch_id`, `challenge_candidate_id`, `attempt_number`, `owner_internal_job`, `artifact_names`, `field_paths`, `affected_row_identity`, `baseline_artifact_versions`, or `packet_fingerprint`.

## Attempt doctrine

- Attempt 1 and attempt 2 use the same bounded field scope unless Phase 11 issues a new directive.
- There is no third attempt.
- Provider retries, malformed output repair and transport failures are technical events, not substantive attempts.
- Failure to resolve the field after attempt 2 becomes an explicit warning and does not block the run unless Layer 3 separately confirms a critical systemic failure.
