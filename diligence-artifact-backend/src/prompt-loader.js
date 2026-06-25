import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadReferencePacket } from "./reference-loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_DIR = path.resolve(__dirname, "../prompts");

export async function loadPromptFile(promptFile) {
  if (!/^[a-z0-9_\-.]+\.md$/i.test(promptFile)) {
    throw new Error(`INVALID_PROMPT_FILE:${promptFile || "missing"}`);
  }
  return readFile(path.join(PROMPT_DIR, promptFile), "utf8");
}

export async function buildPhasePrompt({ prompt_file, phase, run, artifacts = {}, writes = [], references = [] }) {
  const basePrompt = await loadPromptFile(prompt_file);
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

  const sections = [basePrompt];

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
