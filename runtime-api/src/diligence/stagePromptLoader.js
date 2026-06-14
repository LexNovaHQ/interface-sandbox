import { DILIGENCE_PROMPT_BUNDLE } from "../../functions/_generated/diligencePromptBundle.js";
import { getDiligenceStageConfig, getDiligenceStageIds } from "./stageConfigs.js";

const STAGE7_ROUTE_CONTRACT_RULES = `

---STAGE_7_DETERMINISTIC_ROUTE_CONTRACT_RULES---

Runtime-applicable rows are rows whose route_reason is UNI_ALWAYS_RUN, STAGE5_INT_TRIGGERED, or CONDITIONAL_DOC_REVIEW.

Runtime-applicable rows must not receive NOT_APPLICABLE.

For runtime-applicable rows, the only allowed final_status values are CONTROLLED, TRIGGERED, NOT_TRIGGERED, and INSUFFICIENT_EVIDENCE.

Only deterministic skipped rows whose route_reason is INT_NOT_TRIGGERED may receive NOT_APPLICABLE.

The model must not decide whether an archetype applies. Applicability is decided by Stage 5 and the deterministic Stage 7 planner before the model runs.

CONDITIONAL_DOC_REVIEW = legal/governance artifact route, not archetype route.

If evidence is thin for a runtime-applicable row, use INSUFFICIENT_EVIDENCE, not NOT_APPLICABLE.

If a runtime-applicable row does not trigger after Hunter_Trigger evaluation, use NOT_TRIGGERED, not NOT_APPLICABLE.
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
1. Read the supplied stage7_route_contract for the row. Do not decide applicability yourself.
2. Evaluate each CONDITION_N from the row's Hunter_Trigger.
3. Evaluate TRIGGER_IF from the condition booleans.
4. Evaluate EXCLUDE_IF using HER_001 and HER_001B.
5. Assign final_status using HER_002 and the STAGE_7_DETERMINISTIC_ROUTE_CONTRACT_RULES above.

Do not treat generic legal-stack existence as control. Do not ignore first-party controls that directly satisfy the row-specific EXCLUDE_IF. Do not trigger from surface alone.
`;

const STAGE5_COMPLETENESS_SUPREMACY_RULES = `

---STAGE_5_COMPLETENESS_AND_CITATION_SUPREMACY_RULES---

These rules supersede any older Stage 4/5 dictionary language that still asks the model to copy evidence_quote text.

1. Full clean_text_lossless remains available in the packet. Do not summarize, compress, or truncate source text.
2. Model proof must use evidence_refs[] citation IDs such as SRC_003#C002. evidence_quote is optional legacy/runtime-resolved text only.
3. Do not silently omit any admitted Stage 5 source. For every Stage 5 source, create one commercial_scan.source_coverage[] row.
4. Every source_coverage row must use one coverage_status: mapped, supporting, duplicate, insufficient_detail, or non_feature_context.
5. List every visible commercial function/outcome in commercial_scan.distinct_commercial_outcomes_seen[].
6. If a visible outcome/source cannot be mapped into feature_inventory[], list it in unmapped_outcomes_due_to_insufficient_detail[] and mark the relevant source_coverage row insufficient_detail.
7. Set completeness_status to COMPLETE only when all Stage 5 sources/outcomes are accounted for and no unmapped outcome remains. Otherwise use PARTIAL or THIN with completeness_warnings[].
8. Completeness gaps are nonblocking runtime warnings, but they are quality/audit failures before deploy.
`;

const CANON_BLOCKS_BY_STAGE = Object.freeze({
  company_profile: ["UNIVERSAL", "STAGE4"],
  target_feature_profile: ["UNIVERSAL", "STAGE5"],
  stage6a_legal_document_cartography: [],
  registry_ledger_evaluation: ["UNIVERSAL", "STAGE7_NAVIGATION"]
});

function getPrompt(promptId) {
  const prompt = DILIGENCE_PROMPT_BUNDLE.prompts?.[promptId];
  if (!prompt?.text) throw new Error(`Diligence prompt "${promptId}" is missing from generated prompt bundle.`);
  return prompt;
}

function getPromptIfAvailable(promptId) {
  if (!promptId) return null;
  const prompt = DILIGENCE_PROMPT_BUNDLE.prompts?.[promptId];
  return prompt?.text ? prompt : null;
}

function extractCanonBlock(dictionaryText, blockName) {
  const start = `<!-- CANON:${blockName}:START -->`;
  const end = `<!-- CANON:${blockName}:END -->`;
  const startIndex = dictionaryText.indexOf(start);
  const endIndex = dictionaryText.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) return "";
  return dictionaryText.slice(startIndex + start.length, endIndex).trim();
}

function getCanonDictionaryPrompt() {
  const canonicalPromptId = DILIGENCE_PROMPT_BUNDLE.diligence_canon_field_dictionary_prompt_id || "diligence_canon_field_dictionary";
  const canonical = getPromptIfAvailable(canonicalPromptId);
  if (canonical) return { prompt: canonical, mode: "canonical" };

  const legacyPromptId = DILIGENCE_PROMPT_BUNDLE.stage4_stage5_field_dictionary_prompt_id || "stage4_stage5_field_dictionary";
  const legacy = getPromptIfAvailable(legacyPromptId);
  if (legacy) return { prompt: legacy, mode: "legacy_stage4_stage5" };

  return { prompt: null, mode: "missing" };
}

function canonFieldDictionaryAppendix(stageId) {
  const blockNames = CANON_BLOCKS_BY_STAGE[stageId];
  if (!blockNames?.length) return "";

  const { prompt: dictionary, mode } = getCanonDictionaryPrompt();
  if (!dictionary?.text) return "";

  if (mode === "legacy_stage4_stage5") {
    if (stageId !== "company_profile" && stageId !== "target_feature_profile") return "";
    return `\n\n---LEGACY_STAGE_4_5_CANON_FIELD_DICTIONARY_FALLBACK---\n\n${dictionary.text.trim()}`;
  }

  const sections = blockNames.map((blockName) => extractCanonBlock(dictionary.text, blockName)).filter(Boolean);
  if (!sections.length) return "";

  return `\n\n---DILIGENCE_CANON_FIELD_DICTIONARY---\n\n${sections.join("\n\n---\n\n")}`;
}

function runtimePromptAppendixFor(stageId) {
  const parts = [];
  const fieldDictionary = canonFieldDictionaryAppendix(stageId);
  if (fieldDictionary) parts.push(fieldDictionary);
  const stage6Spine = getPromptIfAvailable("stage6_canonical_spine");
  if (stageId === "stage6a_legal_document_cartography" && stage6Spine?.text) parts.push(`\n\n---DILIGENCE_STAGE_6_CANONICAL_SPINE---\n\n${stage6Spine.text.trim()}`);
  if (stageId === "target_feature_profile") parts.push(STAGE5_COMPLETENESS_SUPREMACY_RULES);
  if (stageId === "registry_ledger_evaluation") parts.push(STAGE7_ROUTE_CONTRACT_RULES, REGISTRY_HUNTER_ENGINE_RULES);
  return parts.join("");
}

export function loadDiligencePrompt(stageId) {
  const normalizedStageId = String(stageId || "").trim();
  if (!getDiligenceStageIds().includes(normalizedStageId)) throw new Error(`Unknown Diligence prompt stage "${stageId}".`);
  const sharedPromptId = DILIGENCE_PROMPT_BUNDLE.shared_prompt_id;
  const stagePromptId = DILIGENCE_PROMPT_BUNDLE.stage_prompt_ids?.[normalizedStageId];
  const stageConfig = getDiligenceStageConfig(normalizedStageId);
  const sharedPrompt = getPrompt(sharedPromptId);
  const stagePrompt = getPrompt(stagePromptId);
  const promptParts = [sharedPrompt.text.trim(), "\n\n---\n\n", stagePrompt.text.trim()];
  const runtimeAppendix = runtimePromptAppendixFor(normalizedStageId);
  if (runtimeAppendix) promptParts.push(runtimeAppendix);
  if (stageConfig.runtime_instruction) promptParts.push("\n\n---STAGE_CONTEXT---\n\n", stageConfig.runtime_instruction.trim());
  const combinedPrompt = promptParts.join("");
  const canonicalPromptId = DILIGENCE_PROMPT_BUNDLE.diligence_canon_field_dictionary_prompt_id || "diligence_canon_field_dictionary";
  const canonicalDictionary = getPromptIfAvailable(canonicalPromptId);
  const legacyPromptId = DILIGENCE_PROMPT_BUNDLE.stage4_stage5_field_dictionary_prompt_id || "stage4_stage5_field_dictionary";
  const legacyDictionary = getPromptIfAvailable(legacyPromptId);
  return { stage_id: normalizedStageId, prompt_root: DILIGENCE_PROMPT_BUNDLE.prompt_root, bundle_generated_at: DILIGENCE_PROMPT_BUNDLE.generated_at, shared_prompt: { prompt_id: sharedPrompt.prompt_id, file_name: sharedPrompt.file_name, path: sharedPrompt.path, sha256: sharedPrompt.sha256, characters: sharedPrompt.characters }, stage_prompt: { prompt_id: stagePrompt.prompt_id, file_name: stagePrompt.file_name, path: stagePrompt.path, sha256: stagePrompt.sha256, characters: stagePrompt.characters }, canon_field_dictionary: canonicalDictionary ? { prompt_id: canonicalDictionary.prompt_id, file_name: canonicalDictionary.file_name, path: canonicalDictionary.path, sha256: canonicalDictionary.sha256, characters: canonicalDictionary.characters } : null, legacy_stage4_stage5_field_dictionary: legacyDictionary ? { prompt_id: legacyDictionary.prompt_id, file_name: legacyDictionary.file_name, path: legacyDictionary.path, sha256: legacyDictionary.sha256, characters: legacyDictionary.characters } : null, combined_prompt: combinedPrompt, combined_characters: combinedPrompt.length };
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
  const canonicalPromptId = DILIGENCE_PROMPT_BUNDLE.diligence_canon_field_dictionary_prompt_id || "diligence_canon_field_dictionary";
  const legacyPromptId = DILIGENCE_PROMPT_BUNDLE.stage4_stage5_field_dictionary_prompt_id || "stage4_stage5_field_dictionary";
  const hasCanonicalDictionary = Boolean(DILIGENCE_PROMPT_BUNDLE.prompts?.[canonicalPromptId]?.text);
  const hasLegacyDictionary = Boolean(DILIGENCE_PROMPT_BUNDLE.prompts?.[legacyPromptId]?.text);
  if (!hasCanonicalDictionary && !hasLegacyDictionary) missing.push("diligence_canon_field_dictionary_or_legacy_stage4_stage5_field_dictionary");
  return missing.length ? { ok: false, missing } : { ok: true, prompt_root: DILIGENCE_PROMPT_BUNDLE.prompt_root, generated_at: DILIGENCE_PROMPT_BUNDLE.generated_at, canon_dictionary: hasCanonicalDictionary ? canonicalPromptId : legacyPromptId };
}
