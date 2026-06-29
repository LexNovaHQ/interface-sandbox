import { buildForensicLedgerAppendix, collectLimitations } from "./report-appendix-builder.js";
import {
  PUBLIC_FOOTPRINT_LIMITATION,
  REVIEW_READY_BOUNDARY_NOTICE,
  asArray,
  getPath,
  reviewRouteLabel,
  safeObject,
  safeText,
  statusLabel,
  unique
} from "./report-safe-language.js";
import {
  NORMALIZATION_MAP_VERSION,
  normalizeArchetypeList,
  normalizeFieldLabel,
  normalizeInternalValue,
  normalizeRegistryTerm,
  normalizeStatusForReport,
  normalizeSurfaceList
} from "./report-normalization-map.js";

export const NORMALIZED_PROFILER_VERSION = "normalized_profiler_section_artifacts_v1";

export const NORMALIZED_SECTION_DEFINITIONS = Object.freeze([
  ["matter_overview", "Matter Overview"],
  ["executive_summary", "Executive Summary"],
  ["target_profile", "Target Profile"],
  ["product_activity_ip_profile", "Product, Activity & IP Profile"],
  ["data_provenance_controls", "Data Provenance & Controls"],
  ["legal_document_control_review", "Legal Document & Control Review"],
  ["exposure_findings", "Exposure Findings"],
  ["implications_review_path", "Implications & Review Path"],
  ["evidence_gaps_clarification_points", "Evidence Gaps & Clarification Points"],
  ["methodology_limitations_review_notes", "Methodology, Limitations & Review Notes"],
  ["forensic_ledger_appendix", "Forensic Ledger Appendix"]
]);

export const NORMALIZED_SECTION_KEYS = Object.freeze(NORMALIZED_SECTION_DEFINITIONS.map(([key]) => key));
export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze(NORMALIZED_SECTION_KEYS.map((key) => `normalized_section__${key}`));

const DATA_GROUPS = Object.freeze([
  ["scope_and_source_coverage", "Scope and Source Coverage", ["assessment_scope", "source_coverage"]],
  ["people_and_roles", "People and Roles", ["individuals_and_relationships", "role_relationship_readiness"]],
  ["data_categories_and_outputs", "Data Categories and Outputs", ["data_categories", "generated_output_and_derived_data_treatment", "sensitive_special_category_signals", "children_minors_signal"]],
  ["flow_and_lifecycle", "Flow and Lifecycle", ["collection_sources_and_activity_data_flows", "processing_operations_lifecycle", "purpose_use_signals"]],
  ["notice_and_rights", "Notice and Rights", ["privacy_notice_visibility", "lawful_basis_consent_authorization_readiness", "consent_withdrawal_controls", "rights_request_routes"]],
  ["governance_and_contracts", "Governance and Contracts", ["privacy_governance_contact_accountability_signals", "contractual_dpa_customer_terms_readiness"]],
  ["vendors_and_sharing", "Vendors and Sharing", ["vendor_subprocessor_partner_inventory", "processor_subprocessor_governance_controls", "third_party_disclosure_sharing_controls"]],
  ["transfer_and_retention", "Transfer and Retention", ["cross_border_transfer_location_custody", "retention_deletion_return_export_controls"]],
  ["security_and_incident_visibility", "Security and Incident Visibility", ["security_access_controls", "breach_incident_readiness"]],
  ["ai_specific_controls", "AI-Specific Controls", ["ai_model_provider_processing_chain", "ai_training_finetuning_model_improvement_controls", "embeddings_vector_memory_controls", "prompt_output_logging_telemetry_controls"]],
  ["automated_decisioning", "Automated Decisioning", ["automated_decision_profiling_human_review_signal"]],
  ["readiness_and_gaps", "Readiness and Gaps", ["privacy_accountability_documentation_signals", "law_regulatory_readiness_matrix", "missing_proof_and_diligence_requests", "limitations"]]
]);

export function buildNormalizedProfilerOutput({ run = {}, artifacts = {} } = {}) {
  const context = buildContext({ run, artifacts });
  const sections = {
    matter_overview: buildMatterOverviewSection(context),
    executive_summary: buildExecutiveSummarySection(context),
    target_profile: buildTargetProfileSection(context),
    product_activity_ip_profile: buildProductActivityIpSection(context),
    data_provenance_controls: buildDataProvenanceControlsSection(context),
    legal_document_control_review: buildLegalDocumentControlReviewSection(context),
    exposure_findings: buildExposureFindingsSection(context),
    implications_review_path: buildImplicationsReviewPathSection(context),
    evidence_gaps_clarification_points: buildEvidenceGapsSection(context),
    methodology_limitations_review_notes: buildMethodologySection(context),
    forensic_ledger_appendix: buildForensicAppendixSection(context)
  };

  const namedSections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((key) => [`normalized_section__${key}`, sections[key]]));
  const normalized_report_manifest = buildNormalizedReportManifest({ context, sections });
  const vault_section_handoff = buildVaultSectionHandoff({ context, sections });

  return {
    normalized_report_manifest,
    vault_section_handoff,
    final_output_handoff: buildThinFinalOutputHandoff({ context, normalized_report_manifest, vault_section_handoff }),
    ...namedSections
  };
}

function buildContext({ run, artifacts }) {
  const profiles = {
    source_discovery_handoff: unwrapArtifact(artifacts.source_discovery_handoff, "source_discovery_handoff"),
    legal_cartography_index: unwrapArtifact(artifacts.legal_cartography_index, "legal_cartography_index"),
    target_profile: unwrapArtifact(artifacts.target_profile, "target_profile"),
    target_feature_profile: unwrapArtifact(artifacts.target_feature_profile, "target_feature_profile"),
    data_provenance_profile: unwrapArtifact(artifacts.data_provenance_profile, "data_provenance_profile"),
    exposure_registry_controlled_profile: unwrapArtifact(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile"),
    exposure_registry_triggered_profile: unwrapArtifact(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile"),
    challenge_gate: unwrapArtifact(artifacts.challenge_gate, "challenge_gate")
  };

  const forensics = {
    target_profile_forensics: unwrapArtifact(artifacts.target_profile_forensics, "target_profile_forensics"),
    target_feature_profile_forensics: unwrapArtifact(artifacts.target_feature_profile_forensics, "target_feature_profile_forensics"),
    data_provenance_profile_forensics: unwrapArtifact(artifacts.data_provenance_profile_forensics, "data_provenance_profile_forensics"),
    exposure_registry_route_plan: unwrapArtifact(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan"),
    exposure_registry_workpad_98: unwrapArtifact(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98"),
    exposure_registry_profile_forensics: unwrapArtifact(artifacts.exposure_registry_profile_forensics, "exposure_registry_profile_forensics"),
    m11_batch_artifacts: asArray(artifacts.m11_batch_artifacts),
    m12_batch_validation_artifacts: asArray(artifacts.m12_batch_validation_artifacts)
  };

  const display_id_index = buildDisplayIdIndex(profiles);
  const limitations = collectLimitations({ profiles, forensics, handoff: {} });
  const validation_status = normalizeStatusForReport(run.validation_status || profiles.challenge_gate?.status || profiles.challenge_gate?.lock_status || "LOCKED_WITH_LIMITATIONS");

  return {
    run,
    artifacts,
    profiles,
    forensics,
    display_id_index,
    limitations,
    validation_status,
    generated_at: new Date().toISOString()
  };
}

function buildMatterOverviewSection(context) {
  const { run } = context;
  return section(context, "matter_overview", [
    subsection("matter_identity", "Matter Identity", [
      field("run_id", "Run ID", run.run_id, "run_record", "run_id"),
      field("target", "Target", run.target || hostFromUrl(run.root_url), "run_record", "target"),
      field("target_url", "Target URL", run.root_url || run.target_url || run.target, "run_record", "root_url"),
      field("validation_status", "Review status", context.validation_status, "normalized_profiler", "validation_status")
    ]),
    subsection("review_boundary", "Review Boundary", [
      field("source_mode", "Source mode", sourceModeLabel(run.source_mode), "run_record", "source_mode"),
      field("uploaded_documents", "Uploaded source documents", run.uploaded_source_documents || { document_count: 0 }, "run_record", "uploaded_source_documents"),
      field("public_footprint_limitation", "Public-footprint limitation", PUBLIC_FOOTPRINT_LIMITATION, "report_safe_language", "PUBLIC_FOOTPRINT_LIMITATION"),
      field("review_ready_notice", "Review-Ready boundary", REVIEW_READY_BOUNDARY_NOTICE, "report_safe_language", "REVIEW_READY_BOUNDARY_NOTICE")
    ]),
    subsection("evidence_cutoff", "Evidence Cutoff", [
      field("created_at", "Run created at", run.created_at, "run_record", "created_at"),
      field("compiled_at", "Normalized at", context.generated_at, "normalized_profiler", "generated_at")
    ])
  ], { summary: "Public-footprint diligence scope, target identity, source boundary, and reliance boundary." });
}

function buildExecutiveSummarySection(context) {
  const { profiles, forensics } = context;
  const activities = asArray(profiles.target_feature_profile.activities);
  const triggeredRows = exposureRows(profiles.exposure_registry_triggered_profile, "triggered_rows");
  const controlledRows = exposureRows(profiles.exposure_registry_controlled_profile, "controlled_rows");
  const workpadRows = asArray(forensics.exposure_registry_workpad_98.registry_rows);
  const data = profiles.data_provenance_profile;
  const legal = profiles.legal_cartography_index;

  return section(context, "executive_summary", [
    subsection("target_snapshot", "Target Snapshot", [
      field("target_snapshot", "Target identity snapshot", summarizeTarget(profiles.target_profile), "target_profile", "target_profile")
    ]),
    subsection("product_activity_snapshot", "Product/Activity Snapshot", [
      field("activity_count", "Public product/activity signals", activities.length, "target_feature_profile", "activities"),
      field("activity_patterns", "Activity patterns observed", normalizeActivityPatterns(activities), "target_feature_profile", "activities[].archetype_codes"),
      field("affected_contexts", "Affected contexts observed", normalizeAffectedContexts(activities), "target_feature_profile", "activities[].surface_context_tokens")
    ]),
    subsection("data_and_document_posture", "Data and Document Posture", [
      field("data_control_visibility", "Data/control visibility posture", dataPosture(data), "data_provenance_profile", "data_provenance_profile"),
      field("legal_document_posture", "Legal/governance document posture", legalPosture(legal), "legal_cartography_index", "legal_cartography_index")
    ]),
    subsection("exposure_posture", "Exposure Posture", [
      field("visible_exposure_signals", "Visible exposure signals", triggeredRows.length, "exposure_registry_triggered_profile", "triggered_rows"),
      field("visible_control_or_limitation_signals", "Visible control or limitation signals", controlledRows.length, "exposure_registry_controlled_profile", "controlled_rows"),
      field("full_registry_workpad_rows", "Full registry workpad rows", workpadRows.length, "exposure_registry_workpad_98", "registry_rows")
    ]),
    subsection("priority_review_queue", "Priority Qualified-Review Queue", [
      field("qualified_review_priorities", "Priority qualified-review queue", qualifiedPriorities({ triggeredRows, data, legal }), "normalized_profiler", "qualifiedPriorities")
    ])
  ], { summary: "Plain-English summary of target, product activity, data/control visibility, legal document posture, and exposure review queue." });
}

function buildTargetProfileSection(context) {
  const t = context.profiles.target_profile;
  return section(context, "target_profile", [
    subsection("target_identity", "Target Identity", fieldsFromObject("target_profile", "target_identity", t.target_identity, ["brand_name", "legal_entity_name", "entity_type", "reviewed_website", "primary_domain"])),
    subsection("jurisdiction_notice", "Jurisdiction / Notice Signals", fieldsFromObject("target_profile", "jurisdiction_notice", t.jurisdiction_notice, ["registered_notice_location", "governing_law", "courts_venue"])),
    subsection("business_context", "Business Context", fieldsFromObject("target_profile", "business_context", t.business_context, ["business_category", "primary_customer_type", "market_type_candidate", "industry_sector", "regulated_sector_hints"])),
    subsection("product_service_wrapper", "Product/Service Wrapper", fieldsFromObject("target_profile", "product_service_wrapper", t.product_service_wrapper, ["high_level_offering", "primary_public_claim", "product_service_wrapper_names", "delivery_model_signals"])),
    subsection("target_limitations", "Target Limitations", [field("target_profile_limitations", normalizeFieldLabel("target_profile_limitations"), asArray(t.target_profile_limitations), "target_profile", "target_profile_limitations")])
  ], { summary: "Target identity, contracting-party signals, jurisdiction/notice signals, business context, product wrapper, and limitations." });
}

function buildProductActivityIpSection(context) {
  const p = context.profiles.target_feature_profile;
  const activities = asArray(p.activities).map((activity, index) => normalizeActivityCard(activity, index));
  return section(context, "product_activity_ip_profile", [
    subsection("activity_inventory", "Activity Inventory", [field("activities", "Public product/activity table", activities.map((a) => pick(a, ["activity_display_id", "related_product_service", "publicly_described_activity", "activity_summary"])), "target_feature_profile", "activities")]),
    subsection("activity_mechanics", "Activity Mechanics", [field("mechanics", "How the activities appear to work", activities.map((a) => pick(a, ["activity_display_id", "how_it_appears_to_work", "automation_and_human_review_signal", "data_content_or_asset_affected", "external_or_internal_effect"])), "target_feature_profile", "activities")]),
    subsection("activity_pattern", "Activity Pattern", [field("activity_patterns", "Lawyer-readable activity patterns", activities.map((a) => pick(a, ["activity_display_id", "activity_patterns", "activity_pattern_proof"])), "target_feature_profile", "activities[].archetype_codes")]),
    subsection("affected_context", "Affected Context", [field("affected_contexts", "Lawyer-readable affected contexts", activities.map((a) => pick(a, ["activity_display_id", "affected_contexts", "affected_context_proof_and_limits"])), "target_feature_profile", "activities[].surface_context_tokens")]),
    subsection("content_ip_review_route", "Content/IP Review Route", [field("content_ip_signals", "Content/IP signals for qualified review", activities.filter(hasContentIpSignal).map((a) => pick(a, ["activity_display_id", "data_content_or_asset_affected", "affected_contexts"])), "target_feature_profile", "activities[].data_content_object_touched")]),
    subsection("limitations", "Product/Activity Limitations", [field("profile_level_limitations", normalizeFieldLabel("profile_level_limitations"), asArray(p.profile_level_limitations), "target_feature_profile", "profile_level_limitations")])
  ], { summary: "Product/activity inventory, mechanics, AI/activity pattern routing, affected context, IP/content touchpoints, and profile limitations." });
}

function buildDataProvenanceControlsSection(context) {
  const d = context.profiles.data_provenance_profile;
  return section(context, "data_provenance_controls", DATA_GROUPS.map(([id, title, keys]) => subsection(id, title, keys.map((key) => field(key, normalizeFieldLabel(key), d[key], "data_provenance_profile", key)))), { summary: "Data/control visibility, lifecycle, notices, vendors, transfers, AI-specific controls, readiness, missing proof, and limitations." });
}

function buildLegalDocumentControlReviewSection(context) {
  const l = context.profiles.legal_cartography_index;
  return section(context, "legal_document_control_review", [
    subsection("document_inventory", "Document Inventory", [field("document_coverage_index", normalizeFieldLabel("document_coverage_index"), rows(l.document_coverage_index, "DOC"), "legal_cartography_index", "document_coverage_index")]),
    subsection("legal_governance_sections", "Legal/Governance Sections", [field("document_structure_index", normalizeFieldLabel("document_structure_index"), rows(l.document_structure_index, "UNIT"), "legal_cartography_index", "document_structure_index")]),
    subsection("linked_documents", "Linked / Incorporated Materials", [field("incorporated_linked_document_map", normalizeFieldLabel("incorporated_linked_document_map"), rows(l.incorporated_linked_document_map, "REL"), "legal_cartography_index", "incorporated_linked_document_map")]),
    subsection("control_language", "Control Language", [field("control_language_locator", normalizeFieldLabel("control_language_locator"), rows(l.control_language_locator, "CTRL"), "legal_cartography_index", "control_language_locator")]),
    subsection("missing_limited_materials", "Missing or Limited Materials", [field("missing_limited_legal_governance_items", normalizeFieldLabel("missing_limited_legal_governance_items"), rows(l.missing_limited_legal_governance_items, "GOV"), "legal_cartography_index", "missing_limited_legal_governance_items")]),
    subsection("qualified_review_points", "Qualified Review Points", [field("qualified_review_points", "Document/control areas requiring qualified review", qualifiedLegalReviewPoints(l), "legal_cartography_index", "control_language_locator + missing_limited_legal_governance_items")])
  ], { summary: "Document inventory, legal/governance section map, linked-document map, control-language locator, missing material, and review points." });
}

function buildExposureFindingsSection(context) {
  const triggeredRows = exposureRows(context.profiles.exposure_registry_triggered_profile, "triggered_rows");
  const controlledRows = exposureRows(context.profiles.exposure_registry_controlled_profile, "controlled_rows");
  return section(context, "exposure_findings", [
    subsection("exposure_category_groups", "Exposure Categories", [field("exposure_category_groups", "Exposure categories", groupRows(triggeredRows), "exposure_registry_triggered_profile", "triggered_rows")]),
    subsection("visible_exposure_signals", "Visible Exposure Signals", [field("finding_rows", "Visible exposure signals", triggeredRows.map((row, index) => findingRow(row, `EXP-${String(index + 1).padStart(3, "0")}`)), "exposure_registry_triggered_profile", "triggered_rows")]),
    subsection("visible_control_limitation_signals", "Visible Control / Limitation Signals", [field("controlled_rows_summary", "Visible control or limitation signals", controlledRows.map((row, index) => controlledRow(row, `CTRL-${String(index + 1).padStart(3, "0")}`)), "exposure_registry_controlled_profile", "controlled_rows")]),
    subsection("review_priority", "Review Priority", [field("review_priority_summary", "Review priority grouping", priorityRows(triggeredRows), "exposure_registry_triggered_profile", "triggered_rows")]),
    subsection("control_position", "Control Position", [field("control_position_summary", "Triggered/controlled breakdown", { visible_exposure_signals: triggeredRows.length, visible_control_or_limitation_signals: controlledRows.length, controlled_breakdown: countBy(controlledRows, (row) => row.evaluation_status || row.final_material_status) }, "exposure_registry_controlled_profile", "controlled_rows")]),
    subsection("evidence_crosswalk", "Evidence Crosswalk", [field("finding_to_source_crosswalk", "Finding-to-source crosswalk", triggeredRows.map((row, index) => ({ display_exposure_id: `EXP-${String(index + 1).padStart(3, "0")}`, technical_refs: refs(row) })), "exposure_registry_triggered_profile", "triggered_rows")])
  ], { summary: "Visible exposure signals, visible control/limitation signals, review priority, control position, and evidence crosswalk." });
}

function buildImplicationsReviewPathSection(context) {
  const triggeredRows = exposureRows(context.profiles.exposure_registry_triggered_profile, "triggered_rows");
  const controlledRows = exposureRows(context.profiles.exposure_registry_controlled_profile, "controlled_rows");
  const d = context.profiles.data_provenance_profile;
  return section(context, "implications_review_path", [
    subsection("priority_actions", "Priority Actions", [field("priority_actions", "Priority qualified-review actions", triggeredRows.map((row, index) => ({ action_reference: `ACT-${String(index + 1).padStart(3, "0")}`, linked_finding: `EXP-${String(index + 1).padStart(3, "0")}`, review_route: reviewRouteLabel(row.review_route || getPath(row, "material_projection.review_route")), visible_signal: safeText(row.basis_proof || getPath(row, "material_projection.basis_proof"), "Visible signal requires qualified review"), downstream_use_limit: "Use as review queue only; qualified reviewer should verify." })), "exposure_registry_triggered_profile", "triggered_rows")]),
    subsection("review_routes", "Review Routes", [
      field("document_route", "Document review route", candidateRoutes(triggeredRows, "document"), "exposure_registry_triggered_profile", "review_route"),
      field("data_control_route", "Data/control review route", candidateRoutes(triggeredRows, "data"), "exposure_registry_triggered_profile", "review_route"),
      field("operational_control_route", "Operational control review route", candidateRoutes(triggeredRows, "operational"), "exposure_registry_triggered_profile", "review_route")
    ]),
    subsection("qualified_review_queue", "Qualified Review Queue", [field("qualified_review_queue", "Finding-to-review-route queue", triggeredRows.map((row, index) => ({ linked_finding: `EXP-${String(index + 1).padStart(3, "0")}`, route: reviewRouteLabel(row.review_route || getPath(row, "material_projection.review_route")) })), "exposure_registry_triggered_profile", "triggered_rows")]),
    subsection("visible_controls_to_preserve", "Visible Controls to Preserve or Verify", [field("quick_wins", "Visible controls to preserve or verify", controlledRows.map((row) => safeText(row.control_exclusion_evaluation || row.basis_proof || getPath(row, "material_projection.control_exclusion_evaluation"), "Visible control/exclusion/limitation to preserve or verify")), "exposure_registry_controlled_profile", "controlled_rows")]),
    subsection("blockers", "Blocked Until Clarified", [field("blocked_until_clarified", "Items blocked until clarified", asArray(d.missing_proof_and_diligence_requests).map((item) => safeText(item, "Confirmation needed")), "data_provenance_profile", "missing_proof_and_diligence_requests")]),
    subsection("handoff_status", "Review-Ready Handoff Status", [field("review_ready_handoff_status", "Review-ready handoff status", "Assembly handoff available after qualified-review confirmation.", "normalized_profiler", "review_ready_handoff_status")])
  ], { summary: "Priority actions, candidate review routes, review queue, visible controls, blockers, and review-ready handoff status." });
}

function buildEvidenceGapsSection(context) {
  const d = context.profiles.data_provenance_profile;
  const l = context.profiles.legal_cartography_index;
  const limitations = dedupeStrings(context.limitations.map((row) => row.display_text));
  return section(context, "evidence_gaps_clarification_points", [
    subsection("open_information_requests", "Open Information Requests", [field("open_information_requests", "Open information requests", rows(d.missing_proof_and_diligence_requests, "IR"), "data_provenance_profile", "missing_proof_and_diligence_requests")]),
    subsection("missing_documents", "Missing Documents", [field("missing_documents", "Missing or limited legal/governance materials", rows(l.missing_limited_legal_governance_items, "DOCREQ"), "legal_cartography_index", "missing_limited_legal_governance_items")]),
    subsection("factual_confirmations", "Factual Confirmations", [field("missing_factual_confirmations", "Factual confirmations needed", limitations.map((text, index) => ({ confirmation_reference: `FC-${String(index + 1).padStart(3, "0")}`, question: `Confirm or qualify: ${text}` })), "normalized_profiler", "limitations")]),
    subsection("unclear_data_flows", "Unclear Data Flows", [field("unclear_data_flows", "Unclear data-flow points", rows(d.collection_sources_and_activity_data_flows, "DATA").filter(unclear), "data_provenance_profile", "collection_sources_and_activity_data_flows")]),
    subsection("provider_dependencies", "Provider Dependencies", [field("unclear_provider_dependencies", "Unclear vendor/provider dependencies", rows(d.vendor_subprocessor_partner_inventory || d.ai_model_provider_processing_chain, "VEND").filter(unclear), "data_provenance_profile", "vendor_subprocessor_partner_inventory")]),
    subsection("client_questions", "Client Confirmation Questions", [field("client_confirmation_questions", "Client confirmation questions", limitations.map((text, index) => `CQ-${String(index + 1).padStart(3, "0")}: ${text}`), "normalized_profiler", "limitations")])
  ], { summary: "Open information requests, missing documents, confirmations, unclear flows, provider dependencies, and client questions." });
}

function buildMethodologySection(context) {
  return section(context, "methodology_limitations_review_notes", [
    subsection("methodology", "Methodology", [field("methodology", "How the review was run", ["Public-footprint source discovery and locked artifact assembly.", "Registry-governed material field mapping using locked backend artifacts.", "Deterministic section normalization after M12.", "No model call is required after the normalized profiler."], "normalized_profiler", "methodology")]),
    subsection("stage_roles", "Stage Roles", [field("stage_roles", "Review stage roles", [{ review_step: "M7", purpose: "Target Profile" }, { review_step: "M8", purpose: "Product / Activity Profile" }, { review_step: "M9", purpose: "Legal Document & Control Review" }, { review_step: "M10", purpose: "Data Provenance & Controls" }, { review_step: "M11", purpose: "Exposure Registry split triggered/controlled profiles" }, { review_step: "M12", purpose: "Deterministic quality challenge gate" }, { review_step: "Normalized Profiler / Renderer", purpose: "Deterministic section assembly and display" }], "normalized_profiler", "stage_roles")]),
    subsection("status_definitions", "Status Definitions", [field("status_definitions", "What each status means", [{ status: "Visible exposure signal", meaning: "A public-footprint signal was mapped into a triggered exposure row. It is not a final conclusion." }, { status: "Visible control reduces exposure", meaning: "A visible control signal materially affects row status." }, { status: "Registry exclusion applied", meaning: "The row trigger was affected by registry exclusion logic." }, { status: "Public evidence limitation", meaning: "Public evidence was too thin or limited for a triggered output." }, { status: "Needs qualified review", meaning: "A qualified reviewer should verify before reliance." }], "report_safe_language", "statusLabel")]),
    subsection("legal_boundary", "Legal Boundary", [field("review_ready_notice", "Review-Ready / qualified review notice", REVIEW_READY_BOUNDARY_NOTICE, "report_safe_language", "REVIEW_READY_BOUNDARY_NOTICE")]),
    subsection("evidence_limitations", "Evidence Limitations", [field("evidence_limitations", "Limitations affecting reliance", dedupeStrings(context.limitations.map((row) => row.display_text)), "normalized_profiler", "limitations")]),
    subsection("registry_use_note", "Registry Use Note", [field("registry_use_note", "Registry as internal framework", "The registry is used as an internal review framework and normalization authority. Main report language uses display-safe labels; raw IDs remain in appendix/details.", "normalized_profiler", "registry_use_note")])
  ], { summary: "Methodology, stage roles, safe status language, legal boundary, evidence limitations, and registry-use note." });
}

function buildForensicAppendixSection(context) {
  const appendix = buildForensicLedgerAppendix({ handoff: {}, profiles: context.profiles, forensics: context.forensics, displayIdIndex: context.display_id_index });
  return section(context, "forensic_ledger_appendix", [
    subsection("audit_summary", "Audit Summary", [field("full_ledger_summary", "Audit summary", appendix.full_ledger_summary, "forensics", "full_ledger_summary")]),
    subsection("full_registry_ledger", "Full Registry Ledger", [field("full_registry_ledger", "Full registry review ledger", appendix.full_registry_ledger, "exposure_registry_workpad_98", "registry_rows")]),
    subsection("row_level_proof", "Row-Level Proof", [field("row_level_proof", "Finding proof details", appendix.row_level_proof, "exposure_registry_workpad_98", "registry_rows.material_projection")]),
    subsection("evidence_and_challenge", "Evidence and Challenge Trace", [field("trigger_basis", "Trigger basis", appendix.condition_trigger_basis, "exposure_registry_profile_forensics", "trigger_adjudication_ledger"), field("evidence_references", "Evidence references", appendix.evidence_references, "exposure_registry_profile_forensics", "evidence_binding_ledger"), field("operator_challenge_trace", "Quality challenge trace", appendix.operator_challenge_trace, "challenge_gate", "challenge_gate")]),
    subsection("validation_and_boundary", "Validation and Boundary", [field("batch_warnings", "Batch validation warnings", appendix.batch_warnings, "m11_m12_forensics", "batch_warnings"), field("appendix_limitations", "Appendix limitations", appendix.appendix_limitations, "forensics", "appendix_limitations"), field("renderer_export_trace", "Renderer/export trace", appendix.renderer_export_trace, "normalized_profiler", "renderer_export_trace"), field("forensic_boundary", "Forensic boundary", appendix.forensic_boundary, "normalized_profiler", "forensic_boundary")])
  ], { summary: "Audit/proof/validation appendix. It preserves proof material and does not create new legal conclusions." });
}

function section(context, key, subsections, { summary = "" } = {}) {
  const defIndex = NORMALIZED_SECTION_KEYS.indexOf(key);
  const title = NORMALIZED_SECTION_DEFINITIONS[defIndex]?.[1] || key;
  return {
    section_id: key,
    artifact_name: `normalized_section__${key}`,
    section_title: title,
    section_order: defIndex + 1,
    section_status: context.validation_status,
    reviewer_summary: safeText(summary, "Section summary not specified"),
    subsections,
    section_limitations: sectionLimitations(context, key),
    source_artifacts_used: collectSourceArtifacts(subsections),
    normalization: {
      profiler_version: NORMALIZED_PROFILER_VERSION,
      normalization_map_version: NORMALIZATION_MAP_VERSION,
      raw_ids_primary_display_allowed: key === "forensic_ledger_appendix",
      legal_conclusion_generated: false
    },
    vault_mapping: buildSectionVaultMapping(key)
  };
}

function subsection(subsection_id, subsection_title, fields) {
  return { subsection_id, subsection_title, fields: asArray(fields) };
}

function field(field_id, label, value, source_artifact, source_path, extra = {}) {
  return {
    field_id,
    label: safeText(label || normalizeFieldLabel(field_id), "Field"),
    value: normalizeFieldValue(value),
    source_artifact,
    source_path,
    evidence_refs: asArray(extra.evidence_refs),
    limitation: safeText(extra.limitation, ""),
    qualified_review_note: safeText(extra.qualified_review_note || "Qualified reviewer should verify before reliance.", "Qualified reviewer should verify before reliance."),
    technical_refs: safeObject(extra.technical_refs)
  };
}

function buildNormalizedReportManifest({ context, sections }) {
  return {
    manifest_type: "normalized_report_manifest",
    profiler_version: NORMALIZED_PROFILER_VERSION,
    normalization_map_version: NORMALIZATION_MAP_VERSION,
    run_id: context.run.run_id || "UNKNOWN_RUN",
    target: context.run.target || hostFromUrl(context.run.root_url),
    target_url: context.run.root_url || context.run.target_url || context.run.target || "",
    generated_at: context.generated_at,
    validation_status: context.validation_status,
    section_order: NORMALIZED_SECTION_KEYS,
    section_artifacts: NORMALIZED_SECTION_KEYS.map((key) => ({ section_id: key, artifact_name: `normalized_section__${key}`, title: sections[key]?.section_title || key, status: sections[key]?.section_status || context.validation_status })),
    renderer_contract: { renderer_may_render: true, renderer_may_sort: true, renderer_may_filter_for_view: true, renderer_may_add_facts: false, renderer_may_change_statuses: false, renderer_may_generate_legal_advice: false, model_used_after_m12: false },
    vault_contract: { vault_may_prefill_review_ready_objects: true, vault_must_preserve_source_refs: true, vault_must_not_treat_public_signals_as_confirmed_private_facts: true, qualified_review_required_before_assembly_reliance: true }
  };
}

function buildVaultSectionHandoff({ context, sections }) {
  return {
    handoff_type: "vault_section_handoff",
    profiler_version: NORMALIZED_PROFILER_VERSION,
    run_id: context.run.run_id || "UNKNOWN_RUN",
    validation_status: context.validation_status,
    sections: NORMALIZED_SECTION_KEYS.map((key) => ({ section_id: key, artifact_name: `normalized_section__${key}`, section_title: sections[key]?.section_title || key, eligible_for_vault: sections[key]?.vault_mapping?.eligible_for_vault !== false, vault_category: sections[key]?.vault_mapping?.vault_category || key, requires_confirmation_before_assembly: true })),
    assembly_boundary: "Use section artifacts as Review-Ready support material only. Public-footprint facts require qualified-review confirmation before document assembly reliance."
  };
}

function buildThinFinalOutputHandoff({ context, normalized_report_manifest, vault_section_handoff }) {
  return {
    final_output_handoff: {
      run_meta: { run_id: context.run.run_id || "UNKNOWN_RUN", target: context.run.target || hostFromUrl(context.run.root_url), target_url: context.run.root_url || context.run.target_url || context.run.target || "", generated_at: context.generated_at, generated_by: "normalized_profiler" },
      validation_status: context.validation_status,
      normalized_report_manifest_ref: "normalized_report_manifest",
      vault_section_handoff_ref: "vault_section_handoff",
      section_artifacts: normalized_report_manifest.section_artifacts,
      renderer_contract: normalized_report_manifest.renderer_contract,
      vault_contract: normalized_report_manifest.vault_contract,
      terminal_checks: { normalized_section_count: NORMALIZED_SECTION_KEYS.length, normalized_sections_emitted: NORMALIZED_SECTION_KEYS.length, legacy_blob_replaced_by_section_artifacts: true },
      legacy_compiler_replaced_by: "NORMALIZED_PROFILER",
      vault_section_handoff
    }
  };
}

function fieldsFromObject(sourceArtifact, parentPath, object, keys) {
  const root = safeObject(object);
  return keys.map((key) => field(key, normalizeFieldLabel(`${parentPath}.${key}`), root[key], sourceArtifact, `${parentPath}.${key}`));
}

function normalizeActivityCard(activity, index) {
  const a = safeObject(activity);
  return {
    activity_display_id: `ACT-${String(index + 1).padStart(3, "0")}`,
    activity_reference: safeText(a.activity_reference, `activity_${index + 1}`),
    related_product_service: safeText(a.product_service_wrapper, "Product/service wrapper not specified"),
    publicly_described_activity: safeText(a.activity_feature_name, "Activity not specified"),
    activity_summary: safeText(a.activity_candidate_summary, "Activity summary not specified"),
    how_it_appears_to_work: safeText(a.mechanics_proof, "Mechanics proof not specified"),
    automation_and_human_review_signal: safeText(a.autonomy_human_control_signal, "Automation / human-review signal not visible"),
    data_content_or_asset_affected: safeText(a.data_content_object_touched, "Data/content/asset not visible"),
    external_or_internal_effect: safeText(a.external_internal_action_signal, "External/internal effect not visible"),
    activity_patterns: normalizeArchetypeList(a.archetype_codes),
    activity_pattern_proof: safeText(a.archetype_proof, "Activity pattern proof not specified"),
    affected_contexts: normalizeSurfaceList(a.surface_context_tokens),
    affected_context_proof_and_limits: safeText(a.surface_proof_and_routing_limits, "Affected-context proof/limits not specified")
  };
}

function findingRow(row, displayId) {
  return {
    display_exposure_id: displayId,
    plain_english_issue: safeText(row.Legal_Pain || row.Subcategory || row.Threat_ID, "Exposure signal"),
    review_category: safeText(row.Pain_Category || row.Subcategory, "Review category not specified"),
    review_priority_tier: safeText(row.Pain_Tier, "Review priority not specified"),
    review_depth: safeText(row.Pain_Depth, "Review depth not specified"),
    display_status: normalizeStatusForReport(row.evaluation_status || row.final_material_status || "TRIGGERED"),
    related_activity: safeText(row.target_match || getPath(row, "material_projection.target_match"), "Related activity not specified"),
    visible_basis: safeText(row.basis_proof || getPath(row, "material_projection.basis_proof"), "Visible exposure signal recorded"),
    visible_control_position: safeText(row.control_exclusion_evaluation || getPath(row, "material_projection.control_exclusion_evaluation"), "Visible control/exclusion position requires review"),
    evidence_source_basis: safeText(row.evidence_source_basis || getPath(row, "material_projection.evidence_source_basis"), "Source reference in appendix"),
    activity_pattern: normalizeInternalValue(row.Archetype, "archetype"),
    affected_context: normalizeInternalValue(row.Surface, "surface"),
    review_route: reviewRouteLabel(row.review_route || getPath(row, "material_projection.review_route")),
    technical_refs: refs(row)
  };
}

function controlledRow(row, displayId) {
  return {
    display_control_id: displayId,
    controlled_signal: safeText(row.Legal_Pain || row.Subcategory || row.Threat_ID, "Controlled registry signal"),
    display_status: normalizeStatusForReport(row.evaluation_status || row.final_material_status),
    visible_control_position: safeText(row.control_exclusion_evaluation || row.basis_proof || getPath(row, "material_projection.control_exclusion_evaluation"), "Visible control/exclusion/limitation found"),
    preserve_or_verify: "Preserve / verify before downstream assembly reliance.",
    technical_refs: refs(row)
  };
}

function buildDisplayIdIndex(profiles) {
  const triggeredRows = exposureRows(profiles.exposure_registry_triggered_profile, "triggered_rows");
  const controlledRows = exposureRows(profiles.exposure_registry_controlled_profile, "controlled_rows");
  return {
    exposure_display_ids: triggeredRows.map((row, index) => ({ display_exposure_id: `EXP-${String(index + 1).padStart(3, "0")}`, canonical_refs: refs(row) })),
    controlled_display_ids: controlledRows.map((row, index) => ({ display_control_id: `CTRL-${String(index + 1).padStart(3, "0")}`, canonical_refs: refs(row) })),
    feature_display_ids: asArray(profiles.target_feature_profile.activities).map((activity, index) => ({ display_feature_id: `ACT-${String(index + 1).padStart(3, "0")}`, activity_reference: activity.activity_reference || "" }))
  };
}

function summarizeTarget(profile = {}) {
  const t = safeObject(profile);
  return {
    public_brand_name: safeText(t.target_identity?.brand_name, "Brand name not visible"),
    legal_entity_contracting_party_signal: safeText(t.target_identity?.legal_entity_name, "Legal entity not visible"),
    entity_form_signal: safeText(t.target_identity?.entity_type, "Entity type not visible"),
    reviewed_public_website: safeText(t.target_identity?.reviewed_website || t.target_identity?.primary_domain, "Reviewed website not visible"),
    high_level_offering: safeText(t.product_service_wrapper?.high_level_offering, "Offering not visible")
  };
}

function dataPosture(data = {}) {
  const d = safeObject(data);
  return {
    data_fields_present: Object.keys(d).filter((key) => d[key] !== null && d[key] !== undefined && d[key] !== "").length,
    missing_proof_requests: asArray(d.missing_proof_and_diligence_requests).length,
    readiness_rows: asArray(d.law_regulatory_readiness_matrix).length,
    sensitive_data_indicators_present: asArray(d.sensitive_special_category_signals).length > 0 || Boolean(d.children_minors_signal)
  };
}

function legalPosture(legal = {}) {
  const l = safeObject(legal);
  return {
    document_rows: asArray(l.document_coverage_index).length,
    legal_unit_rows: asArray(l.document_structure_index).length,
    linked_document_rows: asArray(l.incorporated_linked_document_map).length,
    control_language_rows: asArray(l.control_language_locator).length,
    missing_or_limited_rows: asArray(l.missing_limited_legal_governance_items).length,
    lock_status: statusLabel(l.lock_status)
  };
}

function qualifiedPriorities({ triggeredRows, data, legal }) {
  const out = [];
  if (triggeredRows.length) out.push(`${triggeredRows.length} visible exposure signal(s) require qualified review.`);
  if (asArray(data.missing_proof_and_diligence_requests).length) out.push(`${asArray(data.missing_proof_and_diligence_requests).length} data/control confirmation request(s) require follow-up.`);
  if (asArray(legal.missing_limited_legal_governance_items).length) out.push(`${asArray(legal.missing_limited_legal_governance_items).length} legal/governance item(s) are missing, limited, or unclear in public materials.`);
  return out.length ? out : ["No priority queue was deterministically derived from locked artifacts; review appendix limitations before reliance."];
}

function qualifiedLegalReviewPoints(legal = {}) {
  const missing = rows(legal.missing_limited_legal_governance_items, "QRP").map((row) => ({ ...row, review_point_type: "Missing or limited material", review_route: "Qualified reviewer should verify" }));
  const controls = rows(legal.control_language_locator, "CTRL").map((row) => ({ ...row, review_point_type: "Control-language locator", review_route: "Qualified reviewer should verify" }));
  return [...missing, ...controls];
}

function normalizeActivityPatterns(activities) {
  return unique(activities.flatMap((activity) => normalizeArchetypeList(activity.archetype_codes)));
}

function normalizeAffectedContexts(activities) {
  return unique(activities.flatMap((activity) => normalizeSurfaceList(activity.surface_context_tokens)));
}

function normalizeFieldValue(value) {
  if (Array.isArray(value)) return value.map((item) => normalizeFieldValue(item));
  if (value && typeof value === "object") return value;
  return safeText(value, "Not visible in reviewed public materials");
}

function sourceModeLabel(value) {
  const raw = String(value || "url").trim();
  if (raw === "url_plus_documents") return "Website + uploaded source documents reviewed";
  if (raw === "url") return "Website/public URL review";
  return safeText(raw, "Source mode not specified");
}

function buildSectionVaultMapping(key) {
  return { eligible_for_vault: key !== "methodology_limitations_review_notes" && key !== "forensic_ledger_appendix", vault_category: key, requires_confirmation_before_assembly: true };
}

function sectionLimitations(context, key) {
  const sourceHints = {
    target_profile: ["target_profile", "m7_forensics"],
    product_activity_ip_profile: ["target_feature_profile", "m8_forensics"],
    data_provenance_controls: ["data_provenance_profile", "m10_forensics"],
    legal_document_control_review: ["legal_cartography_index"],
    exposure_findings: ["m11_forensics"],
    evidence_gaps_clarification_points: ["target_profile", "target_feature_profile", "data_provenance_profile", "legal_cartography_index", "compiler", "m7_forensics", "m8_forensics", "m10_forensics", "m11_forensics"]
  };
  const allowed = sourceHints[key];
  return context.limitations.filter((row) => !allowed || allowed.includes(row.source)).map((row) => safeText(row.display_text, "Limitation recorded"));
}

function collectSourceArtifacts(subsections = []) {
  return unique(subsections.flatMap((sub) => asArray(sub.fields).map((f) => f.source_artifact).filter(Boolean)));
}

function rows(value, prefix) {
  return asArray(value).map((row, index) => (row && typeof row === "object" && !Array.isArray(row) ? { display_ref: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...row } : { display_ref: `${prefix}-${String(index + 1).padStart(3, "0")}`, value: safeText(row, "Row recorded") }));
}

function exposureRows(profile, key) {
  const o = safeObject(profile);
  return asArray(o[key] || o.rows || o.registry_rows);
}

function refs(row = {}) {
  return {
    registry_row_id: row.Threat_ID || row.registry_row_id || row.threat_id || "",
    threat_id: row.Threat_ID || row.threat_id || row.registry_row_id || "",
    ledger_row_id: row.ledger_row_id || row.registry_order || "",
    evaluation_status: row.evaluation_status || row.final_material_status || "",
    evidence_refs: asArray(row.evidence_refs || getPath(row, "basis_proof.evidence_refs") || getPath(row, "material_projection.basis_proof.evidence_refs")),
    source_refs: asArray(row.source_refs || getPath(row, "basis_proof.source_refs") || getPath(row, "material_projection.basis_proof.source_refs")),
    artifact_refs: asArray(row.artifact_refs),
    unit_refs: asArray(row.unit_refs)
  };
}

function candidateRoutes(rowsIn, type) {
  return rowsIn.map((row, index) => ({ route_reference: `${type.toUpperCase()}-${String(index + 1).padStart(3, "0")}`, linked_signal: safeText(row.Legal_Pain || row.Threat_ID, "Review signal"), candidate_route: reviewRouteLabel(row.review_route || getPath(row, "material_projection.review_route")), route_limit: "Candidate review route only; qualified reviewer should verify." }));
}

function groupRows(rowsIn = []) {
  const grouped = new Map();
  for (const row of rowsIn) {
    const key = safeText(row.Pain_Category || row.Subcategory, "Uncategorized review signal");
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }
  return [...grouped.entries()].map(([category, count]) => ({ review_category: category, count }));
}

function priorityRows(rowsIn = []) {
  const grouped = new Map();
  for (const row of rowsIn) {
    const key = [row.Pain_Tier, row.Pain_Depth, row.Pain_Category].filter(Boolean).map((part) => safeText(part, "")).join(" / ") || "Priority not specified";
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }
  return [...grouped.entries()].map(([review_priority, count]) => ({ review_priority, count }));
}

function countBy(rowsIn, keyFn) {
  const out = {};
  for (const row of rowsIn) {
    const key = safeText(keyFn(row), "Unknown");
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function hasContentIpSignal(activity) {
  return /content|copyright|ip|output|text|audio|image|video|code|document/i.test(JSON.stringify(activity || {}));
}

function unclear(row) {
  return /not visible|weak|unclear|access|unknown|missing|limited/i.test(JSON.stringify(row || {}));
}

function dedupeStrings(values) {
  return unique(asArray(values).map((value) => safeText(value, "")).filter(Boolean));
}

function pick(object, keys) {
  return Object.fromEntries(keys.map((key) => [key, object?.[key]]) );
}

function unwrapArtifact(value, key) {
  const object = safeObject(value);
  return safeObject(object[key] || object.artifact?.[key] || object);
}

function hostFromUrl(value) {
  try {
    return new URL(String(value || "")).hostname.replace(/^www\./i, "");
  } catch {
    return safeText(value, "Target not specified");
  }
}
