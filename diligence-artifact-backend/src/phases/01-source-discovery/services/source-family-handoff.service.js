import { COMMON_ROOTS } from "./source-discovery-taxonomy.service.js";

export function buildSourceFamilyHandoffArtifact({ run, artifacts }) {
  const manifest = artifacts?.deduped_url_manifest;
  const sourceIndex = artifacts?.source_family_index;
  if (!manifest?.manifest_sources?.length) throw new Error("SOURCE_FAMILY_HANDOFF_BLOCKED:deduped_url_manifest_missing_or_empty");
  if (!sourceIndex?.discovered_source_index) throw new Error("SOURCE_FAMILY_HANDOFF_BLOCKED:source_family_index_missing_or_invalid");

  const commonRootIndex = Object.fromEntries(COMMON_ROOTS.map((root) => [root.id, commonRootEntry(root, artifacts, manifest, sourceIndex)]));
  const legalDocs = artifacts?.legal_doc_inventory?.documents_found || [];
  const neutralBuckets = artifacts?.neutral_evidence_bucket_manifest?.buckets || {};
  const targetUrl = manifest.target_url || run.root_url || run.target;

  return {
    source_discovery_handoff: {
      run_id: run.run_id,
      target_url: targetUrl,
      generated_by: "source_discovery_handoff",
      schema_version: "PHASE1_AGNOSTIC_SOURCE_DISCOVERY_HANDOFF_v1_LOCKED_ROOTS",
      status: hasPrimary(commonRootIndex) || legalDocs.length ? "LOCKED" : "LOCKED_WITH_LIMITATIONS",
      contract: {
        formal_output: "source_discovery_handoff",
        purpose: "Index Phase 1 locked common-root source files, neutral evidence buckets, and independent legal document artifacts for downstream profile consumers.",
        source_discovery_prevails: true,
        no_new_urls: true,
        no_new_extraction: true,
        no_full_text: true,
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
        documents_found: legalDocs.map((doc) => ({ artifact_name: doc.artifact_name, doc_type: doc.doc_type, source_url: doc.source_url, status: doc.status }))
      },
      missing_or_limited_sources: sourceIndex.missing_limited_primary_sources || [],
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
      schema_version: "POST_PHASE_1_DOMAIN_GATE_HANDOFF_v1_LOCKED_ROOTS",
      classification_allowed: true,
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
  const rootManifest = sourceIndex?.root_artifact_manifest?.[root.id] || {};
  return {
    file,
    priority: root.priority,
    neutral_buckets: root.buckets,
    storage_status: rootManifest.status || artifact.storage_mode || (artifact.sources?.length ? "SINGLE" : "UNSAVED_EMPTY"),
    virtual_root_file: rootManifest.virtual_artifact_name || file,
    physical_artifacts: rootManifest.required_artifacts || [],
    shard_count: rootManifest.shard_count || rootManifest.required_artifacts?.length || 0,
    shard_resolution_required: Boolean((rootManifest.required_artifacts || []).length > 1),
    complete: rootManifest.complete !== false,
    primary: (artifact.sources || []).map((source) => primaryRef(source, file, rootManifest)),
    legal_documents: artifact.legal_document_sources || [],
    index_only: indexOnlyRefs(artifact, manifestRows),
    failed_absent: failedAbsentRefs(artifact, manifestRows)
  };
}

function primaryRef(source, file, rootManifest) {
  return clean({ source_id: source.source_id, manifest_id: source.manifest_id, file, physical_artifacts: rootManifest?.required_artifacts || [], url: source.canonical_url || source.url || source.final_url, route_type: source.route_type, neutral_buckets: source.neutral_buckets || [], text_field: "lossless_text" });
}
function indexOnlyRefs(artifact, manifestRows) { const rows = [...(artifact.manifest_only_sources || []), ...(artifact.metadata_only_sources || [])]; const source = rows.length ? rows : manifestRows.filter((row) => ["SECONDARY", "CONTEXT_ONLY", "METADATA_ONLY"].includes(row.admission_tier)); return source.map((row) => clean({ manifest_id: row.manifest_id, url: row.canonical_url || row.fetch_url, tier: row.admission_tier, route_type: row.route_type, reason: row.tier_reason })); }
function failedAbsentRefs(artifact, manifestRows) { const failed = (artifact.rejected_sources || []).map((row) => clean({ source_id: row.source_id, manifest_id: row.manifest_id, url: row.canonical_url || row.url || row.fetch_url, status: row.extraction_status || row.status || "FAILED_PRIMARY_EXTRACTION", reason: row.error || row.rejection_reason })); const absent = (artifact.missing_limited_primary_sources || []).map((row) => clean({ status: row.status || "ABSENT_AFTER_TARGETED_PROBE", missing: row.missing_or_limited_source, attempted_paths: row.attempted_paths })); const rejected = manifestRows.filter((row) => row.admission_tier === "REJECTED_NOT_EVIDENCE").map((row) => clean({ manifest_id: row.manifest_id, url: row.canonical_url || row.fetch_url, status: "REJECTED_NOT_EVIDENCE", reason: row.tier_reason })); return [...failed, ...absent, ...rejected]; }
function accessMatrix() { return { global: { default_load: "locked common roots, neutral buckets, and independent legal documents only", index_only: "metadata only", cross_bucket: "exception only", legal_doc_rule: "load individual legal_doc_* artifacts for substance" }, central_phases: { POST_PHASE_1_DOMAIN_GATE: { buckets: ["commercial_positioning_sources", "product_activity_sources", "regulated_activity_signals", "ai_mechanism_signals", "data_processing_signals", "customer_segment_signals", "jurisdiction_market_signals"], source: "neutral_evidence_bucket_manifest" }, LEGAL_CARTOGRAPHY_INDEX: { artifacts: ["legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_{DOC_TYPE}"], buckets: ["legal_terms_sources", "privacy_security_sources", "trust_compliance_sources", "contact_notice_sources", "regulated_activity_signals"] }, TARGET_PROFILE_REVIEW: { roots: ["homepage_landing", "company_identity", "pricing_commercial_availability", "contact_notice"], buckets: ["company_identity_sources", "commercial_positioning_sources", "jurisdiction_market_signals", "contact_notice_sources", "pricing_plan_sources"] }, ACTIVITY_PROFILE_REVIEW: { roots: ["product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "support_help_resources"], buckets: ["product_activity_sources", "technical_docs_sources", "api_integration_sources", "pricing_plan_sources", "customer_segment_signals", "regulated_activity_signals", "ai_mechanism_signals", "support_context_sources"] }, DATA_PROVENANCE_PROFILE: { roots: ["privacy_data_processing", "security_trust_compliance", "data_governance_controls", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "ai_safety_transparency"], artifacts: ["legal_doc_privacy_policy", "legal_doc_data_processing_agreement", "legal_doc_subprocessor_list", "legal_doc_cookie_policy", "legal_doc_terms_of_service"], buckets: ["privacy_security_sources", "data_processing_signals", "technical_docs_sources", "api_integration_sources", "trust_compliance_sources", "contact_notice_sources", "ai_mechanism_signals"] }, EXPOSURE_PROFILE: { required_profiles: ["legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile_semantic_batch_gate"], source_trace: "source_discovery_handoff" }, COMPILER: { required_profiles: ["locked_outputs_only"], source_trace: "source_discovery_handoff" } } }; }
function hasPrimary(index) { return Object.values(index).some((root) => root.primary.length); }
function emptyResolvedRoot(root, rootManifest = {}) { return { artifact_name: `lossless_root__${root.id}`, common_root: root.id, storage_mode: rootManifest.status || "UNSAVED_EMPTY", sources: [], legal_document_sources: [], manifest_only_sources: [], metadata_only_sources: [], rejected_sources: [], missing_limited_primary_sources: [] }; }
function clean(value) { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== "")); }
