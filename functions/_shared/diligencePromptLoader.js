import { DILIGENCE_PROMPT_BUNDLE } from "../_generated/diligencePromptBundle.js";

const VALID_STAGE_IDS = Object.freeze([
  "evidence_refiner",
  "target_feature_profile",
  "legal_stack_review",
  "registry_ledger_evaluation",
  "operator_challenge",
  "final_compiler"
]);

function normalizeStageId(stageId) {
  if (!stageId || typeof stageId !== "string") {
    throw new Error("stage_id must be a non-empty string");
  }

  const normalized = stageId.trim();

  if (!VALID_STAGE_IDS.includes(normalized)) {
    throw new Error(`Unknown Diligence prompt stage "${stageId}". Known stages: ${VALID_STAGE_IDS.join(", ")}`);
  }

  return normalized;
}

function getPrompt(promptId) {
  const prompt = DILIGENCE_PROMPT_BUNDLE.prompts?.[promptId];

  if (!prompt?.text) {
    throw new Error(`Diligence prompt "${promptId}" is missing from generated prompt bundle.`);
  }

  return prompt;
}

export function listDiligencePromptStages() {
  return VALID_STAGE_IDS.map((stageId) => {
    const promptId = DILIGENCE_PROMPT_BUNDLE.stage_prompt_ids?.[stageId];
    const prompt = getPrompt(promptId);

    return {
      stage_id: stageId,
      prompt_id: prompt.prompt_id,
      file_name: prompt.file_name,
      path: prompt.path,
      sha256: prompt.sha256,
      characters: prompt.characters
    };
  });
}

export function loadDiligencePrompt(stageId) {
  const normalizedStageId = normalizeStageId(stageId);
  const sharedPromptId = DILIGENCE_PROMPT_BUNDLE.shared_prompt_id;
  const stagePromptId = DILIGENCE_PROMPT_BUNDLE.stage_prompt_ids?.[normalizedStageId];

  const sharedPrompt = getPrompt(sharedPromptId);
  const stagePrompt = getPrompt(stagePromptId);
  const combinedPrompt = [
    sharedPrompt.text.trim(),
    "\n\n---\n\n",
    stagePrompt.text.trim()
  ].join("");

  return {
    stage_id: normalizedStageId,
    prompt_root: DILIGENCE_PROMPT_BUNDLE.prompt_root,
    bundle_generated_at: DILIGENCE_PROMPT_BUNDLE.generated_at,
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
  if (!DILIGENCE_PROMPT_BUNDLE?.shared_prompt_id) missing.push("shared_prompt_id");

  VALID_STAGE_IDS.forEach((stageId) => {
    const promptId = DILIGENCE_PROMPT_BUNDLE.stage_prompt_ids?.[stageId];
    const prompt = promptId ? DILIGENCE_PROMPT_BUNDLE.prompts?.[promptId] : null;

    if (!prompt?.text) {
      missing.push(`stage:${stageId}`);
    }
  });

  const sharedPrompt = DILIGENCE_PROMPT_BUNDLE.prompts?.[DILIGENCE_PROMPT_BUNDLE.shared_prompt_id];
  if (!sharedPrompt?.text) missing.push("shared_system_preamble");

  if (missing.length) {
    throw new Error(`Generated Diligence prompt bundle is incomplete: ${missing.join(", ")}`);
  }

  return {
    ok: true,
    prompt_root: DILIGENCE_PROMPT_BUNDLE.prompt_root,
    generated_at: DILIGENCE_PROMPT_BUNDLE.generated_at,
    stage_count: VALID_STAGE_IDS.length
  };
}
