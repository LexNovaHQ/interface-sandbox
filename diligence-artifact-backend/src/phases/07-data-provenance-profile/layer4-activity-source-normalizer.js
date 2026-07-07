const ACTIVITY_KEYS = Object.freeze(["activity_reference", "activity_id", "feature_id", "feature_name", "activity_feature_name", "product_service_wrapper", "data_content_object_touched", "input_object", "output_object", "archetype_codes", "surface_context_tokens"]);
const BLOCKED_KEYS = Object.freeze(["excerpt", "excerpts", "raw_text", "clean_text", "content", "body", "html", "markdown", "text"]);

export function normalizePhase7ActivitySources({ artifacts = {} } = {}) {
  const candidates = [];
  collectActivityCandidates({ node: artifacts.feature_candidate_inventory, sourceArtifact: "feature_candidate_inventory", path: "feature_candidate_inventory", candidates });
  collectActivityCandidates({ node: artifacts.target_feature_profile, sourceArtifact: "target_feature_profile", path: "target_feature_profile", candidates });
  collectActivityCandidates({ node: artifacts.target_feature_profile_forensics, sourceArtifact: "target_feature_profile_forensics", path: "target_feature_profile_forensics", candidates });
  return Object.freeze(dedupe(candidates).map((row, index) => Object.freeze({
    activity_join_id: `DAP-ACT-${String(index + 1).padStart(4, "0")}`,
    source_artifact: row.source_artifact,
    artifact_path: row.artifact_path,
    activity_reference: first(row.activity_reference, row.activity_id, row.feature_id, row.feature_name, row.activity_feature_name, `activity_${index + 1}`),
    product_service_wrapper: first(row.product_service_wrapper, row.product, row.service, row.platform, "not_visible_from_activity_source"),
    activity_feature_name: first(row.activity_feature_name, row.feature_name, row.name, row.title, row.activity_reference, `activity_${index + 1}`),
    data_content_object_touched: normalizeArray(first(row.data_content_object_touched, row.data_object, row.input_object, row.object_category, row.data_category)),
    input_signal: first(row.input_object, row.input, row.submitted_material, row.prompt, row.upload, "not_visible_from_activity_source"),
    output_signal: first(row.output_object, row.output, row.result, row.generated_output, "not_visible_from_activity_source"),
    archetype_codes: normalizeArray(row.archetype_codes),
    surface_context_tokens: normalizeArray(row.surface_context_tokens),
    source_confidence: row.source_confidence || "ACTIVITY_SOURCE_NORMALIZED_DETERMINISTIC"
  })));
}

function collectActivityCandidates({ node, sourceArtifact, path, candidates }) {
  if (!node) return;
  if (Array.isArray(node)) return node.forEach((item, index) => collectActivityCandidates({ node: item, sourceArtifact, path: `${path}[${index}]`, candidates }));
  if (typeof node !== "object") return;
  if (looksLikeActivity(node)) candidates.push(safeActivity({ node, sourceArtifact, path }));
  for (const [key, value] of Object.entries(node)) {
    if (BLOCKED_KEYS.includes(key)) continue;
    if (value && typeof value === "object") collectActivityCandidates({ node: value, sourceArtifact, path: `${path}.${key}`, candidates });
  }
}

function looksLikeActivity(node) {
  return ACTIVITY_KEYS.some((key) => Object.prototype.hasOwnProperty.call(node, key));
}

function safeActivity({ node, sourceArtifact, path }) {
  const out = { source_artifact: sourceArtifact, artifact_path: path };
  for (const [key, value] of Object.entries(node)) if (!BLOCKED_KEYS.includes(key) && typeof value !== "object") out[key] = value;
  for (const key of ["archetype_codes", "surface_context_tokens", "data_content_object_touched"]) if (Array.isArray(node[key])) out[key] = node[key].filter((item) => typeof item !== "object");
  return out;
}

function dedupe(rows) {
  const seen = new Set();
  return rows.filter((row) => { const key = `${row.source_artifact}|${row.artifact_path}|${row.activity_reference || row.activity_id || row.feature_id || row.feature_name || row.activity_feature_name}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

function first(...values) {
  const found = values.find((value) => value != null && String(value).trim());
  return found == null ? "" : String(found).trim();
}

function normalizeArray(value) {
  if (Array.isArray(value)) return Object.freeze(value.map((item) => String(item).trim()).filter(Boolean));
  if (value == null || !String(value).trim()) return Object.freeze([]);
  return Object.freeze([String(value).trim()]);
}
