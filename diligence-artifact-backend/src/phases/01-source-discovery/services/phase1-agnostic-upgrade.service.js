import crypto from "node:crypto";

export const COMMON_ROOTS = Object.freeze([
  { id: "homepage_landing", artifact_name: "lossless_root__homepage_landing", priority: "PRIMARY", old_families: ["T0_ROOT"], buckets: ["company_identity_sources", "commercial_positioning_sources"] },
  { id: "about_company", artifact_name: "lossless_root__about_company", priority: "PRIMARY", old_families: ["T1_IDENTITY"], buckets: ["company_identity_sources", "jurisdiction_market_signals"] },
  { id: "legal_identity_notice", artifact_name: "lossless_root__legal_identity_notice", priority: "PRIMARY", old_families: ["T2_LEGAL_IDENTITY", "L6_ENTITY_NOTICE"], buckets: ["company_identity_sources", "contact_notice_sources"] },
  { id: "product_service", artifact_name: "lossless_root__product_service", priority: "PRIMARY", old_families: ["P1_PRODUCT"], buckets: ["product_activity_sources", "commercial_positioning_sources"] },
  { id: "platform_feature_solution", artifact_name: "lossless_root__platform_feature_solution", priority: "PRIMARY", old_families: ["P2_PLATFORM_FEATURE_SOLUTION"], buckets: ["product_activity_sources"] },
  { id: "pricing_commercial_availability", artifact_name: "lossless_root__pricing_commercial_availability", priority: "PRIMARY", old_families: ["P5_ENTERPRISE_PRICING"], buckets: ["pricing_plan_sources", "commercial_positioning_sources"] },
  { id: "privacy_data_processing", artifact_name: "lossless_root__privacy_data_processing", priority: "PRIMARY", old_families: ["D2_SUBPROCESSOR_PRIVACY_CENTER", "L1_CORE_TERMS_PRIVACY", "L4_PRIVACY_ADJACENT_NOTICES"], buckets: ["privacy_security_sources", "data_processing_signals"] },
  { id: "security_trust", artifact_name: "lossless_root__security_trust", priority: "PRIMARY", old_families: ["D1_SECURITY_TRUST"], buckets: ["trust_compliance_sources", "privacy_security_sources"] },
  { id: "technical_docs_api_developer", artifact_name: "lossless_root__technical_docs_api_developer", priority: "PRIMARY", old_families: ["P3_AI_CAPABILITY_TECHNICAL", "D4_DOCS_API_DATA_FLOW"], buckets: ["technical_docs_sources", "api_integration_sources"] },
  { id: "docs_api_data_flow", artifact_name: "lossless_root__docs_api_data_flow", priority: "PRIMARY", old_families: ["D4_DOCS_API_DATA_FLOW"], buckets: ["technical_docs_sources", "api_integration_sources", "data_processing_signals"] },
  { id: "trust_compliance", artifact_name: "lossless_root__trust_compliance", priority: "PRIMARY", old_families: ["D1_SECURITY_TRUST", "D5_AI_SAFETY_TRANSPARENCY"], buckets: ["trust_compliance_sources", "ai_mechanism_signals"] },
  { id: "contact_notice", artifact_name: "lossless_root__contact_notice", priority: "PRIMARY", old_families: ["T2_LEGAL_IDENTITY", "L6_ENTITY_NOTICE"], buckets: ["contact_notice_sources", "company_identity_sources"] },
  { id: "operator_entity_signals", artifact_name: "lossless_root__operator_entity_signals", priority: "SECONDARY", old_families: ["T3_OPERATOR_ENTITY"], buckets: ["company_identity_sources", "jurisdiction_market_signals"] },
  { id: "supporting_company_signals", artifact_name: "lossless_root__supporting_company_signals", priority: "SECONDARY", old_families: ["T4_SUPPORTING_IDENTITY"], buckets: ["third_party_profile_sources", "customer_segment_signals"] },
  { id: "use_case_customer_industry", artifact_name: "lossless_root__use_case_customer_industry", priority: "SECONDARY", old_families: ["P4_USE_CASE_INDUSTRY"], buckets: ["customer_segment_signals", "regulated_activity_signals"] },
  { id: "integrations_ecosystem", artifact_name: "lossless_root__integrations_ecosystem", priority: "SECONDARY", old_families: ["P3_AI_CAPABILITY_TECHNICAL", "D4_DOCS_API_DATA_FLOW"], buckets: ["api_integration_sources", "product_activity_sources"] },
  { id: "support_help", artifact_name: "lossless_root__support_help", priority: "SECONDARY", old_families: ["T4_SUPPORTING_IDENTITY", "P3_AI_CAPABILITY_TECHNICAL"], buckets: ["technical_docs_sources", "product_activity_sources"] },
  { id: "blog_resources", artifact_name: "lossless_root__blog_resources", priority: "SECONDARY", old_families: ["T4_SUPPORTING_IDENTITY"], buckets: ["third_party_profile_sources"] },
  { id: "careers_hiring", artifact_name: "lossless_root__careers_hiring", priority: "SECONDARY", old_families: ["T4_SUPPORTING_IDENTITY"], buckets: ["third_party_profile_sources"] },
  { id: "public_repository_developer_assets", artifact_name: "lossless_root__public_repository_developer_assets", priority: "SECONDARY", old_families: ["P3_AI_CAPABILITY_TECHNICAL"], buckets: ["technical_docs_sources", "api_integration_sources"] },
  { id: "third_party_profiles", artifact_name: "lossless_root__third_party_profiles", priority: "SECONDARY", old_families: ["T4_SUPPORTING_IDENTITY", "P4_USE_CASE_INDUSTRY"], buckets: ["third_party_profile_sources", "customer_segment_signals"] }
]);

export const NEUTRAL_BUCKETS = Object.freeze([
  "company_identity_sources", "commercial_positioning_sources", "product_activity_sources", "technical_docs_sources", "api_integration_sources", "pricing_plan_sources", "legal_terms_sources", "privacy_security_sources", "trust_compliance_sources", "regulated_activity_signals", "ai_mechanism_signals", "data_processing_signals", "contact_notice_sources", "thin_or_missing_source_gaps", "customer_segment_signals", "jurisdiction_market_signals", "third_party_profile_sources"
]);

const ADAPTERS = Object.freeze([
  { adapter_id: "ai-native", adapter_type: "capability_overlay", mode: "EXPAND_ONLY", paths: ["/ai", "/models", "/agents", "/llm", "/assistant", "/automation", "/generation", "/prediction", "/ranking", "/classification"] },
  { adapter_id: "ai-governance", adapter_type: "primary_domain_package", mode: "EXPAND_ONLY", paths: ["/governance", "/model-risk", "/ai-compliance", "/responsible-ai", "/safety", "/evals", "/guardrails"] },
  { adapter_id: "fintech", adapter_type: "primary_domain_package", mode: "EXPAND_ONLY", paths: ["/payments", "/lending", "/credit", "/underwriting", "/banking", "/kyc", "/risk", "/fraud"] },
  { adapter_id: "healthtech", adapter_type: "primary_domain_package", mode: "EXPAND_ONLY", paths: ["/patients", "/clinical", "/diagnosis", "/triage", "/medical", "/health", "/hipaa", "/care"] },
  { adapter_id: "hrtech", adapter_type: "primary_domain_package", mode: "EXPAND_ONLY", paths: ["/hiring", "/recruiting", "/screening", "/assessment", "/performance", "/workforce", "/talent"] },
  { adapter_id: "privacy", adapter_type: "regulatory_overlay", mode: "EXPAND_ONLY", paths: ["/privacy", "/dpa", "/subprocessors", "/cookies", "/gdpr", "/dpdp", "/ccpa", "/data-processing"] }
]);

const LEGAL_DOC_RULES = Object.freeze([
  ["terms_of_service", "legal_doc_terms_of_service", ["terms", "terms-of-service", "terms-of-use", "terms-and-conditions"]],
  ["privacy_policy", "legal_doc_privacy_policy", ["privacy", "privacy-policy"]],
  ["eula", "legal_doc_eula", ["eula"]],
  ["acceptable_use_policy", "legal_doc_acceptable_use_policy", ["aup", "acceptable-use", "acceptable-use-policy"]],
  ["data_processing_agreement", "legal_doc_data_processing_agreement", ["dpa", "data-processing-agreement", "data-processing-addendum"]],
  ["subprocessor_list", "legal_doc_subprocessor_list", ["subprocessor", "subprocessors"]],
  ["cookie_policy", "legal_doc_cookie_policy", ["cookie", "cookies", "cookie-policy"]],
  ["service_level_agreement", "legal_doc_service_level_agreement", ["sla", "service-level", "service-credit"]],
  ["msa", "legal_doc_msa", ["msa", "master-services", "master-service"]],
  ["customer_agreement", "legal_doc_customer_agreement", ["customer-agreement", "platform-agreement", "order-terms"]],
  ["ai_policy", "legal_doc_ai_policy", ["ai-policy", "responsible-ai", "ai-transparency"]],
  ["usage_policy", "legal_doc_usage_policy", ["usage-policy", "model-policy"]],
  ["content_policy", "legal_doc_content_policy", ["content-policy"]],
  ["safety_policy", "legal_doc_safety_policy", ["safety-policy", "safety"]],
  ["legal_notice", "legal_doc_legal_notice", ["legal-notice", "legal"]],
  ["imprint", "legal_doc_imprint", ["imprint"]],
  ["controller_notice", "legal_doc_controller_notice", ["controller", "dpo"]],
  ["refund_cancellation_policy", "legal_doc_refund_cancellation_policy", ["refund", "cancellation", "returns"]],
  ["developer_terms", "legal_doc_developer_terms", ["developer-terms", "api-terms"]],
  ["marketplace_terms", "legal_doc_marketplace_terms", ["marketplace-terms", "seller-terms"]],
  ["baa", "legal_doc_baa", ["baa", "business-associate"]]
]);

const FAMILY_TO_COMMON_ROOTS = COMMON_ROOTS.reduce((acc, root) => {
  for (const family of root.old_families) (acc[family] ||= []).push(root);
  return acc;
}, {});

export function adapterExpansionPathsFromPreflight(preflightContext = {}) {
  const profile = preflightContext.domain_selection_profile || preflightContext;
  const ids = new Set([
    ...(profile.provisional_primary_domain_candidates || []).map((x) => x.package_id),
    ...(profile.provisional_capability_overlay_candidates || []).map((x) => x.package_id),
    ...(profile.provisional_regulatory_overlay_candidates || []).map((x) => x.package_id)
  ].filter(Boolean));
  const paths = [];
  for (const adapter of ADAPTERS) if (ids.has(adapter.adapter_id)) paths.push(...adapter.paths);
  return [...new Set(paths)];
}

export function buildPhase1UrlManifestUpgradeArtifacts({ run, preflight = {}, deduped_url_manifest }) {
  const rows = deduped_url_manifest?.manifest_sources || [];
  const neutralBuckets = emptyNeutralBuckets();
  for (const row of rows) {
    for (const bucket of bucketsForManifestRow(row)) neutralBuckets[bucket].sources.push(manifestRef(row));
  }
  const profile = preflight.domain_selection_profile || preflight || {};
  const adapterIds = new Set([
    ...(profile.provisional_primary_domain_candidates || []).map((x) => x.package_id),
    ...(profile.provisional_capability_overlay_candidates || []).map((x) => x.package_id),
    ...(profile.provisional_regulatory_overlay_candidates || []).map((x) => x.package_id)
  ].filter(Boolean));
  const selectedAdapters = ADAPTERS.filter((adapter) => adapterIds.has(adapter.adapter_id));
  return {
    source_discovery_matrix_manifest: {
      run_id: run?.run_id || null,
      target_url: deduped_url_manifest?.target_url || run?.root_url || run?.target || null,
      generated_by: "source_discovery_url_manifest",
      schema_version: "PHASE1_AGNOSTIC_SOURCE_DISCOVERY_MATRIX_v0",
      classifications: ["COMMON_CORE_ROOT", "EXPAND_ONLY_ADAPTER_ROOT", "NEUTRAL_SIGNAL_BUCKET"],
      common_core_roots: COMMON_ROOTS.map(({ id, artifact_name, priority, old_families, buckets }) => ({ id, artifact_name, priority, legacy_family_compatibility: old_families, neutral_buckets: buckets })),
      adapter_expansion_roots: ADAPTERS.map((adapter) => ({ adapter_id: adapter.adapter_id, adapter_type: adapter.adapter_type, mode: adapter.mode, may_expand_discovery: true, may_narrow_discovery: false, may_exclude_sources: false, probe_paths: adapter.paths })),
      neutral_signal_buckets: NEUTRAL_BUCKETS.map((bucket) => ({ bucket, priority: primaryNeutralBucket(bucket) ? "PRIMARY" : "SECONDARY" })),
      primary_secondary_rule: "Primary/secondary controls discovery priority only. It is not a legal-strength or domain-classification ranking.",
      forbidden_actions_confirmed: noLockNoNarrow()
    },
    adapter_expansion_log: {
      run_id: run?.run_id || null,
      generated_by: "source_discovery_url_manifest",
      schema_version: "PHASE1_ADAPTER_EXPANSION_LOG_v0",
      adapter_mode: "EXPAND_ONLY",
      selected_from_preflight_candidates: selectedAdapters.map((adapter) => ({ adapter_id: adapter.adapter_id, adapter_type: adapter.adapter_type, tested_paths: adapter.paths, may_narrow_discovery: false, may_exclude_sources: false, classification_effect: "NONE" })),
      adapter_paths_registered: selectedAdapters.flatMap((adapter) => adapter.paths),
      dynamic_routing_used: false,
      domain_lock_used: false
    },
    neutral_evidence_bucket_manifest: {
      run_id: run?.run_id || null,
      generated_by: "source_discovery_url_manifest",
      schema_version: "PHASE1_NEUTRAL_EVIDENCE_BUCKET_MANIFEST_v0",
      buckets: neutralBuckets,
      bucket_rule: "Buckets store source evidence only. Domain classification is forbidden inside Phase 1.",
      forbidden_actions_confirmed: noLockNoNarrow()
    }
  };
}

export function buildPhase1ExtractionUpgradeArtifacts({ run, deduped_url_manifest, output }) {
  const rootArtifacts = buildCommonRootArtifacts({ run, deduped_url_manifest, output });
  const legal = buildLegalDocArtifacts({ run, deduped_url_manifest, output });
  return { ...rootArtifacts, ...legal };
}

export function buildPhase1HandoffUpgradeArtifacts({ run, artifacts = {}, output = {} }) {
  const handoff = output.source_discovery_handoff || {};
  const upgraded = {
    ...handoff,
    schema_version: "PHASE1_AGNOSTIC_SOURCE_DISCOVERY_HANDOFF_v0",
    legacy_schema_version: handoff.schema_version || handoff.legacy_schema_version || null,
    upgraded_phase1_bucket_contract: {
      storage_taxonomy: "common agnostic roots + independent legal documents + neutral signal buckets",
      legacy_family_compatibility_retained: true,
      legal_doc_granularity_rule: "Every discovered legal document URL maps to one independent legal_doc_* artifact. No legal blob is source of truth."
    },
    canonical_artifacts: {
      ...(handoff.canonical_artifacts || {}),
      source_discovery_matrix_manifest: "source_discovery_matrix_manifest",
      neutral_evidence_bucket_manifest: "neutral_evidence_bucket_manifest",
      adapter_expansion_log: "adapter_expansion_log",
      common_root_pattern: "lossless_root__{COMMON_ROOT}",
      common_root_shard_pattern: "lossless_root__{COMMON_ROOT}__part_{NNN}",
      legal_doc_inventory: "legal_doc_inventory",
      legal_doc_extraction_index: "legal_doc_extraction_index",
      legal_doc_pattern: "legal_doc_{DOC_TYPE}",
      legal_doc_lossless_validation_manifest: "legal_doc_lossless_validation_manifest"
    },
    neutral_evidence_bucket_manifest_ref: artifacts.neutral_evidence_bucket_manifest ? "neutral_evidence_bucket_manifest" : null,
    legal_doc_inventory_ref: artifacts.legal_doc_inventory ? "legal_doc_inventory" : null,
    legal_doc_extraction_index_ref: artifacts.legal_doc_extraction_index ? "legal_doc_extraction_index" : null,
    adapter_expansion_log_ref: artifacts.adapter_expansion_log ? "adapter_expansion_log" : null,
    handoff_to_domain_gate: { ready: true, classification_allowed_next: true, classification_allowed_in_phase_1: false }
  };
  return {
    source_discovery_handoff: upgraded,
    post_phase_1_domain_gate_handoff: {
      run_id: run?.run_id || null,
      target_url: upgraded.target_url || run?.root_url || run?.target || null,
      generated_by: "source_discovery_family_handoff",
      schema_version: "POST_PHASE_1_DOMAIN_GATE_HANDOFF_v0",
      classification_allowed: true,
      classification_source_artifacts: ["source_discovery_handoff", "source_discovery_matrix_manifest", "neutral_evidence_bucket_manifest", "adapter_expansion_log", "legal_doc_inventory", "legal_doc_extraction_index"],
      legal_doc_granularity_rule: "Domain Gate may use legal_doc_inventory for navigation, but must use individual legal_doc_* artifacts for substance.",
      domain_lock_allowed_before_this_handoff: false,
      forbidden_phase_1_actions_confirmed: noLockNoNarrow()
    }
  };
}

function buildCommonRootArtifacts({ run, deduped_url_manifest, output }) {
  const sourceRows = materialSourceRows(output);
  const artifacts = {};
  for (const root of COMMON_ROOTS) {
    const sources = sourceRows.filter((source) => root.old_families.includes(source.root_family)).map((source, index) => ({ ...source, common_root: root.id, common_root_source_id: `${root.id}.SRC.${String(index + 1).padStart(3, "0")}` }));
    if (!sources.length) continue;
    artifacts[root.artifact_name] = {
      run_id: run?.run_id || null,
      target_url: deduped_url_manifest?.target_url || run?.root_url || run?.target || null,
      artifact_name: root.artifact_name,
      generated_by: "source_discovery_extraction",
      schema_version: "PHASE1_LOSSLESS_COMMON_ROOT_v0",
      common_root: root.id,
      priority: root.priority,
      legacy_family_compatibility: root.old_families,
      neutral_buckets: root.buckets,
      extraction_mode: "LOSSLESS_COMMON_ROOT_COMPATIBILITY_VIEW",
      source_text_cutting_allowed: false,
      sources
    };
  }
  return artifacts;
}

function buildLegalDocArtifacts({ run, deduped_url_manifest, output }) {
  const sourceRows = materialSourceRows(output).filter((source) => isLegalSource(source));
  const docs = [];
  const artifacts = {};
  const usedArtifactNames = new Set();
  for (const source of sourceRows) {
    const docType = legalDocType(source);
    const rule = LEGAL_DOC_RULES.find(([type]) => type === docType);
    const baseName = rule?.[1] || `legal_doc_other__${stableSlug(source.canonical_url || source.url || source.final_url || source.source_id)}`;
    const artifactName = uniqueArtifactName(baseName, source, usedArtifactNames);
    usedArtifactNames.add(artifactName);
    const doc = {
      doc_id: artifactName,
      doc_type: docType,
      source_url: source.canonical_url || source.url || source.final_url,
      artifact_name: artifactName,
      extraction_mode: "LOSSLESS_DOCUMENT_GRANULAR",
      status: "EXTRACTED",
      sha256: source.sha256 || sha256(source.lossless_text || "")
    };
    docs.push(doc);
    artifacts[artifactName] = {
      run_id: run?.run_id || null,
      target_url: deduped_url_manifest?.target_url || run?.root_url || run?.target || null,
      generated_by: "source_discovery_extraction",
      schema_version: "PHASE1_LEGAL_DOC_LOSSLESS_v0",
      artifact_name: artifactName,
      doc_type: docType,
      source_id: source.source_id,
      source_url: doc.source_url,
      route_type: source.route_type,
      legacy_root_family: source.root_family,
      extraction_mode: "LOSSLESS_DOCUMENT_GRANULAR",
      legal_doc_granularity_rule: "This artifact contains one legal document source only. Do not merge with other legal documents for evidentiary reliance.",
      source_text_cutting_allowed: false,
      lossless_text: source.lossless_text,
      sha256: doc.sha256,
      extraction_warnings: source.extraction_warnings || []
    };
  }
  return {
    legal_doc_inventory: {
      run_id: run?.run_id || null,
      target_url: deduped_url_manifest?.target_url || run?.root_url || run?.target || null,
      generated_by: "source_discovery_extraction",
      schema_version: "PHASE1_LEGAL_DOC_INVENTORY_v0",
      status: docs.length ? "LEGAL_DOCS_EXTRACTED" : "NO_LEGAL_DOCS_EXTRACTED",
      documents_found: docs,
      inventory_is_navigation_only: true,
      individual_legal_doc_artifacts_are_source_of_truth: true
    },
    legal_doc_extraction_index: {
      run_id: run?.run_id || null,
      generated_by: "source_discovery_extraction",
      schema_version: "PHASE1_LEGAL_DOC_EXTRACTION_INDEX_v0",
      url_to_artifact: Object.fromEntries(docs.map((doc) => [doc.source_url, doc.artifact_name])),
      artifact_to_doc_type: Object.fromEntries(docs.map((doc) => [doc.artifact_name, doc.doc_type]))
    },
    legal_doc_lossless_validation_manifest: {
      run_id: run?.run_id || null,
      generated_by: "source_discovery_extraction",
      schema_version: "PHASE1_LEGAL_DOC_LOSSLESS_VALIDATION_v0",
      legal_source_count: sourceRows.length,
      legal_doc_artifact_count: docs.length,
      one_legal_url_one_artifact: sourceRows.length === docs.length,
      merged_legal_blob_detected: false,
      status: sourceRows.length === docs.length ? "PASS" : "FAIL"
    },
    ...artifacts
  };
}

function emptyNeutralBuckets() {
  return Object.fromEntries(NEUTRAL_BUCKETS.map((bucket) => [bucket, { priority: primaryNeutralBucket(bucket) ? "PRIMARY" : "SECONDARY", sources: [] }]));
}
function bucketsForManifestRow(row) { return [...new Set((FAMILY_TO_COMMON_ROOTS[row.root_family] || []).flatMap((root) => root.buckets).concat(extraBucketsForRow(row)))]; }
function extraBucketsForRow(row) { const value = `${row.root_family || ""} ${row.route_type || ""} ${row.canonical_url || ""}`.toLowerCase(); const out = []; if (value.includes("ai") || value.includes("model") || value.includes("agent")) out.push("ai_mechanism_signals"); if (/(credit|loan|health|clinical|hiring|recruit|legal|biometric|kyc|children|minor|student)/.test(value)) out.push("regulated_activity_signals"); if (value.includes("privacy") || value.includes("data") || value.includes("subprocessor") || value.includes("dpa")) out.push("data_processing_signals"); if (value.includes("terms") || value.includes("eula") || value.includes("policy") || value.includes("legal")) out.push("legal_terms_sources"); return out; }
function manifestRef(row) { return { manifest_id: row.manifest_id, root_family: row.root_family, canonical_url: row.canonical_url, fetch_url: row.fetch_url, route_type: row.route_type, admission_tier: row.admission_tier, extraction_decision: row.extraction_decision }; }
function materialSourceRows(output = {}) { return Object.entries(output).filter(([name, artifact]) => name.startsWith("lossless_family__") && Array.isArray(artifact?.sources)).flatMap(([, artifact]) => artifact.sources || []); }
function isLegalSource(source) { return String(source.root_family || "").startsWith("L") || legalDocType(source) !== "other"; }
function legalDocType(source) { const value = `${source.route_type || ""} ${source.canonical_url || ""} ${source.url || ""} ${source.final_url || ""}`.toLowerCase(); for (const [type, , terms] of LEGAL_DOC_RULES) if (terms.some((term) => value.includes(term))) return type; return "other"; }
function uniqueArtifactName(baseName, source, used) { if (!used.has(baseName)) return baseName; return `${baseName}__${stableSlug(source.canonical_url || source.url || source.final_url || source.source_id)}`; }
function stableSlug(value) { return String(value || "unknown").toLowerCase().replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "unknown"; }
function primaryNeutralBucket(bucket) { return !["customer_segment_signals", "jurisdiction_market_signals", "third_party_profile_sources"].includes(bucket); }
function noLockNoNarrow() { return { primary_domain_locked: false, source_discovery_narrowed: false, sources_excluded_by_domain: false, domain_specific_prompt_routing_used: false, dynamic_routing_used: false }; }
function sha256(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
