# Phase 13 Submission and Diligence-QA Contract v1

## Status

`CO-P13-10_TO_11_ACTIVE`

## Sequence

```text
AWAITING_QUALIFIED_REVIEW
→ QUALIFIED_REVIEW_SUBMISSION
→ DILIGENCE_QA_COMPLETE
→ AWAITING_ASSEMBLY
```

This sequence is authoritative for the active runtime. The submission compiler runs before the Diligence-QA gate.

## CO-P13-10 — Qualified Review Submission

### Inputs

The submission compiler reads only:

- `qualified_review_submission_request`
- `qualified_review_handoff`
- `qr_active_field_ledger`
- `qr_registry_resolution_manifest`

It also loads the active QR registry authority and template manifest from repository references.

### Outputs

The compiler writes exactly:

- `qualified_review_submission`
- `qr_final_value_ledger`
- `document_activation_manifest`

These artifacts are immutable version-1 artifacts.

### Final-value authority

Every active atomic value is compiled into the final-value ledger as one of:

- `REVIEWER_EDIT`
- `REVIEWER_ATTESTED_PHASE_12`
- `REVIEWER_ATTESTED_MARKET_BASED`
- `REVIEWER_CONFIRMED_ACTIVATION_PROBE`
- `REVIEWER_NOT_APPLICABLE`

Phase 12 remains immutable. The final ledger records Phase 12 routes and report artifacts as provenance but never writes back upstream.

### Section finality

Compilation independently verifies:

- every active section is attested;
- every attestation hash matches the final handoff;
- no activation probe remains unresolved;
- no unregistered field edit is present;
- every required active atomic value is material.

A suppressed activation probe may remain in the submission only as an explicit audit decision.

### Document activation

Document activation is derived from registry-defined rules.

Runtime code may not ask the operator to select a domain or lane. It may not hard-code the AI registry ID or Lane A/Lane B IDs. Registry subpackage scopes are converted into rule variables dynamically.

The document activation manifest contains every template document with one status:

- `ACTIVE`
- `SUPPRESSED`

For each active document it includes:

- template path and version;
- placeholder token/value bindings;
- clause-selection actions;
- action tokens;
- activation trace;
- Review-Ready and local-counsel flags.

No DOCX file is opened, copied, edited or assembled in this phase.

### Immutability and recovery

All three outputs use canonical SHA-256 hashes.

A retry with identical content reuses the existing version-1 artifact. A retry that produces different content fails with an immutable-artifact conflict. This allows recovery from a partial Drive or Firestore outage without permitting overwrites.

The compiler timestamp is taken from the immutable submission request, so retries are deterministic.

## CO-P13-11 — Diligence-QA Complete

### Inputs

The QA gate reads only:

- `qualified_review_submission`
- `qr_final_value_ledger`
- `document_activation_manifest`

### Output

The QA gate writes:

- `diligence_qa_completion_receipt`

### Blocking validation

The gate blocks when any of the following occurs:

- artifact type or immutability marker is invalid;
- an immutable hash does not recompute;
- the submission references the wrong ledger or document-manifest hash;
- cross-artifact counts disagree;
- a final required value is missing;
- a final value is not reviewer-attested;
- a final field has no document binding;
- a template is missing or unknown;
- an active QR placeholder has no value;
- a document lacks Review-Ready or local-counsel safeguards;
- the Legal Architect / not-a-law-firm boundary is absent.

Market-based values and retained suppressed-probe decisions are warnings after reviewer attestation, not structural blockers.

### Completion state

A successful gate sets:

```text
current_phase: AWAITING_ASSEMBLY
central_phase: DILIGENCE_QA_COMPLETE
runner_state: IDLE
runner_auto_continue: false
assembly_authorized: false
```

The receipt does not authorize assembly. Phase 16 requires a separate explicit change order and execution path.

## Review-Ready boundary

All post-review artifacts state that:

- Lex Nova acts as a Legal Architect, not a law firm;
- outputs are Review-Ready Drafts only;
- qualified local counsel must review and approve final documents;
- the service does not provide legal advice;
- the QR assembly control schedule must be removed from final drafts;
- matter-specific generated documents must not be committed to Git.
