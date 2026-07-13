import { asArray, freezeDeep } from "../runtime/phase13-value-utils.js";

export const QR_ACTIVE_FIELD_LEDGER_BUILDER_VERSION = "phase13_qr_active_field_ledger_builder.v1";

export function buildQrActiveFieldLedger({
  authority,
  registry_resolution_manifest,
  qr_phase12_value_resolution,
  run_mode = "PRODUCTION"
} = {}) {
  if (!authority?.registries) throw new Error("QR_ACTIVE_LEDGER_AUTHORITY_INVALID");
  const renderIds = new Set(asArray(registry_resolution_manifest?.render_field_ids));
  const probeIds = new Set(asArray(registry_resolution_manifest?.unresolved_activation_probe_field_ids));
  const suppressedIds = new Set(asArray(registry_resolution_manifest?.suppressed_field_ids));
  const resolutions = qr_phase12_value_resolution?.field_resolutions || {};

  const registryFields = authority.registries.flatMap((loaded) => {
    const sections = new Map(asArray(loaded.registry.sections).map((section) => [section.section_id, section]));
    return asArray(loaded.registry.fields).map((field, registryOrder) => ({
      field,
      registry: loaded.registry,
      registryEntry: loaded.entry,
      section: sections.get(field.section_id) || {},
      registryOrder
    }));
  });

  const activeFields = registryFields
    .filter(({ field }) => renderIds.has(field.qr_field_id))
    .sort(compareFields)
    .map(({ field, registry, section }) => {
      const resolution = resolutions[field.qr_field_id];
      if (!resolution) throw new Error(`QR_ACTIVE_LEDGER_FIELD_RESOLUTION_MISSING:${field.qr_field_id}`);
      const activationProbe = probeIds.has(field.qr_field_id);
      return freezeDeep({
        qr_field_id: field.qr_field_id,
        canonical_key: field.canonical_key,
        label: field.label,
        registry_id: registry.registry_id,
        registry_scope: field.registry_scope,
        lane: field.lane,
        section_id: field.section_id,
        shape: field.shape,
        fillability: field.fillability,
        required_for_assembly: field.required_for_assembly === true,
        activation_state: activationProbe ? "ACTIVATION_PROBE" : "ACTIVE",
        activation_probe: activationProbe,
        atomic_values: resolution.atomic_values,
        source_mix: resolution.source_mix,
        source_counts: resolution.source_counts,
        unresolved_atomic_fields: resolution.unresolved_atomic_fields,
        review_state: resolution.review_state,
        limitation: resolution.limitation,
        not_applicable: resolution.not_applicable,
        document_bindings: field.document_bindings,
        document_binding_count: field.document_binding_count,
        ui: {
          ...field.ui,
          per_question_confirmation_required: false,
          section_attestation_controls_finality: true,
          activation_probe_context: activationProbe
            ? "Resolve this existing registry field to activate or suppress the unresolved subpackage."
            : null
        }
      });
    });

  const sectionMap = new Map();
  for (const field of activeFields) {
    if (!sectionMap.has(field.section_id)) {
      const source = registryFields.find((row) => row.field.section_id === field.section_id)?.section || {};
      sectionMap.set(field.section_id, {
        section_id: field.section_id,
        section_title: source.title || field.section_id,
        registry_scope: field.registry_scope,
        lane: field.lane,
        display_order: Number(source.display_order || 0),
        operator_task: source.operator_task || "Review the active values in this section.",
        attestation_required: true,
        attestation: {
          status: "PENDING",
          confirmation_unit: "SECTION",
          per_question_confirmation_forbidden: true,
          reviewer_identity: null,
          attested_at: null
        },
        field_ids: [],
        atomic_value_count: 0,
        activation_probe_field_ids: []
      });
    }
    const section = sectionMap.get(field.section_id);
    section.field_ids.push(field.qr_field_id);
    section.atomic_value_count += Object.keys(field.atomic_values || {}).length;
    if (field.activation_probe) section.activation_probe_field_ids.push(field.qr_field_id);
  }

  const sections = [...sectionMap.values()].sort((a, b) => a.display_order - b.display_order || a.section_id.localeCompare(b.section_id));
  const activeAtomicCount = activeFields.reduce((sum, field) => sum + Object.keys(field.atomic_values || {}).length, 0);
  const sourceCounts = activeFields.reduce((acc, field) => {
    for (const [source, count] of Object.entries(field.source_counts || {})) acc[source] = (acc[source] || 0) + count;
    return acc;
  }, { REVIEWER: 0, PHASE_12: 0, MARKET_BASED: 0, UNRESOLVED: 0 });

  return freezeDeep({
    artifact_type: "qr_active_field_ledger",
    artifact_version: "phase13_qr_active_field_ledger.v1",
    builder_version: QR_ACTIVE_FIELD_LEDGER_BUILDER_VERSION,
    status: activeFields.some((field) => field.unresolved_atomic_fields.length) ? "LOCKED_WITH_LIMITATIONS" : "LOCKED",
    run_mode: String(run_mode || "PRODUCTION").toUpperCase() === "DEMO" ? "DEMO" : "PRODUCTION",
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    field_values_are_proposed_until_section_attestation: true,
    active_fields: activeFields,
    sections,
    suppressed_field_ids: [...suppressedIds].sort(),
    unresolved_activation_probe_field_ids: [...probeIds].sort(),
    counts: {
      active_field_count: activeFields.length,
      active_atomic_value_count: activeAtomicCount,
      active_section_count: sections.length,
      suppressed_field_count: suppressedIds.size,
      unresolved_activation_probe_count: probeIds.size,
      reviewer_atomic_count: sourceCounts.REVIEWER,
      phase12_atomic_count: sourceCounts.PHASE_12,
      market_based_atomic_count: sourceCounts.MARKET_BASED,
      unresolved_atomic_count: sourceCounts.UNRESOLVED
    }
  });
}

function compareFields(left, right) {
  const leftOrder = Number(left.section?.display_order || 0);
  const rightOrder = Number(right.section?.display_order || 0);
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return left.registryOrder - right.registryOrder;
}
