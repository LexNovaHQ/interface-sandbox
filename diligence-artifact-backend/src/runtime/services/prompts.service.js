import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getInternalJobContract } from "../contracts/internal-job.contract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "../../..");
const PROMPT_DIR = path.join(BACKEND_ROOT, "prompts");
const AGENT_PACKAGE_DIR = path.join(BACKEND_ROOT, "agent-packages");
const REFERENCE_ROOT = path.join(BACKEND_ROOT, "references", "registry");

const SAFE_PROMPT_FILE = /^[a-z0-9_\-.]+\.md$/i;
const SAFE_PACKAGE_FILE = /^agent-packages\/(?:[a-z0-9_\-.]+\/)?[A-Z0-9_\-.]+\.(md|yaml|yml|json)$/i;
const SAFE_REFERENCE_FILE = /^[A-Z0-9_\-.]+\.(yaml|yml|md|json)$/i;

export const PROMPTS_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "prompts.service",
  migration_status: "runtime_owned_prompt_loader",
  prompt_sources: ["prompts/", "agent-packages/"],
  reference_packet_supported: true
});

export async function loadRuntimePromptFile(promptFile) {
  return loadPromptFile(promptFile);
}

export async function loadPromptFile(promptFile) {
  const file = String(promptFile || "");
  if (SAFE_PROMPT_FILE.test(file)) return readFile(path.join(PROMPT_DIR, file), "utf8");
  if (SAFE_PACKAGE_FILE.test(file)) return readAgentPackageFile(file, promptFile);
  throw new Error(`INVALID_PROMPT_FILE:${promptFile || "missing"}`);
}

async function readAgentPackageFile(file, promptFile) {
  return readFile(safePackagePath(file, promptFile), "utf8");
}

function safePackagePath(file, promptFile) {
  const resolved = path.resolve(BACKEND_ROOT, file);
  if (!resolved.startsWith(`${AGENT_PACKAGE_DIR}${path.sep}`)) throw new Error(`INVALID_PROMPT_PATH:${promptFile || "missing"}`);
  return resolved;
}

export async function loadReferencePacket(referenceFiles = []) {
  const files = Array.isArray(referenceFiles) ? referenceFiles : [];
  if (!files.length) return { reference_root: "registry", files: {} };
  const packet = { reference_root: "registry", files: {} };
  for (const fileName of files) {
    assertSafeReferenceFile(fileName);
    const content = await readFile(path.join(REFERENCE_ROOT, fileName), "utf8");
    packet.files[fileName] = { file_name: fileName, content };
  }
  return packet;
}

function assertSafeReferenceFile(fileName) {
  if (!SAFE_REFERENCE_FILE.test(fileName || "")) throw new Error(`INVALID_REFERENCE_FILE:${fileName || "missing"}`);
  if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) throw new Error(`UNSAFE_REFERENCE_FILE:${fileName}`);
}

export async function buildPhasePrompt({ prompt_file, prompt_files, phase, run, artifacts = {}, writes = [], references = [] }) {
  const files = Array.isArray(prompt_files) && prompt_files.length ? prompt_files : [prompt_file];
  const promptSections = [];
  for (const file of files) promptSections.push(await loadPromptFile(file));
  const loadedReferences = await loadReferencePacket(references);
  const runtimePacket = {
    run_id: run.run_id,
    target_url: run.root_url || run.target_url || run.target,
    target: run.target,
    source_mode: run.source_mode,
    phase_name: phase,
    required_output_artifacts: writes,
    reference_files: references,
    upstream_artifacts: artifacts
  };
  const sections = [...promptSections];
  if (references.length) {
    sections.push("<REFERENCE_PACKET>");
    sections.push(JSON.stringify(loadedReferences, null, 2));
    sections.push("</REFERENCE_PACKET>");
  }
  sections.push("<RUNTIME_PACKET>");
  sections.push(JSON.stringify(runtimePacket, null, 2));
  sections.push("</RUNTIME_PACKET>");
  return sections.join("\n\n");
}

export async function buildInternalJobPrompt({ internal_job_id, run, artifacts = {} } = {}) {
  const contract = getInternalJobContract(internal_job_id);
  const promptFiles = contract.prompt_files || (contract.prompt_file ? [contract.prompt_file] : []);
  if (!promptFiles.length) throw new Error(`PROMPT_FILES_NOT_DECLARED:${internal_job_id || "missing"}`);
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
