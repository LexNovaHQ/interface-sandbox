import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadReferencePacket } from "./reference-loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..");
const PROMPT_DIR = path.join(BACKEND_ROOT, "prompts");
const AGENT_PACKAGE_DIR = path.join(BACKEND_ROOT, "agent-packages");

const SAFE_PROMPT_FILE = /^[a-z0-9_\-.]+\.md$/i;
const SAFE_PACKAGE_FILE = /^agent-packages\/[a-z0-9_\-.]+\/[A-Z0-9_\-.]+\.(md|yaml|yml|json)$/i;
const AGENT_3_PACKAGE_PREFIX = "agent-packages/agent_3_target_feature/";
const LEGACY_AGENT_3_PACKAGE_PREFIX = "agent-packages/agent_2_target_feature/";

export async function loadPromptFile(promptFile) {
  const file = String(promptFile || "");

  if (SAFE_PROMPT_FILE.test(file)) {
    return readFile(path.join(PROMPT_DIR, file), "utf8");
  }

  if (SAFE_PACKAGE_FILE.test(file)) {
    return readAgentPackageFile(file, promptFile);
  }

  throw new Error(`INVALID_PROMPT_FILE:${promptFile || "missing"}`);
}

async function readAgentPackageFile(file, promptFile) {
  const resolved = safePackagePath(file, promptFile);
  try {
    return await readFile(resolved, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT" && file.startsWith(AGENT_3_PACKAGE_PREFIX)) {
      const legacyFile = file.replace(AGENT_3_PACKAGE_PREFIX, LEGACY_AGENT_3_PACKAGE_PREFIX);
      return readFile(safePackagePath(legacyFile, promptFile), "utf8");
    }
    throw error;
  }
}

function safePackagePath(file, promptFile) {
  const resolved = path.resolve(BACKEND_ROOT, file);
  if (!resolved.startsWith(`${AGENT_PACKAGE_DIR}${path.sep}`)) {
    throw new Error(`UNSAFE_PROMPT_FILE:${promptFile || "missing"}`);
  }
  return resolved;
}

export async function buildPhasePrompt({ prompt_file, prompt_files, phase, run, artifacts = {}, writes = [], references = [] }) {
  const files = Array.isArray(prompt_files) && prompt_files.length ? prompt_files : [prompt_file];
  const promptSections = [];

  for (const file of files) {
    promptSections.push(await loadPromptFile(file));
  }

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

  const sections = promptSections;

  if (references.length) {
    sections.push("<REFERENCE_PACKET>");
    sections.push(JSON.stringify(loadedReferences, null, 2));
    sections.push("</REFERENCE_PACKET>");
  }

  sections.push("<RUNTIME_PACKET>");
  sections.push(JSON.stringify(runtimePacket, null, 2));
  sections.push("</RUNTIME_PACKET>");
  sections.push("Return strict JSON only.");

  return sections.join("\n\n");
}
