import { DILIGENCE_PROMPT_BUNDLE } from "../../functions/_generated/diligencePromptBundle.js";
import { getDiligenceStageConfig, getDiligenceStageIds } from "./stageConfigs.js";

const LEGAL_STACK_EMBEDDED_CONTROL_REVIEW_RULES = `

---MANDATORY_LEGAL_STACK_EMBEDDED_CONTROL_REVIEW_RULES---

These rules are supreme runtime rules for legal_stack_review. Apply them before writing legal_stack[], document_stack_redline[], document_stack_synthesis, legal_stack_assessment[], or limitations[].

This stage must not run registry evaluation and must not assign registry final_status values. Its job is to create a complete public-footprint legal/control map for later Hunter EXCLUDE_IF review.

Embedded artifact rule:
Inspect admitted legal/governance text for embedded annexures, schedules, addenda, appendices, exhibits, notices, tables, policy sections, support terms, subprocessor lists, DPA sections, AUP/prohibited-use sections, SLA/service-credit sections, security terms, transfer notices, consent notices, retention notices, and special product terms. Treat embedded artifacts as first-class evidence inside legal_stack_assessment[]. Do not add them as sixth legal_stack[] document types.

Mandatory embedded_artifact_index entries:
If an embedded artifact is visible, create at least one legal_stack_assessment[] entry with assessment_type: "embedded_artifact_index". Include parent_document_type, embedded_artifact_type, section_heading, source_basis, feature_refs, coverage_note, evidence_quote, and limitation. Use the admitted source URL or manual_text as source_basis. Keep evidence_quote short and exact.

Mandatory legal_control_index entries:
If admitted text contains a control relevant to later Hunter EXCLUDE_IF analysis, create a legal_stack_assessment[] entry with assessment_type: "legal_control_index". Include control_family, parent_document_type, source_basis, control_strength, feature_refs, coverage_note, evidence_quote, and limitation. The control index is not a legal conclusion; it is a public-footprint inventory of visible controls.

Minimum control families to inspect:
- subprocessor disclosure;
- subprocessor change notice;
- subprocessor objection process;
- model training opt-in or opt-out;
- no sell/share or CPRA-style restriction;
- consent withdrawal;
- data deletion;
- data subject rights;
- cross-border transfer safeguards;
- biometric or voice consent;
- biometric or voice retention;
- AI output reliance disclaimer;
- output ownership or generated-content allocation;
- prohibited-use or AUP controls;
- deepfake, impersonation, or voice-cloning restrictions;
- DPA controller/processor roles;
- DPA processing instructions;
- security measures;
- breach notification;
- SLA uptime;
- SLA remedies or service credits;
- liability limitation;
- warranty disclaimer.

No contradicted misses rule:
Do not write a miss such as "No visible subprocessor disclosure", "No visible consent withdrawal", "No visible deletion process", "No visible model-training restriction", "No visible biometric/voice control", "No visible AUP", or "No visible SLA remedy" until you have checked all admitted ToS, Privacy Policy, DPA, AUP, SLA, annexures, schedules, addenda, appendices, exhibits, notices, tables, trust/security pages, and supporting governance surfaces supplied in source_bundle. If admitted text contains a relevant embedded artifact or control, record it as coverage/control or explain specifically why it does not satisfy the coverage issue.

Annexure/schedule priority rule:
If an admitted Privacy Policy, ToS, DPA, AUP, SLA, or supporting governance surface contains headings such as "Annexure", "Schedule", "Appendix", "Exhibit", "Notice", "Sub-processors", "Data Sub-processors", "Service Providers", "International Transfers", "Biometric", "Voice", "AI", "Acceptable Use", "Prohibited Use", "Service Levels", or "Support", you must inspect and index those sections before declaring related coverage absent.

Control strength labels:
Use practical control_strength labels inside legal_stack_assessment[] such as "specific_named_control", "specific_process_control", "specific_notice_control", "generic_clause_only", "partial_control", "unclear_control", or "not_visible_in_admitted_evidence". These are assessment labels only, not schema-level enums and not registry statuses.

Stage 7 handoff rule:
The legal_control_index should be clear enough that registry_ledger_evaluation can later decide whether row-specific EXCLUDE_IF is satisfied. Do not decide EXCLUDE_IF here. Do not output CONTROLLED, TRIGGERED, NOT_TRIGGERED, NOT_APPLICABLE, or INSUFFICIENT_EVIDENCE as threat classifications.

Self-check before output:
Before returning JSON, verify that every absence/miss statement has been checked against embedded artifacts and the legal_control_index. If a miss would be contradicted by an admitted annexure, schedule, notice, table, or embedded section, revise the miss into a cover/control entry or add a limitation explaining the exact unresolved mismatch.
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
