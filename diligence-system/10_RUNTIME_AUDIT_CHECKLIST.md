# 10_RUNTIME_AUDIT_CHECKLIST.md

```yaml
document_id: 10_RUNTIME_AUDIT_CHECKLIST
document_type: runtime_audit_checklist
system: The Interface
parent_runtime: 00_RUNTIME_SPINE.md
runtime_index: 00_RUNTIME_SPINE_INDEX.md
execution_map: 08_PHASE_STACK_EXECUTION_MAP.md
handoff_contract: 09_OUTPUT_HANDOFF_CONTRACT.md
status: LOCKED_DRAFT
not_a_phase_prompt: true
not_a_runtime_spine: true
not_a_report_template: true
substantive_diligence_authority: false
model_reasoning_authority: false
schema_validation_authority: true
runtime_gate_authority: true

PURPOSE:
  - validate_static_prompt_stack_before_runtime_use
  - validate_runtime_execution_against_phase_stack_map
  - validate_handoff_chain_against_output_handoff_contract
  - detect_source_custody_breach
  - detect_pool_binding_breach
  - detect_forbidden_evidence_access
  - detect_object_name_drift
  - detect_missing_ledgers_traces_and_locks
  - detect_registry_row_loss
  - detect_final_branch_contamination
  - detect_legal_firewall_breach
  - assign_repair_or_controlled_failure_status

OUT_OF_SCOPE:
  - creating_new_facts
  - creating_new_evidence
  - admitting_evidence
  - changing_phase_judgment
  - changing_registry_status
  - resolving_legal_questions
  - adding_new_legal_authorities
  - rewriting_final_findings
  - rendering_html
  - preparing_vault_documents

AUDIT_INPUT_FILES:
  required_stack_files:
    - 00_RUNTIME_SPINE.md
    - 00_RUNTIME_SPINE_INDEX.md
    - 00_SOURCE_EXTRACTION_CONTRACT.md
    - 01_SOURCE_DISCOVERY_EVIDENCE_BOX.md
    - 02_TARGET_PROFILE.md
    - 03_TARGET_FEATURE_PROFILE.md
    - 04_LEGAL_CARTOGRAPHY_INDEX.md
    - 05_TARGET_DATA_PROVENANCE_PROFILE.md
    - 06_EXPOSURE_PROFILE_REGISTRY_LEDGER.md
    - 07_FINAL_OUTPUT_COMPILER_AND_HANDOFF.md
    - 08_PHASE_STACK_EXECUTION_MAP.md
    - 09_OUTPUT_HANDOFF_CONTRACT.md
  required_registry_files:
    - REGISTRY_KEY_v3_0.md
    - AI_THREAT_REGISTRY
  optional_runtime_artifacts:
    - runtime_orchestration_manifest
    - output_handoff_validation_report
    - phase_execution_records
    - pool_execution_records
    - artifact_access_log
    - repair_events
    - controlled_failures

AUDIT_MODES:
  STATIC_PREFLIGHT:
    timing: before_deploy_or_prompt_stack_commit
    input: required_stack_files
    output: static_stack_audit_report
  RUNTIME_PHASE_AUDIT:
    timing: after_each_stage_or_phase
    input: phase_output_plus_runtime_orchestration_manifest
    output: phase_audit_delta
  TERMINAL_AUDIT:
    timing: before_renderer_or_vault_handoff
    input: all_locked_handoffs_plus_final_output_handoff
    output: terminal_runtime_audit_report

STATUS_ENUMS:
  check_status:
    - PASS
    - WARN
    - REPAIR_REQUIRED
    - BLOCKER
    - CONTROLLED_FAILURE
  audit_status:
    - LOCKED
    - READY_WITH_LIMITATIONS
    - REPAIR_REQUIRED
    - CONTROLLED_FAILURE
  severity:
    - INFO
    - WARNING
    - STRUCTURAL
    - BLOCKING
    - FATAL

GLOBAL_AUDIT_INVARIANTS:
  - id: GAI.001
    rule: audit_may_validate_but_not_rewrite_substance
    fail_status: CONTROLLED_FAILURE
  - id: GAI.002
    rule: audit_may_not_create_missing_handoff_objects
    fail_status: CONTROLLED_FAILURE
  - id: GAI.003
    rule: audit_may_not_reconstruct_evidence_from_summaries
    fail_status: CONTROLLED_FAILURE
  - id: GAI.004
    rule: audit_may_not_apply_new_legal_analysis
    fail_status: CONTROLLED_FAILURE
  - id: GAI.005
    rule: audit_may_route_to_repair_only_for_non_substantive_defects
    fail_status: BLOCKER
  - id: GAI.006
    rule: audit_must_preserve_limitations_absence_and_access_failures
    fail_status: BLOCKER
  - id: GAI.007
    rule: audit_must_emit_machine_readable_results
    fail_status: REPAIR_REQUIRED

CHECK_RESULT_SCHEMA:
  audit_check_result:
    check_id: string
    check_group: string
    target_node: string
    target_object: string
    status: PASS | WARN | REPAIR_REQUIRED | BLOCKER | CONTROLLED_FAILURE
    severity: INFO | WARNING | STRUCTURAL | BLOCKING | FATAL
    basis: string
    required_evidence:
      - file_ref_or_object_ref: string
        ref_status: PRESENT | MISSING | INVALID | NOT_APPLICABLE
    repair_route: NONE | SCHEMA_REPAIR | ENUM_REPAIR | REF_REPAIR | PHASE_RERUN | CONTROLLED_FAILURE
    blocks_next_transition: boolean
    blocks_final_handoff: boolean

STATIC_PREFLIGHT_AUDIT:
  file_registry_checks:
    - id: STK.001
      check: all_required_stack_files_present
      fail_if: required_stack_file_missing
      fail_status: BLOCKER
    - id: STK.002
      check: exact_file_names_used
      fail_if: alternate_file_name_or_unregistered_alias_used
      fail_status: BLOCKER
    - id: STK.003
      check: required_registry_files_present
      fail_if: registry_key_or_registry_missing
      fail_status: BLOCKER
    - id: STK.004
      check: no_api_keys_or_secrets_in_prompt_files
      fail_if: credential_like_secret_detected
      fail_status: CONTROLLED_FAILURE
    - id: STK.005
      check: no_hardcoded_runtime_model_names_in_phase_prompts
      fail_if: phase_prompt_contains_hardcoded_model_name
      fail_status: REPAIR_REQUIRED
    - id: STK.006
      check: parent_runtime_and_runtime_index_references_present
      fail_if: phase_prompt_lacks_parent_runtime_or_runtime_index_ref
      fail_status: REPAIR_REQUIRED

  authority_boundary_checks:
    - id: AUT.001
      check: runtime_spine_is_supreme_authority
      fail_if: phase_prompt_or_contract_weakens_runtime_spine
      fail_status: BLOCKER
    - id: AUT.002
      check: execution_map_is_control_map_only
      fail_if: execution_map_contains_substantive_diligence_rules
      fail_status: REPAIR_REQUIRED
    - id: AUT.003
      check: handoff_contract_is_schema_chain_only
      fail_if: handoff_contract_contains_phase_reasoning_or_findings
      fail_status: REPAIR_REQUIRED
    - id: AUT.004
      check: audit_checklist_is_validation_only
      fail_if: audit_checklist_creates_new_phase_obligations_not_traceable_to_stack
      fail_status: REPAIR_REQUIRED
    - id: AUT.005
      check: no_duplicate_runtime_spine_inside_08_09_10
      fail_if: control_docs_restate_full_runtime_doctrine
      fail_status: REPAIR_REQUIRED

  phase_call_card_checks:
    - id: PCC.001
      check: every_model_phase_has_phase_call_card
      target_nodes: [P1, P2, P3, P4, P5, P6, P7]
      fail_if: missing_phase_id_or_primary_output_or_boundary
      fail_status: REPAIR_REQUIRED
    - id: PCC.002
      check: primary_output_names_match_handoff_contract
      target_nodes: [S0, P1, P2, P3, P4, P5, P6, P7]
      fail_if: primary_output_name_mismatch
      fail_status: BLOCKER
    - id: PCC.003
      check: required_top_level_output_keys_match_handoff_contract
      target_nodes: [P1, P2, P3, P4, P5, P6, P7]
      fail_if: ledger_trace_primary_triplet_mismatch
      fail_status: BLOCKER
    - id: PCC.004
      check: phase_boundary_declares_not_legal_advice
      target_nodes: [P2, P3, P4, P5, P6, P7]
      fail_if: legal_firewall_absent_or_weakened
      fail_status: BLOCKER

RUNTIME_EXECUTION_AUDIT:
  source_custody_checks:
    - id: SRC.001
      check: stage_0_candidate_only
      fail_if: stage_0_emits_admitted_evidence_or_source_discovery_handoff
      fail_status: BLOCKER
    - id: SRC.002
      check: phase_1_owns_evidence_admission
      fail_if: evidence_admitted_outside_phase_1
      fail_status: BLOCKER
    - id: SRC.003
      check: every_stage_0_candidate_accounted_for_by_phase_1
      fail_if: candidate_missing_admission_rejection_quarantine_absence_or_access_failed_status
      fail_status: BLOCKER
    - id: SRC.004
      check: search_snippets_not_used_as_evidence
      fail_if: snippet_cited_as_evidence_without_lossless_artifact
      fail_status: BLOCKER
    - id: SRC.005
      check: unadmitted_material_never_reaches_downstream_phase
      fail_if: downstream_phase_consumes_unadmitted_source
      fail_status: CONTROLLED_FAILURE

  phase_order_checks:
    - id: ORD.001
      check: execution_order_matches_08_execution_graph
      fail_if: phase_skipped_or_run_out_of_order_without_controlled_status
      fail_status: BLOCKER
    - id: ORD.002
      check: transition_gate_passed_before_next_node
      fail_if: next_phase_started_without_required_prior_lock
      fail_status: BLOCKER
    - id: ORD.003
      check: downstream_phase_uses_locked_upstream_outputs_only
      fail_if: downstream_consumes_draft_or_partial_output_without_limitation_status
      fail_status: BLOCKER
    - id: ORD.004
      check: no_downstream_upstream_mutation
      fail_if: later_phase_rewrites_prior_phase_object
      fail_status: CONTROLLED_FAILURE

  pool_binding_checks:
    - id: POOL.001
      check: stage_0_only_search_or_grounding
      fail_if: search_or_grounding_used_after_stage_0
      fail_status: CONTROLLED_FAILURE
    - id: POOL.002
      check: phase_1_no_search_no_new_fetch
      fail_if: phase_1_searches_browses_or_fetches_new_public_source
      fail_status: CONTROLLED_FAILURE
    - id: POOL.003
      check: phase_pool_matches_execution_map
      fail_if: wrong_pool_used_without_runtime_recorded_fallback
      fail_status: BLOCKER
    - id: POOL.004
      check: fallback_pool_use_recorded
      fail_if: fallback_used_without_reason_and_pool_record
      fail_status: REPAIR_REQUIRED
    - id: POOL.005
      check: repair_pool_non_substantive_only
      fail_if: repair_pool_changes_fact_status_or_registry_result
      fail_status: CONTROLLED_FAILURE

  evidence_access_checks:
    - id: EVD.001
      check: full_text_scope_matches_phase
      fail_if: phase_receives_source_family_outside_allowed_scope
      fail_status: BLOCKER
    - id: EVD.002
      check: phase_4_legal_governance_only
      fail_if: phase_4_model_context_contains_product_docs_commercial_or_general_marketing_text_as_primary_source
      fail_status: BLOCKER
    - id: EVD.003
      check: phase_5_data_routed_sources_only
      fail_if: phase_5_uses_unrouted_or_irrelevant_source_family_without_exception_record
      fail_status: BLOCKER
    - id: EVD.004
      check: phase_6_legal_governance_lossless_access_present
      fail_if: registry_evaluation_runs_without_required_lossless_legal_governance_evidence_package
      fail_status: BLOCKER
    - id: EVD.005
      check: phase_7_no_fresh_source_analysis
      fail_if: final_compiler_reopens_source_discovery_or_generates_new_findings
      fail_status: CONTROLLED_FAILURE
    - id: EVD.006
      check: evidence_refs_resolve_or_limitation_recorded
      fail_if: unresolved_required_evidence_ref_without_limitation
      fail_status: REPAIR_REQUIRED

  handoff_chain_checks:
    - id: HOF.001
      check: canonical_handoff_chain_complete
      fail_if: required_primary_output_missing
      fail_status: BLOCKER
    - id: HOF.002
      check: no_forbidden_object_aliases
      fail_if: runtime_validator_disallowed_alias_list_detects_alias
      fail_status: BLOCKER
    - id: HOF.003
      check: required_output_shape_keys_present
      fail_if: required_key_missing
      fail_status: REPAIR_REQUIRED
    - id: HOF.004
      check: final_output_handoff_has_three_branches
      fail_if: integrated_json_report_or_screen_report_payload_or_vault_assembler_handoff_missing
      fail_status: BLOCKER
    - id: HOF.005
      check: limitations_carry_forward_complete
      fail_if: upstream_limitation_absence_or_access_failure_suppressed
      fail_status: BLOCKER

  ledger_trace_checks:
    - id: LED.001
      check: every_model_phase_emits_ledger_trace_primary_output_triplet
      fail_if: ledger_trace_or_primary_output_missing
      fail_status: BLOCKER
    - id: LED.002
      check: ledger_records_all_phase_starts_completions_repairs_limitations
      fail_if: required_runtime_event_not_ledgered
      fail_status: REPAIR_REQUIRED
    - id: LED.003
      check: trace_records_field_or_row_derivation_basis
      fail_if: required_derivation_trace_missing
      fail_status: REPAIR_REQUIRED
    - id: LED.004
      check: ledger_is_safe_not_private_reasoning
      fail_if: private_chain_of_thought_or_hidden_reasoning_exposed
      fail_status: REPAIR_REQUIRED
    - id: LED.005
      check: final_output_forensic_ledger_present
      fail_if: final_compiler_lacks_final_output_forensic_ledger
      fail_status: BLOCKER

PHASE_SPECIFIC_AUDIT:
  S0:
    - id: S0.G001
      check: source_mode_valid
      fail_if: source_mode_missing_or_not_allowed_value
      fail_status: BLOCKER
    - id: S0.G002
      check: target_ref_present
      fail_if: no_single_target_ref
      fail_status: BLOCKER
    - id: S0.G003
      check: candidate_manifest_present
      fail_if: candidate_sources_missing
      fail_status: BLOCKER
    - id: S0.G004
      check: lossless_artifact_manifest_present_or_limitation
      fail_if: artifact_store_missing_without_access_failed_or_limitation
      fail_status: BLOCKER
    - id: S0.G005
      check: dedupe_log_present
      fail_if: duplicate_sources_unreconciled
      fail_status: REPAIR_REQUIRED

  P1:
    - id: P1.G001
      check: evidence_box_present
      fail_if: evidence_box_missing
      fail_status: BLOCKER
    - id: P1.G002
      check: all_candidates_accounted_for
      fail_if: candidate_unreviewed
      fail_status: BLOCKER
    - id: P1.G003
      check: routed_phase_packages_present
      fail_if: target_feature_legal_data_or_final_packages_missing_without_absence_record
      fail_status: BLOCKER
    - id: P1.G004
      check: admitted_evidence_has_lossless_artifact_or_controlled_exception
      fail_if: admitted_evidence_has_no_artifact_basis
      fail_status: BLOCKER

  P2:
    - id: P2.G001
      check: target_profile_present
      fail_if: canonical_target_profile_object_missing
      fail_status: BLOCKER
    - id: P2.G002
      check: no_feature_extraction
      fail_if: phase_2_creates_atomic_feature_inventory
      fail_status: REPAIR_REQUIRED
    - id: P2.G003
      check: public_business_context_evidence_linked
      fail_if: unsupported_target_context_without_limitation
      fail_status: REPAIR_REQUIRED

  P3:
    - id: P3.G001
      check: target_feature_profile_present
      fail_if: canonical_target_feature_profile_missing
      fail_status: BLOCKER
    - id: P3.G002
      check: every_feature_has_action_and_output_or_result
      fail_if: feature_missing_system_action_or_output_result
      fail_status: REPAIR_REQUIRED
    - id: P3.G003
      check: archetype_and_surface_provenance_present
      fail_if: feature_lacks_archetype_or_surface_provenance
      fail_status: REPAIR_REQUIRED
    - id: P3.G004
      check: product_wrapper_not_treated_as_atomic_feature
      fail_if: product_platform_module_or_package_used_as_atomic_unit_without_decomposition
      fail_status: REPAIR_REQUIRED

  P4:
    - id: P4.G001
      check: legal_cartography_index_present
      fail_if: canonical_legal_cartography_index_missing
      fail_status: BLOCKER
    - id: P4.G002
      check: legal_governance_family_only
      fail_if: non_legal_governance_source_used_as_phase_4_primary_material
      fail_status: BLOCKER
    - id: P4.G003
      check: macro_units_not_micro_heading_bloat
      fail_if: section_map_is_overgranular_without_navigation_value
      fail_status: REPAIR_REQUIRED
    - id: P4.G004
      check: notice_units_present_when_visible
      fail_if: notices_seen_but_not_indexed
      fail_status: REPAIR_REQUIRED

  P5:
    - id: P5.G001
      check: target_data_provenance_profile_present
      fail_if: canonical_target_data_provenance_profile_missing
      fail_status: BLOCKER
    - id: P5.G002
      check: anti_unknown_protocol_applied
      fail_if: unknown_used_without_search_route_basis_or_missing_signal_route
      fail_status: BLOCKER
    - id: P5.G003
      check: missing_signal_fields_populated
      fail_if: absent_or_unclear_signal_has_no_missing_signal_fields_row
      fail_status: REPAIR_REQUIRED
    - id: P5.G004
      check: review_route_map_populated
      fail_if: unclear_absent_or_conflicting_signal_has_no_review_route
      fail_status: REPAIR_REQUIRED
    - id: P5.G005
      check: no_privacy_compliance_verdict
      fail_if: phase_5_declares_compliance_noncompliance_lawfulness_or_violation
      fail_status: CONTROLLED_FAILURE

  P6:
    - id: P6.G001
      check: target_exposure_profile_present
      fail_if: canonical_target_exposure_profile_missing
      fail_status: BLOCKER
    - id: P6.G002
      check: registry_ledger_has_98_rows
      fail_if: registry_row_count_not_98
      fail_status: BLOCKER
    - id: P6.G003
      check: every_registry_row_present_exactly_once
      fail_if: registry_row_missing_duplicate_or_overwritten
      fail_status: BLOCKER
    - id: P6.G004
      check: model_owns_trigger_adjudication
      fail_if: deterministic_system_finalizes_runtime_validator_supplied_retired_signal_token_pattern_condition_or_registry_status
      fail_status: CONTROLLED_FAILURE
    - id: P6.G005
      check: deterministic_support_does_not_override_model
      fail_if: deterministic_map_controls_final_registry_result
      fail_status: CONTROLLED_FAILURE
    - id: P6.G006
      check: no_legal_verdict_language
      fail_if: registry_result_declares_legal_liability_or_compliance_verdict
      fail_status: CONTROLLED_FAILURE

  P7:
    - id: P7.G001
      check: final_output_handoff_present
      fail_if: canonical_final_output_handoff_missing
      fail_status: BLOCKER
    - id: P7.G002
      check: integrated_json_report_preserves_canon
      fail_if: machine_branch_normalizes_or_relabels_canonical_values
      fail_status: BLOCKER
    - id: P7.G003
      check: screen_report_payload_uses_display_labels_only
      fail_if: screen_branch_mutates_canonical_values_or_outputs_raw_html
      fail_status: BLOCKER
    - id: P7.G004
      check: vault_assembler_handoff_requires_confirmation
      fail_if: vault_branch_confirms_uncertain_prefill_without_user_or_reviewer_confirmation
      fail_status: BLOCKER
    - id: P7.G005
      check: final_compiler_no_new_findings
      fail_if: final_compiler_creates_new_diligence_finding
      fail_status: CONTROLLED_FAILURE

FINAL_BRANCH_AUDIT:
  integrated_json_report:
    - id: B1.G001
      check: canonical_machine_branch_present
      fail_if: integrated_json_report_missing
      fail_status: BLOCKER
    - id: B1.G002
      check: prepared_final_profiles_cross_linked
      fail_if: shared_fields_not_cross_mapped_between_profiles
      fail_status: REPAIR_REQUIRED
    - id: B1.G003
      check: canon_language_preserved
      fail_if: canonical_status_or_object_name_normalized
      fail_status: BLOCKER

  screen_report_payload:
    - id: B2.G001
      check: display_payload_present_not_raw_html
      fail_if: raw_html_generated_by_phase_7
      fail_status: BLOCKER
    - id: B2.G002
      check: display_ids_used_for_findings
      fail_if: user_facing_main_sections_expose_raw_internal_registry_or_threat_ids_as_primary_labels
      fail_status: REPAIR_REQUIRED
    - id: B2.G003
      check: renderer_contract_present
      fail_if: renderer_contract_missing
      fail_status: BLOCKER
    - id: B2.G004
      check: required_sections_present
      fail_if: required_report_section_missing
      fail_status: REPAIR_REQUIRED

  vault_assembler_handoff:
    - id: B3.G001
      check: vault_handoff_present
      fail_if: vault_assembler_handoff_missing
      fail_status: BLOCKER
    - id: B3.G002
      check: baseline_architecture_archetypes_compliance_groups_present
      fail_if: required_vault_group_missing
      fail_status: REPAIR_REQUIRED
    - id: B3.G003
      check: uncertainty_preserved_as_confirmation_question
      fail_if: uncertain_prefill_is_marked_confirmed
      fail_status: BLOCKER
    - id: B3.G004
      check: no_clause_mandates_or_legal_advice
      fail_if: vault_branch_outputs_clause_mandate_compliance_verdict_or_legal_instruction
      fail_status: CONTROLLED_FAILURE

LEGAL_FIREWALL_AUDIT:
  forbidden_language_patterns:
    source: runtime_firewall_forbidden_language_set
    validator_must_load_from: 00_RUNTIME_SPINE.md
  required_boundary_language:
    - public_footprint_or_user_provided_material_only
    - no_legal_advice
    - requires_qualified_review
    - no_compliance_certification
  checks:
    - id: LAW.001
      check: no_legal_advice_or_opinion
      fail_if: output_presents_advice_opinion_or_instruction_requiring_licensed_professional_judgment
      fail_status: CONTROLLED_FAILURE
    - id: LAW.002
      check: no_compliance_certification
      fail_if: output_states_or_implies_target_is_compliant_or_noncompliant
      fail_status: CONTROLLED_FAILURE
    - id: LAW.003
      check: no_liability_or_enforceability_conclusion
      fail_if: output_declares_liability_enforceability_unenforceability_or_legal_violation
      fail_status: CONTROLLED_FAILURE
    - id: LAW.004
      check: qualified_review_route_preserved
      fail_if: unresolved_legal_question_lacks_review_route
      fail_status: BLOCKER
    - id: LAW.005
      check: no_new_unverified_legal_citation
      fail_if: new_case_statute_regulation_or_standard_added_without_verification_record
      fail_status: BLOCKER

REPAIR_AUDIT:
  allowed_repair_types:
    - JSON_REPAIR
    - SCHEMA_REPAIR
    - ENUM_REPAIR
    - REF_FORMAT_REPAIR
    - MISSING_WRAPPER_REPAIR_WHERE_SOURCE_DATA_EXISTS
    - FORBIDDEN_LANGUAGE_REPAIR
    - LOCK_OBJECT_REPAIR
  repair_checks:
    - id: REP.001
      check: repair_type_allowed
      fail_if: repair_event_type_not_in_allowed_repair_types
      fail_status: BLOCKER
    - id: REP.002
      check: repair_has_no_substantive_mutation
      fail_if: repair_changes_fact_status_registry_status_or_phase_judgment
      fail_status: CONTROLLED_FAILURE
    - id: REP.003
      check: repair_event_recorded
      fail_if: repair_applied_without_repair_event
      fail_status: REPAIR_REQUIRED
    - id: REP.004
      check: failed_repair_routes_to_controlled_failure
      fail_if: unrepairable_blocker_allowed_to_continue
      fail_status: CONTROLLED_FAILURE

TERMINAL_AUDIT_GATES:
  - id: TAG.001
    gate: required_stack_files_present
    blocks_final_handoff: true
  - id: TAG.002
    gate: source_custody_chain_valid
    blocks_final_handoff: true
  - id: TAG.003
    gate: phase_order_and_transition_gates_valid
    blocks_final_handoff: true
  - id: TAG.004
    gate: pool_binding_records_valid
    blocks_final_handoff: true
  - id: TAG.005
    gate: evidence_access_policy_valid
    blocks_final_handoff: true
  - id: TAG.006
    gate: canonical_handoff_chain_complete
    blocks_final_handoff: true
  - id: TAG.007
    gate: phase_ledgers_traces_and_locks_present
    blocks_final_handoff: true
  - id: TAG.008
    gate: registry_ledger_complete_98_rows
    blocks_final_handoff: true
  - id: TAG.009
    gate: final_three_branch_handoff_valid
    blocks_final_handoff: true
  - id: TAG.010
    gate: limitation_carry_forward_valid
    blocks_final_handoff: true
  - id: TAG.011
    gate: legal_firewall_valid
    blocks_final_handoff: true
  - id: TAG.012
    gate: renderer_and_vault_boundaries_valid
    blocks_final_handoff: true

AUDIT_REPORT_SCHEMA:
  runtime_audit_report:
    report_meta:
      run_id: string
      audit_mode: STATIC_PREFLIGHT | RUNTIME_PHASE_AUDIT | TERMINAL_AUDIT
      audited_at: string
      audited_files: array
      audited_objects: array
    audit_status: LOCKED | READY_WITH_LIMITATIONS | REPAIR_REQUIRED | CONTROLLED_FAILURE
    static_stack_status: PASS | WARN | REPAIR_REQUIRED | BLOCKER | CONTROLLED_FAILURE
    runtime_execution_status: PASS | WARN | REPAIR_REQUIRED | BLOCKER | CONTROLLED_FAILURE
    handoff_chain_status: COMPLETE | PARTIAL | BROKEN
    source_custody_status: PASS | FAIL
    pool_binding_status: PASS | FAIL | NOT_RUN
    evidence_access_status: PASS | FAIL | PARTIAL
    ledger_trace_status: COMPLETE | PARTIAL | BROKEN
    registry_status: COMPLETE_98 | PARTIAL | MISSING | NOT_RUN
    final_branch_status: PASS | FAIL | NOT_RUN
    legal_firewall_status: PASS | FAIL
    check_results:
      - audit_check_result
    blockers:
      - check_id: string
        target_node: string
        reason: string
    repair_required:
      - check_id: string
        repair_route: string
        repair_scope: string
    warnings:
      - check_id: string
        warning: string
    controlled_failures:
      - check_id: string
        failure_reason: string
    final_decision:
      status: LOCKED | READY_WITH_LIMITATIONS | REPAIR_REQUIRED | CONTROLLED_FAILURE
      basis: string
      next_allowed_action: RUN_NEXT_PHASE | RUN_REPAIR | RERUN_PHASE | RENDER | VAULT_CONFIRMATION | STOP

LOCK_RULE:
  LOCKED_requires:
    - no_blocking_checks_failed
    - no_controlled_failure_checks_failed
    - required_handoff_chain_complete_for_current_audit_mode
    - limitations_preserved
    - legal_firewall_passed
  READY_WITH_LIMITATIONS_requires:
    - no_blocking_checks_failed
    - limitations_visible
    - final_status_does_not_claim_false_completeness
  REPAIR_REQUIRED_if:
    - defect_is_structural_or_schema_or_enum_or_ref_level
    - repair_can_be_done_without_substantive_mutation
  CONTROLLED_FAILURE_if:
    - source_custody_breach
    - unauthorized_search_or_fetch_after_stage_0
    - unadmitted_evidence_used
    - registry_row_loss_unrepairable
    - final_compiler_created_new_findings
    - legal_firewall_breach_unrepairable
```
