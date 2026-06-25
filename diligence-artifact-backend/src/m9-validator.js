const REQUIRED_KEYS = Object.freeze([
  "document_coverage_index",
  "document_structure_index",
  "incorporated_linked_document_map",
  "control_language_locator",
  "missing_limited_legal_governance_items",
  "downstream_rules",
  "lock_status"
]);

const LOCK_STATUSES = Object.freeze([
  "LOCKED",
  "LOCKED_WITH_LIMITATIONS",
  "REPAIR_REQUIRED",
  "CONTROLLED_FAILURE"
]);

const FORBIDDEN_KEYS = Object.freeze([
  "source_discovery_handoff",
  "target_profile",
  "target_feature_profile",
  "data_provenance_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload",
  "legal_advice",
  "compliance_conclusion",
  "sufficiency_conclusion",
  "enforceability_assessment",
  "risk_conclusion",
  "registry_evaluation"
]);

const SOURCE_FIELD_NAMES = Object.freeze([
  "source",
  "source_or_reference",
  "referring_document",
  "referenced_document_or_policy",
  "located_in_document"
]);

export function validateM9LegalCartographyIndex(output) {
  const failures = [];
  const artifact = output?.legal_cartography_index;

  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    return fail(["missing legal_cartography_index object"]);
  }

  const keys = Object.keys(artifact);
  const missing = REQUIRED_KEYS.filter((key) => !(key in artifact));
  const extra = keys.filter((key) => !REQUIRED_KEYS.includes(key));

  if (missing.length) failures.push(`missing keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`extra keys: ${extra.join(",")}`);

  for (const key of REQUIRED_KEYS.slice(0, 5)) {
    if (!Array.isArray(artifact[key])) failures.push(`${key} must be an array`);
  }

  if (!artifact.downstream_rules || typeof artifact.downstream_rules !== "object" || Array.isArray(artifact.downstream_rules)) {
    failures.push("downstream_rules must be an object");
  }

  if (!LOCK_STATUSES.includes(artifact.lock_status)) {
    failures.push(`invalid lock_status: ${artifact.lock_status || "missing"}`);
  }

  for (const forbidden of FORBIDDEN_KEYS) {
    if (containsKey(output, forbidden)) failures.push(`forbidden key present: ${forbidden}`);
  }

  for (const row of collectRows(artifact)) {
    for (const field of SOURCE_FIELD_NAMES) {
      if (typeof row[field] === "string" && hasBadSourceSyntax(row[field])) {
        failures.push(`bad source syntax in ${field}: ${row[field].slice(0, 80)}`);
      }
    }
  }

  return failures.length ? fail(failures) : { status: "PASS", failed_gates: [], repair_instructions: [] };
}

function fail(failures) {
  return {
    status: "REPAIR_REQUIRED",
    failed_gates: failures,
    repair_instructions: ["Return exactly one legal_cartography_index object using the M9 schema and authorized legal bucket sources only."]
  };
}

function collectRows(artifact) {
  return REQUIRED_KEYS.slice(0, 5).flatMap((key) => Array.isArray(artifact[key]) ? artifact[key] : []);
}

function hasBadSourceSyntax(value) {
  return /\[[^\]]+\]\([^)]*\)/.test(value) || value.includes("%22") || value.includes("") || value.startsWith("mailto:");
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  return Object.values(value).some((item) => containsKey(item, key));
}
