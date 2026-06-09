import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { DILIGENCE_PROMPT_BUNDLE } from "../../../functions/_generated/diligencePromptBundle.js";
import { getDiligenceStageConfig, getDiligenceStageIds } from "./stageConfigs.js";

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function getPrompt(promptId) {
  const prompt = DILIGENCE_PROMPT_BUNDLE.prompts?.[promptId];

  if (!prompt?.text) {
    throw new Error(`Diligence prompt "${promptId}" is missing from generated prompt bundle.`);
  }

  return prompt;
}

function getCompanyProfilePrompt() {
  const fileName = "02_COMPANY_PROFILE.prompt.md";
  const path = "functions/_prompts/diligence-v2/02_COMPANY_PROFILE.prompt.md";
  const text = readFileSync(resolve(process.cwd(), "..", path), "utf8");
  return {
    prompt_id: "company_profile",
    file_name: fileName,
    path,
    sha256: sha256(text),
    characters: text.length,
    text
  };
}

export function loadDiligencePrompt(stageId) {
  const normalizedStageId = String(stageId || "").trim();

  if (!getDiligenceStageIds().includes(normalizedStageId)) {
    throw new Error(`Unknown Diligence prompt stage "${stageId}".`);
  }

  const sharedPromptId = DILIGENCE_PROMPT_BUNDLE.shared_prompt_id;
  const stagePromptId = DILIGENCE_PROMPT_BUNDLE.stage_prompt_ids?.[normalizedStageId];
  const stageConfig = getDiligenceStageConfig(normalizedStageId);

  const sharedPrompt = getPrompt(sharedPromptId);
  const stagePrompt = normalizedStageId === "company_profile" ? getCompanyProfilePrompt() : getPrompt(stagePromptId);
  const promptParts = [sharedPrompt.text.trim(), "\n\n---\n\n", stagePrompt.text.trim()];

  if (stageConfig.runtime_instruction) {
    promptParts.push("\n\n---STAGE_CONTEXT---\n\n", stageConfig.runtime_instruction.trim());
  }

  const combinedPrompt = promptParts.join("");

  return {
    stage_id: normalizedStageId,
    prompt_root: DILIGENCE_PROMPT_BUNDLE.prompt_root,
    bundle_generated_at: normalizedStageId === "company_profile" ? "source_prompt_runtime_loaded" : DILIGENCE_PROMPT_BUNDLE.generated_at,
    shared_prompt: {
      prompt_id: sharedPrompt.prompt_id,
      file_name: sharedPrompt.file_name,
      path: sharedPrompt.path,
      sha256: sharedPrompt.sha256,
      characters: sharedPrompt.characters
    },
    stage_prompt: {
      prompt_id: stagePrompt.prompt_id,
      file_name: stagePrompt.file_name,
      path: stagePrompt.path,
      sha256: stagePrompt.sha256,
      characters: stagePrompt.characters
    },
    combined_prompt: combinedPrompt,
    combined_characters: combinedPrompt.length
  };
}

export function assertDiligencePromptBundleReady() {
  const missing = [];

  if (!DILIGENCE_PROMPT_BUNDLE?.prompts) missing.push("prompts");
  if (!DILIGENCE_PROMPT_BUNDLE?.stage_prompt_ids) missing.push("stage_prompt_ids");
  if (!DILIGENCE_PROMPT_BUNDLE?.shared_prompt_id) missing.push("shared_system_preamble");

  for (const stageId of getDiligenceStageIds()) {
    if (stageId === "company_profile") continue;
    const promptId = DILIGENCE_PROMPT_BUNDLE.stage_prompt_ids?.[stageId];
    const prompt = promptId ? DILIGENCE_PROMPT_BUNDLE.prompts?.[promptId] : null;
    if (!prompt?.text) missing.push(`stage:${stageId}`);
  }

  if (missing.length) {
    throw new Error(`Generated Diligence prompt bundle is incomplete: ${missing.join(", ")}`);
  }

  return {
    ok: true,
    prompt_root: DILIGENCE_PROMPT_BUNDLE.prompt_root,
    generated_at: DILIGENCE_PROMPT_BUNDLE.generated_at,
    source_loaded_stages: ["company_profile"],
    stage_count: getDiligenceStageIds().length
  };
}
