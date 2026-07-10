import { runPrePhase1DomainPreflight } from "../../runtime/domain-gate/pre-phase-1-domain-preflight.js";
import { SOURCE_DISCOVERY_CONTRACT, getSourceDiscoveryJobContract } from "./source-discovery.contract.js";
import { buildSourceUrlManifest } from "./jobs/url-manifest.job.js";
import { buildSourceExtractionArtifacts } from "./jobs/source-extraction.job.js";
import { buildSourceFamilyHandoff } from "./jobs/source-family-handoff.job.js";

export const SOURCE_DISCOVERY_RUNNER = Object.freeze({
  phase_id: SOURCE_DISCOVERY_CONTRACT.phase_id,
  public_label: SOURCE_DISCOVERY_CONTRACT.public_label,
  implementation_status: SOURCE_DISCOVERY_CONTRACT.implementation_status,
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  blocking_is_exception_noncritical_limitations_pass: true,
  pre_phase_1_domain_preflight_hook_wired: true,
  pre_phase_1_domain_preflight_lock_allowed: false,
  phase_1_agnostic_bucket_upgrade_wired: true,
  legal_doc_granular_lossless_extraction_wired: true
});

export async function runSourceDiscoveryJob({ job_id, run, artifacts = {} } = {}) {
  const job = getSourceDiscoveryJobContract(job_id);
  if (job.job_id === "URL_MANIFEST") {
    const preflight = await runPrePhase1DomainPreflight({ run });
    const output = await buildSourceUrlManifest({ run, preflight_context: preflight.output });
    return sourceDiscoveryRunResult({ job, output: { ...preflight.output, ...output } });
  }
  if (job.job_id === "SOURCE_EXTRACTION") {
    const output = await buildSourceExtractionArtifacts({ run, deduped_url_manifest: artifacts.deduped_url_manifest });
    return sourceDiscoveryRunResult({ job, output });
  }
  if (job.job_id === "SOURCE_FAMILY_HANDOFF") {
    const output = buildSourceFamilyHandoff({ run, artifacts });
    return sourceDiscoveryRunResult({ job, output });
  }
  throw new Error(`SOURCE_DISCOVERY_RUNNER_UNHANDLED_JOB:${job.job_id}`);
}

export async function runSourceUrlManifestJob(input) { return runSourceDiscoveryJob({ ...input, job_id: "URL_MANIFEST" }); }
export async function runSourceExtractionJob(input) { return runSourceDiscoveryJob({ ...input, job_id: "SOURCE_EXTRACTION" }); }
export async function runSourceFamilyHandoffJob(input) { return runSourceDiscoveryJob({ ...input, job_id: "SOURCE_FAMILY_HANDOFF" }); }

function sourceDiscoveryRunResult({ job, output }) {
  return { ok: true, phase_id: SOURCE_DISCOVERY_CONTRACT.phase_id, public_label: SOURCE_DISCOVERY_CONTRACT.public_label, job_id: job.job_id, job_label: job.public_label, model_usage: SOURCE_DISCOVERY_CONTRACT.model_usage, output };
}