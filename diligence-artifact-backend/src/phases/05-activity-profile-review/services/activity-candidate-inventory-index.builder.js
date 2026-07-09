import { FEATURE_CANDIDATE_INDEX_BOUNDARY, FEATURE_CANDIDATE_INVENTORY_ARTIFACT, FEATURE_CANDIDATE_INVENTORY_MODE, FEATURE_CANDIDATE_INVENTORY_VERSION } from "./activity-candidate-inventory.boundary.js";

const PRODUCT_ROOTS = new Set(["product_service", "platform_feature_solution", "technical_docs_api_developer", "docs_api_data_flow", "pricing_commercial_availability", "integrations_ecosystem"]);
const RAW_TYPES = Object.freeze({ PRODUCT_WRAPPER: "PRODUCT_WRAPPER", FEATURE_PAGE: "FEATURE_PAGE", STANDALONE_API: "STANDALONE_API", MODEL_CATALOGUE: "MODEL_CATALOGUE", INTEGRATION_SURFACE: "INTEGRATION_SURFACE", PRICING_CONFIRMED_CAPABILITY: "PRICING_CONFIRMED_CAPABILITY", DOCS_TECHNICAL_CAPABILITY: "DOCS_TECHNICAL_CAPABILITY" });

export function buildFeatureCandidateInventoryIndex(sourceArtifacts, options = {}) {
  const artifacts = Array.isArray(sourceArtifacts) ? sourceArtifacts : [sourceArtifacts];
  const rawHits = artifacts.flatMap((artifactLike) => harvestArtifactHits(unwrapArtifact(artifactLike))).map((hit, index) => ({ ...hit, raw_hit_id: `RH.${String(index + 1).padStart(3, "0")}` }));
  const { candidates, dedup_index, parent_child_overlap_index } = canonicalizeRawHits(rawHits);
  return Object.freeze({ artifact_type: FEATURE_CANDIDATE_INVENTORY_ARTIFACT, inventory_version: FEATURE_CANDIDATE_INVENTORY_VERSION, run_id: options.runId || findRunId(artifacts) || null, derivation_mode: FEATURE_CANDIDATE_INVENTORY_MODE, source_roots_indexed: [...new Set(rawHits.map((hit) => hit.source_root).filter(Boolean))].sort(), raw_hit_count: rawHits.length, canonical_candidate_count: candidates.length, raw_feature_hit_index: rawHits.map(stripRawHit), candidates, canonicalization_index: candidates.map((candidate) => ({ candidate_id: candidate.candidate_id, canonical_feature_key: candidate.canonical_feature_key, merged_raw_hit_ids: candidate.merged_raw_hit_ids })), dedup_index, parent_child_overlap_index, dedup_summary: Object.freeze({ merged_duplicate_count: dedup_index.length, parent_child_overlap_count: parent_child_overlap_index.length }), index_boundary: FEATURE_CANDIDATE_INDEX_BOUNDARY, index_limitations: rawHits.length ? [] : ["No public product/activity candidates were detected in the loaded product/activity source roots."] });
}

export const buildFeatureCandidateInventory = buildFeatureCandidateInventoryIndex;

export function validateFeatureCandidateInventoryIndex(input) {
  const inventory = unwrapInventory(input);
  const failures = [];
  if (inventory?.artifact_type !== FEATURE_CANDIDATE_INVENTORY_ARTIFACT) failures.push("artifact_type must be feature_candidate_inventory");
  if (inventory?.inventory_version !== FEATURE_CANDIDATE_INVENTORY_VERSION) failures.push("inventory_version mismatch");
  if (inventory?.derivation_mode !== FEATURE_CANDIDATE_INVENTORY_MODE) failures.push("inventory must be deterministic index-only mode");
  if (!Array.isArray(inventory?.candidates)) failures.push("candidates must be array");
  if (!inventory?.index_boundary?.index_only || !inventory?.index_boundary?.no_source_text_copy) failures.push("index boundary missing");
  const keys = new Set();
  for (const candidate of inventory?.candidates || []) {
    if (!candidate.candidate_id || !candidate.canonical_feature_key) failures.push("candidate missing id/key");
    if (keys.has(candidate.canonical_feature_key)) failures.push(`duplicate canonical key:${candidate.canonical_feature_key}`);
    keys.add(candidate.canonical_feature_key);
    if (!Array.isArray(candidate.source_pointers) || !candidate.source_pointers.length) failures.push(`${candidate.candidate_id || "candidate"}:source_pointers_missing`);
  }
  if (containsEvidenceCopy(inventory)) failures.push("inventory contains evidence-copy fields");
  return Object.freeze({ status: failures.length ? "FAIL" : "PASS", failures });
}

export const validateFeatureCandidateInventory = validateFeatureCandidateInventoryIndex;

export function validateFeatureCandidateCoverage(inventoryInput, profileInput, options = {}) {
  const inventory = unwrapInventory(inventoryInput);
  const profile = profileInput?.target_feature_profile || profileInput;
  const failures = [...validateFeatureCandidateInventoryIndex(inventory).failures];
  if (!Array.isArray(profile?.activities)) failures.push("target_feature_profile.activities must be array");
  if (failures.length) return coverageResult("FAIL", failures, [], []);
  const candidateIds = new Set(inventory.candidates.map((candidate) => candidate.candidate_id));
  const activityRefs = new Set((profile.activities || []).map((activity) => activity.activity_reference).filter(Boolean));
  const covered = new Set();
  const coverageRows = [];
  const add = (candidate_id, activity_reference, disposition, path, reason = "") => { if (!candidate_id) return failures.push(`${path}:candidate_id_missing`); if (!candidateIds.has(candidate_id)) return failures.push(`${path}:unknown_candidate:${candidate_id}`); if (activity_reference && !activityRefs.has(activity_reference)) failures.push(`${path}:unknown_activity:${activity_reference}`); covered.add(candidate_id); coverageRows.push({ candidate_id, activity_reference: activity_reference || null, coverage_disposition: disposition || "DIRECT_ACTIVITY_ROW", coverage_path: path, reason }); };
  for (const activity of profile.activities || []) for (const candidate_id of activity.source_candidate_ids || []) add(candidate_id, activity.activity_reference, activity.coverage_disposition, "activity.source_candidate_ids");
  for (const row of options.coverageLedger || options.candidate_to_activity_coverage_ledger || []) add(row.candidate_id || row.source_candidate_id || row.canonical_candidate_id, row.activity_reference, row.coverage_disposition || row.disposition, "candidate_to_activity_coverage_ledger", row.reason || "");
  for (const row of options.exclusionLedger || options.candidate_exclusion_ledger || []) if (row.reason || row.exclusion_reason) add(row.candidate_id || row.source_candidate_id, null, row.disposition || "EXCLUDED_NON_PRODUCT_ACTIVITY", "candidate_exclusion_ledger", row.reason || row.exclusion_reason);
  const uncovered = inventory.candidates.filter((candidate) => !covered.has(candidate.candidate_id));
  for (const candidate of uncovered) failures.push(`uncovered candidate:${candidate.candidate_id}:${candidate.candidate_name}`);
  return coverageResult(failures.length ? "FAIL" : "PASS", failures, uncovered, coverageRows);
}

export function buildM8FeatureCoverageForensics(inventoryInput, profileInput, options = {}) {
  const inventory = unwrapInventory(inventoryInput);
  const validation = options.coverageResult || validateFeatureCandidateCoverage(inventory, profileInput, options);
  return Object.freeze({ feature_candidate_inventory_ref: { artifact_name: FEATURE_CANDIDATE_INVENTORY_ARTIFACT, inventory_version: inventory?.inventory_version || "", run_id: inventory?.run_id || "", canonical_candidate_count: inventory?.canonical_candidate_count || 0, raw_hit_count: inventory?.raw_hit_count || 0, source_of_truth: true }, raw_feature_hit_derivation_ledger: (inventory?.raw_feature_hit_index || []).map(({ raw_hit_id, raw_type, source_pointer, confidence_basis }) => ({ raw_hit_id, raw_type, source_pointer, confidence_basis })), canonicalization_derivation_ledger: inventory?.canonicalization_index || [], dedup_decision_ledger: inventory?.dedup_index || [], parent_child_overlap_ledger: validation.coverage_rows || [], validation_result: validation });
}

function harvestArtifactHits(artifact = {}) {
  const root = String(artifact.common_root || artifact.artifact_name || "").replace(/^lossless_root__/, "");
  if (!PRODUCT_ROOTS.has(root)) return [];
  return (artifact.sources || []).flatMap((source) => harvestSourceHits(source, root));
}

function harvestSourceHits(source = {}, root) {
  const url = String(source.canonical_url || source.url || source.final_url || "");
  const routeType = String(source.route_type || "");
  const slug = slugFromUrl(url);
  const title = firstNonEmptyString(source.title, source.page_title, source.source_title, source.document_or_artifact, slug);
  const text = String(source.lossless_text || source.clean_text || source.text || "");
  const pointer = toPointer(source, root);
  const hits = [];
  if (root === "product_service" && (hasPathSegment(url, "products") || routeType.includes("product"))) hits.push(rawHit({ source, root, pointer, raw_name: title || "Product Wrapper", raw_type: RAW_TYPES.PRODUCT_WRAPPER, wrapper_or_surface: normalizeSlug(title || slug || "product"), capability_key: normalizeSlug(title || slug || "product"), surface_key: "product-wrapper", confidence_basis: "product_route_or_title" }));
  if (root === "platform_feature_solution" && (slug || title)) hits.push(rawHit({ source, root, pointer, raw_name: title || humanize(slug), raw_type: RAW_TYPES.FEATURE_PAGE, wrapper_or_surface: "feature-page", capability_key: normalizeSlug(title || slug), surface_key: "feature-page", confidence_basis: routeType || "feature_route" }));
  if (["technical_docs_api_developer", "docs_api_data_flow"].includes(root)) {
    if (hasPathSegment(url, "apis") || hasPathSegment(url, "api")) hits.push(rawHit({ source, root, pointer, raw_name: `${humanize(slug || "api")} API`, raw_type: RAW_TYPES.STANDALONE_API, wrapper_or_surface: "api", capability_key: normalizeSlug(slug || title || "api"), surface_key: "standalone-api", confidence_basis: "api_route" }));
    if (hasPathSegment(url, "models")) hits.push(rawHit({ source, root, pointer, raw_name: "Model Catalogue", raw_type: RAW_TYPES.MODEL_CATALOGUE, wrapper_or_surface: "models", capability_key: "model-catalogue", surface_key: "model-catalogue", confidence_basis: "models_route" }));
    if (hasPathSegment(url, "docs")) hits.push(rawHit({ source, root, pointer, raw_name: "API Documentation Surface", raw_type: RAW_TYPES.DOCS_TECHNICAL_CAPABILITY, wrapper_or_surface: "docs", capability_key: "api-documentation-surface", surface_key: "docs-technical-capability", confidence_basis: "docs_route" }));
  }
  if (root === "integrations_ecosystem") hits.push(rawHit({ source, root, pointer, raw_name: title || "Integration Surface", raw_type: RAW_TYPES.INTEGRATION_SURFACE, wrapper_or_surface: "integrations", capability_key: "integration-surface", surface_key: "integration-surface", confidence_basis: routeType || "integration_route" }));
  if (root === "pricing_commercial_availability") for (const name of pricingNames(text)) hits.push(rawHit({ source, root, pointer, raw_name: name, raw_type: RAW_TYPES.PRICING_CONFIRMED_CAPABILITY, wrapper_or_surface: "pricing", capability_key: normalizeSlug(name), surface_key: "commercial-pricing", confidence_basis: "pricing_text" }));
  return hits;
}

function canonicalizeRawHits(rawHits) { const byKey = new Map(); for (const hit of rawHits) { const key = `${hit.wrapper_or_surface}::${hit.capability_key}::${hit.surface_key}`; if (!byKey.has(key)) byKey.set(key, []); byKey.get(key).push(hit); } const candidates = []; const dedup_index = []; let counter = 1; for (const [canonical_feature_key, hits] of [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))) { const primary = hits[0]; const candidate_id = `FC.${String(counter++).padStart(3, "0")}`; const merged_raw_hit_ids = hits.map((hit) => hit.raw_hit_id); for (const duplicate of hits.slice(1)) dedup_index.push({ canonical_candidate_id: candidate_id, primary_raw_hit_id: primary.raw_hit_id, merged_raw_hit_id: duplicate.raw_hit_id, merge_basis: "same_canonical_feature_key" }); candidates.push({ candidate_id, canonical_feature_key, candidate_name: primary.raw_name, candidate_type: primary.raw_type, candidate_status: "CANONICAL_CANDIDATE", wrapper_or_surface: primary.wrapper_or_surface, capability_key: primary.capability_key, surface_key: primary.surface_key, mandatory_profile_treatment: primary.raw_type === RAW_TYPES.PRODUCT_WRAPPER ? "DIRECT_ACTIVITY_OR_PARENT" : "DIRECT_ACTIVITY_OR_CHILD_CAPABILITY", merged_raw_hit_ids, source_pointers: hits.map((hit) => hit.source_pointer) }); } return { candidates, dedup_index, parent_child_overlap_index: [] }; }
function rawHit({ source, root, pointer, raw_name, raw_type, wrapper_or_surface, capability_key, surface_key, confidence_basis }) { return { source_root: root, source_id: source.source_id || source.manifest_id || "", source_url: source.canonical_url || source.url || source.final_url || "", raw_name, raw_type, wrapper_or_surface, capability_key, surface_key, confidence_basis, source_pointer: pointer }; }
function stripRawHit(hit) { return { raw_hit_id: hit.raw_hit_id, source_root: hit.source_root, source_id: hit.source_id, source_url: hit.source_url, raw_name: hit.raw_name, raw_type: hit.raw_type, wrapper_or_surface: hit.wrapper_or_surface, capability_key: hit.capability_key, surface_key: hit.surface_key, confidence_basis: hit.confidence_basis, source_pointer: hit.source_pointer }; }
function toPointer(source, root) { return { lossless_artifact_name: `lossless_root__${root}`, source_root: root, source_id: source.source_id || "", source_url: source.canonical_url || source.url || source.final_url || "", route_type: source.route_type || "", locator_type: source.route_type ? "route_type" : "source_url", locator_value: source.route_type || slugFromUrl(source.canonical_url || source.url || source.final_url || "") || source.source_id || "" }; }
function coverageResult(status, failures, uncovered, coverageRows) { return { coverage_result: status, failures, uncovered_candidates: uncovered.map(({ candidate_id, candidate_name, candidate_type, canonical_feature_key }) => ({ candidate_id, candidate_name, candidate_type, canonical_feature_key })), coverage_rows: coverageRows, repair_required: status !== "PASS" }; }
function unwrapArtifact(value) { return value?.artifact && typeof value.artifact === "object" ? value.artifact : value; }
function unwrapInventory(input) { return input?.feature_candidate_inventory || input; }
function findRunId(values) { for (const value of Array.isArray(values) ? values : [values]) if (value?.run_id || value?.artifact?.run_id) return value.run_id || value.artifact.run_id; return null; }
function slugFromUrl(value) { try { return new URL(String(value || "")).pathname.split("/").filter(Boolean).at(-1) || ""; } catch { return String(value || "").split(/[/?#]/)[0].split("/").filter(Boolean).at(-1) || ""; } }
function hasPathSegment(value, segment) { try { return new URL(String(value || "")).pathname.split("/").filter(Boolean).includes(segment); } catch { return String(value || "").split(/[/?#]/)[0].split("/").filter(Boolean).includes(segment); } }
function normalizeSlug(value) { return String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-"); }
function humanize(value) { return normalizeSlug(value).split("-").filter(Boolean).map((word) => ["api", "ai", "llm", "tts", "stt"].includes(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function firstNonEmptyString(...values) { for (const value of values) if (typeof value === "string" && value.trim()) return value.trim().slice(0, 200); return ""; }
function pricingNames(text) { const names = []; const raw = String(text || ""); for (const pattern of [/text\s*to\s*speech/i, /speech\s*to\s*text/i, /translation/i, /transliteration/i, /language\s+identification/i, /vision/i, /chat/i]) if (pattern.test(raw)) names.push(humanize(pattern.source.replace(/\\s\*/g, " ").replace(/\\s\+/g, " ").replace(/\W+/g, " "))); return [...new Set(names.filter(Boolean))]; }
function containsEvidenceCopy(value) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some(containsEvidenceCopy); return Object.keys(value).some((key) => ["excerpt", "lossless_text", "clean_text", "text", "mechanics_proof", "evidence_summary", "activity_candidate_summary", "archetype_proof", "surface_proof_and_routing_limits"].includes(key) || containsEvidenceCopy(value[key])); }
