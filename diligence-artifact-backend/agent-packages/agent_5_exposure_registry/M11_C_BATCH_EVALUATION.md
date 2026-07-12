# M11_C_BATCH_EVALUATION

## PURPOSE

Evaluate only the package-scoped M11 batch supplied in `m11_batch_packet`.

This is Layer 2 semantic evidence application only. Do not evaluate rows outside the active packet. Do not select registries, classify activities, route rows, choose stream membership, choose batch membership, resize the batch, rebuild the route plan, merge the workpad, project profiles, assemble forensics, emit a challenge gate, or write report prose.

## CONTRACT VERSION

```text
M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1
```

## REQUIRED PACKET

The backend packet must satisfy `M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1` and provide immutable batch identity:

```text
batch_id
batch_group
stream_id
stream_type
package_id
source_domain
expected_registry_row_keys[]
expected_threat_ids[]
row_count
registry_rows[]
```

The batch contains one package, one stream, and one archetype group. `row_count` is at most 15.

The model must preserve the canonical `Threat_ID` exactly. The model must not emit `registry_row_key`, prepend the package ID to a Threat ID, rename a Threat ID, or compare the active package with another package.

## SEMANTIC ROLE

The backend owns the deterministic registry spine and custody fields, including:

```text
registry_row_key
Threat_ID
Threat_Name
package_id
source_domain
stream_id
stream_type
Archetype
Subcategory
Surface
authority_anchors
pain fields
Legal_Pain
base FP mechanism
remediation source
review route
parsed Hunter Trigger
route and route reason
matched activity references
batch membership
final material status
```

The model owns only these semantic evidence-application fields:

```text
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
applied_fp_mechanism
row_limitations
status_inputs
```

`trigger_status` may be returned as a non-authoritative short diagnostic label. It is not a final material status and the backend may ignore it.

Do not emit `evaluation_status`, final profile placement, deterministic spine fields, or any downstream artifact.

## EVIDENCE AUTHORITY

Apply the exact parsed Hunter Trigger for each supplied registry row to the admitted evidence in that row’s packet.

Use this discipline:

1. Hunter Trigger conditions and logic are the row-level evaluation authority.
2. Supplied primary evidence is the proof basis.
3. M9 legal cartography is the mandatory navigation map into legal/governance primary evidence.
4. Recorded index-gap navigation inside the same routed primary evidence bucket remains primary evidence navigation; it is not fallback evidence.
5. Phase 5 classification and route reason establish why the row entered this batch, not whether the Hunter Trigger is satisfied.
6. Domain-control-obligation context is contextual only and cannot independently trigger, exclude, or control a row.
7. Legal-cartography metadata is not substantive proof except for document-presence, document-absence, custody, navigation, or evidence-limitation questions.
8. Silence, missing pages, gated flows, or unavailable evidence are limitations unless the exact Hunter Trigger expressly makes a verified absence dispositive.

Do not fabricate facts, controls, exclusions, jurisdictions, deployment contexts, user flows, or regulatory applicability.

## CONDITION-BY-CONDITION DISCIPLINE

For every row, `basis_proof` must identify:

- which parsed Hunter Trigger conditions are directly supported;
- which conditions are contradicted, unsupported, or only partially supported;
- whether the `TRIGGER_IF` logic is satisfied;
- whether the `EXCLUDE_IF` logic is satisfied;
- the specific supplied evidence supporting each conclusion.

Do not set `trigger_if_met = yes` from general product capability, domain classification, route membership, registry status, marketing language, or legal-policy silence.

Jurisdiction-specific, deployment-specific, UI-flow, consent-flow, cancellation-flow, biometric/audio, investor-facing, regulated-claim, or licensing rows require direct evidence of the specific condition. Where that evidence is absent or indirect, use `partial` or `no` and carry the limitation.

## HUMAN-READABLE FIELD RULE

These report-facing fields must be concise narrative text, not scalar labels:

```text
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
row_limitations
```

Do not use only `yes`, `no`, `partial`, `true`, `false`, `unknown`, `n/a`, or equivalent scalar text.

- `target_match` identifies the specific supplied target activity, product, data practice, or document signal connected to the row.
- `basis_proof` applies the Hunter Trigger condition by condition.
- `control_exclusion_evaluation` explains any supplied visible control or exclusion and whether it defeats or merely reduces the exposure.
- `evidence_source_basis` names the actual supplied source types and evidence units used.
- `row_limitations` states the exact missing or ambiguous evidence without generic boilerplate.

## STATUS INPUT CONTRACT

Every row must include exactly these lower-case `yes | no | partial` inputs:

```text
target_match_present
hunter_conditions_met
trigger_if_met
exclude_if_met
visible_control_present
visible_control_defeats_or_reduces_exposure
evidence_sufficient
public_evidence_limitation
false_positive_concern
```

The model does not derive the final material status. The backend owns that derivation.

## OUTPUT ROOT

Return exactly one JSON root:

```json
{
  "m11_batch_registry_ledger": {
    "semantic_contract_version": "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
    "batch_id": "",
    "batch_group": "",
    "stream_id": "",
    "stream_type": "PRIMARY | OVERLAY",
    "package_id": "",
    "source_domain": "",
    "expected_threat_ids": [],
    "returned_threat_ids": [],
    "m9_legal_cartography_consumed": true,
    "batch_registry_ledger": []
  }
}
```

The echoed batch metadata must match the supplied packet exactly.

## ROW SHAPE

Each `batch_registry_ledger[]` item must contain exactly these semantic keys plus canonical `Threat_ID`; optional `trigger_status` is permitted:

```json
{
  "Threat_ID": "",
  "trigger_status": "",
  "target_match": "",
  "basis_proof": "",
  "control_exclusion_evaluation": "",
  "evidence_source_basis": "",
  "applied_fp_mechanism": "",
  "row_limitations": "",
  "status_inputs": {
    "target_match_present": "yes | no | partial",
    "hunter_conditions_met": "yes | no | partial",
    "trigger_if_met": "yes | no | partial",
    "exclude_if_met": "yes | no | partial",
    "visible_control_present": "yes | no | partial",
    "visible_control_defeats_or_reduces_exposure": "yes | no | partial",
    "evidence_sufficient": "yes | no | partial",
    "public_evidence_limitation": "yes | no | partial",
    "false_positive_concern": "yes | no | partial"
  }
}
```

## EXACT-COVERAGE RULE

- Return one row for every `expected_threat_ids` item.
- Return no other row.
- Preserve expected order.
- `returned_threat_ids` must equal `expected_threat_ids` exactly.
- Do not group or summarize Threat IDs.
- Do not omit a row because evidence is weak; return the row with explicit limitations and conservative status inputs.
- Do not return a partial ledger.

## FORBIDDEN OUTPUT

The model must not emit:

```text
registry_row_key
Threat_Name
package routing changes
stream changes
classification changes
batch changes
Archetype
Subcategory
Surface
authority anchors
pain fields
remediation
review_route
evaluation_status
active_threat_registry_manifest
exposure_registry_route_plan
exposure_registry_batch_validation
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
challenge_gate
compiler or renderer output
```

Evidence gaps are limitations, not hallucination permission. Stop after the single semantic ledger root.