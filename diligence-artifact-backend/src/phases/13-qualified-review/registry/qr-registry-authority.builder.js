import { loadAndValidateQrRegistryAuthority } from "./qr-registry-structural-validator.js";

export const QR_REGISTRY_AUTHORITY_BUILDER_VERSION = "phase13_qr_registry_authority_builder.v1";

export function buildQrRegistryAuthorityArtifacts(options = {}) {
  const { authority, validation } = loadAndValidateQrRegistryAuthority(options);
  const registries = authority.registries.map((loaded) => Object.freeze({
    registry_id: loaded.registry.registry_id,
    registry_class: loaded.entry.registry_class,
    version: String(loaded.registry.version || ""),
    path: loaded.relative_path,
    load_order: Number(loaded.entry.load_order || 0),
    activation: loaded.entry.activation || {},
    record_count: Number(loaded.registry.record_count || 0),
    atomic_value_count: Number(loaded.registry.atomic_value_count || 0)
  }));

  const qr_registry_load_manifest = Object.freeze({
    artifact_type: "qr_registry_load_manifest",
    artifact_version: "phase13_qr_registry_load_manifest.v1",
    builder_version: QR_REGISTRY_AUTHORITY_BUILDER_VERSION,
    status: "LOCKED",
    authority_id: authority.active_pointer.authority_id,
    active_pointer_path: authority.active_pointer_path,
    catalog_id: authority.catalog.catalog_id,
    catalog_version: String(authority.catalog.version || ""),
    catalog_path: authority.catalog_path,
    schema_id: authority.schema.schema_id,
    schema_version: String(authority.schema.version || ""),
    schema_path: authority.schema_path,
    deterministic_only: true,
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    registries: Object.freeze(registries),
    document_assets: Object.freeze({
      template_manifest_path: authority.template_manifest_path,
      injection_map_path: authority.injection_map_path,
      validation_reports: Object.freeze(authority.validation_reports.map((report) => report.relative_path))
    }),
    phase12_authority: Object.freeze({
      ownership_matrix_path: authority.ownership_matrix_path,
      report_manifest_artifact: authority.catalog.phase12_authority?.report_manifest_artifact,
      report_handoff_artifact: authority.catalog.phase12_authority?.report_handoff_artifact,
      compiler_validation_artifact: authority.catalog.phase12_authority?.compiler_validation_artifact
    }),
    counts: validation.counts,
    legacy_catalog_authority_forbidden: true,
    legacy_matrix_authority_forbidden: true
  });

  const qr_registry_structural_validation = Object.freeze({
    artifact_type: "qr_registry_structural_validation",
    artifact_version: "phase13_qr_registry_structural_validation.v1",
    validator_version: validation.validator_version,
    status: validation.status,
    phase_lock_status: validation.status === "PASS" ? "LOCKED" : "CONTROLLED_FAILURE",
    authority_id: validation.authority_id,
    catalog_id: validation.catalog_id,
    catalog_version: validation.catalog_version,
    counts: validation.counts,
    critical_failure_count: validation.errors.length,
    warning_count: validation.warnings.length,
    errors: validation.errors,
    warnings: validation.warnings
  });

  return Object.freeze({
    qr_registry_load_manifest,
    qr_registry_structural_validation
  });
}
