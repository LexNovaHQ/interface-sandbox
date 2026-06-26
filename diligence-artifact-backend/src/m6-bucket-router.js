const BUCKETS = Object.freeze({
  target_profile_urls: ["T0_ROOT", "T1_IDENTITY", "T2_LEGAL_IDENTITY", "T3_OPERATOR_ENTITY", "T4_SUPPORTING_IDENTITY"],
  product_activity_profile_urls: ["P1_PRODUCT", "P2_PLATFORM_FEATURE_SOLUTION", "P3_AI_CAPABILITY_TECHNICAL", "P4_USE_CASE_INDUSTRY", "P5_ENTERPRISE_PRICING"],
  data_asset_provenance_profile_urls: ["D1_SECURITY_TRUST", "D2_SUBPROCESSOR_PRIVACY_CENTER", "D3_DATA_GOVERNANCE_CONTROLS", "D4_DOCS_API_DATA_FLOW", "D5_AI_SAFETY_TRANSPARENCY"],
  legal_governance_profile_urls: ["L1_CORE_TERMS_PRIVACY", "L2_B2B_CONTRACTING", "L3_AI_USAGE_GOVERNANCE", "L4_PRIVACY_ADJACENT_NOTICES", "L5_LEGAL_HUB_HOSTED", "L6_ENTITY_NOTICE"]
});

const LEGAL = BUCKETS.legal_governance_profile_urls;
const TARGET = BUCKETS.target_profile_urls;
const PRODUCT = BUCKETS.product_activity_profile_urls;
const DATA_PRIVACY = [...BUCKETS.data_asset_provenance_profile_urls, "L1_CORE_TERMS_PRIVACY", "L2_B2B_CONTRACTING", "L4_PRIVACY_ADJACENT_NOTICES"];

export function buildM6SourceDiscoveryHandoff({ run, artifacts }) {
  const manifest = artifacts?.deduped_url_manifest;
  const sourceIndex = artifacts?.source_family_index;
  if (!manifest?.manifest_sources?.length) throw new Error("M6_BLOCKED:deduped_url_manifest_missing_or_empty");
  if (!sourceIndex?.discovered_source_index) throw new Error("M6_BLOCKED:source_family_index_missing_or_invalid");

  const bucketFamilyIndex = Object.fromEntries(
    Object.entries(BUCKETS).map(([bucket, families]) => [
      bucket,
      { families: Object.fromEntries(families.map((family) => [family, familyEntry(family, artifacts, manifest)])) }
    ])
  );

  return {
    source_discovery_handoff: {
      run_id: run.run_id,
      target_url: manifest.target_url || run.root_url || run.target,
      generated_by: "agent_2a_bucket_routing",
      schema_version: "M6_BUCKET_FAMILY_INDEX_v2_SIMPLIFIED",
      status: hasPrimary(bucketFamilyIndex) ? "LOCKED" : "LOCKED_WITH_LIMITATIONS",
      contract: {
        formal_output: "source_discovery_handoff",
        purpose: "Index Agent 1B family files by bucket/family and define downstream access.",
        agent_1_prevails: true,
        no_new_urls: true,
        no_new_extraction: true,
        no_full_text: true,
        no_separate_bucket_artifacts: true,
        source_text_location: "lossless_family__{ROOT_FAMILY}.sources[].lossless_text"
      },
      bucket_family_index: bucketFamilyIndex,
      access_matrix: accessMatrix(),
      canonical_artifacts: {
        self: "source_discovery_handoff",
        manifest: "deduped_url_manifest",
        source_index: "source_family_index",
        family_file_pattern: "lossless_family__{ROOT_FAMILY}"
      }
    }
  };
}

function familyEntry(family, artifacts, manifest) {
  const file = `lossless_family__${family}`;
  const artifact = artifacts?.[file] || {};
  const manifestRows = (manifest.manifest_sources || []).filter((row) => row.root_family === family);
  return {
    file,
    primary: (artifact.sources || []).map((source) => primaryRef(source, file)),
    index_only: indexOnlyRefs(artifact, manifestRows),
    failed_absent: failedAbsentRefs(artifact, manifestRows)
  };
}

function primaryRef(source, file) {
  return clean({
    source_id: source.source_id,
    manifest_id: source.manifest_id,
    file,
    url: source.canonical_url || source.url || source.final_url,
    route_type: source.route_type,
    doc_hint: docHint(source),
    text_field: "lossless_text"
  });
}

function indexOnlyRefs(artifact, manifestRows) {
  const rows = [...(artifact.manifest_only_sources || []), ...(artifact.metadata_only_sources || [])];
  const source = rows.length ? rows : manifestRows.filter((row) => ["SECONDARY", "CONTEXT_ONLY", "METADATA_ONLY"].includes(row.admission_tier));
  return source.map((row) => clean({
    manifest_id: row.manifest_id,
    url: row.canonical_url || row.fetch_url,
    tier: row.admission_tier,
    route_type: row.route_type,
    reason: row.tier_reason
  }));
}

function failedAbsentRefs(artifact, manifestRows) {
  const failed = (artifact.rejected_sources || []).map((row) => clean({
    source_id: row.source_id,
    manifest_id: row.manifest_id,
    url: row.canonical_url || row.url || row.fetch_url,
    status: row.extraction_status || row.status || "FAILED_PRIMARY_EXTRACTION",
    reason: row.error || row.rejection_reason
  }));
  const absent = (artifact.missing_limited_primary_sources || []).map((row) => clean({
    status: row.status || "ABSENT_AFTER_TARGETED_PROBE",
    missing: row.missing_or_limited_source,
    attempted_paths: row.attempted_paths
  }));
  const rejected = manifestRows
    .filter((row) => row.admission_tier === "REJECTED_NOT_EVIDENCE")
    .map((row) => clean({ manifest_id: row.manifest_id, url: row.canonical_url || row.fetch_url, status: "REJECTED_NOT_EVIDENCE", reason: row.tier_reason }));
  return [...failed, ...absent, ...rejected];
}

function accessMatrix() {
  return {
    global: {
      default_load: "primary refs in allowed bucket only",
      index_only: "metadata only",
      cross_bucket: "exception only"
    },
    agents: {
      M9: { buckets: ["legal_governance_profile_urls"], families: LEGAL, exceptions: ["ENTITY_CONFLICT_CHECK", "LEGAL_REFERENCE_IN_TRUST_CENTER"] },
      M7_TARGET_PROFILE: { buckets: ["target_profile_urls"], families: TARGET, exceptions: ["ENTITY_CONFLICT_CHECK"] },
      M8_TARGET_FEATURE_PROFILE: { buckets: ["product_activity_profile_urls"], families: PRODUCT, required_profiles: ["target_profile", "target_profile_forensics"], exceptions: ["PRODUCT_CLAIM_VERIFICATION"] },
      M10: { buckets: ["data_asset_provenance_profile_urls", "legal_governance_profile_urls"], families: DATA_PRIVACY, exceptions: ["DATA_FLOW_NEEDED_FOR_PRIVACY_ANALYSIS", "BROKEN_OR_THIN_PRIMARY"] },
      M11: { buckets: ["legal_governance_profile_urls"], families: LEGAL, required_profiles: ["legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "registry_batch"], exceptions: ["CITATION_VERIFICATION", "VALIDATION_FAILURE"] },
      M12: { buckets: [], families: [], required_profiles: ["legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_profile"], exceptions: ["VALIDATION_FAILURE", "CITATION_VERIFICATION"] },
      COMPILER: { buckets: [], families: [], required_profiles: ["locked_outputs_only"] }
    }
  };
}

function hasPrimary(index) {
  return Object.values(index).some((bucket) => Object.values(bucket.families).some((family) => family.primary.length));
}

function docHint(row) {
  const value = `${row.route_type || ""} ${row.canonical_url || ""} ${row.url || ""}`.toLowerCase();
  if (value.includes("privacy")) return "privacy_policy";
  if (value.includes("terms")) return "terms_of_service";
  if (value.includes("eula")) return "eula";
  if (value.includes("dpa") || value.includes("data-processing")) return "dpa";
  if (value.includes("aup") || value.includes("acceptable-use")) return "aup";
  if (value.includes("sla") || value.includes("service-level")) return "sla";
  if (value.includes("trust")) return "trust_center";
  if (value.includes("legal-notice") || value.includes("imprint")) return "entity_notice";
  return undefined;
}

function clean(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""));
}
