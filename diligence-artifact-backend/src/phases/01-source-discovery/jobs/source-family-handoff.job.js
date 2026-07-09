import { buildSourceFamilyHandoffArtifact } from "../services/source-family-handoff.service.js";
import { buildPhase1HandoffUpgradeArtifacts } from "../services/phase1-agnostic-upgrade.service.js";
import { assertSourceDiscoveryBoundary, assertNoSourceDiscoveryModelUsage } from "../validators/source-discovery.validator.js";

export const SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  job_id: "SOURCE_FAMILY_HANDOFF",
  public_label: "Source Family Handoff",
  implementation_status: "PHASE_OWNED_IMPLEMENTATION_AGNOSTIC_UPGRADE_V0",
  model_usage: "NONE"
});

export function buildSourceFamilyHandoff({ run, artifacts } = {}) {
  const output = buildSourceFamilyHandoffArtifact({ run, artifacts });
  const upgrade = buildPhase1HandoffUpgradeArtifacts({ run, artifacts, output });
  const merged = { ...output, ...upgrade };
  if (merged.source_discovery_handoff?.contract) {
    merged.source_discovery_handoff.contract = {
      ...merged.source_discovery_handoff.contract,
      no_separate_bucket_artifacts: false,
      agnostic_bucket_artifacts_enabled: true,
      independent_legal_doc_artifacts_enabled: true,
      source_text_location: "lossless_root__{COMMON_ROOT}.sources[].lossless_text OR legal_doc_{DOC_TYPE}.lossless_text"
    };
  }
  assertNoSourceDiscoveryModelUsage({ job_id: SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB.job_id });
  assertSourceDiscoveryBoundary({ job_id: SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB.job_id, output: merged });
  return merged;
}
