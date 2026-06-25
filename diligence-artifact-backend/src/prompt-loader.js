import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_DIR = path.resolve(__dirname, "../prompts");

export async function loadPromptFile(promptFile) {
  if (!/^[a-z0-9_\-.]+\.md$/i.test(promptFile)) {
    throw new Error(`INVALID_PROMPT_FILE:${promptFile || "missing"}`);
  }
  return readFile(path.join(PROMPT_DIR, promptFile), "utf8");
}

export async function buildPhasePrompt({ prompt_file, phase, run, artifacts = {}, writes = [] }) {
  const basePrompt = await loadPromptFile(prompt_file);
  const runtimePacket = {
    run_id: run.run_id,
    target_url: run.root_url || run.target_url || run.target,
    target: run.target,
    source_mode: run.source_mode,
    phase_name: phase,
    required_output_artifacts: writes,
    upstream_artifacts: artifacts
  };

  return `${basePrompt}

<RUNTIME_PACKET>
${JSON.stringify(runtimePacket, null, 2)}
</RUNTIME_PACKET>

Return only strict JSON. No markdown. No commentary. No prose outside JSON.`;
}
