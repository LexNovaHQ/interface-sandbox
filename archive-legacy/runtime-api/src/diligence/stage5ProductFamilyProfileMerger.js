function clone(value) { return JSON.parse(JSON.stringify(value || {})); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function asString(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).trim() || fallback;
}
function uniq(values = []) { return [...new Set(asArray(values).map((value) => asString(value)).filter(Boolean))]; }
function confidence(values = []) {
  const set = new Set(asArray(values).filter(Boolean));
  if (set.has("high")) return "high";
  if (set.has("medium")) return "medium";
  if (set.has("low")) return "low";
  return "unknown";
}
function targetRef(baseInput = {}, firstProfile = {}) {
  const fromProfile = firstProfile.target_profile_ref || {};
  const target = baseInput.target_profile_v2 || baseInput.company_profile || {};
  const identity = target.identity || {};
  return {
    target_profile_version: asString(fromProfile.target_profile_version || target.target_profile_version, "target_profile_v2"),
    brand_name: asString(fromProfile.brand_name || identity.brand_name || identity.company_name || "Unknown target"),
    legal_name: asString(fromProfile.legal_name || identity.legal_name || "unknown"),
    domain: asString(fromProfile.domain || identity.domain || identity.website || "unknown")
  };
}
function remapFeature(feature = {}, nextId) {
  const oldFeatureId = asString(feature.feature_id || `OLD_${nextId}`);
  const newFeatureId = `F${String(nextId).padStart(3, "0")}`;
  const copy = clone(feature);
  copy.feature_id = newFeatureId;
  copy.linked_threat_ids = [];
  return { oldFeatureId, newFeatureId, feature: copy };
}
function flattenDataProvenance(features = []) {
  const rows = [];
  let index = 1;
  for (const feature of features) {
    for (const row of asArray(feature.data_provenance)) {
      rows.push({
        provenance_id: `DP${String(index++).padStart(3, "0")}`,
        feature_id: feature.feature_id,
        data_origin: row.data_origin || "unknown",
        data_subject: row.data_subject || "unknown",
        data_category: row.data_category || "unknown",
        processing_context: row.processing_context || feature.system_action || "not_visible_in_product_sources",
        storage_or_retention_signal: row.storage_or_retention_signal || "not_visible_in_product_sources",
        training_or_finetuning_signal: row.training_or_finetuning_signal || "not_visible_in_product_sources",
        source_url: row.source_url || feature.feature_source_url || "unknown",
        evidence_refs: asArray(row.evidence_refs).length ? row.evidence_refs : asArray(feature.evidence_refs),
        confidence: row.confidence || feature.confidence || "unknown"
      });
    }
  }
  return rows.filter((row) => asArray(row.evidence_refs).length);
}
function flattenSurfaceMap(features = []) {
  const rows = [];
  let index = 1;
  for (const feature of features) {
    for (const row of asArray(feature.surface_provenance)) {
      rows.push({
        surface_id: `SF${String(index++).padStart(3, "0")}`,
        feature_id: feature.feature_id,
        surface_token: row.surface_token,
        int_ext_classification: "unknown",
        basis: row.matched_data_or_context || row.registry_key_surface_meaning || "surface derived from feature-level surface provenance",
        confidence: row.confidence || feature.confidence || "unknown",
        evidence_refs: asArray(row.evidence_refs).length ? row.evidence_refs : asArray(feature.evidence_refs)
      });
    }
  }
  return rows.filter((row) => row.surface_token && asArray(row.evidence_refs).length);
}
function remapArchitectureHints(profiles = [], idMap = new Map()) {
  const rows = [];
  let index = 1;
  for (const profile of profiles) {
    for (const row of asArray(profile.architecture_hints)) {
      const mappedFeatureId = idMap.get(asString(row.feature_id));
      if (!mappedFeatureId) continue;
      rows.push({
        ...clone(row),
        hint_id: `AH${String(index++).padStart(3, "0")}`,
        feature_id: mappedFeatureId,
        hint_type: row.hint_type || "unknown",
        hint_value: row.hint_value || "unknown",
        disposition: row.disposition || "confirmation_only",
        source_url: row.source_url || "unknown",
        evidence_refs: asArray(row.evidence_refs),
        confidence: row.confidence || "unknown"
      });
    }
  }
  return rows.filter((row) => row.hint_type && row.hint_value && asArray(row.evidence_refs).length);
}
function mergeVaultCandidates(profiles = []) {
  const out = { baseline: {}, archetypes: {}, compliance: {} };
  for (const profile of profiles) {
    for (const section of ["baseline", "archetypes", "compliance"]) {
      if (profile.vault_feature_candidates?.[section] && typeof profile.vault_feature_candidates[section] === "object") {
        out[section] = { ...out[section], ...profile.vault_feature_candidates[section] };
      }
    }
  }
  return out;
}
function mergeEvidenceRefs(profiles = [], features = []) {
  const rows = [];
  for (const profile of profiles) rows.push(...asArray(profile.evidence?.field_evidence_refs));
  for (const feature of features) {
    rows.push({ field_path: `/feature_inventory/${feature.feature_id}`, evidence_refs: asArray(feature.evidence_refs), basis: "Merged from product-family scoped Stage 5 output", confidence: feature.confidence || "unknown" });
  }
  const seen = new Set();
  return rows.filter((row) => asArray(row?.evidence_refs).length).filter((row) => {
    const key = `${row.field_path}:${asArray(row.evidence_refs).join("|")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((row) => ({ field_path: asString(row.field_path, "/unknown"), evidence_refs: asArray(row.evidence_refs), basis: asString(row.basis, "Stage 5 merged evidence ref"), confidence: row.confidence || "unknown" }));
}
function sourceCoverage(baseInput = {}, profiles = [], idMap = new Map()) {
  const rows = [];
  const seen = new Set();
  for (const profile of profiles) {
    for (const row of asArray(profile.commercial_scan?.source_coverage)) {
      const mapped = asArray(row.mapped_feature_ids).map((id) => idMap.get(asString(id)) || asString(id)).filter(Boolean);
      const key = row.source_id || row.source_url || JSON.stringify(row.evidence_refs || []);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        source_id: asString(row.source_id, "unknown"),
        source_url: asString(row.source_url, "unknown"),
        source_family: asString(row.source_family, "unknown"),
        coverage_status: row.coverage_status || (mapped.length ? "mapped" : "supporting"),
        mapped_feature_ids: mapped,
        unmapped_reason: asString(row.unmapped_reason, mapped.length ? "mapped_after_product_family_merge" : "supporting_or_insufficient_detail_after_product_family_merge"),
        evidence_refs: asArray(row.evidence_refs).length ? row.evidence_refs : [`${asString(row.source_id, "unknown")}#C001`]
      });
    }
  }
  if (rows.length) return rows;
  return asArray(baseInput.source_bundle?.artifact_inventory).map((source) => ({
    source_id: asString(source.evidence_source_id || source.source_id, "unknown"),
    source_url: asString(source.final_url || source.source_url || source.url, "unknown"),
    source_family: asString(source.source_family, "unknown"),
    coverage_status: "supporting",
    mapped_feature_ids: [],
    unmapped_reason: "source retained in Stage 5 product-family packet but not directly mapped during merge",
    evidence_refs: [`${asString(source.evidence_source_id || source.source_id, "unknown")}#C001`]
  }));
}
function classificationQuality(profiles = [], unresolved = []) {
  const statuses = profiles.map((profile) => profile.classification_quality?.status).filter(Boolean);
  const degraded = statuses.includes("DEGRADED") || unresolved.length > 0;
  return {
    quality_version: "stage5_feature_classification_quality_v1",
    status: degraded ? "DEGRADED" : "PASS",
    reinvestigation_required: false,
    reinvestigation_attempted: profiles.some((profile) => profile.classification_quality?.reinvestigation_attempted === true),
    reinvestigation_pass_count: profiles.some((profile) => Number(profile.classification_quality?.reinvestigation_pass_count || 0) > 0) ? 1 : 0,
    unresolved_feature_count: unresolved.length,
    fallback_routing_required: unresolved.length > 0 || degraded
  };
}
export function mergeStage5ProductFamilyProfiles({ baseInput = {}, familyResults = [], packetPlan = null } = {}) {
  const profiles = familyResults.map((row) => row?.target_feature_profile || row?.result?.target_feature_profile || row?.result?.["target_feature_profile"]).filter((profile) => profile && typeof profile === "object");
  const idMap = new Map();
  const features = [];
  let nextFeature = 1;
  for (const profile of profiles) {
    for (const feature of asArray(profile.feature_inventory)) {
      const mapped = remapFeature(feature, nextFeature++);
      idMap.set(mapped.oldFeatureId, mapped.newFeatureId);
      features.push(mapped.feature);
    }
  }
  const unresolved = profiles.flatMap((profile) => asArray(profile.unresolved_feature_candidates));
  const distinctOutcomes = uniq([...profiles.flatMap((profile) => asArray(profile.commercial_scan?.distinct_commercial_outcomes_seen)), ...features.map((feature) => feature.commercial_function)]);
  const mappedCoreIds = features.filter((feature) => feature.feature_role === "CORE").map((feature) => feature.feature_id);
  const limitations = uniq([
    "Stage 5 was assembled from capped product-family scoped lossless model passes; source text was not snippet-selected, summarized, or compressed.",
    ...(packetPlan?.manifest?.manifest_warnings || []),
    ...profiles.flatMap((profile) => asArray(profile.limitations))
  ]);
  const firstProfile = profiles[0] || {};
  const merged = {
    feature_profile_version: "feature_profile_v2",
    target_profile_ref: targetRef(baseInput, firstProfile),
    feature_inventory: features,
    product_feature_map: [],
    data_provenance_map: flattenDataProvenance(features),
    regulated_surface_map: flattenSurfaceMap(features),
    architecture_hints: remapArchitectureHints(profiles, idMap),
    classification_quality: classificationQuality(profiles, unresolved),
    unresolved_feature_candidates: unresolved,
    commercial_scan: {
      distinct_commercial_outcomes_seen: distinctOutcomes,
      mapped_core_feature_ids: mappedCoreIds,
      source_coverage: sourceCoverage(baseInput, profiles, idMap),
      unmapped_outcomes_due_to_insufficient_detail: uniq(profiles.flatMap((profile) => asArray(profile.commercial_scan?.unmapped_outcomes_due_to_insufficient_detail))),
      completeness_status: unresolved.length ? "PARTIAL" : "COMPLETE",
      completeness_warnings: uniq([...(unresolved.length ? ["Product-family scoped merge contains unresolved feature candidates; Stage 7 fallback routing may apply."] : []), ...profiles.flatMap((profile) => asArray(profile.commercial_scan?.completeness_warnings))])
    },
    vault_feature_candidates: mergeVaultCandidates(profiles),
    evidence: {
      field_evidence_refs: mergeEvidenceRefs(profiles, features),
      unresolved_questions: uniq(profiles.flatMap((profile) => asArray(profile.evidence?.unresolved_questions)))
    },
    limitations
  };
  return {
    ok: features.length > 0,
    target_feature_profile: merged,
    merge_summary: {
      product_family_result_count: familyResults.length,
      merged_profile_count: profiles.length,
      merged_feature_count: features.length,
      unresolved_feature_candidate_count: unresolved.length,
      product_family_packet_plan_version: packetPlan?.packet_plan_version || null
    }
  };
}
