import { createHash } from "node:crypto";
import { parseHunterTrigger } from "./m11-deterministic-system.js";

export const MAX_M11_BATCH_ROWS = 15;
export const MAX_M11_BATCH_PACKET_CHARS = 180000;
export const M11_PACKAGE_ROUTING_RULES_VERSION = "M11_PACKAGE_SCOPED_BEHAVIOR_CLASS_ROUTE_RULES_v2";
export const M11_PACKET_CEILING_VERSION = "M11_PACKET_CHARS_180000_v1";
export const PHASE5_CLASSIFICATION_INVENTORY_SCHEMA = "phase5_classification_inventory.v2.behavior_class";
export const PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA = "exposure_registry_route_plan.v4.behavior_class_package_scoped";

const ROUTED = "EVALUATION_ROUTED";
const NOT_APPLICABLE = "NOT_TRIGGERED_NOT_APPLICABLE";

export function finalizePhase10RoutingContext({ registryContext, targetFeatureProfile } = {}) {
  if (!registryContext?.artifact) throw new Error("PHASE10_REGISTRY_CONTEXT_REQUIRED");
  const inventory = buildPhase5ClassificationInventory({ targetFeatureProfile, manifest: registryContext.artifact });
  if (inventory.validation.status === "CONTROLLED_FAILURE") throw new Error(`PHASE5_CLASSIFICATION_INVENTORY_INVALID:${inventory.validation.failures.join("|")}`);
  const priorFingerprint = String(registryContext.phase10_execution_fingerprint || registryContext.artifact.phase10_execution_fingerprint || "");
  const phase10ExecutionFingerprint = sha256(stableJson({
    prior_phase10_execution_fingerprint: priorFingerprint,
    routing_rules_version: M11_PACKAGE_ROUTING_RULES_VERSION,
    classification_inventory_digest: inventory.inventory_digest,
    max_m11_batch_rows: MAX_M11_BATCH_ROWS,
    max_m11_batch_packet_chars: MAX_M11_BATCH_PACKET_CHARS,
    packet_ceiling_version: M11_PACKET_CEILING_VERSION
  }));
  const artifact = {
    ...registryContext.artifact,
    phase10_execution_fingerprint: phase10ExecutionFingerprint,
    phase5_classification_inventory_digest: inventory.inventory_digest,
    execution_fingerprint_inputs: {
      ...(registryContext.artifact.execution_fingerprint_inputs || {}),
      routing_rules_version: M11_PACKAGE_ROUTING_RULES_VERSION,
      classification_inventory_schema: PHASE5_CLASSIFICATION_INVENTORY_SCHEMA,
      classification_inventory_digest: inventory.inventory_digest,
      max_m11_batch_rows: MAX_M11_BATCH_ROWS,
      max_m11_batch_packet_chars: MAX_M11_BATCH_PACKET_CHARS,
      packet_ceiling_version: M11_PACKET_CEILING_VERSION
    },
    routing_adapter_status: "BEHAVIOR_CLASS_CANONICAL_ACTIVE",
    validation: {
      ...(registryContext.artifact.validation || {}),
      phase5_classification_inventory_status: inventory.validation.status,
      package_scoped_route_planner_status: "ACTIVE",
      max_15_batch_planner_status: "ACTIVE"
    }
  };
  const next = {
    ...registryContext,
    artifact,
    classification_inventory: inventory,
    phase10_execution_fingerprint: phase10ExecutionFingerprint,
    route_plan_compatibility: { ok: true, behavior_class_canonical: true },
    semantic_layer_compatibility: { ok: true, package_scoped_behavior_class_streams: true }
  };
  delete next.legacy_route_compatibility;
  return next;
}

export function buildPhase5ClassificationInventory({ targetFeatureProfile, manifest } = {}) {
  const profile = unwrap(targetFeatureProfile, "target_feature_profile");
  const failures = [];
  const limitations = [];
  const activities = Array.isArray(profile?.activities) ? profile.activities : [];
  const mountedTaxonomy = isPlainObject(profile?.mounted_taxonomy_ref) ? profile.mounted_taxonomy_ref : {};
  const streams = Array.isArray(manifest?.streams) ? manifest.streams : [];
  if (!isPlainObject(profile) || !Array.isArray(profile.activities)) failures.push("target_feature_profile.activities[] missing");
  if (!isPlainObject(profile?.mounted_taxonomy_ref)) failures.push("target_feature_profile.mounted_taxonomy_ref missing");
  if (String(mountedTaxonomy.primary_package_id || "") !== String(manifest?.primary_package || "")) failures.push(`Phase 5 primary package mismatch:${mountedTaxonomy.primary_package_id || "missing"}:${manifest?.primary_package || "missing"}`);

  const streamInventories = streams.map((stream, index) => createStreamInventory(stream, index));
  const mountedPackageSet = new Set(streamInventories.map((row) => row.package_id));

  for (const [index, activity] of activities.entries()) {
    const path = `target_feature_profile.activities[${index}]`;
    if (!isPlainObject(activity)) { failures.push(`${path} must be object`); continue; }
    for (const retired of ["archetype_codes", "archetype_derivation_basis"]) if (containsKey(activity, retired)) failures.push(`${path} contains retired Phase 5 key:${retired}`);
    const activityReference = String(activity.activity_reference || "").trim();
    if (!activityReference) failures.push(`${path}.activity_reference missing`);
    const primaryStream = streamInventories.find((row) => row.stream_type === "PRIMARY");
    const primaryBlock = activity.primary_classification;
    if (!primaryStream) failures.push("manifest PRIMARY stream missing");
    else if (!isPlainObject(primaryBlock)) failures.push(`${path}.primary_classification missing`);
    else {
      if (String(primaryBlock.package_id || "") !== primaryStream.package_id) failures.push(`${path}.primary_classification.package_id mismatch:${primaryBlock.package_id || "missing"}:${primaryStream.package_id}`);
      addClassification(primaryStream, { activityReference, classificationSource: "primary_classification", overlayId: null, block: primaryBlock, failures, path: `${path}.primary_classification` });
    }

    const overlays = Array.isArray(activity.overlay_classifications) ? activity.overlay_classifications : [];
    if (!Array.isArray(activity.overlay_classifications)) failures.push(`${path}.overlay_classifications must be array`);
    for (const [overlayIndex, overlayBlock] of overlays.entries()) {
      const overlayPath = `${path}.overlay_classifications[${overlayIndex}]`;
      if (!isPlainObject(overlayBlock)) { failures.push(`${overlayPath} must be object`); continue; }
      const packageId = String(overlayBlock.package_id || "").trim();
      if (!mountedPackageSet.has(packageId)) { failures.push(`${overlayPath}.package_id is not a mounted Phase 10 package:${packageId || "missing"}`); continue; }
      const overlayStream = streamInventories.find((row) => row.stream_type === "OVERLAY" && row.package_id === packageId);
      if (!overlayStream) { failures.push(`${overlayPath} has no matching mounted OVERLAY stream:${packageId || "missing"}`); continue; }
      addClassification(overlayStream, { activityReference, classificationSource: "overlay_classifications", overlayId: String(overlayBlock.overlay_id || "").trim(), block: overlayBlock, failures, path: overlayPath });
    }
  }

  for (const inventory of streamInventories) {
    inventory.activity_references = unique(inventory.classifications.map((row) => row.activity_reference)).sort();
    inventory.behavior_class_codes = unique(inventory.classifications.flatMap((row) => row.behavior_class_codes)).sort();
    inventory.surface_context_tokens = unique(inventory.classifications.flatMap((row) => row.surface_context_tokens)).sort();
    inventory.overlay_ids = unique(inventory.classifications.map((row) => row.overlay_id).filter(Boolean)).sort();
    inventory.classification_count = inventory.classifications.length;
    inventory.inventory_digest = sha256(stableJson(inventory.classifications));
    if (!inventory.classifications.length) limitations.push(`NO_PHASE5_CLASSIFICATION_ROWS_FOR_STREAM:${inventory.stream_id}`);
  }

  const normalized = {
    schema_version: PHASE5_CLASSIFICATION_INVENTORY_SCHEMA,
    source_artifact: "target_feature_profile",
    ownership: "PHASE5_CLASSIFIES_PHASE10_PROJECTS_ONLY",
    reclassification_forbidden: true,
    behavior_class_canonical: true,
    primary_overlay_separate: true,
    mounted_taxonomy_ref: mountedTaxonomy,
    primary_package_id: String(manifest?.primary_package || ""),
    streams: streamInventories,
    stream_order: streamInventories.map((row) => row.stream_id),
    limitations: unique(limitations).sort()
  };
  return {
    ...normalized,
    inventory_digest: sha256(stableJson(normalized)),
    validation: {
      status: failures.length ? "CONTROLLED_FAILURE" : limitations.length ? "PASS_WITH_LIMITATION" : "PASS",
      failures,
      limitations: unique(limitations).sort(),
      activity_count: activities.length,
      stream_count: streamInventories.length,
      package_scoped: true,
      primary_overlay_independence_verified: failures.length === 0,
      retired_archetype_material_paths_forbidden: true
    }
  };
}

export function buildPackageScopedExposureRegistryRoutePlan({ registryContext, targetFeatureProfile, legalCartographyIndex, upstreamArtifacts = {}, runId = "", manifest, maxRows = MAX_M11_BATCH_ROWS, maxPacketChars = MAX_M11_BATCH_PACKET_CHARS } = {}) {
  if (!registryContext?.registries?.length) throw new Error("PHASE10_SELECTED_REGISTRIES_MISSING");
  const activeManifest = manifest || registryContext.artifact;
  const inventory = registryContext.classification_inventory || buildPhase5ClassificationInventory({ targetFeatureProfile, manifest: activeManifest });
  const failures = [...(inventory.validation?.failures || [])];
  const warnings = [...(inventory.validation?.limitations || [])];
  const legalStatus = inspectLegalCartographyIndex(unwrap(legalCartographyIndex || upstreamArtifacts.legal_cartography_index, "legal_cartography_index"));
  failures.push(...legalStatus.failures);
  const inventoryByStream = new Map(inventory.streams.map((row) => [row.stream_id, row]));
  const routeRows = [];
  const streamPlans = [];
  let globalOrder = 0;

  for (const registry of registryContext.registries) {
    const streamId = makeStreamId(registry.stream_type, registry.package_id);
    const streamInventory = inventoryByStream.get(streamId);
    if (!streamInventory) { failures.push(`PHASE5_CLASSIFICATION_STREAM_MISSING:${streamId}`); continue; }
    const streamRows = [];
    for (const [index, executionRow] of registry.execution_rows.entries()) {
      globalOrder += 1;
      const routed = routeExecutionRow({ executionRow, streamInventory, globalOrder, streamOrder: index + 1, registryKeyVersion: registry.package_key_version, threatRegistryVersion: registry.registry_version || registry.registry_file });
      streamRows.push(routed);
      routeRows.push(routed);
    }
    const routedCount = streamRows.filter((row) => row.route === ROUTED).length;
    streamPlans.push({
      stream_id: streamId,
      stream_type: registry.stream_type,
      package_id: registry.package_id,
      source_domain: registry.source_domain,
      registry_file: registry.registry_file,
      classification_inventory_digest: streamInventory.inventory_digest,
      expected_registry_rows: registry.routable_row_count,
      routed_rows: routedCount,
      non_routed_rows: streamRows.length - routedCount,
      uni_rows: streamRows.filter((row) => String(row.Behavior_Class || "").toUpperCase() === "UNI").length,
      active_behavior_class_codes: streamInventory.behavior_class_codes,
      active_surface_context_tokens: streamInventory.surface_context_tokens,
      route_reason_counts: countBy(streamRows, (row) => row.route_reason)
    });
  }

  const batchPlan = buildPackageScopedBatchPlan(routeRows, { inventory, maxRows, maxPacketChars });
  const routeValidation = validatePackageScopedRoutePlan({ routeRows, streamPlans, registryContext, manifest: activeManifest });
  const batchValidation = validatePackageScopedBatchPlan(batchPlan, { routedRows: routeRows.filter((row) => row.route === ROUTED), maxRows, maxPacketChars });
  failures.push(...routeValidation.failures, ...batchValidation.failures);
  const phaseStatus = failures.length ? "CONTROLLED_FAILURE" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS";

  return { exposure_registry_route_plan: {
    schema_version: PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA,
    run_id: runId,
    generated_by: "phase10_package_scoped_behavior_class_route_planner",
    routing_rules_version: M11_PACKAGE_ROUTING_RULES_VERSION,
    batch_planner_version: "M11_MAX_15_PACKAGE_SCOPED_BATCH_PLANNER_v2",
    registry_inventory: {
      expected_active_rows: Number(activeManifest?.expected_row_count || 0),
      loaded_active_rows: routeRows.length,
      expected_registry_row_keys: Number(activeManifest?.expected_registry_row_key_count || routeRows.length),
      loaded_registry_row_keys: unique(routeRows.map((row) => row.registry_row_key)).length,
      mounted_registry_count: registryContext.registries.length,
      mounted_packages: [...(activeManifest?.mounted_packages || [])],
      behavior_class_canonical: true,
      complete_registry_spine_required: true,
      status_policy: activeManifest?.status_policy || null,
      warning_count: warnings.length,
      blocking_failure_count: failures.length
    },
    phase5_classification_inventory: inventory,
    stream_plans: streamPlans,
    stream_order: inventory.stream_order,
    active_routing_substrate: {
      package_scoped: true,
      primary_and_overlay_separate: true,
      global_behavior_class_union_forbidden: true,
      inventory_digest: inventory.inventory_digest,
      streams: inventory.streams.map((stream) => ({ stream_id: stream.stream_id, stream_type: stream.stream_type, package_id: stream.package_id, behavior_class_codes: stream.behavior_class_codes, surface_context_tokens: stream.surface_context_tokens, activity_references: stream.activity_references }))
    },
    upstream_access_manifest: buildUpstreamAccessManifest(upstreamArtifacts),
    m9_legal_cartography_consumption: { m9_artifact: "legal_cartography_index", m9_is_builder: true, m11_builds_legal_cartography: false, status: legalStatus.ok ? "PASS" : "CONTROLLED_FAILURE", available_families: legalStatus.available_families, failures: legalStatus.failures },
    route_rows: routeRows,
    batch_plan: batchPlan,
    deterministic_not_applicable_rows: routeRows.filter((row) => row.route === NOT_APPLICABLE),
    route_reconciliation: routeValidation,
    batch_plan_validation: batchValidation,
    phase_a_validation: { status: phaseStatus, failures, warnings, non_blocking_warning_count: warnings.length, blocking_failure_count: failures.length }
  }};
}

export function buildPackageScopedBatchPlan(routeRows, { inventory, maxRows = MAX_M11_BATCH_ROWS, maxPacketChars = MAX_M11_BATCH_PACKET_CHARS } = {}) {
  const routedRows = asArray(routeRows).filter((row) => row.route === ROUTED);
  const streamInventory = new Map(asArray(inventory?.streams).map((stream) => [stream.stream_id, stream]));
  const groups = new Map();
  for (const row of routedRows) {
    const groupKey = `${row.stream_id}::${String(row.Behavior_Class || "UNKNOWN").toUpperCase()}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(row);
  }
  const streamOrder = new Map(asArray(inventory?.stream_order).map((streamId, index) => [streamId, index]));
  const orderedKeys = [...groups.keys()].sort((a, b) => {
    const [streamA, classA] = splitGroupKey(a); const [streamB, classB] = splitGroupKey(b);
    const streamDiff = (streamOrder.get(streamA) ?? 9999) - (streamOrder.get(streamB) ?? 9999);
    if (streamDiff) return streamDiff;
    if (classA === "UNI" && classB !== "UNI") return -1;
    if (classB === "UNI" && classA !== "UNI") return 1;
    return classA.localeCompare(classB);
  });
  const batches = [];
  for (const groupKey of orderedKeys) {
    const rows = groups.get(groupKey).sort((a, b) => a.stream_registry_order - b.stream_registry_order);
    const [streamId, behaviorClass] = splitGroupKey(groupKey);
    const context = streamInventory.get(streamId) || {};
    let current = []; let batchNumber = 0;
    const flush = () => {
      if (!current.length) return;
      batchNumber += 1;
      const first = current[0];
      const nnn = String(batchNumber).padStart(3, "0");
      const estimated = estimateBatchPacketChars(current, context);
      batches.push({
        batch_id: `${first.stream_type}__${safeToken(first.package_id)}__${behaviorClass}__${nnn}`,
        batch_group: behaviorClass,
        batch_number: batchNumber,
        stream_id: first.stream_id,
        stream_type: first.stream_type,
        package_id: first.package_id,
        source_domain: first.source_domain,
        max_rows: maxRows,
        max_packet_chars: maxPacketChars,
        row_count: current.length,
        estimated_packet_chars: estimated,
        packet_size_status: estimated <= maxPacketChars ? "WITHIN_CEILING" : "SINGLE_ROW_EXCEEDS_CEILING",
        expected_registry_row_keys: current.map((row) => row.registry_row_key),
        expected_threat_ids: current.map((row) => row.Threat_ID),
        route_reasons: unique(current.map((row) => row.route_reason)),
        classification_inventory_digest: context.inventory_digest || "",
        active_behavior_class_codes: context.behavior_class_codes || [],
        activity_references: context.activity_references || [],
        registry_order_start: current[0]?.registry_order ?? null,
        registry_order_end: current[current.length - 1]?.registry_order ?? null,
        status: estimated <= maxPacketChars ? "PLANNED" : "CONTROLLED_FAILURE_PACKET_TOO_LARGE"
      });
      current = [];
    };
    for (const row of rows) {
      const candidate = [...current, row];
      if (current.length && (candidate.length > maxRows || estimateBatchPacketChars(candidate, context) > maxPacketChars)) flush();
      current.push(row);
      if (current.length >= maxRows) flush();
    }
    flush();
  }
  return batches;
}

export function validatePackageScopedBatchPlan(batchPlan, { routedRows = [], maxRows = MAX_M11_BATCH_ROWS, maxPacketChars = MAX_M11_BATCH_PACKET_CHARS } = {}) {
  const failures = []; const seen = new Set(); const expected = new Set(asArray(routedRows).map((row) => row.registry_row_key));
  for (const batch of asArray(batchPlan)) {
    const keys = asArray(batch.expected_registry_row_keys); const ids = asArray(batch.expected_threat_ids);
    if (!batch.batch_id) failures.push("batch missing batch_id");
    if (!batch.stream_id || !batch.package_id || !batch.stream_type) failures.push(`${batch.batch_id || "batch"} missing stream/package identity`);
    if (!keys.length) failures.push(`${batch.batch_id || "batch"} has no expected_registry_row_keys`);
    if (keys.length !== ids.length || keys.length !== Number(batch.row_count || 0)) failures.push(`${batch.batch_id || "batch"} identity counts do not reconcile`);
    if (keys.length > maxRows) failures.push(`${batch.batch_id || "batch"} exceeds maximum rows`);
    if (Number(batch.estimated_packet_chars || 0) > maxPacketChars) failures.push(`${batch.batch_id || "batch"} exceeds packet ceiling`);
    for (const key of keys) { if (seen.has(key)) failures.push(`registry_row_key appears in multiple batches:${key}`); seen.add(key); if (!key.startsWith(`${batch.package_id}::`)) failures.push(`${batch.batch_id || "batch"} contains cross-package registry_row_key:${key}`); }
    if (new Set(ids).size !== ids.length) failures.push(`${batch.batch_id || "batch"} contains duplicate canonical Threat_ID within one package stream`);
  }
  for (const key of expected) if (!seen.has(key)) failures.push(`routed registry_row_key missing from batch plan:${key}`);
  for (const key of seen) if (!expected.has(key)) failures.push(`batch plan contains non-routed registry_row_key:${key}`);
  return { ok: !failures.length, status: failures.length ? "CONTROLLED_FAILURE" : "PASS", failures, batch_count: asArray(batchPlan).length, routed_registry_row_key_count: expected.size, batched_registry_row_key_count: seen.size, maximum_rows_per_batch: maxRows, maximum_packet_chars: maxPacketChars, package_and_stream_isolation: true };
}

function createStreamInventory(stream, index) { const packageId = String(stream?.package_id || "").trim(); const streamType = String(stream?.stream_type || "").trim().toUpperCase(); return { stream_id: makeStreamId(streamType, packageId), stream_index: index, stream_type: streamType, package_id: packageId, source_domain: packageId, classifications: [], activity_references: [], behavior_class_codes: [], surface_context_tokens: [], overlay_ids: [], classification_count: 0, inventory_digest: "" }; }
function addClassification(inventory, { activityReference, classificationSource, overlayId, block, failures, path }) { const behaviorClasses = normalizeCodes(block.behavior_class_codes, `${path}.behavior_class_codes`, failures); const surfaces = normalizeStrings(block.surface_context_tokens, `${path}.surface_context_tokens`, failures); inventory.classifications.push({ activity_reference: activityReference, classification_source: classificationSource, overlay_id: overlayId, package_id: inventory.package_id, behavior_class_codes: behaviorClasses, surface_context_tokens: surfaces }); }
function routeExecutionRow({ executionRow, streamInventory, globalOrder, streamOrder, registryKeyVersion, threatRegistryVersion }) {
  const registryRow = executionRow.registry_row || {};
  const behaviorClass = String(registryRow.Behavior_Class || registryRow.Archetype || registryRow.FIELD21 || "").trim().toUpperCase();
  const active = new Set(streamInventory.behavior_class_codes.map((code) => String(code).toUpperCase()));
  const matched = streamInventory.classifications.filter((row) => row.behavior_class_codes.includes(behaviorClass));
  let route = NOT_APPLICABLE; let reason = "PACKAGE_BEHAVIOR_CLASS_NOT_ACTIVE";
  if (behaviorClass === "UNI") { route = ROUTED; reason = "UNI_ALWAYS_RUN"; }
  else if (active.has(behaviorClass)) { route = ROUTED; reason = "PACKAGE_BEHAVIOR_CLASS_MATCH"; }
  return {
    registry_row_key: executionRow.registry_row_key,
    Threat_ID: registryRow.Threat_ID,
    Threat_Name: registryRow.Threat_Name,
    package_id: executionRow.package_id,
    source_domain: executionRow.source_domain,
    stream_type: executionRow.stream_type,
    stream_id: makeStreamId(executionRow.stream_type, executionRow.package_id),
    Behavior_Class: behaviorClass,
    Surface: registryRow.Surface,
    FIELD21: registryRow.FIELD21,
    FIELD22: registryRow.FIELD22,
    FIELD23: registryRow.FIELD23,
    registry_order: globalOrder,
    stream_registry_order: streamOrder,
    registry_key_version: registryKeyVersion || "",
    threat_registry_version: threatRegistryVersion || "",
    route,
    route_reason: reason,
    routing_authority: "PHASE5_PACKAGE_SCOPED_BEHAVIOR_CLASS_INVENTORY",
    surface_routing_allowed: false,
    matched_activity_references: reason === "UNI_ALWAYS_RUN" ? streamInventory.activity_references : unique(matched.map((row) => row.activity_reference)).sort(),
    active_package_behavior_classes: streamInventory.behavior_class_codes,
    active_package_surfaces_context_only: streamInventory.surface_context_tokens,
    registry_row: { ...registryRow, Behavior_Class: behaviorClass, Hunter_Trigger_Parsed: parseHunterTrigger(registryRow.Hunter_Trigger || "") }
  };
}
function validatePackageScopedRoutePlan({ routeRows, streamPlans, registryContext, manifest }) { const failures = []; const keys = new Set(); let uniNotRouted = 0; for (const row of routeRows) { if (!row.registry_row_key) failures.push("route row missing registry_row_key"); if (keys.has(row.registry_row_key)) failures.push(`duplicate route row registry_row_key:${row.registry_row_key}`); keys.add(row.registry_row_key); if (String(row.Behavior_Class || "").toUpperCase() === "UNI" && row.route !== ROUTED) uniNotRouted += 1; if (row.route_reason === "PACKAGE_BEHAVIOR_CLASS_MATCH" && !row.matched_activity_references.length) failures.push(`${row.registry_row_key} package behavior class match has no Phase 5 activity reference`); } const expected = Number(manifest?.expected_registry_row_key_count || manifest?.expected_row_count || 0); if (routeRows.length !== expected) failures.push(`route plan must account for ${expected} registry_row_keys, got ${routeRows.length}`); if (keys.size !== expected) failures.push(`route plan unique registry_row_key count expected ${expected}, got ${keys.size}`); if (uniNotRouted) failures.push(`${uniNotRouted} UNI rows were not evaluation-routed`); for (const stream of streamPlans) if (stream.routed_rows + stream.non_routed_rows !== stream.expected_registry_rows) failures.push(`${stream.stream_id} stream row reconciliation failed`); if (streamPlans.length !== registryContext.registries.length) failures.push("stream plan count does not match mounted registry count"); return { ok: !failures.length, status: failures.length ? "CONTROLLED_FAILURE" : "PASS", failures, expected_registry_row_keys: expected, accounted_registry_row_keys: keys.size, stream_count: streamPlans.length, primary_overlay_isolation: true, surface_only_routing_forbidden: true }; }
function estimateBatchPacketChars(rows, stream) { return JSON.stringify({ stream: { stream_id: stream.stream_id, stream_type: stream.stream_type, package_id: stream.package_id, behavior_class_codes: stream.behavior_class_codes, surface_context_tokens: stream.surface_context_tokens, activity_references: stream.activity_references }, rows: rows.map((row) => ({ registry_row_key: row.registry_row_key, package_id: row.package_id, stream_type: row.stream_type, route_reason: row.route_reason, matched_activity_references: row.matched_activity_references, registry_row: row.registry_row })) }).length; }
function inspectLegalCartographyIndex(index) { if (!isPlainObject(index)) return { ok: false, failures: ["legal_cartography_index missing"], available_families: [] }; const required = ["document_coverage_index", "document_structure_index", "incorporated_linked_document_map", "control_language_locator", "missing_limited_legal_governance_items", "downstream_rules", "lock_status"]; const failures = required.filter((key) => !(key in index)).map((key) => `legal_cartography_index.${key} missing`); return { ok: !failures.length, failures, available_families: Object.keys(index).sort() }; }
function buildUpstreamAccessManifest(artifacts) { return { material_artifacts: Object.keys(artifacts || {}).filter((key) => !key.includes("forensic")).sort(), forensic_inputs_forbidden: true }; }
function normalizeCodes(value, path, failures) { return normalizeStrings(value, path, failures).map((value) => value.toUpperCase()); }
function normalizeStrings(value, path, failures) { if (!Array.isArray(value)) { failures.push(`${path} must be array`); return []; } const rows = value.map((item) => String(item || "").trim()); rows.forEach((item, index) => { if (!item) failures.push(`${path}[${index}] empty`); }); return unique(rows.filter(Boolean)); }
function containsKey(value, target, seen = new Set()) { if (!value || typeof value !== "object" || seen.has(value)) return false; seen.add(value); if (Object.prototype.hasOwnProperty.call(value, target)) return true; return Object.values(value).some((child) => containsKey(child, target, seen)); }
function makeStreamId(type, packageId) { return `${String(type || "").toUpperCase()}::${String(packageId || "").trim()}`; }
function splitGroupKey(value) { const index = value.lastIndexOf("::"); return [value.slice(0, index), value.slice(index + 2)]; }
function safeToken(value) { return String(value || "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase() || "PACKAGE"; }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function unique(values) { return [...new Set(asArray(values).filter(Boolean))]; }
function countBy(rows, selector) { const out = {}; for (const row of rows) { const key = selector(row); out[key] = (out[key] || 0) + 1; } return out; }
function stableJson(value) { if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function sha256(value) { return createHash("sha256").update(String(value || ""), "utf8").digest("hex"); }
