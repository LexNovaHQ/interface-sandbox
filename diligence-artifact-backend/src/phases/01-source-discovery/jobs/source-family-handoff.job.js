import { buildSourceFamilyHandoffArtifact } from "../services/source-family-handoff.service.js";
import { assertSourceDiscoveryBoundary, assertNoSourceDiscoveryModelUsage } from "../validators/source-discovery.validator.js";

export const SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  job_id: "SOURCE_FAMILY_HANDOFF",
  public_label: "Source Family Handoff",
  implementation_status: "PHASE_OWNED_IMPLEMENTATION",
  model_usage: "NONE"
});

export function buildSourceFamilyHandoff({ run, artifacts } = {}) {
  const output = buildSourceFamilyHandoffArtifact({ run, artifacts });
  assertNoSourceDiscoveryModelUsage({ job_id: SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB.job_id });
  assertSourceDiscoveryBoundary({ job_id: SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB.job_id, output });
  return output;
}
