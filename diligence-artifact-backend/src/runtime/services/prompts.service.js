import { buildPhasePrompt, loadPromptFile } from "../../prompt-loader.js";
import { getInternalJobContract } from "../contracts/internal-job.contract.js";

export const PROMPTS_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "prompts.service",
  migration_status: "bridge_to_existing_prompt_loader",
  prompt_sources: ["prompts/", "agent-packages/"],
  reference_packet_supported: true
});

export async function loadRuntimePromptFile(promptFile) {
  return loadPromptFile(promptFile);
}

export async function buildInternalJobPrompt({ internal_job_id, run, artifacts = {} } = {}) {
  const contract = getInternalJobContract(internal_job_id);
  const promptFiles = contract.prompt_files || (contract.prompt_file ? [contract.prompt_file] : []);
  if (!promptFiles.length) {
    throw new Error(`PROMPT_FILES_NOT_DECLARED:${internal_job_id || "missing"}`);
  }
  return buildPhasePrompt({
    prompt_files: promptFiles,
    phase: internal_job_id,
    run,
    artifacts,
    writes: contract.writes || [],
    references: contract.references || []
  });
}

export function promptContractForInternalJob(internalJobId) {
  const contract = getInternalJobContract(internalJobId);
  return {
    internal_job_id: internalJobId,
    type: contract.type,
    agent_id: contract.agent_id || contract.actor_id || "",
    prompt_files: contract.prompt_files || (contract.prompt_file ? [contract.prompt_file] : []),
    references: contract.references || [],
    writes: contract.writes || [],
    has_prompt_files: Boolean((contract.prompt_files || []).length || contract.prompt_file)
  };
}
