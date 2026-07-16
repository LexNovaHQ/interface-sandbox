import { ROOT_TRAVERSAL_POLICY, neutralBucketsForSource } from "./source-discovery-taxonomy.service.js";

export const PHASE1_FINAL_DEDUPED_MANIFEST_SCHEMA_VERSION = "PHASE1_FINAL_DEDUPED_MANIFEST_v1";

/**
 * RB-10 projects the internal canonical-selection ledger back into the frozen
 * public `deduped_url_manifest.manifest_sources` contract. Existing required
 * fields remain present; new selection fields are additive. RB-18 makes the
 * material fingerprint decision visible and enforceable in the final manifest.
 */
export function buildFinalDedupedManifest({ legacyManifest, canonicalSelection } = {}) {
  const legacyRows = legacyManifest?.manifest_sources || [];
  const legacyById = new Map(legacyRows.map((row) => [row.manifest_id, row]));
  const rows = [];
  const counters = new Map();

  for (const decision of canonicalSelection?.decisions || []) {
    const template = firstLegacyTemplate(decision, legacyRows, legacyById);
    const root = decision.primary_root;
    const index = (counters.get(root) || 0) + 1;
    counters.set(root, index);
    const authorized = decision.extraction_authorized === true;
    const legal = decision.source_disposition === "LEGAL_INSTRUMENT";
    const rejected = decision.source_disposition === "REJECTED_NOT_EVIDENCE";
    const failed = decision.source_disposition === "FETCH_FAILED";
    const admissionTier = authorized ? "PRIMARY" : rejected || failed ? "REJECTED_NOT_EVIDENCE" : "CONTEXT_ONLY";
    const extractionDecision = authorized ? "EXTRACT" : rejected || failed ? "NO_EXTRACT" : "MANIFEST_ONLY";
    const sourceSignalRoles = unique([
      ...(template?.source_signal_roles || []),
      ...rolesForDecision(decision)
    ]);

    const row = {
      ...(template || {}),
      manifest_id: `${root}.URL.${String(index).padStart(3, "0")}`,
      canonical_candidate_id: decision.candidate_id,
      canonical_identity: decision.canonical_identity,
      entity_id: decision.entity_id,
      entity_status: decision.entity_status,
      common_root: root,
      root_traversal_policy: ROOT_TRAVERSAL_POLICY[root],
      canonical_url: decision.canonical_url,
      canonical_url_key: decision.canonical_identity,
      fetch_url: decision.fetch_url,
      route_type: template?.route_type || (legal ? decision.legal_doc_type : decision.feature_cluster),
      route_type_aliases: unique([...(template?.route_type_aliases || []), template?.route_type].filter((item) => item && item !== decision.feature_cluster)),
      materiality: legal ? "legal_document" : materialityForLane(decision.evidence_lane),
      source_signal_roles: sourceSignalRoles,
      technical_route_shape: root === "technical_docs_api" ? template?.technical_route_shape || "UNIVERSAL_SELECTED_TECHNICAL_SOURCE" : template?.technical_route_shape || null,
      api_data_flow_signal: root === "docs_api_data_flow" ? { present: true, basis: unique([...(template?.api_data_flow_signal?.basis || []), decision.feature_cluster]) } : template?.api_data_flow_signal || { present: false, basis: [] },
      neutral_buckets: template?.neutral_buckets || neutralBucketsForSource({ common_root: root, source_signal_roles: sourceSignalRoles, route_type: decision.feature_cluster, canonical_url: decision.canonical_url }),
      discovered_by: unique([...(template?.discovered_by || []), "RB09_CANONICAL_SELECTION"]),
      priority_route_found_by: template?.priority_route_found_by || "RB09_CANONICAL_SELECTION",
      priority_result: authorized ? "CANONICAL_SELECTION_AUTHORISED" : rejected ? "NO_MATERIAL_CONTENT_REJECTED" : "CANONICAL_SELECTION_NOT_AUTHORISED",
      admission_tier: admissionTier,
      variant_class: decision.variant_family && decision.variant_family !== "none" ? "CANONICAL_VARIANT_FAMILY" : "NONE",
      variant_cluster_id: decision.feature_cluster,
      variant_rank: decision.source_disposition === "SELECTED_CANONICAL" || legal ? 1 : decision.source_disposition === "SELECTED_PARTIAL_CONTRIBUTOR" ? 2 : 99,
      feature_cluster: decision.feature_cluster,
      evidence_lane: decision.evidence_lane,
      variant_family: decision.variant_family || "none",
      structured_coverage: decision.structured_coverage || null,
      secondary_root_references: decision.secondary_root_references || [],
      ai_overlay: decision.ai_overlay || null,
      source_disposition: decision.source_disposition,
      canonical_owner_candidate_id: decision.canonical_owner_candidate_id || null,
      fingerprint_fetch_status: decision.fingerprint_fetch_status,
      fingerprint_extraction_eligible: decision.fingerprint_extraction_eligible === true,
      content_materiality: decision.content_materiality || null,
      exact_content_hash: decision.exact_content_hash || null,
      extraction_scope: decision.extraction_scope,
      selected_block_hashes: decision.selected_block_hashes || [],
      extraction_authorized_by_canonical_selection: authorized,
      extraction_decision: extractionDecision,
      downstream_default: authorized,
      tier_reason: decision.selection_reason,
      legal_doc_candidate: legal,
      legal_doc_type: legal ? decision.legal_doc_type : "other",
      legal_doc_artifact_hint: legal ? decision.legal_artifact_name_hint : "legal_doc_other",
      alias_urls: decision.alias_urls || [],
      phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING"
    };
    rows.push(row);
  }

  rows.sort((a, b) => rootOrder(a.common_root) - rootOrder(b.common_root) || a.manifest_id.localeCompare(b.manifest_id));
  return {
    ...legacyManifest,
    schema_version: legacyManifest?.schema_version || PHASE1_FINAL_DEDUPED_MANIFEST_SCHEMA_VERSION,
    producer_version: "PHASE1_UNIVERSAL_DISCOVERY_RB18_MATERIAL_GATE_v1",
    final_manifest_schema_version: PHASE1_FINAL_DEDUPED_MANIFEST_SCHEMA_VERSION,
    status: "FINAL_DEDUPED_EXTRACTION_MANIFEST",
    manifest_stage: "POST_CANONICAL_SELECTION",
    final_extraction_authority: true,
    material_content_required_for_extraction: true,
    compatibility_projection_mode: "FROZEN_PUBLIC_CONTRACT_ADDITIVE_FIELDS",
    selection_ledger_ref: "source_discovery_matrix_manifest.canonical_selection",
    manifest_sources: rows,
    manifest_forensics: {
      legacy_rows_read: legacyRows.length,
      canonical_decisions_read: canonicalSelection?.decisions?.length || 0,
      final_rows: rows.length,
      extract_rows: rows.filter((row) => row.extraction_decision === "EXTRACT").length,
      no_material_content_rows: rows.filter((row) => row.source_disposition === "REJECTED_NOT_EVIDENCE").length,
      full_document_rows: rows.filter((row) => row.extraction_scope === "FULL_DOCUMENT").length,
      full_main_content_rows: rows.filter((row) => row.extraction_scope === "FULL_MAIN_CONTENT").length,
      selected_unique_section_rows: rows.filter((row) => row.extraction_scope === "SELECTED_UNIQUE_SECTIONS").length,
      structured_coverage_rows: rows.filter((row) => row.extraction_scope === "STRUCTURED_COVERAGE_ONLY").length,
      metadata_only_rows: rows.filter((row) => row.extraction_scope === "METADATA_ONLY").length
    }
  };
}

export function assertFinalDedupedManifest(manifest, canonicalSelection) {
  if (manifest?.final_manifest_schema_version !== PHASE1_FINAL_DEDUPED_MANIFEST_SCHEMA_VERSION || manifest.final_extraction_authority !== true || manifest.material_content_required_for_extraction !== true) throw new Error("PHASE1_FINAL_DEDUPED_MANIFEST_SCHEMA_INVALID");
  const rows = manifest.manifest_sources || [];
  const decisions = canonicalSelection?.decisions || [];
  if (rows.length !== decisions.length) throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_ACCOUNTING_MISMATCH:${rows.length}/${decisions.length}`);
  const identities = new Set();
  for (const row of rows) {
    if (!row.manifest_id || !row.canonical_candidate_id || !row.canonical_identity || !row.entity_id || !row.common_root || !ROOT_TRAVERSAL_POLICY[row.common_root] || !row.canonical_url || !row.fetch_url || !row.route_type || !row.admission_tier || !row.extraction_decision || !row.extraction_scope || !row.source_disposition || !Array.isArray(row.source_signal_roles) || !Array.isArray(row.secondary_root_references)) throw new Error("PHASE1_FINAL_DEDUPED_MANIFEST_ROW_INCOMPLETE");
    if (identities.has(row.canonical_identity)) throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_DUPLICATE_IDENTITY:${row.canonical_identity}`);
    identities.add(row.canonical_identity);
    if (row.root_traversal_policy !== ROOT_TRAVERSAL_POLICY[row.common_root]) throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_ROOT_POLICY_MISMATCH:${row.manifest_id}`);
    const authorized = row.extraction_authorized_by_canonical_selection === true;
    if ((row.extraction_decision === "EXTRACT") !== authorized) throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_AUTHORITY_MISMATCH:${row.manifest_id}`);
    const selectedHashesRequired = row.extraction_scope !== "STRUCTURED_COVERAGE_ONLY";
    if (authorized && (row.admission_tier !== "PRIMARY" || row.fingerprint_fetch_status !== "FETCHED" || row.fingerprint_extraction_eligible !== true || row.content_materiality?.status !== "MATERIAL_CONTENT" || !row.exact_content_hash || (selectedHashesRequired && !row.selected_block_hashes.length))) throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_EXTRACT_ROW_WITHOUT_MATERIAL_CONTENT:${row.manifest_id}`);
    if (row.source_disposition === "REJECTED_NOT_EVIDENCE" && (row.extraction_decision !== "NO_EXTRACT" || row.admission_tier !== "REJECTED_NOT_EVIDENCE" || row.fingerprint_extraction_eligible !== false)) throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_NO_MATERIAL_ROW_INVALID:${row.manifest_id}`);
    if (row.legal_doc_candidate && row.extraction_scope !== "FULL_DOCUMENT") throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_LEGAL_SCOPE_INVALID:${row.manifest_id}`);
    if (row.legal_doc_candidate && row.fingerprint_extraction_eligible !== true) throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_LEGAL_WITHOUT_MATERIAL_BODY:${row.manifest_id}`);
    if (row.common_root === "docs_api_data_flow" && row.admission_tier === "PRIMARY" && row.api_data_flow_signal?.present !== true) throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_DATA_FLOW_SIGNAL_MISSING:${row.manifest_id}`);
    if (row.common_root === "technical_docs_api" && row.admission_tier === "PRIMARY" && !row.technical_route_shape) throw new Error(`PHASE1_FINAL_DEDUPED_MANIFEST_TECHNICAL_SHAPE_MISSING:${row.manifest_id}`);
  }
  return { ok: true, rows: identities.size };
}

function firstLegacyTemplate(decision, rows, byId) {
  for (const id of decision.legacy_manifest_ids || []) if (byId.has(id)) return byId.get(id);
  return rows.find((row) => row.canonical_url === decision.canonical_url || (decision.alias_urls || []).includes(row.canonical_url) || (decision.alias_urls || []).includes(row.fetch_url)) || null;
}

function rolesForDecision(decision) {
  const roles = [];
  if (decision.evidence_lane === "legal_instrument") roles.push("LEGAL_DOCUMENT_SIGNAL");
  if (decision.evidence_lane === "commercial_product") roles.push("PRODUCT_ACTIVITY_SIGNAL", "COMMERCIAL_POSITIONING_SIGNAL");
  if (decision.evidence_lane === "technical_operation") roles.push("TECHNICAL_MECHANICS_SIGNAL", "API_INTEGRATION_SIGNAL");
  if (decision.evidence_lane === "data_flow") roles.push("DATA_FLOW_SIGNAL", "TECHNICAL_MECHANICS_SIGNAL", "API_INTEGRATION_SIGNAL");
  if (decision.evidence_lane === "security_compliance") roles.push("SECURITY_TRUST_SIGNAL");
  if (decision.evidence_lane === "regulatory_disclosure") roles.push("LICENSING_REGULATORY_SIGNAL", "REGULATED_ACTIVITY_SIGNAL");
  if (decision.evidence_lane === "support_operations") roles.push("SUPPORT_CONTEXT_SIGNAL");
  if (decision.evidence_lane === "corporate_strategy") roles.push("TARGET_IDENTITY_SIGNAL");
  if (decision.ai_overlay) roles.push("AI_MECHANISM_SIGNAL");
  return roles;
}

function materialityForLane(lane) {
  return {
    commercial_product: "product_activity",
    technical_operation: "technical_evidence",
    data_flow: "data_flow_signal",
    security_compliance: "trust_compliance",
    regulatory_disclosure: "regulatory_operating_context",
    support_operations: "support_context",
    corporate_strategy: "target_identity"
  }[lane] || "source_evidence";
}

function rootOrder(root) {
  return ["homepage_landing", "company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "support_help_resources", "regulatory_licensing_status", "grievance_complaints"].indexOf(root);
}
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
