# Phase 16 Assembly Engine Contract v1

## Status

`CO-P13-12_ACTIVE`

## Sequence

```text
DILIGENCE_QA_COMPLETE
→ AWAITING_ASSEMBLY
→ explicit assembly authorization
→ ASSEMBLY_ENGINE
→ COMPLETE
```

The Assembly Engine may not run merely because Diligence-QA completed. A separate explicit release is required.

## Authorization

The existing asynchronous advance route accepts either:

```json
{
  "authorize_assembly": true,
  "authorized_by": "reviewer identity"
}
```

or:

```json
{
  "action": "AUTHORIZE_ASSEMBLY",
  "authorized_by": "reviewer identity"
}
```

Authorization fails unless:

- the run is paused at `AWAITING_ASSEMBLY`;
- `diligence_qa_complete` is true;
- assembly has not already completed.

## Inputs

The engine reads only:

- `diligence_qa_completion_receipt`
- `qualified_review_submission`
- `qr_final_value_ledger`
- `document_activation_manifest`

It independently verifies every immutable hash and the QA receipt's references to the submission, final ledger and document activation manifest.

## Repository template authority

The engine loads blank immutable templates exclusively from the active repository template manifest.

Matter-specific generated documents are not repository assets. They must never be committed to Git.

## Document selection

Only documents marked `ACTIVE` in the immutable document activation manifest are generated.

Documents marked `SUPPRESSED` are recorded in the assembly payload with the suppression reason but are not copied or uploaded.

## QR placeholder assembly

For each active document, the engine:

1. loads the versioned DOCX template;
2. resolves registered `{{QR.*}}` tokens from the final-value ledger and document manifest;
3. supports tokens split across WordprocessingML text runs;
4. formats booleans as `Yes` or `No`;
5. formats arrays and structured values as readable document text;
6. blocks if any QR token remains unresolved.

A reviewer-confirmed not-applicable value is rendered explicitly as `Not applicable` rather than silently omitted.

## Internal delivery-section removal

The final Review-Ready Draft removes:

- `QR ASSEMBLY CONTROL SCHEDULE`
- `Architect Notes`
- `Production Notes`

`Counsel Notes` are preserved because they contain the professional-review instructions required for local counsel.

The engine verifies the rebuilt DOCX package after removal.

## Clause-action boundary

The current templates contain QR value tokens but no machine-addressable clause action tokens.

Therefore, the engine must not infer, rewrite or delete legal prose merely from a prose target description. That would convert a deterministic assembler into an unreviewed legal drafter.

When a registry binding requires clause selection or suppression but provides no action token, the engine:

- preserves the document text;
- records the exact field, target and final value;
- marks the document `REVIEW_READY_WITH_COUNSEL_ACTIONS`;
- adds the action to the immutable local-counsel action list.

This is a deliberate legal-liability control, not an incomplete assembly.

## Outputs

The engine writes exactly:

- `document_assembly_payload`
- `review_ready_draft_manifest`
- `document_assembly_validation_manifest`

It also uploads active generated DOCX files to the run's Drive folder:

```text
<run folder>/
└── document-assembly/
    └── review-ready-drafts/
        └── <DOCUMENT_ID>_REVIEW_READY.docx
```

## Custody and immutability

JSON assembly artifacts are immutable version-1 artifacts.

Drive folders are reused deterministically. Generated binary files are reused only when their size and checksum match. A different file under the same deterministic name causes an immutable binary conflict.

This permits recovery from partial Drive or Firestore failures without duplicating or overwriting client documents.

## Validation

Assembly blocks when:

- Diligence-QA is incomplete or invalid;
- an immutable source hash fails;
- the QA receipt references the wrong source hashes;
- an active template is missing or not Review-Ready;
- a QR placeholder remains unresolved;
- the internal control schedule remains;
- Architect Notes or Production Notes remain;
- an expected active document is not generated;
- an uploaded file hash or size differs from the generated file;
- an unexpected document is uploaded.

The final validation confirms:

- all active documents were generated;
- all generated documents were uploaded;
- all QR tokens were resolved;
- all internal delivery sections were removed;
- Counsel Notes were preserved;
- all non-machine clause actions were disclosed;
- generated documents remain outside Git.

## Completion state

A successful run sets:

```text
current_phase: COMPLETE
central_phase: ASSEMBLY_ENGINE
runner_state: IDLE
runner_auto_continue: false
assembly_complete: true
```

The completion status is:

- `COMPLETE` when no local-counsel clause actions remain; or
- `COMPLETE_WITH_COUNSEL_ACTIONS` when local counsel must make documented clause selections or suppressions.

## Review-Ready boundary

Every generated document remains subject to the following non-negotiable limits:

- Lex Nova acts as a Legal Architect, not a law firm;
- the output is a Review-Ready Draft, not a final legal instrument;
- qualified local counsel must review and approve it before execution, publication or reliance;
- the service does not provide legal advice.
