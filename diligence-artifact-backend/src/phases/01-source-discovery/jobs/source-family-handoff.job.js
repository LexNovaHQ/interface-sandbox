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
  assertNoSourceDiscoveryModelUsage({ job_id: SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB.job_id });
  assertSourceDiscoveryBoundary({ job_id: SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB.job_id, output: merged });
  return merged;
}
