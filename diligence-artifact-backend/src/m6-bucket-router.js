import { LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES, ROOT_FAMILY_CODES } from "./constants.js";

const BUCKETS = Object.freeze({
  target_profile_urls: ["T0_ROOT", "T1_IDENTITY", "T2_LEGAL_IDENTITY", "T3_OPERATOR_ENTITY", "T4_SUPPORTING_IDENTITY"],
  product_activity_profile_urls: ["P1_PRODUCT", "P2_PLATFORM_FEATURE_SOLUTION", "P3_AI_CAPABILITY_TECHNICAL", "P4_USE_CASE_INDUSTRY", "P5_ENTERPRISE_PRICING"],
  data_asset_provenance_profile_urls: ["D1_SECURITY_TRUST", "D2_SUBPROCESSOR_PRIVACY_CENTER", "D3_DATA_GOVERNANCE_CONTROLS", "D4_DOCS_API_DATA_FLOW", "D5_AI_SAFETY_TRANSPARENCY"],
  legal_governance_profile_urls: ["L1_CORE_TERMS_PRIVACY", "L2_B2B_CONTRACTING", "L3_AI_USAGE_GOVERNANCE", "L4_PRIVACY_ADJACENT_NOTICES", "L5_LEGAL_HUB_HOSTED", "L6_ENTITY_NOTICE"]
});

const FAMILY_TO_BUCKET = Object.freeze(
  Object.fromEntries(Object.entries(BUCKETS).flatMap(([bucket, families]) => families.map((family) => [family, bucket])))
);

const LEGAL_FAMILIES = Object.freeze(BUCKETS.legal_governance_profile_urls);
const TARGET_PRODUCT_FAMILIES = Object.freeze([...BUCKETS.target_profile_urls, ...BUCKETS.product_activity_profile_urls]);
const DATA_AND_PRIVACY_FAMILIES = Object.freeze([
  ...BUCKETS.data_asset_provenance_profile_urls,
  "L1_CORE_TERMS_PRIVACY",
  "L2_B2B_CONTRACTING",
  "L4_PRIVACY_ADJACENT_NOTICES"
]);

export function buildM6SourceDiscoveryHandoff({ run, artifacts }) {
  const manifest = artifacts?.deduped_url_manifest;
  const sourceIndex = artifacts?.source_family_index;

  if (!manifest?.manifest_sources?.length) throw new Error("M6_BLOCKED:deduped_url_manifest_missing_or_empty");
  if (!sourceIndex?.discovered_source_index) throw new Error("M6_BLOCKED:source_family_index_missing_or_invalid");

  const familyArtifacts = loadFamilyArtifacts(artifacts);
  const familyViews = buildFamilyViews({ manifest, familyArtifacts });
  const bucketViews = buildBucketViews({ familyViews });
  const familyCounts = buildFamilyCounts({ familyViews });
  const globalCounts = buildGlobalCounts({ manifest, familyViews, sourceIndex });
  const routingLimitations = buildRoutingLimitations({ familyViews, sourceIndex });

  return {
    source_discovery_handoff: {
      run_id: run.run_id,
      target: run.target,
      target_url: manifest.target_url || run.root_url || run.target,
      generated_by: "agent_2a_m6_bucket_router",
      taxonomy_version: "M6_SOURCE_ACCESS_COMPILER_v1",
      formal_output_contract: {
        formal_outputs: ["source_discovery_handoff"],
        bucket_views_are_embedded: true,
        separate_bucket_artifacts_are_not_formal_outputs: true,
        no_full_text_duplication: true
      },
      authority: {
        agent_1_supremacy: true,
        conflict_rule: "If archive allocation doctrine conflicts with Agent 1 manifest tier, extraction decision, source family, or custody status, Agent 1 prevails.",
        no_downstream_direct_agent_1_reads: true,
        metadata_is_not_primary_evidence: true,
        index_is_not_primary_evidence: true,
        primary_text_source_of_truth: "lossless_family__* artifacts referenced by source_id; this handoff carries refs, not duplicated text."
      },
      phase_inputs: {
        manifest_artifact: "deduped_url_manifest",
        source_index_artifact: "source_family_index",
        family_artifacts: LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES
      },
      source_custody_summary: {
        source_custody_status: determineCustodyStatus({ globalCounts, routingLimitations }),
        no_new_url_rule: true,
        no_new_extraction_rule: true,
        primary_only_extraction_rule: true,
        secondary_context_manifest_only_rule: true,
        legal_governance_full_primary_access_for_m11: true,
        global_counts: globalCounts,
        family_counts: familyCounts
      },
      bucket_views: bucketViews,
      source_access_matrix: buildSourceAccessMatrix(),
      downstream_input_contracts: buildDownstreamInputContracts(),
      routing_limitations: routingLimitations,
      forensic_ledger: buildForensicLedger({ globalCounts, routingLimitations })
    }
  };
}

function loadFamilyArtifacts(artifacts) {
  const out = {};
  for (const family of ROOT_FAMILY_CODES) {
    const artifactName = `lossless_family__${family}`;
    const artifact = artifacts?.[artifactName];
    if (!artifact || typeof artifact !== "object") {
      out[family] = emptyFamilyArtifact(family, artifactName);
    } else {
      out[family] = artifact;
    }
  }
  return out;
}

function emptyFamilyArtifact(family, artifactName) {
  return {
    artifact_name: artifactName,
    root_family: family,
    bucket: FAMILY_TO_BUCKET[family] || "UNMAPPED",
    sources: [],
    manifest_only_sources: [],
    metadata_only_sources: [],
    rejected_sources: [],
    missing_limited_primary_sources: []
  };
}

function buildFamilyViews({ manifest, familyArtifacts }) {
  const manifestRowsByFamily = groupBy(manifest.manifest_sources || [], (row) => row.root_family);
  const familyViews = {};

  for (const family of ROOT_FAMILY_CODES) {
    const artifact = familyArtifacts[family] || emptyFamilyArtifact(family, `lossless_family__${family}`);
    const manifestRows = manifestRowsByFamily[family] || [];
    const primarySourceRefs = (artifact.sources || []).map((source) => sourceRef(source, family));
    const secondaryManifestRefs = manifestRefsForTier({ artifact, manifestRows, tier: "SECONDARY" });
    const contextManifestRefs = manifestRefsForTier({ artifact, manifestRows, tier: "CONTEXT_ONLY" });
    const metadataOnlyRefs = metadataRefs({ artifact, manifestRows });
    const failedOrAbsentRefs = failedAbsentRefs({ artifact, manifestRows });

    familyViews[family] = {
      root_family: family,
      bucket: FAMILY_TO_BUCKET[family],
      family_artifact: `lossless_family__${family}`,
      default_text_loading: "PRIMARY_ONLY",
      primary_source_refs: primarySourceRefs,
      secondary_manifest_refs: secondaryManifestRefs,
      context_manifest_refs: contextManifestRefs,
      metadata_only_refs: metadataOnlyRefs,
      failed_or_absent_refs: failedOrAbsentRefs,
      counts: {
        manifest_rows: manifestRows.length,
        primary_manifest_rows: manifestRows.filter((row) => row.admission_tier === "PRIMARY").length,
        primary_sources_extracted: primarySourceRefs.length,
        secondary_manifest_refs: secondaryManifestRefs.length,
        context_manifest_refs: contextManifestRefs.length,
        metadata_only_refs: metadataOnlyRefs.length,
        failed_or_absent_refs: failedOrAbsentRefs.length
      }
    };
  }

  return familyViews;
}

function buildBucketViews({ familyViews }) {
  const out = {};
  for (const [bucket, families] of Object.entries(BUCKETS)) {
    const familyViewsForBucket = families.map((family) => familyViews[family]).filter(Boolean);
    out[bucket] = {
      bucket,
      source_families: families,
      default_text_loading: bucket === "legal_governance_profile_urls" ? "PRIMARY_ONLY_LEGAL_FULL_DOCS" : "PRIMARY_ONLY",
      source_text_policy: "Refs only in M6. Downstream prompt assembler loads matching primary source rows from family artifacts when allowed by source_access_matrix.",
      primary_source_refs: familyViewsForBucket.flatMap((view) => view.primary_source_refs),
      secondary_manifest_refs: familyViewsForBucket.flatMap((view) => view.secondary_manifest_refs),
      context_manifest_refs: familyViewsForBucket.flatMap((view) => view.context_manifest_refs),
      metadata_only_refs: familyViewsForBucket.flatMap((view) => view.metadata_only_refs),
      failed_or_absent_refs: familyViewsForBucket.flatMap((view) => view.failed_or_absent_refs),
      family_counts: Object.fromEntries(familyViewsForBucket.map((view) => [view.root_family, view.counts])),
      routing_limitations: familyViewsForBucket.flatMap((view) => view.failed_or_absent_refs).filter((row) => row.status || row.extraction_status || row.rejection_reason)
    };
  }
  return out;
}

function sourceRef(source, fallbackFamily) {
  return compact({
    source_id: source.source_id,
    manifest_id: source.manifest_id,
    root_family: source.root_family || fallbackFamily,
    bucket: source.bucket || FAMILY_TO_BUCKET[source.root_family || fallbackFamily],
    family_artifact: `lossless_family__${source.root_family || fallbackFamily}`,
    canonical_url: source.canonical_url,
    source_url: source.url || source.canonical_url,
    final_url: source.final_url,
    route_type: source.route_type,
    admission_tier: source.admission_tier || "PRIMARY",
    extraction_decision: source.extraction_decision || "EXTRACT",
    evidence_text_source: source.evidence_text_source,
    sha256: source.sha256,
    document_type_hint: documentTypeHint(source),
    text_pointer: {
      artifact_name: `lossless_family__${source.root_family || fallbackFamily}`,
      source_id: source.source_id,
      field: "lossless_text"
    }
  });
}

function manifestRefsForTier({ artifact, manifestRows, tier }) {
  const fromArtifact = (artifact.manifest_only_sources || []).filter((row) => row.admission_tier === tier);
  const rows = fromArtifact.length ? fromArtifact : manifestRows.filter((row) => row.admission_tier === tier);
  return rows.map(manifestRef);
}

function metadataRefs({ artifact, manifestRows }) {
  const fromArtifact = artifact.metadata_only_sources || [];
  const rows = fromArtifact.length ? fromArtifact : manifestRows.filter((row) => row.admission_tier === "METADATA_ONLY");
  return rows.map(manifestRef);
}

function failedAbsentRefs({ artifact, manifestRows }) {
  const rejected = (artifact.rejected_sources || []).map((row) => compact({
    source_id: row.source_id,
    manifest_id: row.manifest_id,
    root_family: row.root_family || artifact.root_family,
    bucket: row.bucket || artifact.bucket,
    canonical_url: row.canonical_url,
    source_url: row.url || row.fetch_url || row.canonical_url,
    route_type: row.route_type,
    admission_tier: row.admission_tier,
    extraction_status: row.extraction_status,
    error: row.error,
    rejection_reason: row.rejection_reason,
    status: row.status || "PRIMARY_EXTRACTION_FAILED"
  }));
  const absent = (artifact.missing_limited_primary_sources || []).map((row) => compact({
    root_family: row.root_family || artifact.root_family,
    bucket: row.bucket_affected || artifact.bucket,
    missing_or_limited_source: row.missing_or_limited_source,
    attempted_paths: row.attempted_paths,
    attempted_manifest_rows: row.attempted_manifest_rows,
    status: row.status || "ABSENT_AFTER_TARGETED_PROBE",
    why_it_matters: row.why_it_matters
  }));
  const rejectedManifest = manifestRows.filter((row) => row.admission_tier === "REJECTED_NOT_EVIDENCE").map((row) => ({ ...manifestRef(row), status: "REJECTED_NOT_EVIDENCE" }));
  return [...rejected, ...absent, ...rejectedManifest];
}

function manifestRef(row) {
  return compact({
    manifest_id: row.manifest_id,
    root_family: row.root_family,
    bucket: row.bucket || FAMILY_TO_BUCKET[row.root_family],
    canonical_url: row.canonical_url,
    fetch_url: row.fetch_url,
    route_type: row.route_type,
    admission_tier: row.admission_tier,
    variant_class: row.variant_class,
    extraction_decision: row.extraction_decision,
    tier_reason: row.tier_reason,
    downstream_default: Boolean(row.downstream_default)
  });
}

function documentTypeHint(row) {
  const combined = `${row.route_type || ""} ${row.canonical_url || ""}`.toLowerCase();
  if (combined.includes("privacy")) return "privacy_policy";
  if (combined.includes("terms")) return "terms_of_service";
  if (combined.includes("eula")) return "eula";
  if (combined.includes("dpa") || combined.includes("data-processing")) return "data_processing_agreement";
  if (combined.includes("acceptable-use") || combined.includes("aup")) return "acceptable_use_policy";
  if (combined.includes("sla") || combined.includes("service-level")) return "service_level_agreement";
  if (combined.includes("cookie")) return "cookie_policy";
  if (combined.includes("trust")) return "trust_center";
  if (combined.includes("legal-notice") || combined.includes("imprint") || combined.includes("controller")) return "entity_notice";
  return undefined;
}

function buildFamilyCounts({ familyViews }) {
  return Object.fromEntries(ROOT_FAMILY_CODES.map((family) => [family, familyViews[family]?.counts || {}]));
}

function buildGlobalCounts({ manifest, familyViews, sourceIndex }) {
  const manifestRows = manifest.manifest_sources || [];
  const familyViewValues = Object.values(familyViews);
  return {
    manifest_rows: manifestRows.length,
    primary_manifest_rows: manifestRows.filter((row) => row.admission_tier === "PRIMARY").length,
    secondary_indexed: manifestRows.filter((row) => row.admission_tier === "SECONDARY").length,
    context_indexed: manifestRows.filter((row) => row.admission_tier === "CONTEXT_ONLY").length,
    metadata_only: manifestRows.filter((row) => row.admission_tier === "METADATA_ONLY").length,
    rejected_not_evidence: manifestRows.filter((row) => row.admission_tier === "REJECTED_NOT_EVIDENCE").length,
    primary_extracted_sources: familyViewValues.reduce((sum, view) => sum + view.primary_source_refs.length, 0),
    failed_or_absent_refs: familyViewValues.reduce((sum, view) => sum + view.failed_or_absent_refs.length, 0),
    source_index_extracted_sources: sourceIndex?.corpus_forensics?.sources_extracted ?? sourceIndex?.discovered_source_index?.length ?? null,
    generated_at: new Date().toISOString()
  };
}

function buildRoutingLimitations({ familyViews, sourceIndex }) {
  const familyLimitations = Object.values(familyViews).flatMap((view) =>
    view.failed_or_absent_refs.map((item) => ({
      root_family: view.root_family,
      bucket: view.bucket,
      ...item
    }))
  );
  return [
    ...familyLimitations,
    ...(sourceIndex?.missing_limited_primary_sources || []).map((row) => ({ ...row, source: "source_family_index" }))
  ];
}

function determineCustodyStatus({ globalCounts, routingLimitations }) {
  if (!globalCounts.primary_extracted_sources) return "LOCKED_WITH_LIMITATIONS";
  return routingLimitations.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";
}

function buildSourceAccessMatrix() {
  return {
    global_loading_rule: {
      default_text_loading: "PRIMARY_ONLY",
      secondary_context_loading: "MANIFEST_ONLY",
      metadata_only_loading: "NO_TEXT",
      cross_bucket_access: "EXCEPTION_ONLY_LOGGED_CAPPED",
      exception_max_sources_per_phase: 3,
      complete_bucket_request_allowed: false
    },
    agents: {
      M9: {
        primary_inputs: ["source_discovery_handoff.bucket_views.legal_governance_profile_urls"],
        default_raw_text_families: LEGAL_FAMILIES,
        default_text_loading: "PRIMARY_ONLY_LEGAL_FULL_DOCS",
        forbidden_default_raw_text_families: [...BUCKETS.target_profile_urls, ...BUCKETS.product_activity_profile_urls, ...BUCKETS.data_asset_provenance_profile_urls],
        forbidden_outputs: ["registry_final_status", "findings", "report_data", "legal_advice_conclusions"],
        exception_allowed: true,
        exception_reasons: ["ENTITY_CONFLICT_CHECK", "LEGAL_REFERENCE_IN_TRUST_CENTER"]
      },
      M7_M8: {
        primary_inputs: ["source_discovery_handoff.bucket_views.target_profile_urls", "source_discovery_handoff.bucket_views.product_activity_profile_urls"],
        default_raw_text_families: TARGET_PRODUCT_FAMILIES,
        default_text_loading: "PRIMARY_ONLY",
        forbidden_default_raw_text_families: [...BUCKETS.data_asset_provenance_profile_urls, ...BUCKETS.legal_governance_profile_urls],
        forbidden_outputs: ["legal_stack", "registry_final_status", "findings", "report_data", "vault_prefill"],
        exception_allowed: true,
        exception_reasons: ["ENTITY_CONFLICT_CHECK", "PRODUCT_CLAIM_VERIFICATION"]
      },
      M10: {
        primary_inputs: ["source_discovery_handoff.bucket_views.data_asset_provenance_profile_urls", "source_discovery_handoff.bucket_views.legal_governance_profile_urls", "legal_cartography_index", "target_profile", "target_feature_profile"],
        default_raw_text_families: DATA_AND_PRIVACY_FAMILIES,
        default_text_loading: "PRIMARY_ONLY",
        forbidden_default_raw_text_families: ["P1_PRODUCT", "P2_PLATFORM_FEATURE_SOLUTION", "P3_AI_CAPABILITY_TECHNICAL", "P4_USE_CASE_INDUSTRY", "P5_ENTERPRISE_PRICING"],
        exception_allowed: true,
        exception_reasons: ["DATA_FLOW_NEEDED_FOR_PRIVACY_ANALYSIS", "BROKEN_OR_THIN_PRIMARY"]
      },
      M11: {
        primary_inputs: ["source_discovery_handoff.bucket_views.legal_governance_profile_urls", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "registry_batch"],
        default_raw_text_families: LEGAL_FAMILIES,
        default_text_loading: "FULL_LEGAL_GOVERNANCE_BUCKET_PRIMARY_TEXTS_ONLY",
        forbidden_default_raw_text_families: [...BUCKETS.target_profile_urls, ...BUCKETS.product_activity_profile_urls, ...BUCKETS.data_asset_provenance_profile_urls],
        exception_allowed: true,
        exception_reasons: ["CITATION_VERIFICATION", "PRIMARY_SOURCE_MISSING", "VALIDATION_FAILURE"]
      },
      M12: {
        primary_inputs: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_profile"],
        default_raw_text_families: [],
        default_text_loading: "OUTPUTS_AND_FORENSICS_ONLY",
        exception_allowed: true,
        exception_reasons: ["VALIDATION_FAILURE", "CITATION_VERIFICATION", "BROKEN_OR_THIN_PRIMARY"]
      },
      COMPILER: {
        primary_inputs: ["locked_outputs_only"],
        default_raw_text_families: [],
        default_text_loading: "NO_RAW_SOURCE_BY_DEFAULT",
        exception_allowed: true,
        exception_reasons: ["M12_UNRESOLVED_CITATION_DEFECT"]
      }
    },
    forbidden_exception_reasons: ["GENERAL_CONTEXT", "MODEL_CURIOUS", "COMPLETE_BUCKET_REQUEST", "MAKE_OUTPUT_BETTER", "CHECK_EVERYTHING"]
  };
}

function buildDownstreamInputContracts() {
  return {
    M9: {
      package_name: "m9_legal_cartography_input",
      assemble_from: ["source_discovery_handoff.bucket_views.legal_governance_profile_urls"],
      load_text_for: "legal_governance_profile_urls.primary_source_refs only",
      include_metadata_for: ["secondary_manifest_refs", "context_manifest_refs", "metadata_only_refs", "failed_or_absent_refs"],
      formal_output: "legal_cartography_index"
    },
    M7_M8: {
      package_name: "m7_m8_target_feature_input",
      assemble_from: ["source_discovery_handoff.bucket_views.target_profile_urls", "source_discovery_handoff.bucket_views.product_activity_profile_urls"],
      load_text_for: "target/product primary_source_refs only",
      formal_outputs: ["target_profile", "target_feature_profile"]
    },
    M10: {
      package_name: "m10_data_provenance_input",
      assemble_from: ["source_discovery_handoff.bucket_views.data_asset_provenance_profile_urls", "source_discovery_handoff.bucket_views.legal_governance_profile_urls", "legal_cartography_index", "target_profile", "target_feature_profile"],
      load_text_for: "data primary refs plus privacy/legal primary refs only",
      formal_output: "data_provenance_profile"
    },
    M11: {
      package_name: "m11_registry_exposure_input",
      assemble_from: ["source_discovery_handoff.bucket_views.legal_governance_profile_urls", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "registry_batch"],
      load_text_for: "full legal/governance bucket primary source texts only",
      formal_output: "exposure_registry_profile"
    }
  };
}

function buildForensicLedger({ globalCounts, routingLimitations }) {
  return [
    {
      check_id: "M6.CUSTODY.001",
      status: "PASS",
      rule: "Agent 1 manifest is the source custody authority and prevails over archived allocation doctrine.",
      evidence: { manifest_rows: globalCounts.manifest_rows, primary_extracted_sources: globalCounts.primary_extracted_sources }
    },
    {
      check_id: "M6.OUTPUT.001",
      status: "PASS",
      rule: "M6 formal output is exactly source_discovery_handoff; bucket views are embedded.",
      evidence: { formal_outputs: ["source_discovery_handoff"] }
    },
    {
      check_id: "M6.ACCESS.001",
      status: "PASS",
      rule: "Secondary/context rows remain manifest-only; metadata-only rows have no text loading.",
      evidence: { secondary_indexed: globalCounts.secondary_indexed, context_indexed: globalCounts.context_indexed, metadata_only: globalCounts.metadata_only }
    },
    {
      check_id: "M6.LIMITATIONS.001",
      status: routingLimitations.length ? "LIMITATION_RECORDED" : "PASS",
      rule: "Failed/absent primary sources are preserved as routing limitations.",
      evidence: { limitation_count: routingLimitations.length }
    }
  ];
}

function groupBy(rows, keyFn) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""));
}
