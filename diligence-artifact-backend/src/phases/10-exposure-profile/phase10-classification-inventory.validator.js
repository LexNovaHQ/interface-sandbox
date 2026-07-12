export function assertRequiredPhase5ClassificationStreams({ inventory, manifest } = {}) {
  const failures = [];
  const streams = Array.isArray(manifest?.streams) ? manifest.streams : [];
  const inventories = Array.isArray(inventory?.streams) ? inventory.streams : [];
  const mountedTaxonomy = inventory?.mounted_taxonomy_ref && typeof inventory.mounted_taxonomy_ref === "object" ? inventory.mounted_taxonomy_ref : {};

  if (inventory?.schema_version !== "phase5_classification_inventory.v2.behavior_class") failures.push(`PHASE5_CLASSIFICATION_SCHEMA_INVALID:${inventory?.schema_version || "missing"}`);
  if (inventory?.behavior_class_canonical !== true) failures.push("PHASE5_BEHAVIOR_CLASS_CANONICAL_MARKER_MISSING");
  if (inventory?.validation?.status === "CONTROLLED_FAILURE") failures.push(...(inventory.validation.failures || []));
  if (String(mountedTaxonomy.primary_package_id || "") !== String(manifest?.primary_package || "")) failures.push(`PHASE5_MOUNTED_TAXONOMY_PRIMARY_MISMATCH:${mountedTaxonomy.primary_package_id || "missing"}:${manifest?.primary_package || "missing"}`);

  for (const stream of streams) {
    const streamType = String(stream?.stream_type || "").trim().toUpperCase();
    const packageId = String(stream?.package_id || "").trim();
    const streamId = `${streamType}::${packageId}`;
    const projected = inventories.find((row) => row.stream_id === streamId);
    if (!projected) { failures.push(`PHASE5_REQUIRED_STREAM_INVENTORY_MISSING:${streamId}`); continue; }
    if (Number(projected.classification_count || 0) < 1) { failures.push(`PHASE5_REQUIRED_STREAM_CLASSIFICATION_MISSING:${streamId}`); continue; }
    if (projected.package_id !== packageId || projected.stream_type !== streamType) failures.push(`PHASE5_REQUIRED_STREAM_IDENTITY_MISMATCH:${streamId}`);
    if (!Array.isArray(projected.behavior_class_codes)) failures.push(`PHASE5_BEHAVIOR_CLASS_CODES_MISSING:${streamId}`);
    if (Object.prototype.hasOwnProperty.call(projected, "archetype_codes")) failures.push(`PHASE5_RETIRED_ARCHETYPE_CODES_PRESENT:${streamId}`);
    for (const classification of projected.classifications || []) {
      if (classification.package_id !== packageId) failures.push(`PHASE5_CLASSIFICATION_PACKAGE_ESCAPE:${streamId}:${classification.package_id || "missing"}`);
      if (!Array.isArray(classification.behavior_class_codes)) failures.push(`PHASE5_CLASSIFICATION_BEHAVIOR_CLASS_CODES_MISSING:${streamId}`);
      if (Object.prototype.hasOwnProperty.call(classification, "archetype_codes")) failures.push(`PHASE5_CLASSIFICATION_RETIRED_ARCHETYPE_CODES_PRESENT:${streamId}`);
      if (streamType === "PRIMARY" && classification.classification_source !== "primary_classification") failures.push(`PHASE5_PRIMARY_STREAM_SOURCE_INVALID:${streamId}:${classification.classification_source || "missing"}`);
      if (streamType === "OVERLAY") {
        if (classification.classification_source !== "overlay_classifications") failures.push(`PHASE5_OVERLAY_STREAM_SOURCE_INVALID:${streamId}:${classification.classification_source || "missing"}`);
        if (!classification.overlay_id) failures.push(`PHASE5_OVERLAY_ID_MISSING:${streamId}`);
      }
    }
  }

  const expectedOverlayPackages = streams.filter((stream) => String(stream.stream_type || "").toUpperCase() === "OVERLAY").map((stream) => String(stream.package_id || "")).sort();
  const mountedOverlayPackages = (Array.isArray(mountedTaxonomy.overlays) ? mountedTaxonomy.overlays : []).map((overlay) => String(overlay?.package_id || "")).filter(Boolean).sort();
  if (JSON.stringify(expectedOverlayPackages) !== JSON.stringify(mountedOverlayPackages)) failures.push(`PHASE5_MOUNTED_TAXONOMY_OVERLAY_MISMATCH:${mountedOverlayPackages.join(",") || "none"}:${expectedOverlayPackages.join(",") || "none"}`);

  if (failures.length) throw new Error(`PHASE5_CLASSIFICATION_STREAM_GATE_FAILED:${[...new Set(failures)].join("|")}`);
  return { status: "PASS", required_stream_count: streams.length, validated_stream_count: inventories.length, primary_overlay_source_isolation: true, mounted_taxonomy_parity: true, behavior_class_canonical: true };
}
