import { createHash } from "node:crypto";

export const PHASE11_MUTATION_GUARD_VERSION = "phase11_mutation_guard.v1";
const METADATA_SEGMENTS = new Set(["status", "lock_status", "updated_at", "generated_at", "generated_by", "version", "schema_version", "validation", "validator_status", "model_metadata", "runtime_metadata", "phase10_execution_fingerprint", "phase10_execution_identity_version"]);
const ID_FIELDS = ["registry_row_key", "activity_id", "field_id", "obligation_id", "challenge_candidate_id", "batch_id", "Threat_ID", "threat_id"];

export function validatePhase11TargetedMutation({ dispatch, beforeArtifacts = {}, afterArtifacts = {} } = {}) {
  if (!dispatch?.targeted_reinvestigation_only || dispatch?.full_phase_rerun_forbidden !== true) throw new Error("PHASE11_MUTATION_GUARD_DISPATCH_INVALID");
  const allowed = (dispatch.field_paths || []).map(normalizePath).filter(Boolean);
  const artifacts = [...new Set(dispatch.artifact_names || [])];
  const unauthorized = [];
  const authorized = [];
  const artifactResults = [];
  for (const artifactName of artifacts) {
    const changes = diffJson(beforeArtifacts[artifactName], afterArtifacts[artifactName], artifactName);
    for (const change of changes) {
      const normalized = normalizePath(change.path);
      const permitted = isMetadataPath(normalized) || allowed.some((path) => pathsOverlap(normalized, path));
      (permitted ? authorized : unauthorized).push(change);
    }
    artifactResults.push({ artifact_name: artifactName, changed_path_count: changes.length });
  }
  return Object.freeze({ schema_version: PHASE11_MUTATION_GUARD_VERSION, status: unauthorized.length ? "REJECTED_UNAUTHORIZED_MUTATION" : "PASS", dispatch_id: dispatch.dispatch_id, challenge_candidate_id: dispatch.challenge_candidate_id, allowed_field_paths: allowed, authorized_changes: authorized, unauthorized_changes: unauthorized, artifact_results: artifactResults, rollback_required: unauthorized.length > 0, mutation_fingerprint: sha({ dispatch_id: dispatch.dispatch_id, allowed, authorized, unauthorized }) });
}

function diffJson(before, after, root) { const out = []; walk(before, after, root, out); return out; }
function walk(left, right, path, out) {
  if (Object.is(left, right)) return;
  const leftObj = isObject(left);
  const rightObj = isObject(right);
  if (!leftObj || !rightObj || Array.isArray(left) !== Array.isArray(right)) { out.push({ path, before_hash: sha(left), after_hash: sha(right) }); return; }
  if (Array.isArray(left) && Array.isArray(right)) {
    const leftMap = stableArrayMap(left);
    const rightMap = stableArrayMap(right);
    if (leftMap && rightMap) {
      const ids = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort();
      for (const id of ids) walk(leftMap.get(id), rightMap.get(id), `${path}[${id}]`, out);
    } else {
      const max = Math.max(left.length, right.length);
      for (let i = 0; i < max; i += 1) walk(left[i], right[i], `${path}[${i}]`, out);
    }
    return;
  }
  const keys = [...new Set([...Object.keys(left || {}), ...Object.keys(right || {})])].sort();
  for (const key of keys) walk(left?.[key], right?.[key], `${path}.${key}`, out);
}
function stableArrayMap(rows) {
  const map = new Map();
  for (const row of rows) {
    const id = stableIdentity(row);
    if (!id || map.has(id)) return null;
    map.set(id, row);
  }
  return map;
}
function stableIdentity(value) { if (!isObject(value) || Array.isArray(value)) return ""; for (const key of ID_FIELDS) if (value[key] !== undefined && value[key] !== null && String(value[key]).trim()) return String(value[key]).trim(); return ""; }
function normalizePath(value) { return String(value || "").replace(/\[([^\]]+)\]/g, ".$1").replace(/\.+/g, ".").replace(/^\.|\.$/g, ""); }
function pathsOverlap(a, b) { return a === b || a.startsWith(`${b}.`) || b.startsWith(`${a}.`); }
function isMetadataPath(path) { return path.split(".").some((segment) => METADATA_SEGMENTS.has(segment)); }
function isObject(value) { return value !== null && typeof value === "object"; }
function sha(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
