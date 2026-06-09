import { DILIGENCE_PROMPT_BUNDLE } from "../../functions/_generated/diligencePromptBundle.js";
import { getDiligenceStageConfig, getDiligenceStageIds } from "./stageConfigs.js";

const LEGAL_STACK_EMBEDDED_CONTROL_REVIEW_RULES = `

---MANDATORY_LEGAL_STACK_CONTROL_SIGNAL_MAP_RULES---

These rules are supreme runtime rules for legal_stack_review. Apply them before writing legal_stack[], document_stack_redline[], document_stack_synthesis, legal_stack_assessment[], or limitations[].

This stage must not run registry evaluation and must not assign registry final_status values. Its job is to review the public legal stack and prepare compact control evidence for later Hunter EXCLUDE_IF review.

Use the deterministic legal_control_signal_map:
The input may include legal_control_signal_map. It is built deterministically from admitted full legal/governance text before this model call. Treat it as a reading aid, not a legal conclusion. The full admitted text in source_bundle.evidence_buffer remains the authority.

No exhaustive control inventory:
Do not create a long legal_control_index. Do not repeat every signal. legal_stack_assessment[] should stay compact and material.

Output budget rule:
Create at most 8 legal_stack_assessment[] entries total unless a document is impossible to assess without more. Prefer the highest-value entries for later Stage 7 EXCLUDE_IF review.

Priority controls to mention if visible in legal_control_signal_map or full text:
1. subprocessor disclosure / change notice / objection;
2. model training or fine-tuning opt-in or opt-out;
3. consent withdrawal, deletion, or data-subject rights;
4. biometric, voice, deepfake, or impersonation controls;
5. AUP or prohibited-use restrictions;
6. AI output reliance/accuracy disclaimer;
7. output ownership or generated-content allocation;
8. DPA roles / processing instructions;
9. security or breach controls;
10. SLA remedies / service credits;
11. liability or warranty limits.

Embedded artifact handling:
If legal_control_signal_map flags an embedded artifact such as an annexure, schedule, notice, table, subprocessor list, AUP section, DPA section, SLA section, or support terms, check the corresponding full text before declaring related coverage absent. Do not add embedded artifacts as sixth legal_stack[] document types.

No contradicted misses rule:
Before writing a miss such as "No visible subprocessor disclosure", "No visible consent withdrawal", "No visible deletion process", "No visible model-training restriction", "No visible biometric/voice control", "No visible AUP", or "No visible SLA remedy", first check legal_control_signal_map and the full admitted source text. If a signal exists, either record it as coverage/control or explain the exact mismatch in one compact limitation.

Compact entry rule:
If you create legal_stack_assessment[] entries for controls or embedded artifacts, keep coverage_note under 25 words and evidence_quote under 25 words. Do not duplicate the same control family across documents unless the second document adds materially different control evidence.

Stage 7 handoff rule:
The output should help registry_ledger_evaluation later decide row-specific EXCLUDE_IF. Do not decide EXCLUDE_IF here. Do not output CONTROLLED, TRIGGERED, NOT_TRIGGERED, NOT_APPLICABLE, or INSUFFICIENT_EVIDENCE as threat classifications.
`;

const REGISTRY_HUNTER_ENGINE_RULES = `

---MANDATORY_HUNTER_ENGINE_RULES---

These Hunter Engine Rules are supreme runtime rules for registry_ledger_evaluation. Apply them to every supplied Hunter_Trigger row after lane/archetype/surface gating and before final_status assignment.

HER_001 — Universal EXCLUDE_IF First-Party Control Rule
For every threat row, treat EXCLUDE_IF as a hard non-trigger rule only where first-party evidence shows legal, operational, product, UI, workflow, policy, or documentation controls sufficient to defeat the specific triggering conditions. Neutralizing evidence may be a clause, product control, UI flow, policy, trust-center artifact, DPA, ToS, AUP, privacy/security document, internal policy surfaced by the prospect, or a combination of these. Where the threat depends on legal allocation, a technical control alone is insufficient. Where the threat depends on product flow, consent, notice, or user assent, a clause alone is insufficient. Assess whether the evidence actually kills the row-specific conditions, not merely whether a generic control exists.

HER_001B — Risk Surface Is Insufficient Rule
A risk surface alone is insufficient. Trigger only when the risk surface exists AND the first-party public/legal/product evidence does not kill the relevant conditions. Row-specific EXCLUDE_IF language supplies examples, not the full universe of acceptable neutralizing evidence.

HER_002 — Controlled Evidence Output Rule
Evaluate CONDITION_N and TRIGGER_IF first, then apply EXCLUDE_IF. If EXCLUDE_IF evidence is present in first-party materials, output CONTROLLED when TRIGGER_IF is true and EXCLUDE_IF is true. Output NOT_TRIGGERED when TRIGGER_IF is false. Do not output TRIGGERED merely because a risk surface exists. Do not output a TRUE_GAP-style basis where first-party control evidence defeats the row-specific trigger.

Mandatory evaluation order for each row:
1. Evaluate lane, archetype, and surface gates.
2. Evaluate each CONDITION_N from the row's Hunter_Trigger.
3. Evaluate TRIGGER_IF from the condition booleans.
4. Evaluate EXCLUDE_IF using HER_001 and HER_001B.
5. Assign final_status using HER_002 and the five-state contract.

Do not treat generic legal-stack existence as control. Do not ignore first-party controls that directly satisfy the row-specific EXCLUDE_IF. Do not trigger from surface alone.
`;

function getPrompt(promptId) {
  const prompt = DILIGENCE_PROMPT_BUNDLE.prompts?.[promptId];

  if (!prompt?.text) {
    throw new Error(`Diligence prompt "${promptId}" is missing from generated prompt bundle.`);
  }

  return prompt;
}

function runtimePromptAppendixFor(stageId) {
  if (stageId === "legal_stack_review") return LEGAL_STACK_EMBEDDED_CONTROL_REVIEW_RULES;
  if (stageId === "registry_ledger_evaluation") return REGISTRY_HUNTER_ENGINE_RULES;
  return "";
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
  const stagePrompt = getPrompt(stagePromptId);
  const promptParts = [sharedPrompt.text.trim(), "\n\n---\n\n", stagePrompt.text.trim()];
  const runtimeAppendix = runtimePromptAppendixFor(normalizedStageId);

  if (runtimeAppendix) {
    promptParts.push(runtimeAppendix);
  }

  if (stageConfig.runtime_instruction) {
    promptParts.push("\n\n---STAGE_CONTEXT---\n\n", stageConfig.runtime_instruction.trim());
  }

  const combinedPrompt = promptParts.join("");

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
  if (!DILIGENCE_PROMPT_BUNDLE?.shared_prompt_id) missing.push("shared_system_preamble");

  for (const stageId of getDiligenceStageIds()) {
    const promptId = DILIGENCE_PROMPT_BUNDLE.stage_prompt_ids?.[stageId];
    const prompt = promptId ? DILIGENCE_PROMPT_BUNDLE.prompts?.[promptId] : null;
    if (!prompt?.text) missing.push(`stage:${stageId}`);
  }

  return missing.length ? { ok: false, missing } : {
    ok: true,
    prompt_root: DILIGENCE_PROMPT_BUNDLE.prompt_root,
    generated_at: DILIGENCE_PROMPT_BUNDLE.generated_at,
    stage_count: getDiligenceStageIds().length
  };
}
