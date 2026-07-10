import { COMMON_ROOTS, ROOT_TRAVERSAL_POLICY } from "./source-discovery-taxonomy.service.js";

export function buildSourceFamilyHandoffArtifact({ run, artifacts }) {
  const manifest = artifacts?.deduped_url_manifest;
  const sourceIndex = artifacts?.source_family_index;
  if (!manifest?.manifest_sources?.length) throw new Error("SOURCE_FAMILY_HANDOFF_BLOCKED:deduped_url_manifest_missing_or_empty");
  if (!sourceIndex?.discovered_source_index) throw new Error("SOURCE_FAMILY_HANDOFF_BLOCKED:source_family_index_missing_or_invalid");

  const sourceRows = sourceIndex.discovered_source_index || [];
  const manifestRows = manifest.manifest_sources || [];
  const commonRootIndex = Object.fromEntries(COMMON_ROOTS.map((root) => [root.id, commonRootEntry(root, artifacts, manifest, sourceIndex)]));
  const legalDocs = artifacts?.legal_doc_inventory?.documents_found || [];
  const neutralBuckets = artifacts?.neutral_evidence_bucket_manifest?.buckets || {};
  const targetUrl = manifest.target_url || run.root_url || run.target;

  return {
    source_discovery_handoff: {
      run_id: run.run_id,
      target_url: targetUrl,
      generated_by: "source_discovery_handoff",
      schema_version: "PHASE1_SOURCE_DISCOVERY_HANDOFF_v2_FULL_ROOT_MATRIX",
      status: hasPrimary(commonRootIndex) || legalDocs.length ? "LOCKED" : "LOCKED_WITH_LIMITATIONS",
      contract: {
        formal_output: "source_discovery_handoff",
        purpose: "Index Phase 1 locked common-root source files, full matrix metadata, neutral evidence buckets, and independent legal document artifacts for downstream profile consumers.",
        source_discovery_prevails: true,
        no_new_urls: true,
        no_new_extraction: true,
        no_full_text: true,
        full_15_root_classifier_matrix_preserved: true,
        primary_full_extract_slug_chain_preserved: true,
        source_signal_roles_preserved: true,
        technical_route_shape_preserved: true,
        api_data_flow_signal_preserved: true,
        legal_doc_granularity_preserved: true,
        agnostic_bucket_artifacts_enabled: true,
        independent_legal_doc_artifacts_enabled: true,
        legal_doc_inventory_is_navigation_only: true,
        individual_legal_doc_artifacts_are_source_of_truth: true,
        source_text_location: "lossless_root__{COMMON_ROOT}.sources[].lossless_text OR legal_doc_{DOC_TYPE}.lossless_text"
      },
      common_root_index: commonRootIndex,
      neutral_evidence_bucket_index: neutralBuckets,
      legal_document_index: {
        inventory_artifact: "legal_doc_inventory",
        extraction_index_artifact: "legal_doc_extraction_index",
        validation_artifact: "legal_doc_lossless_validation_manifest",
        documents_found: legalDocs.map((doc) => legalDocumentRef(doc, sourceRows, manifestRows))
      },
      full_matrix_source_index: {
        primary_sources: sourceRows.filter((row) => row.admission_tier === "PRIMARY" && !row.legal_doc_candidate).map((row) => canonicalSourceRef(row, sourceIndex)),
        legal_document_sources: sourceRows.filter((row) => row.legal_doc_candidate).map((row) => canonicalSourceRef(row, sourceIndex, { textField: "legal_doc_{DOC_TYPE}.lossless_text" })),
        manifest_only_sources: [...(sourceIndex.manifest_only_index || []), ...(sourceIndex.metadata_only_index || [])].map((row) => canonicalSourceRef(row, sourceIndex)),
        failed_sources: (sourceIndex.failed_source_index || []).map((row) => canonicalSourceRef(row, sourceIndex, { status: row.extraction_status || row.status || "FAILED_PRIMARY_EXTRACTION", reason: row.error || row.rejection_reason }))
      },
      missing_or_limited_sources: (sourceIndex.missing_limited_primary_sources || []).map((row) => missingSourceRef(row)),
      access_matrix: accessMatrix(),
      canonical_artifacts: {
        self: "source_discovery_handoff",
        manifest: "deduped_url_manifest",
        source_index: "source_family_index",
        matrix_manifest: "source_discovery_matrix_manifest",
        neutral_bucket_manifest: "neutral_evidence_bucket_manifest",
        adapter_expansion_log: "adapter_expansion_log",
        common_root_pattern: "lossless_root__{COMMON_ROOT}",
        common_root_shard_pattern: "lossless_root__{COMMON_ROOT}__part_{NNN}",
        legal_doc_inventory: "legal_doc_inventory",
        legal_doc_extraction_index: "legal_doc_extraction_index",
        legal_doc_pattern: "legal_doc_{DOC_TYPE}",
        legal_doc_lossless_validation_manifest: "legal_doc_lossless_validation_manifest"
      },
      handoff_to_domain_gate: { ready: true, classification_allowed_next: true, classification_allowed_in_phase_1: false }
    },
    post_phase_1_domain_gate_handoff: {
      run_id: run.run_id,
      target_url: targetUrl,
      generated_by: "source_discovery_handoff",
      schema_version: "POST_PHASE_1_DOMAIN_GATE_HANDOFF_v2_FULL_ROOT_MATRIX",
      classification_allowed: true,
      full_15_root_classifier_matrix_preserved: true,
      primary_full_extract_slug_chain_preserved: true,
      source_signal_roles_preserved: true,
      technical_route_shape_preserved: true,
      api_data_flow_signal_preserved: true,
      classification_source_artifacts: ["source_discovery_handoff", "source_discovery_matrix_manifest", "neutral_evidence_bucket_manifest", "adapter_expansion_log", "legal_doc_inventory", "legal_doc_extraction_index"],
      legal_doc_granularity_rule: "Domain Gate may use legal_doc_inventory for navigation, but must use individual legal_doc_* artifacts for substance.",
      domain_lock_allowed_before_this_handoff: false,
      forbidden_phase_1_actions_confirmed: { primary_domain_locked: false, source_discovery_narrowed: false, sources_excluded_by_domain: false, domain_specific_prompt_routing_used: false, dynamic_routing_used: false }
    }
  };
}

function commonRootEntry(root, artifacts, manifest, sourceIndex) {
  const file = `lossless_root__${root.id}`;
  const artifact = artifacts?.[file] || emptyResolvedRoot(root, sourceIndex?.root_artifact_manifest?.[root.id]);
  const manifestRows = (manifest.manifest_sources || []).filter((row) => row.common_root === root.id);
  const extractedRows = (sourceIndex.discovered_source_index || []).filter((row) => row.common_root === root.id);
  const manifestOnlyRows = [...(sourceIndex.manifest_only_index || []), ...(sourceIndex.metadata_only_index || [])].filter((row) => row.common_root === root.id);
  const failedRows = (sourceIndex.failed_source_index || []).filter((row) => row.common_root === root.id);
  const missingRows = (sourceIndex.missing_limited_primary_sources || []).filter((row) => row.common_root === root.id);
  const rootManifest = sourceIndex?.root_artifact_manifest?.[root.id] || {};
  return {
    file,
    priority: root.priority,
    root_traversal_policy: root.traversal_policy || ROOT_TRAVERSAL_POLICY[root.id],
    neutral_buckets: root.buckets,
    storage_status: rootManifest.status || artifact.storage_mode || (extractedRows.some((row) => !row.legal_doc_candidate) ? "SINGLE" : "UNSAVED_EMPTY"),
    virtual_root_file: rootManifest.virtual_artifact_name || file,
    physical_artifacts: rootManifest.required_artifacts || [],
    shard_count: rootManifest.shard_count || rootManifest.required_artifacts?.length || 0,
    shard_resolution_required: Boolean((rootManifest.required_artifacts || []).length > 1),
    complete: rootManifest.complete !== false,
    primary: extractedRows.filter((row) => !row.legal_doc_candidate).map((row) => canonicalSourceRef(row, sourceIndex)),
    legal_documents: extractedRows.filter((row) => row.legal_doc_candidate).map((row) => canonicalSourceRef(row, sourceIndex, { textField: "legal_doc_{DOC_TYPE}.lossless_text" })),
    index_only: (manifestOnlyRows.length ? manifestOnlyRows : manifestRows.filter((row) => ["SECONDARY", "CONTEXT_ONLY", "METADATA_ONLY"].includes(row.admission_tier))).map((row) => canonicalSourceRef(row, sourceIndex)),
    failed_absent: [...failedRows.map((row) => canonicalSourceRef(row, sourceIndex, { status: row.extraction_status || row.status || "FAILED_PRIMARY_EXTRACTION", reason: row.error || row.rejection_reason })), ...missingRows.map((row) => missingSourceRef(row))]
  };
}

function canonicalSourceRef(row, sourceIndex, overrides = {}) {
  const rootManifest = sourceIndex?.root_artifact_manifest?.[row.common_root] || {};
  const file = rootManifest.virtual_artifact_name || (row.common_root ? `lossless_root__${row.common_root}` : undefined);
  return clean({
    source_id: row.source_id,
    manifest_id: row.manifest_id,
    common_root: row.common_root,
    root_traversal_policy: row.root_traversal_policy || ROOT_TRAVERSAL_POLICY[row.common_root],
    url: row.canonical_url || row.url || row.fetch_url || row.final_url,
    canonical_url: row.canonical_url,
    fetch_url: row.fetch_url || row.url,
    file,
    physical_artifacts: rootManifest.required_artifacts || [],
    text_field: overrides.textField || "lossless_text",
    route_type: row.route_type,
    route_type_aliases: row.route_type_aliases || [],
    materiality: row.materiality,
    admission_tier: row.admission_tier,
    extraction_decision: row.extraction_decision,
    neutral_buckets: row.neutral_buckets || [],
    source_signal_roles: row.source_signal_roles || [],
    technical_route_shape: row.technical_route_shape || null,
    api_data_flow_signal: row.api_data_flow_signal || { present: false, basis: [] },
    legal_doc_candidate: Boolean(row.legal_doc_candidate),
    legal_doc_type: row.legal_doc_type,
    legal_doc_artifact_hint: row.legal_doc_artifact_hint,
    adapter_discovery: row.adapter_discovery || null,
    phase_1_classification_effect: row.phase_1_classification_effect || "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
    evidence_text_source: row.evidence_text_source,
    sha256: row.sha256,
    content_type: row.content_type,
    final_url: row.final_url,
    status: overrides.status || row.extraction_status || row.status,
    reason: overrides.reason || row.tier_reason || row.error || row.rejection_reason
  });
}

function legalDocumentRef(doc, sourceRows, manifestRows) {
  const source = sourceRows.find((row) => row.canonical_url === doc.source_url || row.url === doc.source_url || row.final_url === doc.source_url) || manifestRows.find((row) => row.canonical_url === doc.source_url || row.fetch_url === doc.source_url) || {};
  return clean({
    artifact_name: doc.artifact_name,
    doc_type: doc.doc_type,
    source_url: doc.source_url,
    common_root: source.common_root,
    root_traversal_policy: source.root_traversal_policy || ROOT_TRAVERSAL_POLICY[source.common_root],
    route_type: source.route_type,
    materiality: source.materiality || "legal_document",
    source_signal_roles: doc.source_signal_roles || source.source_signal_roles || [],
    legal_doc_artifact_hint: source.legal_doc_artifact_hint || doc.artifact_name,
    evidence_text_source: source.evidence_text_source,
    sha256: doc.sha256 || source.sha256,
    text_field: "lossless_text",
    source_of_truth: true,
    status: doc.status
  });
}

function missingSourceRef(row) {
  return clean({
    common_root: row.common_root,
    root_traversal_policy: row.root_traversal_policy || ROOT_TRAVERSAL_POLICY[row.common_root],
    status: row.status || "ABSENT_AFTER_TARGETED_PROBE",
    missing: row.missing_or_limited_source,
    attempted_paths: row.attempted_paths || [],
    attempted_manifest_rows: row.attempted_manifest_rows,
    search_exhausted: row.search_exhausted,
    reason: row.why_it_matters
  });
}

function accessMatrix() { return { global: { default_load: "locked common roots, full matrix metadata, neutral buckets, and independent legal documents only", index_only: "metadata only", cross_bucket: "exception only", legal_doc_rule: "load individual legal_doc_* artifacts for substance" }, central_phases: { POST_PHASE_1_DOMAIN_GATE: { buckets: ["commercial_positioning_sources", "product_activity_sources", "regulated_activity_signals", "ai_mechanism_signals", "data_processing_signals", "customer_segment_signals", "jurisdiction_market_signals"], source: "neutral_evidence_bucket_manifest" }, LEGAL_CARTOGRAPHY_INDEX: { artifacts: ["legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_{DOC_TYPE}"], buckets: ["legal_terms_sources", "privacy_security_sources", "trust_compliance_sources", "contact_notice_sources", "regulated_activity_signals"] }, TARGET_PROFILE_REVIEW: { roots: ["homepage_landing", "company_identity", "pricing_commercial_availability", "contact_notice"], buckets: ["company_identity_sources", "commercial_positioning_sources", "jurisdiction_market_signals", "contact_notice_sources", "pricing_plan_sources"] }, ACTIVITY_PROFILE_REVIEW: { roots: ["product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "support_help_resources"], buckets: ["product_activity_sources", "technical_docs_sources", "api_integration_sources", "pricing_plan_sources", "customer_segment_signals", "regulated_activity_signals", "ai_mechanism_signals", "support_context_sources"] }, DATA_PROVENANCE_PROFILE: { roots: ["privacy_data_processing", "security_trust_compliance", "data_governance_controls", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "ai_safety_transparency"], artifacts: ["legal_doc_privacy_policy", "legal_doc_data_processing_agreement", "legal_doc_subprocessor_list", "legal_doc_cookie_policy", "legal_doc_terms_of_service"], buckets: ["privacy_security_sources", "data_processing_signals", "technical_docs_sources", "api_integration_sources", "trust_compliance_sources", "contact_notice_sources", "ai_mechanism_signals"] }, EXPOSURE_PROFILE: { required_profiles: ["legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile_semantic_batch_gate"], source_trace: "source_discovery_handoff" }, COMPILER: { required_profiles: ["locked_outputs_only"], source_trace: "source_discovery_handoff" } } }; }
function hasPrimary(index) { return Object.values(index).some((root) => root.primary.length || root.legal_documents.length); }
function emptyResolvedRoot(root, rootManifest = {}) { return { artifact_name: `lossless_root__${root.id}`, common_root: root.id, root_traversal_policy: root.traversal_policy || ROOT_TRAVERSAL_POLICY[root.id], storage_mode: rootManifest.status || "UNSAVED_EMPTY", sources: [], legal_document_sources: [], manifest_only_sources: [], metadata_only_sources: [], rejected_sources: [], missing_limited_primary_sources: [] }; }
function clean(value) { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== "")); }
