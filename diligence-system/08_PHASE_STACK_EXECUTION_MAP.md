# 08_PHASE_STACK_EXECUTION_MAP.md

```yaml
document_id: 08_PHASE_STACK_EXECUTION_MAP
document_type: execution_map
system: The Interface
parent_runtime: 00_RUNTIME_SPINE.md
runtime_index: 00_RUNTIME_SPINE_INDEX.md
source_extraction_contract: 00_SOURCE_EXTRACTION_CONTRACT.md
status: LOCKED_DRAFT
not_a_phase_prompt: true
not_a_runtime_spine: true
model_reasoning_authority: false
substantive_diligence_authority: false

GLOBAL_INVARIANTS:
  - no_phase_skip_without_status
  - no_downstream_upstream_mutation
  - no_search_after_stage_0
  - no_stage_0_candidate_used_without_phase_1_admission
  - no_unadmitted_evidence
  - no_registry_evaluation_outside_phase_6
  - no_final_compiler_new_findings
  - no_renderer_substantive_mutation
  - every_model_phase_emits_ledger_trace_handoff
  - repair_pool_non_substantive_only
  - prompts_must_not_contain_api_keys
  - prompts_must_not_hardcode_model_names
  - pool_selection_is_runtime_controlled
  - final_readiness_requires_locked_handoff_chain

SOURCE_MODE_RULES:
  allowed_values: [url, text, url_plus_text, synthetic_demo]
  url: {search_allowed: true, fetch_extract_allowed: true, stage_0_candidate_collection_required: true}
  url_plus_text: {search_allowed: true, fetch_extract_allowed: true, stage_0_url_collection_runs_first: true, pasted_material_candidate_required: true}
  text: {search_allowed: false, fetch_extract_allowed: false, pasted_material_candidate_required: true}
  synthetic_demo: {search_allowed: false, fetch_extract_allowed: false, synthetic_demo_limitation_required: true}

EXECUTION_GRAPH:
  - node_id: S0
    order: 0
    file: 00_SOURCE_EXTRACTION_CONTRACT.md
    type: extraction_contract
    pool: {primary: [search, extract], fallback: [router]}
    access: {search: conditional_url_or_url_plus_text, grounding: conditional_url_or_url_plus_text, full_text: candidate_collection_only}
    requires: [source_mode, target_url_or_text_or_demo_material, runtime_boundary]
    emits: [hybrid_extraction_manifest, extraction_forensic_ledger]
    lock_requires: [source_mode_valid, candidate_manifest_present, artifact_store_manifest_present_or_controlled_limitation, every_candidate_fetched_rejected_deferred_or_failed]
    block_if: [invalid_source_mode, no_single_target, unsafe_private_material_supplied]

  - node_id: P1
    order: 1
    file: 01_SOURCE_DISCOVERY_EVIDENCE_BOX.md
    type: model_phase
    pool: {primary: [router], fallback: [extract, repair]}
    access: {search: false, grounding: false, full_text: stage_0_candidates_for_admission_only}
    requires: [hybrid_extraction_manifest, hybrid_extraction_manifest.candidate_sources, hybrid_extraction_manifest.artifact_store_manifest, extraction_forensic_ledger]
    emits: [source_discovery_forensic_ledger, source_discovery_trace, source_discovery_handoff]
    lock_requires: [every_candidate_accounted_for, admission_status_assigned_to_each_candidate, evidence_box_manifest_present, phase_packages_present, no_search_or_new_fetch]
    block_if: [missing_hybrid_extraction_manifest, unaccounted_candidate_sources, snippet_used_as_evidence]

  - node_id: P2
    order: 2
    file: 02_TARGET_PROFILE.md
    type: model_phase
    pool: {primary: [profile], fallback: [repair]}
    access: {search: false, grounding: false, full_text: [source_discovery_handoff.phase_packages.target_profile_package, source_discovery_handoff.phase_packages.final_source_coverage_package]}
    requires: [source_discovery_handoff, source_discovery_handoff.phase_packages.target_profile_package, source_discovery_handoff.phase_packages.final_source_coverage_package]
    emits: [target_profile_forensic_ledger, target_profile_trace, target_profile]
    lock_requires: [target_profile_present, evidence_refs_resolve_or_fallback_recorded, limitations_preserved, no_feature_extraction, no_registry_evaluation]
    block_if: [missing_target_profile_package, missing_target_profile]

  - node_id: P3
    order: 3
    file: 03_TARGET_FEATURE_PROFILE.md
    type: model_phase
    pool: {primary: [profile], fallback: [repair]}
    access: {search: false, grounding: false, full_text: source_discovery_handoff.phase_packages.feature_profile_package}
    requires: [target_profile, source_discovery_handoff.phase_packages.feature_profile_package, source_discovery_handoff]
    emits: [feature_profile_forensic_ledger, feature_function_trace, target_feature_profile]
    lock_requires: [target_feature_profile_present, feature_inventory_valid, emitted_features_have_system_action, emitted_features_have_output_or_result, evidence_refs_resolve_or_unresolved_candidate_recorded, no_registry_evaluation]
    block_if: [missing_target_profile, feature_inventory_schema_invalid]

  - node_id: P4
    order: 4
    file: 04_LEGAL_CARTOGRAPHY_INDEX.md
    type: model_phase
    pool: {primary: [extract], fallback: [profile, repair]}
    access: {search: false, grounding: false, full_text: [source_discovery_handoff.phase_packages.legal_cartography_package, source_discovery_handoff.absence_records, source_discovery_handoff.access_failed_sources]}
    requires: [target_profile, source_discovery_handoff.phase_packages.legal_cartography_package, source_discovery_handoff.absence_records, source_discovery_handoff.access_failed_sources, source_discovery_handoff]
    emits: [legal_cartography_forensic_ledger, legal_cartography_trace, legal_cartography_index]
    lock_requires: [legal_cartography_index_present, legal_governance_source_gate_passed, no_forbidden_source_family, artifact_inventory_present, macro_units_only]
    block_if: [legal_source_family_breach, missing_legal_cartography_package]

  - node_id: P5
    order: 5
    file: 05_TARGET_DATA_PROVENANCE_PROFILE.md
    type: model_phase
    pool: {primary: [profile], fallback: [repair]}
    access: {search: false, grounding: false, full_text: source_discovery_handoff.phase_packages.data_provenance_package}
    requires: [target_profile, target_feature_profile, legal_cartography_index, source_discovery_handoff.phase_packages.data_provenance_package]
    emits: [data_provenance_forensic_ledger, data_provenance_trace, target_data_provenance_profile]
    lock_requires: [target_data_provenance_profile_present, anti_unknown_protocol_applied, missing_signal_fields_recorded_where_required, review_route_map_present, no_privacy_compliance_verdict]
    block_if: [missing_target_feature_profile, missing_legal_cartography_index, anti_unknown_protocol_not_applied]

  - node_id: P6
    order: 6
    file: 06_EXPOSURE_PROFILE_REGISTRY_LEDGER.md
    type: model_phase
    pool: {primary: [registry], fallback: [repair]}
    access: {search: false, grounding: false, full_text: source_discovery_handoff.phase_packages.registry_support_package}
    requires: [registry_key, ai_threat_registry, target_profile, target_feature_profile, legal_cartography_index, target_data_provenance_profile, source_discovery_handoff.phase_packages.registry_support_package]
    emits: [exposure_profile_forensic_ledger, registry_evaluation_trace, target_exposure_profile]
    lock_requires: [target_exposure_profile_present, registry_ledger_98_rows, all_registry_rows_present_exactly_once, registry_status_vocab_valid, no_registry_row_loss, no_legal_verdict_language]
    block_if: [registry_key_missing, ai_threat_registry_missing, registry_row_count_not_98, missing_registry_support_package]

  - node_id: P7
    order: 7
    file: 07_FINAL_OUTPUT_COMPILER_AND_HANDOFF.md
    type: model_phase
    pool: {primary: [final], fallback: [repair]}
    access: {search: false, grounding: false, full_text: none_by_default}
    requires: [target_profile, target_feature_profile, legal_cartography_index, target_data_provenance_profile, target_exposure_profile, prior_phase_ledgers]
    emits: [final_output_forensic_ledger, final_compiler_trace, final_output_handoff]
    lock_requires: [final_output_handoff_present, final_output_forensic_ledger_present, integrated_json_report_present, screen_report_payload_present, vault_assembler_handoff_present, no_new_findings, no_upstream_mutation, branch_separation_preserved]
    block_if: [missing_locked_upstream_profile, branch_contamination, new_finding_created]

  - node_id: RENDERER
    order: 8
    file: deterministic_renderer
    type: deterministic_display_layer
    pool: {primary: [], fallback: []}
    access: {search: false, grounding: false, full_text: none}
    requires: [final_output_handoff]
    emits: [rendered_report]
    lock_requires: [renderer_contract_present, no_substantive_mutation, appendices_preserved]
    block_if: [missing_final_output_handoff, renderer_substantive_mutation]

TRANSITION_GATES:
  S0_to_P1: {require: [hybrid_extraction_manifest, extraction_forensic_ledger], block_if: [missing_candidate_manifest, invalid_source_mode]}
  P1_to_P2: {require: [source_discovery_handoff, source_discovery_handoff.phase_packages.target_profile_package, source_discovery_handoff.phase_packages.final_source_coverage_package], block_if: [unaccounted_candidate_sources, evidence_box_missing]}
  P2_to_P3: {require: [target_profile, source_discovery_handoff.phase_packages.feature_profile_package], block_if: [missing_target_profile]}
  P3_to_P4: {require: [target_feature_profile, source_discovery_handoff.phase_packages.legal_cartography_package, source_discovery_handoff.absence_records, source_discovery_handoff.access_failed_sources], block_if: [missing_target_feature_profile]}
  P4_to_P5: {require: [legal_cartography_index, source_discovery_handoff.phase_packages.data_provenance_package], block_if: [legal_source_family_breach, missing_legal_cartography_index]}
  P5_to_P6: {require: [target_data_provenance_profile, ai_threat_registry, registry_key, source_discovery_handoff.phase_packages.registry_support_package], block_if: [anti_unknown_protocol_not_applied, missing_target_data_provenance_profile, missing_registry_source]}
  P6_to_P7: {require: [target_exposure_profile, target_exposure_profile.registry_ledger], block_if: [registry_row_count_not_98, registry_row_loss, registry_status_vocab_invalid]}
  P7_to_RENDERER: {require: [final_output_handoff, final_output_forensic_ledger, final_compiler_trace], block_if: [missing_renderer_contract, branch_contamination, final_handoff_not_locked]}

POOL_RULES:
  only_stage_0_may_use_search_or_grounding: true
  phase_1_may_not_search_crawl_browse_or_fetch_new_public_sources: true
  phase_6_substantive_registry_work_pool: registry
  phase_7_final_compilation_pool: final
  repair_pool_may_create_new_substance: false
  fallback_pool_use_must_be_recorded: true

REPAIR_POLICY:
  allowed_repair: [JSON_REPAIR, SCHEMA_REPAIR, ENUM_REPAIR, REF_FORMAT_REPAIR, MISSING_WRAPPER_REPAIR_WHERE_SOURCE_DATA_EXISTS, FORBIDDEN_LANGUAGE_REPAIR, LOCK_OBJECT_REPAIR]
  forbidden_repair: [SOURCE_DISCOVERY_AFTER_STAGE_0, EVIDENCE_ADMISSION_OUTSIDE_PHASE_1, FEATURE_CREATION_BY_REPAIR, DATA_FACT_CREATION_BY_REPAIR, REGISTRY_STATUS_CREATION_BY_REPAIR, FINAL_FINDING_CREATION_BY_REPAIR, LEGAL_ADVICE_CREATION_BY_REPAIR, LIMITATION_SUPPRESSION_BY_REPAIR]
  repair_record_required: [phase_id, repair_reason, repair_scope, repair_pool_used, substance_changed_false, validator_approved]

FINAL_READINESS:
  allowed_values: [READY_FOR_RENDER, READY_WITH_LIMITATIONS, REPAIR_REQUIRED, CONTROLLED_FAILURE]
  READY_FOR_RENDER_requires: [all_required_nodes_locked, handoff_chain_status_complete, ledger_chain_status_complete, artifact_access_status_valid, pool_execution_records_valid, final_output_handoff_locked, renderer_contract_present]
  READY_WITH_LIMITATIONS_requires: [all_blocking_gates_passed, limitations_preserved, no_false_completeness]
  REPAIR_REQUIRED_if: [structural_defect_repairable_without_substantive_mutation]
  CONTROLLED_FAILURE_if: [blocking_gate_failed_and_no_safe_repair]

ORCHESTRATION_MANIFEST_SCHEMA:
  runtime_orchestration_manifest:
    run_id: string
    source_mode: url | text | url_plus_text | synthetic_demo
    active_node: string | null
    completed_nodes: array
    blocked_nodes: array
    node_execution_records: [{node_id: string, file: string, status: PENDING | RUNNING | LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE | SKIPPED, inputs_received: array, outputs_emitted: array, lock_gates_passed: array, lock_gates_failed: array}]
    pool_execution_records: [{node_id: string, primary_pool: array, actual_pool_used: array, fallback_used: boolean, fallback_reason: string | null, search_allowed: boolean, grounding_allowed: boolean, runtime_model_ref: string | null, runtime_key_pool_ref: string | null}]
    handoff_chain_status: COMPLETE | PARTIAL | REPAIR_REQUIRED | CONTROLLED_FAILURE
    ledger_chain_status: COMPLETE | PARTIAL | REPAIR_REQUIRED | CONTROLLED_FAILURE
    artifact_access_status: VALID | VIOLATION | REPAIR_REQUIRED | CONTROLLED_FAILURE
    repair_events: array
    controlled_failures: array
    final_readiness: READY_FOR_RENDER | READY_WITH_LIMITATIONS | REPAIR_REQUIRED | CONTROLLED_FAILURE
```
