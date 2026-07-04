import { buildM6SourceDiscoveryHandoff as buildLegacySourceDiscoveryHandoff } from "../../../m6-bucket-router.js";
import { assertSourceDiscoveryBoundary, assertNoSourceDiscoveryModelUsage } from "../validators/source-discovery.validator.js";

export const SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  job_id: "SOURCE_FAMILY_HANDOFF",
  public_label: "Source Family Handoff",
  implementation_status: "WRAPS_EXISTING_HELPER",
  model_usage: "NONE"
});

export function buildSourceFamilyHandoff({ run, artifacts } = {}) {
  const output = buildLegacySourceDiscoveryHandoff({ run, artifacts });
  assertNoSourceDiscoveryModelUsage({ job_id: SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB.job_id });
  assertSourceDiscoveryBoundary({ job_id: SOURCE_DISCOVERY_FAMILY_HANDOFF_JOB.job_id, output });
  return output;
}
