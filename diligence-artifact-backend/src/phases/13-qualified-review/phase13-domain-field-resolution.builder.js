import { buildQrRegistryAuthorityArtifacts, loadAndValidateQrRegistryAuthority } from "./registry/index.js";
import { resolveQrRegistryActivation } from "./activation/qr-registry-activation-resolver.js";
import { resolvePhase12QrValues } from "./resolution/phase12-qr-value-resolver.js";
import { buildQrActiveFieldLedger } from "./ledger/qr-active-field-ledger.builder.js";

export const PHASE13_DOMAIN_FIELD_RESOLUTION_BUILDER_VERSION = "phase13_domain_field_resolution_builder.v1";

export function buildPhase13DomainFieldResolutionArtifacts({
  backendRoot,
  activePointerPath,
  domain_derivation_profile = {},
  active_run_package_manifest = {},
  phase12_report_artifacts = {},
  reviewer_values = {},
  run_mode = "PRODUCTION"
} = {}) {
  const authorityArtifacts = buildQrRegistryAuthorityArtifacts({ backendRoot, activePointerPath });
  const { authority } = loadAndValidateQrRegistryAuthority({ backendRoot, activePointerPath });

  const initialActivation = resolveQrRegistryActivation({
    authority,
    domain_derivation_profile,
    active_run_package_manifest,
    phase12_report_artifacts,
    reviewer_values
  });

  const qr_phase12_value_resolution = resolvePhase12QrValues({
    authority,
    phase12_report_artifacts,
    reviewer_values,
    run_mode
  });

  const qr_registry_resolution_manifest = resolveQrRegistryActivation({
    authority,
    domain_derivation_profile,
    active_run_package_manifest,
    phase12_report_artifacts,
    reviewer_values,
    phase12_field_resolutions: qr_phase12_value_resolution.field_resolutions
  });

  const qr_active_field_ledger = buildQrActiveFieldLedger({
    authority,
    registry_resolution_manifest: qr_registry_resolution_manifest,
    qr_phase12_value_resolution,
    run_mode
  });

  return Object.freeze({
    ...authorityArtifacts,
    qr_registry_resolution_manifest,
    qr_phase12_value_resolution,
    qr_active_field_ledger,
    phase13_domain_field_resolution_summary: Object.freeze({
      artifact_type: "phase13_domain_field_resolution_summary",
      artifact_version: "phase13_domain_field_resolution_summary.v1",
      builder_version: PHASE13_DOMAIN_FIELD_RESOLUTION_BUILDER_VERSION,
      status: summaryStatus({
        authority: authorityArtifacts.qr_registry_structural_validation,
        activation: qr_registry_resolution_manifest,
        values: qr_phase12_value_resolution,
        ledger: qr_active_field_ledger
      }),
      initial_activation_snapshot: initialActivation,
      final_activation_counts: qr_registry_resolution_manifest.counts,
      active_ledger_counts: qr_active_field_ledger.counts
    })
  });
}

function summaryStatus({ authority, activation, values, ledger }) {
  if (authority?.status !== "PASS") return "CONTROLLED_FAILURE";
  if ([activation?.status, values?.status, ledger?.status].includes("LOCKED_WITH_LIMITATIONS")) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}
