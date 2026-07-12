import { createHash } from "node:crypto";
import yaml from "js-yaml";
import { loadReferencePacket } from "../../runtime/services/reference.service.js";
import { MAX_M11_BATCH_ROWS, parseAiThreatRegistryYaml, validateRegistryRows } from "./m11-deterministic-system-m11v2.js";

const ARTIFACT_NAME = "active_threat_registry_manifest";
const SCHEMA_VERSION = "active_threat_registry_manifest.v2";
const STATUS_POLICY = "INCLUDE_ALL_DECLARED_ROWS";
const BINDING_FILE = "THREAT_REGISTRY_BINDINGS_v1.yaml";
const BINDING_AUTHORITY = `references/registry/${BINDING_FILE}`;
const IDENTITY_VERSION = "PHASE10_EXECUTION_IDENTITY_v2";
const ROUTING_RULES_VERSION = "M11_ROUTE_RULES_PRE_CO4_v1";
const PACKET_CEILING_VERSION = "PRE_CO6_NO_PACKET_CEILING";
const VALID_AI_MOUNTS = new Set(["AI_PRIMARY", "AI_OVERLAY_MOUNTED", "AI_CANDIDATE_ONLY", "AI_NOT_VISIBLE"]);

export const PHASE10_EXECUTION_IDENTITY_VERSION = IDENTITY_VERSION;

export async function resolveActiveThreatRegistryContext({ runId = "", artifacts = {}, baseReferencePacket = {} } = {}) {
  const domainProfile = unwrap(artifacts.domain_derivation_profile, "domain_derivation_profile");
  const activeRunManifest = unwrap(artifacts.active_run_package_manifest, "active_run_package_manifest");
  const selection = resolveMountedPackages({ domainProfile, activeRunManifest });

  const bindingPacket = await loadReferencePacket([BINDING_FILE]);
  const bindingManifest = parseBindingManifest(bindingPacket);
  const selectedBindings = selection.streams.map((stream) => {
    const binding = bindingManifest.packages?.[stream.package_id];
    if (!binding) throw new Error(`PACKAGE_KEY_NOT_FOUND:${stream.package_id}`);
    return { ...stream, binding };
  });

  const selectedReferenceFiles = unique(selectedBindings.flatMap(({ binding }) => [binding.package_key_file, binding.threat_registry_file]));
  const selectedPacket = await loadReferencePacket(selectedReferenceFiles);
  const referencePacket = mergeReferencePackets(baseReferencePacket, bindingPacket, selectedPacket);
  const registries = selectedBindings.map(({ package_id, stream_type, binding }) => loadRegistry({ packageId: package_id, streamType: stream_type, binding, referencePacket }));
  const identity = buildExecutionIdentity(registries);
  const classificationFingerprint = buildClassificationFingerprint(artifacts.target_feature_profile);
  const registrySetFingerprint = buildRegistrySetFingerprint({ selection, registries, identity, bindingManifest });
  const phase10ExecutionFingerprint = sha256(stableJson({
    identity_version: IDENTITY_VERSION,
    registry_set_fingerprint: registrySetFingerprint,
    phase5_classification_fingerprint: classificationFingerprint,
    routing_rules_version: ROUTING_RULES_VERSION,
    max_m11_batch_rows: MAX_M11_BATCH_ROWS,
    packet_ceiling_version: PACKET_CEILING_VERSION
  }));

  const artifact = buildManifestArtifact({
    runId,
    selection,
    registries,
    identity,
    registrySetFingerprint,
    classificationFingerprint,
    phase10ExecutionFingerprint,
    bindingManifest
  });

  return {
    artifact,
    referencePacket,
    selection,
    registries,
    identity,
    registry_set_fingerprint: registrySetFingerprint,
    phase5_classification_fingerprint: classificationFingerprint,
    phase10_execution_fingerprint: phase10ExecutionFingerprint,
    legacy_route_compatibility: {
      ok: selection.streams.length === 1 && selection.streams[0].package_id === "ai-governance" && selection.streams[0].stream_type === "PRIMARY",
      pending_change_orders: ["CO_4_PHASE5_CLASSIFICATION_INVENTORY_ADAPTER", "CO_5_PACKAGE_SCOPED_ROUTE_PLANS"]
    }
  };
}

export function buildActiveThreatRegistryManifest({ context } = {}) {
  if (!context?.artifact) throw new Error("ACTIVE_THREAT_REGISTRY_CONTEXT_REQUIRED");
  return { [ARTIFACT_NAME]: context.artifact };
}

export function isCurrentActiveThreatRegistryManifest(artifact = {}, expectedExecutionFingerprint = "") {
  return artifact?.schema_version === SCHEMA_VERSION
    && artifact?.selection_mode === "DETERMINISTIC_PHASE3_AUTO_SELECTOR"
    && artifact?.auto_selector_status === "ACTIVE"
    && artifact?.execution_identity_contract?.version === IDENTITY_VERSION
    && artifact?.validation?.status === "PASS"
    && typeof artifact?.registry_set_fingerprint === "string"
    && artifact.registry_set_fingerprint.length === 64
    && typeof artifact?.phase10_execution_fingerprint === "string"
    && artifact.phase10_execution_fingerprint.length === 64
    && (!expectedExecutionFingerprint || artifact.phase10_execution_fingerprint === expectedExecutionFingerprint);
}

export function stampPhase10ExecutionMetadata(artifact = {}, manifest = {}) {
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error("PHASE10_CHECKPOINT_ARTIFACT_OBJECT_REQUIRED");
  if (!isCurrentActiveThreatRegistryManifest(manifest)) throw new Error("PHASE10_CURRENT_MANIFEST_REQUIRED_FOR_CHECKPOINT_STAMP");
  return {
    ...artifact,
    phase10_execution_identity_version: IDENTITY_VERSION,
    registry_set_fingerprint: manifest.registry_set_fingerprint,
    phase5_classification_fingerprint: manifest.phase5_classification_fingerprint,
    phase10_execution_fingerprint: manifest.phase10_execution_fingerprint,
    mounted_packages: [...manifest.mounted_packages]
  };
}

export function artifactMatchesPhase10ExecutionFingerprint(artifact = {}, expectedExecutionFingerprint = "") {
  return Boolean(expectedExecutionFingerprint)
    && artifact?.phase10_execution_identity_version === IDENTITY_VERSION
    && artifact?.phase10_execution_fingerprint === expectedExecutionFingerprint;
}

function resolveMountedPackages({ domainProfile = {}, activeRunManifest = {} } = {}) {
  const primary = domainProfile.primary_domain_derivation || {};
  const ai = domainProfile.ai_mount_derivation || {};
  const primaryPackage = String(primary.selected_package || "").trim();
  const primaryStatus = String(primary.status || "").trim();
  const aiMount = String(ai.ai_package_mount || "").trim();

  if (!primaryPackage) throw new Error("PRIMARY_PACKAGE_NOT_SELECTED");
  if (primaryStatus !== "LOCKED") throw new Error(`DOMAIN_PROFILE_NOT_LOCKED:${primaryStatus || "missing"}`);
  if (!VALID_AI_MOUNTS.has(aiMount)) throw new Error(`DOMAIN_MOUNT_INCONSISTENCY:INVALID_AI_MOUNT:${aiMount || "missing"}`);
  if (primaryPackage === "ai-governance" && aiMount !== "AI_PRIMARY") throw new Error(`DOMAIN_MOUNT_INCONSISTENCY:AI_PRIMARY_REQUIRES_AI_PRIMARY:${aiMount}`);
  if (primaryPackage !== "ai-governance" && aiMount === "AI_PRIMARY") throw new Error(`DOMAIN_MOUNT_INCONSISTENCY:NON_AI_PRIMARY_WITH_AI_PRIMARY:${primaryPackage}`);
  if (primaryPackage === "ai-governance" && aiMount === "AI_OVERLAY_MOUNTED") throw new Error("DOMAIN_MOUNT_INCONSISTENCY:AI_PRIMARY_AND_OVERLAY");

  assertActiveRunManifestParity({ primaryPackage, primaryStatus, aiMount, activeRunManifest });

  const streams = [{ package_id: primaryPackage, stream_type: "PRIMARY" }];
  if (primaryPackage !== "ai-governance" && aiMount === "AI_OVERLAY_MOUNTED") streams.push({ package_id: "ai-governance", stream_type: "OVERLAY" });

  return {
    primary_package: primaryPackage,
    primary_status: primaryStatus,
    ai_mount: aiMount,
    mounted_packages: streams.map((stream) => stream.package_id),
    streams
  };
}

function assertActiveRunManifestParity({ primaryPackage, primaryStatus, aiMount, activeRunManifest }) {
  const manifestPrimary = String(activeRunManifest.primary_domain_package || "").trim();
  const manifestStatus = String(activeRunManifest.primary_domain_status || "").trim();
  const manifestAiMount = String(activeRunManifest.ai_package_mount || "").trim();
  if (manifestPrimary !== primaryPackage) throw new Error(`ACTIVE_PACKAGE_MANIFEST_MISMATCH:PRIMARY:${manifestPrimary || "missing"}:${primaryPackage}`);
  if (manifestStatus !== primaryStatus) throw new Error(`ACTIVE_PACKAGE_MANIFEST_MISMATCH:STATUS:${manifestStatus || "missing"}:${primaryStatus}`);
  if (manifestAiMount !== aiMount) throw new Error(`ACTIVE_PACKAGE_MANIFEST_MISMATCH:AI_MOUNT:${manifestAiMount || "missing"}:${aiMount}`);
}

function parseBindingManifest(packet = {}) {
  const text = fileContent(packet, BINDING_FILE);
  if (!text) throw new Error("REGISTRY_BINDING_NOT_FOUND");
  const parsed = yaml.load(text) || {};
  const manifest = parsed.registry_binding_manifest || {};
  if (manifest.schema_version !== "THREAT_REGISTRY_BINDINGS_v1" || manifest.status !== "LOCKED") throw new Error("REGISTRY_BINDING_AUTHORITY_INVALID");
  if (manifest.authority_model?.binding_manifest?.role !== "SOLE_EXECUTABLE_THREAT_REGISTRY_BINDING_AUTHORITY") throw new Error("REGISTRY_BINDING_AUTHORITY_NOT_SOLE");
  if (manifest.status_policy?.mode !== STATUS_POLICY || manifest.status_policy?.row_filter !== "NONE") throw new Error("UNKNOWN_STATUS_POLICY");
  return manifest;
}

function loadRegistry({ packageId, streamType, binding, referencePacket }) {
  const keyText = fileContent(referencePacket, binding.package_key_file);
  const registryText = fileContent(referencePacket, binding.threat_registry_file);
  if (!keyText) throw new Error(`PACKAGE_KEY_NOT_FOUND:${packageId}:${binding.package_key_file || "missing"}`);
  if (!registryText) throw new Error(`REGISTRY_NOT_LOADED:${packageId}:${binding.threat_registry_file || "missing"}`);

  const key = yaml.load(keyText) || {};
  if (key?.registry_key?.domain_package !== packageId) throw new Error(`REGISTRY_INTEGRITY_ERROR:PACKAGE_KEY_DOMAIN_MISMATCH:${packageId}`);
  if (String(key?.registry_key?.version || "") !== String(binding.package_key_version || "")) throw new Error(`REGISTRY_INTEGRITY_ERROR:PACKAGE_KEY_VERSION_MISMATCH:${packageId}`);

  const rows = parseAiThreatRegistryYaml(registryText);
  const validation = validateRegistryRows(rows, { expectedCount: Number(binding.declared_row_count) });
  if (!validation.ok) throw new Error(`REGISTRY_INTEGRITY_ERROR:${packageId}:${validation.failures.join("|")}`);
  if (rows.length !== Number(binding.routable_row_count)) throw new Error(`KEY_REGISTRY_COUNT_MISMATCH:${packageId}:ROUTABLE:${rows.length}:${binding.routable_row_count}`);

  const statusCounts = countBy(rows, (row) => String(row.Status || "").trim() || "MISSING");
  if (stableJson(statusCounts) !== stableJson(sortObject(binding.declared_status_counts || {}))) throw new Error(`REGISTRY_INTEGRITY_ERROR:${packageId}:STATUS_COUNTS:${stableJson(statusCounts)}`);

  const threatIds = rows.map((row) => String(row.Threat_ID || "").trim()).sort();
  const registryRowKeys = threatIds.map((threatId) => registryRowKey(packageId, threatId));
  return {
    package_id: packageId,
    source_domain: packageId,
    stream_type: streamType,
    package_key_file: binding.package_key_file,
    package_key_version: String(binding.package_key_version || ""),
    registry_file: binding.threat_registry_file,
    registry_format: binding.registry_format || "yaml",
    declared_row_count: Number(binding.declared_row_count),
    parsed_row_count: rows.length,
    routable_row_count: rows.length,
    uni_row_count: rows.filter((row) => String(row.Archetype || "").trim().toUpperCase() === "UNI").length,
    status_counts: statusCounts,
    threat_ids: threatIds,
    registry_row_keys: registryRowKeys,
    threat_id_inventory_hash: sha256(threatIds.join("\n")),
    registry_row_key_inventory_hash: sha256(registryRowKeys.join("\n")),
    validation_status: validation.status,
    metadata_limitations: validation.metadata_limitations || [],
    rows,
    execution_rows: rows.map((registry_row) => ({
      registry_row_key: registryRowKey(packageId, registry_row.Threat_ID),
      package_id: packageId,
      source_domain: packageId,
      stream_type: streamType,
      Threat_ID: registry_row.Threat_ID,
      registry_row
    }))
  };
}

function buildExecutionIdentity(registries) {
  const rawIdPackages = new Map();
  const keySet = new Set();
  for (const registry of registries) {
    for (const threatId of registry.threat_ids) {
      if (!rawIdPackages.has(threatId)) rawIdPackages.set(threatId, new Set());
      rawIdPackages.get(threatId).add(registry.package_id);
      const key = registryRowKey(registry.package_id, threatId);
      if (keySet.has(key)) throw new Error(`REGISTRY_INTEGRITY_ERROR:DUPLICATE_REGISTRY_ROW_KEY:${key}`);
      keySet.add(key);
    }
  }
  const canonicalThreatIdCollisions = [...rawIdPackages.entries()]
    .filter(([, packages]) => packages.size > 1)
    .map(([Threat_ID, packages]) => ({
      Threat_ID,
      package_ids: [...packages].sort(),
      registry_row_keys: [...packages].sort().map((packageId) => registryRowKey(packageId, Threat_ID))
    }))
    .sort((a, b) => a.Threat_ID.localeCompare(b.Threat_ID));
  return {
    version: IDENTITY_VERSION,
    global_identity_field: "registry_row_key",
    format: "<package_id>::<Threat_ID>",
    canonical_threat_id_preserved: true,
    silent_namespacing_forbidden: true,
    registry_row_key_count: keySet.size,
    canonical_threat_id_collision_count: canonicalThreatIdCollisions.length,
    canonical_threat_id_collisions: canonicalThreatIdCollisions,
    registry_row_key_inventory_hash: sha256([...keySet].sort().join("\n"))
  };
}

function buildRegistrySetFingerprint({ selection, registries, identity, bindingManifest }) {
  return sha256(stableJson({
    identity_version: IDENTITY_VERSION,
    binding_schema_version: bindingManifest.schema_version,
    status_policy: STATUS_POLICY,
    primary_package: selection.primary_package,
    ai_mount: selection.ai_mount,
    mounted_packages: selection.mounted_packages,
    registries: registries.map((registry) => ({
      package_id: registry.package_id,
      stream_type: registry.stream_type,
      package_key_file: registry.package_key_file,
      package_key_version: registry.package_key_version,
      registry_file: registry.registry_file,
      declared_row_count: registry.declared_row_count,
      parsed_row_count: registry.parsed_row_count,
      status_counts: registry.status_counts,
      threat_id_inventory_hash: registry.threat_id_inventory_hash,
      registry_row_key_inventory_hash: registry.registry_row_key_inventory_hash
    })),
    union_registry_row_key_inventory_hash: identity.registry_row_key_inventory_hash
  }));
}

function buildClassificationFingerprint(targetFeatureProfile) {
  const profile = unwrap(targetFeatureProfile, "target_feature_profile");
  if (!profile || typeof profile !== "object" || !Array.isArray(profile.activities)) throw new Error("PHASE5_CLASSIFICATION_PROFILE_MISSING");
  const normalized = {
    mounted_taxonomy_ref: profile.mounted_taxonomy_ref || null,
    activities: profile.activities.map((activity) => ({
      activity_reference: activity?.activity_reference || "",
      primary_classification: activity?.primary_classification || null,
      overlay_classifications: Array.isArray(activity?.overlay_classifications) ? activity.overlay_classifications : []
    })).sort((a, b) => a.activity_reference.localeCompare(b.activity_reference))
  };
  return sha256(stableJson(normalized));
}

function buildManifestArtifact({ runId, selection, registries, identity, registrySetFingerprint, classificationFingerprint, phase10ExecutionFingerprint, bindingManifest }) {
  const expectedRowCount = registries.reduce((total, registry) => total + registry.routable_row_count, 0);
  const expectedUniCount = registries.reduce((total, registry) => total + registry.uni_row_count, 0);
  return {
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    generated_by: "phase10_deterministic_auto_selector_registry_loader",
    selection_mode: "DETERMINISTIC_PHASE3_AUTO_SELECTOR",
    auto_selector_status: "ACTIVE",
    binding_authority: BINDING_AUTHORITY,
    binding_authority_schema_version: bindingManifest.schema_version,
    status_policy: {
      mode: STATUS_POLICY,
      row_filter: "NONE",
      status_field_role: "METADATA_ONLY"
    },
    execution_identity_contract: identity,
    primary_package: selection.primary_package,
    primary_domain_status: selection.primary_status,
    ai_mount: selection.ai_mount,
    mounted_packages: selection.mounted_packages,
    streams: selection.streams,
    registries: registries.map((registry) => ({
      package_id: registry.package_id,
      source_domain: registry.source_domain,
      stream_type: registry.stream_type,
      package_key_file: registry.package_key_file,
      package_key_version: registry.package_key_version,
      registry_file: registry.registry_file,
      registry_format: registry.registry_format,
      declared_row_count: registry.declared_row_count,
      parsed_row_count: registry.parsed_row_count,
      routable_row_count: registry.routable_row_count,
      uni_row_count: registry.uni_row_count,
      active_row_count: Number(registry.status_counts.Active || 0),
      upcoming_row_count: Number(registry.status_counts.Upcoming || 0),
      pending_row_count: Number(registry.status_counts.Pending || 0),
      watch_row_count: Number(registry.status_counts.Watch || 0),
      pending_watch_row_count: Number(registry.status_counts["Pending / Watch"] || 0),
      status_counts: registry.status_counts,
      threat_id_inventory_hash: registry.threat_id_inventory_hash,
      registry_row_key_inventory_hash: registry.registry_row_key_inventory_hash,
      validation_status: registry.validation_status,
      metadata_limitation_count: registry.metadata_limitations.length
    })),
    expected_row_count: expectedRowCount,
    expected_uni_count: expectedUniCount,
    expected_registry_row_key_count: identity.registry_row_key_count,
    registry_set_fingerprint: registrySetFingerprint,
    phase5_classification_fingerprint: classificationFingerprint,
    phase10_execution_fingerprint: phase10ExecutionFingerprint,
    execution_fingerprint_inputs: {
      routing_rules_version: ROUTING_RULES_VERSION,
      max_m11_batch_rows: MAX_M11_BATCH_ROWS,
      packet_ceiling_version: PACKET_CEILING_VERSION
    },
    validation: {
      status: "PASS",
      selector_authority: "domain_derivation_profile",
      active_run_package_manifest_role: "CONSISTENCY_CHECK_ONLY",
      mounted_registry_count: registries.length,
      parsed_row_count: expectedRowCount,
      unique_registry_row_keys: identity.registry_row_key_count,
      canonical_threat_id_collision_count: identity.canonical_threat_id_collision_count,
      compound_identity_resolution_status: "PASS",
      status_policy_verified: true,
      failures: []
    }
  };
}

function registryRowKey(packageId, threatId) {
  const pkg = String(packageId || "").trim();
  const id = String(threatId || "").trim();
  if (!pkg || !id) throw new Error("REGISTRY_ROW_KEY_COMPONENT_MISSING");
  return `${pkg}::${id}`;
}

function fileContent(packet, fileName) {
  const files = packet?.files && typeof packet.files === "object" ? packet.files : {};
  const direct = files[fileName]?.content;
  if (direct) return direct;
  const match = Object.entries(files).find(([key]) => key === fileName || key.endsWith(`/${fileName}`));
  return match?.[1]?.content || "";
}

function mergeReferencePackets(...packets) {
  return {
    reference_root: "references",
    files: Object.assign({}, ...packets.map((packet) => packet?.files || {}))
  };
}

function unwrap(value, key) {
  if (!value || typeof value !== "object") return {};
  return value[key] && typeof value[key] === "object" ? value[key] : value;
}

function countBy(rows, selector) {
  const counts = {};
  for (const row of rows) {
    const key = selector(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return sortObject(counts);
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value || {}).sort(([a], [b]) => a.localeCompare(b)));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}
