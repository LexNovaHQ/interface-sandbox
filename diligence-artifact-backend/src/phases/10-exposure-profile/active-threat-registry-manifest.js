import { createHash } from "node:crypto";
import { EXPECTED_ACTIVE_REGISTRY_ROWS, parseAiThreatRegistryYaml, parseReferencePacket, validateRegistryRows } from "./m11-deterministic-system-m11v2.js";

const ARTIFACT_NAME = "active_threat_registry_manifest";
const SCHEMA_VERSION = "active_threat_registry_manifest.v1";
const STATUS_POLICY = "INCLUDE_ALL_DECLARED_ROWS";
const EXPECTED_STATUS_COUNTS = Object.freeze({ Active: 73, Upcoming: 14, Pending: 8, Watch: 2, "Pending / Watch": 1 });

export function buildActiveThreatRegistryManifest({ runId = "", referencePacket = {} } = {}) {
  const refs = parseReferencePacket(referencePacket);
  const rows = parseAiThreatRegistryYaml(refs.aiThreatRegistryText);
  const validation = validateRegistryRows(rows, { expectedCount: EXPECTED_ACTIVE_REGISTRY_ROWS });
  if (!validation.ok) throw new Error(`ACTIVE_THREAT_REGISTRY_MANIFEST_REGISTRY_INVALID:${validation.failures.join("|")}`);

  const statusCounts = countBy(rows, (row) => String(row.Status || "").trim() || "MISSING");
  if (!sameCountMap(statusCounts, EXPECTED_STATUS_COUNTS)) throw new Error(`ACTIVE_THREAT_REGISTRY_MANIFEST_STATUS_PARITY_FAILED:${stableJson(statusCounts)}`);

  const threatIds = rows.map((row) => String(row.Threat_ID || "").trim()).filter(Boolean).sort();
  const threatIdInventoryHash = sha256(threatIds.join("\n"));
  const registrySetFingerprint = sha256(stableJson({
    schema_version: SCHEMA_VERSION,
    status_policy: STATUS_POLICY,
    primary_package: "ai-governance",
    ai_mount: "AI_PRIMARY",
    package_key_file: "AI_Registry_Key.yml",
    package_key_version: "v4.0",
    registry_file: "AI_THREAT_REGISTRY.yaml",
    declared_row_count: EXPECTED_ACTIVE_REGISTRY_ROWS,
    parsed_row_count: rows.length,
    status_counts: statusCounts,
    threat_id_inventory_hash: threatIdInventoryHash
  }));

  return {
    [ARTIFACT_NAME]: {
      schema_version: SCHEMA_VERSION,
      run_id: runId,
      generated_by: "phase10_active_threat_registry_manifest_builder",
      selection_mode: "CURRENT_SINGLE_REGISTRY_PRE_AUTO_SELECTOR",
      auto_selector_status: "PENDING_CO_2",
      binding_authority: "references/registry/THREAT_REGISTRY_BINDINGS_v1.yaml",
      status_policy: {
        mode: STATUS_POLICY,
        row_filter: "NONE",
        status_field_role: "METADATA_ONLY"
      },
      primary_package: "ai-governance",
      ai_mount: "AI_PRIMARY",
      mounted_packages: ["ai-governance"],
      registries: [{
        package_id: "ai-governance",
        source_domain: "ai-governance",
        stream_type: "PRIMARY",
        package_key_file: "AI_Registry_Key.yml",
        package_key_version: "v4.0",
        registry_file: "AI_THREAT_REGISTRY.yaml",
        declared_row_count: EXPECTED_ACTIVE_REGISTRY_ROWS,
        parsed_row_count: rows.length,
        active_row_count: Number(statusCounts.Active || 0),
        upcoming_row_count: Number(statusCounts.Upcoming || 0),
        pending_row_count: Number(statusCounts.Pending || 0),
        watch_row_count: Number(statusCounts.Watch || 0),
        pending_watch_row_count: Number(statusCounts["Pending / Watch"] || 0),
        routable_row_count: rows.length,
        uni_row_count: rows.filter((row) => String(row.Archetype || "").trim().toUpperCase() === "UNI").length,
        status_counts: statusCounts,
        threat_id_inventory_hash: threatIdInventoryHash
      }],
      expected_row_count: rows.length,
      expected_uni_count: rows.filter((row) => String(row.Archetype || "").trim().toUpperCase() === "UNI").length,
      registry_set_fingerprint: registrySetFingerprint,
      validation: {
        status: "PASS",
        registry_validation_status: validation.status,
        parsed_row_count: rows.length,
        unique_threat_ids: validation.unique_threat_ids,
        status_policy_verified: true,
        failures: []
      }
    }
  };
}

export function isCurrentActiveThreatRegistryManifest(artifact = {}) {
  return artifact?.schema_version === SCHEMA_VERSION
    && artifact?.selection_mode === "CURRENT_SINGLE_REGISTRY_PRE_AUTO_SELECTOR"
    && artifact?.validation?.status === "PASS"
    && artifact?.expected_row_count === EXPECTED_ACTIVE_REGISTRY_ROWS
    && typeof artifact?.registry_set_fingerprint === "string"
    && artifact.registry_set_fingerprint.length === 64;
}

function countBy(rows, selector) {
  const counts = {};
  for (const row of rows) {
    const key = selector(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function sameCountMap(actual, expected) {
  return stableJson(actual) === stableJson(Object.fromEntries(Object.entries(expected).sort(([a], [b]) => a.localeCompare(b))));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}
