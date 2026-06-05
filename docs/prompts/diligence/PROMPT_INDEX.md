# Diligence Groq Stage Prompt Index

These files are operational prompt templates for the Diligence Engine.

They do not replace the governing runtime.

Governing runtime:

- docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md

If any stage prompt conflicts with the governing runtime, the governing runtime controls.

## Stage Order

1. Source Collector
   - Backend-owned.
   - No Groq prompt.
   - Produces source_review, evidence_buffer, artifact_inventory, and limitations.

2. Target and Feature Extraction
   - File: docs/prompts/diligence/01_Target_Feature_Extraction.prompt.md
   - Produces target_profile, product_feature_map, raw_feature_candidates, feature_map_scratchpad, and warnings.

3. Legal Stack Review
   - File: docs/prompts/diligence/02_Legal_Stack_Review.prompt.md
   - Produces legal_stack, document_stack_synthesis, document_stack_redline, legal_stack_assessment, and warnings.

4. Registry Evaluation
   - File: docs/prompts/diligence/03_Registry_Evaluation.prompt.md
   - Runs over registry row batches.
   - Produces one registry ledger entry per input registry row.

5. Operator Challenge Gate
   - Governed by the main runtime.
   - No separate prompt file yet.
   - Reviews the merged full registry ledger and returns corrections if needed.

6. Final Compiler and Assembly Handoff
   - File: docs/prompts/diligence/04_Final_Compiler_And_Handoff.prompt.md
   - Produces all triggered findings, controlled_rows, insufficient_evidence_rows, report_prose, report_data, technical_audit_log, and assembly_handoff.

## Non-negotiable Base Runtime Rule

The base Diligence Engine emits a full threat report.

All TRIGGERED threats must be preserved in findings[].

Filtering, sorting, prioritising, grouping, and collapsing are UI/report-renderer functions only.

## Backend Validation Requirements

- registry_count_loaded must equal registry_evaluation_ledger length.
- every active Threat_ID must be evaluated exactly once.
- findings length must equal count of TRIGGERED ledger rows.
- legal_stack length must equal 5.
- no Groq stage may browse, search, fetch, or rely on prior model memory.
- no output may contain legacy fields: sales_viability, signal_context, ghost_protection_profile, true_gaps, prospect_meta.
