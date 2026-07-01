const SOURCE_FAMILY_TYPES = Object.freeze({
  P1_PRODUCT: "P1_PRODUCT",
  P2_PLATFORM_FEATURE_SOLUTION: "P2_PLATFORM_FEATURE_SOLUTION",
  P3_AI_CAPABILITY_TECHNICAL: "P3_AI_CAPABILITY_TECHNICAL",
  P5_ENTERPRISE_PRICING: "P5_ENTERPRISE_PRICING",
});

export const RAW_FEATURE_HIT_TYPES = Object.freeze({
  PRODUCT_WRAPPER: "PRODUCT_WRAPPER",
  FEATURE_PAGE: "FEATURE_PAGE",
  STANDALONE_API: "STANDALONE_API",
  MODEL_CATALOGUE: "MODEL_CATALOGUE",
  INTEGRATION_SURFACE: "INTEGRATION_SURFACE",
  PRICING_CONFIRMED_CAPABILITY: "PRICING_CONFIRMED_CAPABILITY",
  DOCS_TECHNICAL_CAPABILITY: "DOCS_TECHNICAL_CAPABILITY",
});

export const CANDIDATE_TREATMENTS = Object.freeze({
  DIRECT_ACTIVITY_OR_PARENT: "DIRECT_ACTIVITY_OR_PARENT",
  DIRECT_ACTIVITY_OR_CHILD_CAPABILITY: "DIRECT_ACTIVITY_OR_CHILD_CAPABILITY",
  CROSS_CHECK_EXISTING_ACTIVITY: "CROSS_CHECK_EXISTING_ACTIVITY",
  LINK_OR_EXCLUDE_WITH_REASON: "LINK_OR_EXCLUDE_WITH_REASON",
});

export const COVERAGE_DISPOSITIONS = Object.freeze({
  DIRECT_ACTIVITY_ROW: "DIRECT_ACTIVITY_ROW",
  DIRECT_ACTIVITY_WITH_CHILD_CAPABILITIES: "DIRECT_ACTIVITY_WITH_CHILD_CAPABILITIES",
  CHILD_CAPABILITY_OF_ACTIVITY: "CHILD_CAPABILITY_OF_ACTIVITY",
  MERGED_DUPLICATE_SOURCE: "MERGED_DUPLICATE_SOURCE",
  EXCLUDED_NON_PRODUCT_ACTIVITY: "EXCLUDED_NON_PRODUCT_ACTIVITY",
  POSSIBLE_OVERLAP_REVIEW: "POSSIBLE_OVERLAP_REVIEW",
});

const SOURCE_FAMILIES = new Set(Object.values(SOURCE_FAMILY_TYPES));
const API_SLUG_ALIASES = Object.freeze({
  "document-digitisation": "document-digitisation",
  "document-digitization": "document-digitisation",
  dubbing: "dubbing",
  "speech-to-text": "speech-to-text",
  stt: "speech-to-text",
  "text-to-speech": "text-to-speech",
  tts: "text-to-speech",
  translation: "translation",
  translate: "translation",
  transliteration: "transliteration",
  transliterate: "transliteration",
  "language-identification": "language-identification",
});

const MODEL_PRICING_PATTERNS = Object.freeze([
  [/sarvam\s+105b/i, "Sarvam 105B Chat LLM", "chat-llm-model-access"],
  [/sarvam\s+30b/i, "Sarvam 30B Chat LLM", "chat-llm-model-access"],
  [/sarvam\s+vision/i, "Sarvam Vision", "vision-model-access"],
]);

const API_PRICING_PATTERNS = Object.freeze([
  [/text\s*to\s*speech|bulbul/i, "Text-to-Speech API", "text-to-speech"],
  [/speech\s*to\s*text/i, "Speech-to-Text API", "speech-to-text"],
  [/translation|translate|mayura/i, "Translation API", "translation"],
  [/transliterate|transliteration/i, "Transliteration API", "transliteration"],
  [/language\s+identification/i, "Language Identification API", "language-identification"],
]);

export function buildFeatureCandidateInventory(sourceArtifacts, options = {}) {
  const runId = options.runId || findRunId(sourceArtifacts) || null;
  const rawHits = harvestRawFeatureHits(sourceArtifacts);
  const { candidates, dedupMergeLedger, parentChildOverlapLedger } = canonicalizeRawFeatureHits(rawHits);
  const sourceFamiliesRead = [...new Set(rawHits.map((hit) => hit.source_family).filter(Boolean))].sort();
  return {
    artifact_type: "feature_candidate_inventory",
    inventory_version: "m8_feature_candidate_inventory_v1",
    run_id: runId,
    derivation_mode: "DETERMINISTIC_NO_MODEL",
    source_families_read: sourceFamiliesRead,
    raw_hit_count: rawHits.length,
    canonical_candidate_count: candidates.length,
    raw_feature_hit_ledger: rawHits,
    candidates,
    dedup_merge_ledger: dedupMergeLedger,
    parent_child_overlap_ledger: parentChildOverlapLedger,
    dedup_summary: {
      merged_duplicate_count: dedupMergeLedger.length,
      parent_child_overlap_count: parentChildOverlapLedger.length,
      possible_overlap_review_count: parentChildOverlapLedger.filter((row) => row.disposition === COVERAGE_DISPOSITIONS.POSSIBLE_OVERLAP_REVIEW).length,
    },
  };
}

export function harvestRawFeatureHits(sourceArtifacts) {
  const rawHits = [];
  const artifacts = Array.isArray(sourceArtifacts) ? sourceArtifacts : [sourceArtifacts];

  for (const artifactLike of artifacts) {
    const artifact = unwrapArtifact(artifactLike);
    const rootFamily = artifact?.root_family || artifactLike?.artifact_name || artifactLike?.root_family || "";
    if (!SOURCE_FAMILIES.has(rootFamily)) continue;
    const sources = Array.isArray(artifact?.sources) ? artifact.sources : [];
    for (const source of sources) {
      const sourceFamily = source.root_family || rootFamily;
      rawHits.push(...harvestSourceHits(source, sourceFamily));
    }
  }

  return rawHits.map((hit, index) => ({ ...hit, raw_hit_id: `RH.${String(index + 1).padStart(3, "0")}` }));
}

function harvestSourceHits(source, sourceFamily) {
  const hits = [];
  const url = String(source?.canonical_url || source?.url || source?.final_url || "").trim();
  const routeType = String(source?.route_type || "").trim();
  const sourceRef = buildSourceRef(source, sourceFamily);
  const slug = slugFromUrl(url);

  if (sourceFamily === SOURCE_FAMILY_TYPES.P1_PRODUCT && hasPathSegment(url, "products") && slug) {
    hits.push(buildRawHit({
      sourceFamily,
      source,
      sourceRef,
      rawName: humanizeSlug(slug),
      rawType: RAW_FEATURE_HIT_TYPES.PRODUCT_WRAPPER,
      wrapperOrSurface: humanizeSlug(slug),
      capabilityKey: normalizeSlug(slug),
      surfaceKey: "product-wrapper",
      confidenceBasis: "product_route_slug",
      mandatoryTreatment: CANDIDATE_TREATMENTS.DIRECT_ACTIVITY_OR_PARENT,
    }));
  }

  if (sourceFamily === SOURCE_FAMILY_TYPES.P2_PLATFORM_FEATURE_SOLUTION && slug) {
    hits.push(buildRawHit({
      sourceFamily,
      source,
      sourceRef,
      rawName: humanizeSlug(slug),
      rawType: RAW_FEATURE_HIT_TYPES.FEATURE_PAGE,
      wrapperOrSurface: "feature-page",
      capabilityKey: normalizeSlug(slug),
      surfaceKey: "feature-page",
      confidenceBasis: routeType || "feature_route",
      mandatoryTreatment: CANDIDATE_TREATMENTS.DIRECT_ACTIVITY_OR_CHILD_CAPABILITY,
    }));
  }

  if (sourceFamily === SOURCE_FAMILY_TYPES.P3_AI_CAPABILITY_TECHNICAL) {
    if (hasPathSegment(url, "apis") && slug) {
      const apiCapability = API_SLUG_ALIASES[normalizeSlug(slug)] || normalizeSlug(slug);
      hits.push(buildRawHit({
        sourceFamily,
        source,
        sourceRef,
        rawName: `${humanizeSlug(apiCapability)} API`,
        rawType: RAW_FEATURE_HIT_TYPES.STANDALONE_API,
        wrapperOrSurface: "sarvam-api",
        capabilityKey: apiCapability,
        surfaceKey: "standalone-api",
        confidenceBasis: "api_route_slug",
        mandatoryTreatment: CANDIDATE_TREATMENTS.DIRECT_ACTIVITY_OR_CHILD_CAPABILITY,
      }));
    } else if (hasPathSegment(url, "models")) {
      hits.push(buildRawHit({
        sourceFamily,
        source,
        sourceRef,
        rawName: "Model Catalogue",
        rawType: RAW_FEATURE_HIT_TYPES.MODEL_CATALOGUE,
        wrapperOrSurface: "models",
        capabilityKey: "model-catalogue",
        surfaceKey: "model-catalogue",
        confidenceBasis: "models_route",
        mandatoryTreatment: CANDIDATE_TREATMENTS.DIRECT_ACTIVITY_OR_CHILD_CAPABILITY,
      }));
    } else if (hasPathSegment(url, "integrations")) {
      hits.push(buildRawHit({
        sourceFamily,
        source,
        sourceRef,
        rawName: "Integrations",
        rawType: RAW_FEATURE_HIT_TYPES.INTEGRATION_SURFACE,
        wrapperOrSurface: "integrations",
        capabilityKey: "integration-surface",
        surfaceKey: "integration-surface",
        confidenceBasis: "integrations_route",
        mandatoryTreatment: CANDIDATE_TREATMENTS.DIRECT_ACTIVITY_OR_CHILD_CAPABILITY,
      }));
    } else if (hasPathSegment(url, "docs")) {
      hits.push(buildRawHit({
        sourceFamily,
        source,
        sourceRef,
        rawName: "API Documentation Surface",
        rawType: RAW_FEATURE_HIT_TYPES.DOCS_TECHNICAL_CAPABILITY,
        wrapperOrSurface: "docs",
        capabilityKey: "api-documentation-surface",
        surfaceKey: "docs-technical-capability",
        confidenceBasis: "docs_route",
        mandatoryTreatment: CANDIDATE_TREATMENTS.LINK_OR_EXCLUDE_WITH_REASON,
      }));
    }
  }

  if (sourceFamily === SOURCE_FAMILY_TYPES.P5_ENTERPRISE_PRICING) {
    hits.push(...harvestPricingHits(source, sourceFamily, sourceRef));
  }

  return hits;
}

function harvestPricingHits(source, sourceFamily, sourceRef) {
  const text = String(source?.lossless_text || source?.clean_text || source?.text || "");
  const payPerUseText = segmentBetween(text, /API Pricing \(Pay Per Use\)/i, /Subscription plans/i) || text;
  const rawLineItems = extractPricingLineItems(payPerUseText);
  const hits = [];
  const seen = new Set();

  for (const item of rawLineItems) {
    const classified = classifyPricingLineItem(item);
    if (!classified) continue;
    const key = `${classified.surfaceKey}::${classified.capabilityKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(buildRawHit({
      sourceFamily,
      source,
      sourceRef: { ...sourceRef, excerpt: item },
      rawName: classified.rawName,
      rawType: RAW_FEATURE_HIT_TYPES.PRICING_CONFIRMED_CAPABILITY,
      wrapperOrSurface: classified.wrapperOrSurface,
      capabilityKey: classified.capabilityKey,
      surfaceKey: classified.surfaceKey,
      confidenceBasis: "pricing_line_item",
      mandatoryTreatment: CANDIDATE_TREATMENTS.CROSS_CHECK_EXISTING_ACTIVITY,
    }));
  }

  return hits;
}

function extractPricingLineItems(text) {
  const items = [];
  const normalized = String(text || "").replace(/\s+/g, " ");
  const colonMatches = normalized.matchAll(/([A-Z][A-Za-z0-9\s+&/(),.-]{2,90}?):\s*(?:Free|₹|\$|€|£|\d)/g);
  for (const match of colonMatches) items.push(match[1].trim());
  for (const [pattern, displayName] of [...API_PRICING_PATTERNS, ...MODEL_PRICING_PATTERNS]) {
    if (pattern.test(normalized)) items.push(displayName);
  }
  return [...new Set(items.map((item) => item.replace(/\s+/g, " ").trim()).filter(Boolean))];
}

function classifyPricingLineItem(item) {
  const value = String(item || "").trim();
  if (!value) return null;
  for (const [pattern, rawName, capabilityKey] of MODEL_PRICING_PATTERNS) {
    if (pattern.test(value)) {
      return {
        rawName,
        wrapperOrSurface: "models",
        capabilityKey,
        surfaceKey: "model-access",
      };
    }
  }
  for (const [pattern, rawName, capabilityKey] of API_PRICING_PATTERNS) {
    if (pattern.test(value)) {
      return {
        rawName,
        wrapperOrSurface: "sarvam-api",
        capabilityKey,
        surfaceKey: "standalone-api",
      };
    }
  }
  return null;
}

export function canonicalizeRawFeatureHits(rawHits) {
  const byKey = new Map();
  for (const hit of rawHits || []) {
    const canonicalFeatureKey = makeCanonicalFeatureKey(hit);
    if (!byKey.has(canonicalFeatureKey)) byKey.set(canonicalFeatureKey, []);
    byKey.get(canonicalFeatureKey).push(hit);
  }

  const candidates = [];
  const dedupMergeLedger = [];
  let counter = 1;
  for (const [canonicalFeatureKey, hits] of [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const primaryHit = selectPrimaryHit(hits);
    const candidateId = `FC.${String(counter++).padStart(3, "0")}`;
    const mergedRawHitIds = hits.map((hit) => hit.raw_hit_id);
    const duplicateHits = hits.filter((hit) => hit.raw_hit_id !== primaryHit.raw_hit_id);
    for (const duplicate of duplicateHits) {
      dedupMergeLedger.push({
        candidate_id: candidateId,
        canonical_feature_key: canonicalFeatureKey,
        merged_raw_hit_id: duplicate.raw_hit_id,
        primary_raw_hit_id: primaryHit.raw_hit_id,
        disposition: COVERAGE_DISPOSITIONS.MERGED_DUPLICATE_SOURCE,
        reason: "same canonical feature key after deterministic route/name/source-type normalization",
      });
    }
    candidates.push({
      candidate_id: candidateId,
      canonical_feature_key: canonicalFeatureKey,
      candidate_name: primaryHit.raw_name,
      candidate_type: primaryHit.raw_type,
      wrapper_or_surface: primaryHit.wrapper_or_surface,
      capability_key: primaryHit.capability_key,
      surface_key: primaryHit.surface_key,
      mandatory_profile_treatment: strongestMandatoryTreatment(hits),
      dedup_disposition: "CANONICAL_CANDIDATE",
      merged_raw_hit_ids: mergedRawHitIds,
      source_refs: hits.map((hit) => hit.source_ref),
    });
  }

  const parentChildOverlapLedger = detectParentChildOverlaps(candidates);
  return { candidates, dedupMergeLedger, parentChildOverlapLedger };
}

function detectParentChildOverlaps(candidates) {
  const rows = [];
  const products = candidates.filter((candidate) => candidate.candidate_type === RAW_FEATURE_HIT_TYPES.PRODUCT_WRAPPER);
  const capabilities = candidates.filter((candidate) => [RAW_FEATURE_HIT_TYPES.STANDALONE_API, RAW_FEATURE_HIT_TYPES.MODEL_CATALOGUE, RAW_FEATURE_HIT_TYPES.INTEGRATION_SURFACE].includes(candidate.candidate_type));
  for (const product of products) {
    for (const capability of capabilities) {
      const sharedTokens = intersectTokens(product.candidate_name, capability.candidate_name);
      if (!sharedTokens.length) continue;
      rows.push({
        parent_candidate_id: product.candidate_id,
        child_candidate_id: capability.candidate_id,
        disposition: COVERAGE_DISPOSITIONS.POSSIBLE_OVERLAP_REVIEW,
        shared_tokens: sharedTokens,
        reason: "product wrapper and technical capability share normalized tokens; preserve both unless agent package explicitly child-links them",
      });
    }
  }
  return rows;
}

export function validateFeatureCandidateCoverage(candidateInventory, targetFeatureProfile, options = {}) {
  const failures = [];
  const inventory = unwrapInventory(candidateInventory);
  const profile = unwrapFeatureProfile(targetFeatureProfile);
  if (!inventory || !Array.isArray(inventory.candidates)) failures.push("feature_candidate_inventory.candidates must be array");
  if (!profile || !Array.isArray(profile.activities)) failures.push("target_feature_profile.activities must be array");
  if (failures.length) return buildCoverageResult("FAIL", failures, [], []);

  const candidateIds = new Set(inventory.candidates.map((candidate) => candidate.candidate_id));
  const duplicateKeys = findDuplicateCanonicalKeys(inventory.candidates);
  for (const key of duplicateKeys) failures.push(`duplicate canonical_feature_key: ${key}`);

  const coveredCandidateIds = new Set();
  const coverageRows = [];
  const activities = profile.activities || [];
  const activityReferences = new Set();

  activities.forEach((activity, index) => {
    const activityReference = typeof activity?.activity_reference === "string" && activity.activity_reference.trim() ? activity.activity_reference.trim() : null;
    if (!activityReference) failures.push(`activities[${index}].activity_reference missing`);
    else if (activityReferences.has(activityReference)) failures.push(`duplicate activity_reference: ${activityReference}`);
    else activityReferences.add(activityReference);

    const ids = Array.isArray(activity?.source_candidate_ids) ? activity.source_candidate_ids : [];
    if (!ids.length) failures.push(`activities[${index}].source_candidate_ids missing or empty`);
    for (const id of ids) {
      if (!candidateIds.has(id)) failures.push(`activities[${index}].source_candidate_ids references unknown candidate: ${id}`);
      coveredCandidateIds.add(id);
      coverageRows.push({ candidate_id: id, activity_reference: activityReference, coverage_disposition: activity.coverage_disposition || COVERAGE_DISPOSITIONS.DIRECT_ACTIVITY_ROW, coverage_path: "activity.source_candidate_ids" });
    }

    const childCapabilities = Array.isArray(activity?.child_capabilities) ? activity.child_capabilities : [];
    for (const [childIndex, child] of childCapabilities.entries()) {
      const childCandidateId = child?.source_candidate_id;
      if (!childCandidateId) failures.push(`activities[${index}].child_capabilities[${childIndex}].source_candidate_id missing`);
      else if (!candidateIds.has(childCandidateId)) failures.push(`activities[${index}].child_capabilities[${childIndex}].source_candidate_id references unknown candidate: ${childCandidateId}`);
      else {
        coveredCandidateIds.add(childCandidateId);
        coverageRows.push({ candidate_id: childCandidateId, activity_reference: activityReference, coverage_disposition: COVERAGE_DISPOSITIONS.CHILD_CAPABILITY_OF_ACTIVITY, coverage_path: "activity.child_capabilities" });
      }
    }
  });

  const exclusionRows = normalizeExclusionRows(options.exclusionLedger || options.candidate_exclusion_ledger || profile.candidate_exclusion_ledger || []);
  for (const row of exclusionRows) {
    if (candidateIds.has(row.candidate_id) && row.reason) {
      coveredCandidateIds.add(row.candidate_id);
      coverageRows.push({ candidate_id: row.candidate_id, activity_reference: null, coverage_disposition: row.disposition || COVERAGE_DISPOSITIONS.EXCLUDED_NON_PRODUCT_ACTIVITY, coverage_path: "candidate_exclusion_ledger" });
    }
  }

  const uncoveredCandidates = inventory.candidates.filter((candidate) => !coveredCandidateIds.has(candidate.candidate_id));
  for (const candidate of uncoveredCandidates) failures.push(`uncovered candidate: ${candidate.candidate_id} ${candidate.candidate_name}`);
  return buildCoverageResult(failures.length ? "FAIL" : "PASS", failures, uncoveredCandidates, coverageRows);
}

export function buildM8FeatureCoverageForensics(candidateInventory, targetFeatureProfile, coverageResult = null) {
  const inventory = unwrapInventory(candidateInventory);
  const profile = unwrapFeatureProfile(targetFeatureProfile);
  const validation = coverageResult || validateFeatureCandidateCoverage(inventory, profile);
  return {
    artifact_type: "target_feature_profile_forensics",
    forensic_version: "m8_feature_coverage_forensics_v1",
    derivation_mode: "DETERMINISTIC_NO_MODEL",
    source_family_coverage_ledger: (inventory?.source_families_read || []).map((source_family) => ({ source_family, consumed: true })),
    raw_feature_hit_ledger: inventory?.raw_feature_hit_ledger || [],
    canonical_feature_candidate_ledger: inventory?.candidates || [],
    dedup_merge_ledger: inventory?.dedup_merge_ledger || [],
    parent_child_overlap_ledger: inventory?.parent_child_overlap_ledger || [],
    candidate_to_activity_coverage_ledger: validation.coverage_rows || [],
    candidate_exclusion_ledger: profile?.candidate_exclusion_ledger || [],
    validation_result: validation,
  };
}

function buildCoverageResult(status, failures, uncoveredCandidates, coverageRows) {
  return {
    coverage_result: status,
    failures,
    uncovered_candidates: uncoveredCandidates.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      candidate_name: candidate.candidate_name,
      candidate_type: candidate.candidate_type,
      canonical_feature_key: candidate.canonical_feature_key,
    })),
    coverage_rows: coverageRows,
    repair_required: status !== "PASS",
  };
}

function buildRawHit({ sourceFamily, source, sourceRef, rawName, rawType, wrapperOrSurface, capabilityKey, surfaceKey, confidenceBasis, mandatoryTreatment }) {
  return {
    source_family: sourceFamily,
    source_id: source?.source_id || source?.manifest_id || null,
    source_url: String(source?.canonical_url || source?.url || source?.final_url || "").trim(),
    source_title_or_slug: slugFromUrl(source?.canonical_url || source?.url || source?.final_url || "") || rawName,
    raw_name: rawName,
    raw_type: rawType,
    wrapper_or_surface: wrapperOrSurface,
    capability_key: capabilityKey,
    surface_key: surfaceKey,
    source_ref: sourceRef,
    confidence_basis: confidenceBasis,
    mandatory_profile_treatment: mandatoryTreatment,
  };
}

function buildSourceRef(source, sourceFamily) {
  return {
    artifact_name: source?.root_family || sourceFamily,
    source_id: source?.source_id || null,
    source_url: source?.canonical_url || source?.url || source?.final_url || "",
    route_type: source?.route_type || "",
    excerpt: firstNonEmptyString(source?.title, source?.page_title, source?.source_title, source?.lossless_text, source?.clean_text, source?.text, source?.url),
  };
}

function makeCanonicalFeatureKey(hit) {
  const surface = normalizeKey(hit.wrapper_or_surface || "unknown");
  const capability = normalizeKey(hit.capability_key || hit.raw_name || "unknown");
  const type = normalizeSurfaceType(hit.surface_key || hit.raw_type || "unknown");
  return `${surface}::${capability}::${type}`;
}

function normalizeSurfaceType(value) {
  const normalized = normalizeKey(value);
  if (["pricing-confirmed-capability", "api", "api-docs-or-api-family-root"].includes(normalized)) return "standalone-api";
  return normalized;
}

function selectPrimaryHit(hits) {
  return [...hits].sort((a, b) => rawTypeRank(a.raw_type) - rawTypeRank(b.raw_type) || String(a.source_url).localeCompare(String(b.source_url)))[0];
}

function rawTypeRank(type) {
  return {
    [RAW_FEATURE_HIT_TYPES.PRODUCT_WRAPPER]: 1,
    [RAW_FEATURE_HIT_TYPES.STANDALONE_API]: 1,
    [RAW_FEATURE_HIT_TYPES.MODEL_CATALOGUE]: 1,
    [RAW_FEATURE_HIT_TYPES.INTEGRATION_SURFACE]: 1,
    [RAW_FEATURE_HIT_TYPES.FEATURE_PAGE]: 2,
    [RAW_FEATURE_HIT_TYPES.DOCS_TECHNICAL_CAPABILITY]: 3,
    [RAW_FEATURE_HIT_TYPES.PRICING_CONFIRMED_CAPABILITY]: 4,
  }[type] || 9;
}

function strongestMandatoryTreatment(hits) {
  const treatments = hits.map((hit) => hit.mandatory_profile_treatment);
  if (treatments.includes(CANDIDATE_TREATMENTS.DIRECT_ACTIVITY_OR_PARENT)) return CANDIDATE_TREATMENTS.DIRECT_ACTIVITY_OR_PARENT;
  if (treatments.includes(CANDIDATE_TREATMENTS.DIRECT_ACTIVITY_OR_CHILD_CAPABILITY)) return CANDIDATE_TREATMENTS.DIRECT_ACTIVITY_OR_CHILD_CAPABILITY;
  if (treatments.includes(CANDIDATE_TREATMENTS.CROSS_CHECK_EXISTING_ACTIVITY)) return CANDIDATE_TREATMENTS.CROSS_CHECK_EXISTING_ACTIVITY;
  return CANDIDATE_TREATMENTS.LINK_OR_EXCLUDE_WITH_REASON;
}

function findDuplicateCanonicalKeys(candidates) {
  const seen = new Set();
  const duplicates = new Set();
  for (const candidate of candidates || []) {
    if (!candidate?.canonical_feature_key) continue;
    if (seen.has(candidate.canonical_feature_key)) duplicates.add(candidate.canonical_feature_key);
    seen.add(candidate.canonical_feature_key);
  }
  return [...duplicates].sort();
}

function normalizeExclusionRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    candidate_id: row?.candidate_id || row?.source_candidate_id,
    reason: row?.reason || row?.exclusion_reason,
    disposition: row?.disposition,
  })).filter((row) => row.candidate_id);
}

function unwrapArtifact(value) {
  return value?.artifact && typeof value.artifact === "object" ? value.artifact : value;
}

function unwrapInventory(value) {
  return value?.feature_candidate_inventory || value;
}

function unwrapFeatureProfile(value) {
  return value?.target_feature_profile || value;
}

function findRunId(values) {
  const list = Array.isArray(values) ? values : [values];
  for (const value of list) {
    if (value?.run_id) return value.run_id;
    if (value?.artifact?.run_id) return value.artifact.run_id;
  }
  return null;
}

function slugFromUrl(urlLike) {
  try {
    const url = new URL(String(urlLike || ""));
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.at(-1) || "";
  } catch {
    const parts = String(urlLike || "").split(/[/?#]/)[0].split("/").filter(Boolean);
    return parts.at(-1) || "";
  }
}

function hasPathSegment(urlLike, segment) {
  try {
    const url = new URL(String(urlLike || ""));
    return url.pathname.split("/").filter(Boolean).includes(segment);
  } catch {
    return String(urlLike || "").split(/[/?#]/)[0].split("/").filter(Boolean).includes(segment);
  }
}

function normalizeSlug(value) {
  return normalizeKey(value).replace(/-api$/, "");
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function humanizeSlug(value) {
  const normalized = normalizeSlug(value);
  return normalized.split("-").filter(Boolean).map((word) => {
    if (["api", "ai", "llm", "tts", "stt"].includes(word)) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}

function segmentBetween(text, startPattern, endPattern) {
  const value = String(text || "");
  const startMatch = value.match(startPattern);
  if (!startMatch || typeof startMatch.index !== "number") return "";
  const start = startMatch.index + startMatch[0].length;
  const afterStart = value.slice(start);
  const endMatch = afterStart.match(endPattern);
  return endMatch && typeof endMatch.index === "number" ? afterStart.slice(0, endMatch.index) : afterStart;
}

function intersectTokens(a, b) {
  const stop = new Set(["api", "ai", "sarvam", "model", "models", "product", "surface", "catalogue", "integration", "integrations"]);
  const tokensA = new Set(normalizeKey(a).split("-").filter((token) => token && !stop.has(token)));
  return normalizeKey(b).split("-").filter((token) => token && !stop.has(token) && tokensA.has(token));
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 500);
  }
  return "";
}
