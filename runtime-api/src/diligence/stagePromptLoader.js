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

const STAGE5_FIELD_DERIVATION_INSTRUCTIONS_V2 = `

---STAGE5_FIELD_DERIVATION_INSTRUCTIONS_v2---

These rules are binding for target_feature_profile. They implement docs/contracts/STAGE5_FIELD_DERIVATION_INSTRUCTIONS_v2.md.

A. Candidate typing comes before feature output.
The deterministic candidate index and Stage 5A discovery are high-recall inputs, not final truth. First classify each visible candidate as one of: PRODUCT_AREA, ATOMIC_FEATURE_CANDIDATE, DELIVERY_CHANNEL_SIGNAL, DATA_SIGNAL, ARCHITECTURE_SIGNAL, COMMERCIAL_OUTCOME_SIGNAL, LEGAL_CONTROL_SIGNAL, DUPLICATE_OR_ALIAS, or INSUFFICIENT_FEATURE_EVIDENCE.

B. Product areas are not final features by default.
A product/module/brand/page label such as Samvaad, Arya, Studio, Akshar, Edge, Models, or Integrations is a product area, architecture signal, delivery signal, or source label unless evidence proves it is itself an atomic function. Decompose product areas into atomic features. Emit only atomic functions in feature_inventory[]. Link the product area through business_label_or_product_area.

C. Every final feature_inventory[] row must have at least one archetype and one surface.
No final atomic feature may have archetype_codes.length === 0 or surface_tokens.length === 0. If no controlled archetype or surface safely applies, do not emit the row as a final feature. Put it in unresolved_feature_candidates[] or account for it in commercial_scan as insufficient_detail/non_feature_context.

D. UNI is not an uncertainty fallback.
Use UNI only where evidence supports a general-purpose AI assistant/tool. Do not use UNI because classification is uncertain.

E. CORE vs SECONDARY.
Set feature_role = CORE when the function is independently marketed, sold, API-exposed, or materially drives customer value. Set SECONDARY when it is a support/deployment/enablement/context capability.

F. Per-feature derivation checklist.
For every final feature answer these from admitted evidence:
1. What is the atomic feature name? Use function language, not product branding.
2. Which product area does it belong to?
3. Who uses it? actor_or_user.
4. What input data does it consume? input_data[] and data_provenance[].
5. What system action does it perform? system_action.
6. What output/result does it produce? output_or_result.
7. What autonomy level is visible? none, draft, recommend, execute, or unknown.
8. Is human review required/optional/not visible/unknown?
9. Does it trigger external actions or downstream systems? external_action_signal true/false/unknown.
10. Which delivery channels are visible? app/api/web true/false/unknown.
11. Which controlled archetype code(s) apply, with archetype_provenance[] for every code?
12. Which controlled surface token(s) apply, with surface_provenance[] for every token?
13. Which source URL and evidence_refs support the row?

G. Controlled archetype classification.
Use only UNI, DOE, JDG, CMP, CRT, RDR, ORC, TRN, SHD, OPT, MOV. Multiple archetypes are allowed and expected where behavior supports them. DOE requires action on the user's behalf or external execution. ORC requires routing/coordinating models/tools/agents/workflows. CRT requires generated/synthetic/copyrightable output. RDR requires ingesting or reading customer/user/third-party source material. TRN covers translation, audio, voice, speech, biometric-adjacent transformation. JDG requires decisioning/recommendation that materially affects people, rights, eligibility, HR, legal, finance, health, or similar. Do not over-trigger; cite behavior.

H. Controlled surface classification.
Use only Consumer-Public, Enterprise-Private, PII, Employment, Sensitive/Biometric, Financial, Content&IP, Safety&Physical, Infrastructure, Minors. Every final atomic feature must have at least one surface. Surface must be tied to data/context, not guessed from company category alone.

I. Data provenance derivation.
For each feature, derive data_origin, data_subject, data_category, processing_context, storage_or_retention_signal, training_or_finetuning_signal, source_url, evidence_refs, and confidence. Prefer deterministic source evidence for audio/text/document/API payloads, retention, training/fine-tuning, and product-improvement signals.

J. Architecture hints.
Emit architecture_hints[] only for visible provider, memory, cloud_host, vector_db, subprocessor, or integration facts. Do not emit unknown/empty hints. Use disposition=prefill_candidate only where the value is explicit; otherwise confirmation_only.

K. Stage5R repair policy.
If completion_repair_request is present, perform exactly one focused repair pass over the listed failed candidates/features. Do not start a recursive repair loop. If a candidate still cannot satisfy archetype/surface/provenance requirements, remove it from feature_inventory[] and place it in unresolved_feature_candidates[] with reason and evidence_refs. Set classification_quality.status = DEGRADED and fallback_routing_required = true.

L. Stage 5 never emits threat IDs or registry statuses.
linked_threat_ids must remain []. Stage 7 owns registry rows, Hunter Trigger evaluation, and final statuses.
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
  if (stageId === "target_feature_profile") parts.push(STAGE5_COMPLETENESS_SUPREMACY_RULES, STAGE5_FIELD_DERIVATION_INSTRUCTIONS_V2);
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
