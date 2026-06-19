# 09_OUTPUT_HANDOFF_CONTRACT.md

```yaml
document_id: 09_OUTPUT_HANDOFF_CONTRACT
document_type: output_handoff_contract
system: The Interface
parent_runtime: 00_RUNTIME_SPINE.md
runtime_index: 00_RUNTIME_SPINE_INDEX.md
execution_map: 08_PHASE_STACK_EXECUTION_MAP.md
status: LOCKED_DRAFT
not_a_phase_prompt: true
not_a_runtime_spine: true
schema_chain_authority: true
substantive_diligence_authority: false
model_reasoning_authority: false

PURPOSE:
  - lock_exact_handoff_object_names
  - lock_required_ledger_trace_output_triplets
  - lock_stage_phase_transition_payloads
  - prevent_object_name_drift
  - prevent_handoff_reconstruction
  - prevent_downstream_upstream_mutation
  - define_final_output_readiness_schema

GLOBAL_HANDOFF_INVARIANTS:
  - id: HGI.001
    rule: every_model_phase_must_emit_forensic_ledger_trace_and_primary_output
  - id: HGI.002
    rule: downstream_nodes_may_consume_locked_handoffs_only
  - id: HGI.003
    rule: downstream_nodes_may_not_reconstruct_missing_upstream_handoffs
  - id: HGI.004
    rule: downstream_nodes_may_not_mutate_upstream_outputs
  - id: HGI.005
    rule: object_aliases_are_forbidden
  - id: HGI.006
    rule: ledgers_and_traces_are_required_handoff_companions
  - id: HGI.007
    rule: limitations_absence_records_and_access_failures_must_carry_forward
  - id: HGI.008
    rule: schema_repair_may_not_create_new_substance
  - id: HGI.009
    rule: handoff_chain_must_be_machine_validatable
  - id: HGI.010
    rule: final_output_may_lock_only_if_required_handoff_chain_is_complete_or_controlled_failure_recorded

CANONICAL_HANDOFF_CHAIN:
  - order: 0
    node_id: S0
    file: 00_SOURCE_EXTRACTION_CONTRACT.md
    primary_output: hybrid_extraction_manifest
    required_companions:
      - extraction_forensic_ledger
    consumed_by:
      - P1
    may_be_consumed_directly_by_downstream_after_P1: false

  - order: 1
    node_id: P1
    file: 01_SOURCE_DISCOVERY_EVIDENCE_BOX.md
    primary_output: source_discovery_handoff
    required_companions:
      - source_discovery_forensic_ledger
      - source_discovery_trace
    consumed_by:
      - P2
      - P3
      - P4
      - P5
      - P6
      - P7

  - order: 2
    node_id: P2
    file: 02_TARGET_PROFILE.md
    primary_output: target_profile
    required_companions:
      - target_profile_forensic_ledger
      - target_profile_trace
    consumed_by:
      - P3
      - P4
      - P5
      - P6
      - P7

  - order: 3
    node_id: P3
    file: 03_TARGET_FEATURE_PROFILE.md
    primary_output: target_feature_profile
    required_companions:
      - feature_profile_forensic_ledger
      - feature_function_trace
    consumed_by:
      - P5
      - P6
      - P7

  - order: 4
    node_id: P4
    file: 04_LEGAL_CARTOGRAPHY_INDEX.md
    primary_output: legal_cartography_index
    required_companions:
      - legal_cartography_forensic_ledger
      - legal_cartography_trace
    consumed_by:
      - P5
      - P6
      - P7

  - order: 5
    node_id: P5
    file: 05_TARGET_DATA_PROVENANCE_PROFILE.md
    primary_output: target_data_provenance_profile
    required_companions:
      - data_provenance_forensic_ledger
      - data_provenance_trace
    consumed_by:
      - P6
      - P7

  - order: 6
    node_id: P6
    file: 06_EXPOSURE_PROFILE_REGISTRY_LEDGER.md
    primary_output: target_exposure_profile
    required_companions:
      - exposure_profile_forensic_ledger
      - registry_evaluation_trace
    consumed_by:
      - P7

  - order: 7
    node_id: P7
    file: 07_FINAL_OUTPUT_COMPILER_AND_HANDOFF.md
    primary_output: final_output_handoff
    required_companions:
      - final_output_forensic_ledger
      - final_compiler_trace
    consumed_by:
      - RENDERER
      - VAULT_ASSEMBLY_INTAKE

FORBIDDEN_OBJECT_ALIASES:
  source: runtime_validator_supplied_disallowed_alias_list
  rule: no_noncanonical_output_object_names_allowed
  action_if_detected: REPAIR_REQUIRED_OR_CONTROLLED_FAILURE
  note: This contract does not list retired aliases inside prompt text. The validator may maintain a disallowed-name list outside the prompt stack.

TRANSITION_CONTRACTS:
  S0_to_P1:
    required_inputs_to_next:
      - hybrid_extraction_manifest
      - hybrid_extraction_manifest.candidate_sources
      - hybrid_extraction_manifest.lossless_text_artifacts
      - hybrid_extraction_manifest.artifact_store_manifest
      - extraction_forensic_ledger
    next_must_emit:
      - source_discovery_forensic_ledger
      - source_discovery_trace
      - source_discovery_handoff
    block_if_missing:
      - hybrid_extraction_manifest
      - candidate_sources
      - artifact_store_manifest

  P1_to_P2:
    required_inputs_to_next:
      - source_discovery_handoff
      - source_discovery_handoff.phase_packages.target_profile_package
      - source_discovery_handoff.phase_packages.final_source_coverage_package
      - source_discovery_forensic_ledger
      - source_discovery_trace
    next_must_emit:
      - target_profile_forensic_ledger
      - target_profile_trace
      - target_profile
    block_if_missing:
      - source_discovery_handoff
      - target_profile_package

  P2_to_P3:
    required_inputs_to_next:
      - target_profile
      - source_discovery_handoff.phase_packages.feature_profile_package
      - target_profile_forensic_ledger
      - target_profile_trace
    next_must_emit:
      - feature_profile_forensic_ledger
      - feature_function_trace
      - target_feature_profile
    block_if_missing:
      - target_profile
      - feature_profile_package

  P3_to_P4:
    required_inputs_to_next:
      - target_profile
      - target_feature_profile
      - source_discovery_handoff.phase_packages.legal_cartography_package
      - source_discovery_handoff.absence_records
      - source_discovery_handoff.access_failed_sources
    next_must_emit:
      - legal_cartography_forensic_ledger
      - legal_cartography_trace
      - legal_cartography_index
    block_if_missing:
      - target_profile
      - legal_cartography_package

  P4_to_P5:
    required_inputs_to_next:
      - target_profile
      - target_feature_profile
      - legal_cartography_index
      - source_discovery_handoff.phase_packages.data_provenance_package
      - legal_cartography_forensic_ledger
      - legal_cartography_trace
    next_must_emit:
      - data_provenance_forensic_ledger
      - data_provenance_trace
      - target_data_provenance_profile
    block_if_missing:
      - target_feature_profile
      - legal_cartography_index
      - data_provenance_package

  P5_to_P6:
    required_inputs_to_next:
      - registry_key
      - ai_threat_registry
      - target_profile
      - target_feature_profile
      - legal_cartography_index
      - target_data_provenance_profile
      - source_discovery_handoff.phase_packages.registry_support_package
      - data_provenance_forensic_ledger
      - data_provenance_trace
    next_must_emit:
      - exposure_profile_forensic_ledger
      - registry_evaluation_trace
      - target_exposure_profile
    block_if_missing:
      - registry_key
      - ai_threat_registry
      - target_data_provenance_profile
      - registry_support_package

  P6_to_P7:
    required_inputs_to_next:
      - target_profile
      - target_feature_profile
      - legal_cartography_index
      - target_data_provenance_profile
      - target_exposure_profile
      - exposure_profile_forensic_ledger
      - registry_evaluation_trace
      - prior_phase_ledgers
      - prior_phase_limitations
    next_must_emit:
      - final_output_forensic_ledger
      - final_compiler_trace
      - final_output_handoff
    block_if_missing:
      - target_exposure_profile
      - target_exposure_profile.registry_ledger
      - prior_phase_ledgers
    block_if_invalid:
      - registry_row_count_not_98
      - branch_contamination

  P7_to_RENDERER:
    required_inputs_to_next:
      - final_output_handoff
      - final_output_forensic_ledger
      - final_compiler_trace
      - final_output_handoff.screen_report_payload
      - final_output_handoff.screen_report_payload.renderer_contract
    renderer_may_emit:
      - rendered_report
      - export_payload
    block_if_missing:
      - final_output_handoff
      - renderer_contract
    block_if_invalid:
      - renderer_substantive_mutation
      - missing_appendix_rows

  P7_to_VAULT_ASSEMBLY_INTAKE:
    required_inputs_to_next:
      - final_output_handoff
      - final_output_handoff.vault_assembler_handoff
      - final_output_handoff.vault_assembler_handoff.handoff_lock
    downstream_may_emit:
      - assembly_intake_payload_after_confirmation
    block_if_missing:
      - vault_assembler_handoff
      - vault_confirmation_questions_or_confirmation_lock
    block_if_invalid:
      - legal_advice_language
      - clause_mandate_language
      - confirmed_defect_language

REQUIRED_OUTPUT_SHAPES:
  hybrid_extraction_manifest:
    required_keys:
      - run_meta
      - source_mode
      - target_ref
      - candidate_sources
      - lossless_text_artifacts
      - artifact_store_manifest
      - source_family_candidates
      - extraction_forensic_ledger
      - extraction_limitations
      - extraction_lock

  source_discovery_handoff:
    required_keys:
      - evidence_box
      - admitted_sources
      - rejected_sources
      - quarantined_sources
      - access_failed_sources
      - absence_records
      - source_family_map
      - phase_packages
      - source_discovery_lock
    phase_packages:
      required_keys:
        - target_profile_package
        - feature_profile_package
        - legal_cartography_package
        - data_provenance_package
        - registry_support_package
        - final_source_coverage_package

  target_profile:
    required_keys:
      - target_identity
      - public_business_context
      - product_wrapper_baseline
      - jurisdiction_and_market_visibility
      - baseline_data_touchpoints
      - downstream_assumptions
      - evidence_support
      - limitations
      - target_profile_lock

  target_feature_profile:
    required_keys:
      - feature_inventory
      - feature_function_map
      - system_action_map
      - output_result_map
      - archetype_provenance
      - surface_provenance
      - feature_signal_aggregation
      - architecture_hints
      - commercial_outcome_context
      - evidence_support
      - limitations
      - feature_profile_lock

  legal_cartography_index:
    required_keys:
      - artifact_inventory
      - artifact_family_map
      - artifact_status_map
      - macro_document_units
      - notice_units
      - control_language_reference_locations
      - cross_document_references
      - artifact_absence_records
      - source_coverage
      - routing_candidates
      - evidence_references
      - limitations
      - legal_cartography_lock

  target_data_provenance_profile:
    required_keys:
      - feature_data_maps
      - data_category_maps
      - processing_visibility_maps
      - control_visibility_maps
      - privacy_signal_maps
      - missing_signal_fields
      - review_route_map
      - anti_unknown_protocol_log
      - evidence_support
      - limitations
      - data_provenance_lock

  target_exposure_profile:
    required_keys:
      - registry_ledger
      - registry_row_count
      - trigger_adjudication_log
      - evidence_route_disposition_log
      - exposure_summary
      - operator_challenge_result
      - registry_evaluation_lock
    required_registry_row_count: 98

  final_output_handoff:
    required_keys:
      - run_meta
      - input_manifest
      - normalization_dictionary
      - integrated_json_report
      - screen_report_payload
      - vault_assembler_handoff
      - final_quality_control
      - limitations
      - handoff_lock

FINAL_BRANCH_CONTRACT:
  integrated_json_report:
    branch_type: canonical_machine_report
    must_preserve_canon: true
    normalization_allowed: false
    required_keys:
      - report_meta
      - profile_manifest
      - prepared_final_profiles
      - cross_profile_indexes
      - canonical_ref_indexes
      - canonical_summary
      - machine_lock

  screen_report_payload:
    branch_type: display_payload_not_html
    normalization_allowed: true
    raw_html_allowed: false
    required_keys:
      - report_shell
      - display_id_index
      - sections
      - platform_diligence_object
      - renderer_contract
    required_sections:
      - matter_overview
      - executive_summary
      - target_profile
      - product_activity_ip_profile
      - data_risk_provenance_controls
      - legal_document_control_review
      - exposure_findings
      - implications_remediation_path
      - evidence_gaps_clarification_points
      - methodology_limitations_review_notes
      - forensic_ledger_appendix

  vault_assembler_handoff:
    branch_type: functional_assembly_intake
    legal_advice_allowed: false
    confirmation_required: true
    required_keys:
      - handoff_meta
      - source_packet
      - functional_intake_vault
      - vault_payload
      - vault_prefill_suggestions
      - vault_confirmation_questions
      - assembly_handoff_intake
      - handoff_envelope
      - persistence_plan
      - warnings
      - handoff_lock
    required_vault_groups:
      - baseline
      - architecture
      - archetypes
      - compliance

LEDGER_TRACE_COMPANION_CONTRACT:
  required_phase_triplets:
    P1:
      - source_discovery_forensic_ledger
      - source_discovery_trace
      - source_discovery_handoff
    P2:
      - target_profile_forensic_ledger
      - target_profile_trace
      - target_profile
    P3:
      - feature_profile_forensic_ledger
      - feature_function_trace
      - target_feature_profile
    P4:
      - legal_cartography_forensic_ledger
      - legal_cartography_trace
      - legal_cartography_index
    P5:
      - data_provenance_forensic_ledger
      - data_provenance_trace
      - target_data_provenance_profile
    P6:
      - exposure_profile_forensic_ledger
      - registry_evaluation_trace
      - target_exposure_profile
    P7:
      - final_output_forensic_ledger
      - final_compiler_trace
      - final_output_handoff

  triplet_gate:
    pass_if: all_required_triplet_objects_present
    fail_if:
      - ledger_missing
      - trace_missing
      - primary_output_missing
      - alias_used_instead_of_canonical_object

LIMITATION_CARRY_FORWARD_CONTRACT:
  required_limitation_sources:
    - extraction_limitations
    - source_discovery_handoff.absence_records
    - source_discovery_handoff.access_failed_sources
    - target_profile.limitations
    - target_feature_profile.limitations
    - legal_cartography_index.limitations
    - target_data_provenance_profile.limitations
    - target_exposure_profile.limitations
    - final_output_handoff.limitations
  preservation_required: true
  suppression_allowed: false

SCHEMA_VALIDATION_GATES:
  - id: SVG.001
    gate: canonical_object_name_gate
    fail_if: forbidden_object_alias_used
  - id: SVG.002
    gate: phase_triplet_gate
    fail_if: ledger_trace_or_primary_output_missing
  - id: SVG.003
    gate: downstream_handoff_gate
    fail_if: downstream_consumes_unlocked_or_missing_upstream_output
  - id: SVG.004
    gate: no_reconstruction_gate
    fail_if: downstream_reconstructs_missing_handoff
  - id: SVG.005
    gate: no_mutation_gate
    fail_if: downstream_mutates_upstream_output
  - id: SVG.006
    gate: evidence_ref_gate
    fail_if: required_evidence_refs_missing_or_unresolved_without_limitation
  - id: SVG.007
    gate: registry_completeness_gate
    fail_if: target_exposure_profile.registry_row_count_not_98
  - id: SVG.008
    gate: final_branch_gate
    fail_if: integrated_json_report_or_screen_report_payload_or_vault_assembler_handoff_missing
  - id: SVG.009
    gate: renderer_contract_gate
    fail_if: renderer_contract_missing_or_renderer_substantive_authority_enabled
  - id: SVG.010
    gate: vault_confirmation_gate
    fail_if: vault_handoff_lacks_confirmation_or_review_route_for_uncertain_items

HANDOFF_STATUS_VALUES:
  allowed_values:
    - LOCKED
    - READY_WITH_LIMITATIONS
    - REPAIR_REQUIRED
    - CONTROLLED_FAILURE
  LOCKED_requires:
    - required_objects_present
    - required_companions_present
    - schema_validation_gates_pass
    - no_blocking_limitations
  READY_WITH_LIMITATIONS_requires:
    - required_objects_present
    - non_blocking_limitations_preserved
    - no_false_completeness
  REPAIR_REQUIRED_if:
    - repairable_schema_or_wrapper_or_enum_or_ref_defect
    - no_substantive_mutation_required
  CONTROLLED_FAILURE_if:
    - missing_core_handoff
    - unrepairable_schema_failure
    - forbidden_alias_only_output
    - registry_row_loss_unrepairable
    - legal_firewall_breach_unrepairable

OUTPUT_HANDOFF_VALIDATION_REPORT_SCHEMA:
  output_handoff_validation_report:
    run_id: string
    validation_status: LOCKED | READY_WITH_LIMITATIONS | REPAIR_REQUIRED | CONTROLLED_FAILURE
    canonical_handoff_chain_status: COMPLETE | PARTIAL | BROKEN
    phase_triplet_status: COMPLETE | PARTIAL | BROKEN
    alias_scan_status: PASS | FAIL
    limitation_carry_forward_status: PASS | FAIL | PARTIAL
    schema_gate_results:
      - gate_id: string
        status: PASS | FAIL | REPAIR_REQUIRED | CONTROLLED_FAILURE
        affected_node: string | null
        basis: string
    missing_objects: array
    forbidden_aliases_detected: array
    repair_routes: array
    controlled_failure_reasons: array
```
