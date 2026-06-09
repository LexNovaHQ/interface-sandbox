import crypto from "node:crypto";

const DEFAULT_MAX_INPUT_CHARS = 120000;
const DEFAULT_MAX_ESTIMATED_TOKENS = 60000;
const DEFAULT_MAX_SINGLE_SOURCE_CHARS = 60000;
const DEFAULT_PROMPT_OVERHEAD_TOKENS = 30000;
const ESTIMATED_CHARS_PER_TOKEN = 2.25;
const LEGAL_STAGE_KEY = "legal_stack_review";
const SOURCE_PRIORITY = { legal_profile: 10, governance_profile: 20, company_profile: 50, product_profile: 90 };
const MAX_CONTROL_SIGNALS = 20;
const MAX_SIGNAL_SNIPPET_CHARS = 280;

const LEGAL_CONTROL_SIGNAL_DEFINITIONS = [
  {
    signal_type: "embedded_artifact",
    control_family: "embedded_legal_artifact",
    heading: "annexure_schedule_notice_or_table",
    terms: ["annexure", "schedule", "appendix", "exhibit", "notice", "table"],
    patterns: [/(annexure|schedule|appendix|exhibit|notice|table|addendum).{0,120}(sub-?processor|data processing|service level|acceptable use|support|transfer|voice|biometric|ai|security)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "subprocessor_disclosure",
    heading: "subprocessor_or_service_provider_disclosure",
    terms: ["subprocessor", "service provider", "AWS", "Google Cloud", "Razorpay"],
    patterns: [/(data\s+sub-?processors?|sub-?processors?|service providers?|aws|amazon web services|google cloud platform|razorpay)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "subprocessor_change_notice_or_objection",
    heading: "subprocessor_change_notice_or_objection",
    terms: ["subprocessor", "change notice", "objection", "30 days"],
    patterns: [/(sub-?processor.{0,180}(change|notice|object|objection|30\s+days?)|(change|notice|object|objection|30\s+days?).{0,180}sub-?processor)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "model_training_opt_in_or_opt_out",
    heading: "model_training_opt_in_or_opt_out",
    terms: ["model training", "fine-tuning", "opt-in", "opt-out"],
    patterns: [/(training|fine[-\s]?tuning|improv(e|ing).*model|model improvement|opt[-\s]?in|opt[-\s]?out|explicit consent).{0,180}(model|training|fine[-\s]?tuning|content|data)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "no_sell_share_or_cpra_restriction",
    heading: "no_sell_share_or_cpra_restriction",
    terms: ["do not sell", "do not share", "CCPA", "CPRA"],
    patterns: [/(do not sell|do not share|sell or share|ccpa|cpra|california privacy)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "consent_withdrawal",
    heading: "consent_withdrawal",
    terms: ["withdraw consent", "consent manager", "affirmative consent"],
    patterns: [/(withdraw.{0,80}consent|consent.{0,80}withdraw|consent manager|affirmative consent)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "deletion_or_data_subject_rights",
    heading: "deletion_or_data_subject_rights",
    terms: ["deletion", "erasure", "data subject rights", "access", "correction"],
    patterns: [/(deletion|delete your data|erasure|data subject rights|right to access|right to correct|rectification|dsr|privacy rights)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "cross_border_transfer_safeguards",
    heading: "cross_border_transfer_safeguards",
    terms: ["international transfer", "cross-border", "SCC", "transfer safeguards"],
    patterns: [/(international transfer|cross[-\s]?border|standard contractual clauses|\bSCCs?\b|transfer safeguards|adequacy)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "biometric_or_voice_control",
    heading: "biometric_or_voice_control",
    terms: ["voice", "biometric", "audio", "speaker", "diarization", "voice cloning"],
    patterns: [/(voice|biometric|speaker|speech|audio|diari[sz]ation|voice cloning|synthetic voice|deepfake|impersonation)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "aup_or_prohibited_use_control",
    heading: "aup_or_prohibited_use_control",
    terms: ["acceptable use", "prohibited use", "usage restrictions", "abuse"],
    patterns: [/(acceptable use|prohibited use|prohibited activities|usage restrictions|misuse|abuse|harmful|illegal use|restricted use)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "ai_output_reliance_or_accuracy_disclaimer",
    heading: "ai_output_reliance_or_accuracy_disclaimer",
    terms: ["output", "accuracy", "reliance", "hallucination", "as is"],
    patterns: [/(output.{0,160}(accuracy|accurate|rely|reliance|hallucination|as is|warranty)|hallucination|generated output|not guaranteed)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "output_ownership_or_generated_content_allocation",
    heading: "output_ownership_or_generated_content_allocation",
    terms: ["output ownership", "generated content", "your content", "ownership"],
    patterns: [/(ownership.{0,160}(output|generated content|content)|your output|generated content|input.{0,80}output|output.{0,80}belong)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "dpa_roles_or_processing_instructions",
    heading: "dpa_roles_or_processing_instructions",
    terms: ["DPA", "controller", "processor", "processing instructions"],
    patterns: [/(data processing addendum|data processing agreement|\bDPA\b|controller|processor|processing instructions|process personal data)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "security_or_breach_control",
    heading: "security_or_breach_control",
    terms: ["security measures", "breach", "incident", "encryption", "access controls"],
    patterns: [/(security measures|technical and organisational|technical and organizational|breach|security incident|encryption|access controls|audit logs?|incident response)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "sla_or_service_credit_control",
    heading: "sla_or_service_credit_control",
    terms: ["SLA", "uptime", "service credit", "remedy"],
    patterns: [/(service level|\bSLA\b|uptime|service credit|credits|remed(y|ies)|support response)/i]
  },
  {
    signal_type: "legal_control_signal",
    control_family: "liability_or_warranty_control",
    heading: "liability_or_warranty_control",
    terms: ["limitation of liability", "liability cap", "warranty", "as is"],
    patterns: [/(limitation of liability|liability cap|warranty disclaimer|as is|indemnity|consequential damages)/i]
  }
];

function nowIso() { return new Date().toISOString(); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex"); }
function cleanText(record = {}) { return record?.text?.clean_text_lossless || ""; }
function titleOf(record = {}) { return record?.structure?.title || record?.title || ""; }
function normalizeLimit(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
function enforcementMode(value) { return String(value || "guidance").trim().toLowerCase() === "hard" ? "hard" : "guidance"; }
function shouldEnforce(budget = {}) { return enforcementMode(budget.enforcement_mode || budget.mode) === "hard"; }
function estimateSourceTokens(chars) { return Math.ceil(Number(chars || 0) / ESTIMATED_CHARS_PER_TOKEN); }
function estimateTotalPromptTokens(sourceChars, promptOverheadTokens = DEFAULT_PROMPT_OVERHEAD_TOKENS) { return estimateSourceTokens(sourceChars) + promptOverheadTokens; }
function sourceSpecificity(record = {}) { const url = String(record.final_url || record.url || "").toLowerCase(); const title = String(titleOf(record) || "").toLowerCase(); const text = cleanText(record).toLowerCase(); let score = 0; if (/terms|privacy|dpa|data-processing|acceptable-use|aup|sla|service-level|security|trust|subprocessor|compliance|legal/.test(url)) score += 40; if (/terms|privacy|dpa|data processing|acceptable use|prohibited use|sla|service level|security|trust|subprocessor|compliance/.test(title)) score += 30; if (/data processing addendum|data processing agreement|acceptable use|service level agreement|sub-?processors?|annexure|schedule|addendum|prohibited use|support services/.test(text)) score += 25; score += Math.min(cleanText(record).length, 30000) / 3000; return score; }
function sortSources(records = []) { return [...records].sort((a, b) => { const pa = SOURCE_PRIORITY[a.source_family] || 99; const pb = SOURCE_PRIORITY[b.source_family] || 99; if (pa !== pb) return pa - pb; return sourceSpecificity(b) - sourceSpecificity(a); }); }
function artifactFromRecord(record = {}) { const text = cleanText(record); return { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), word_count: record?.text?.word_count || 0, clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text), clean_text_length: text.length, estimated_source_tokens: estimateSourceTokens(text.length), coverage_status: record?.quality?.coverage_status || "unknown", full_text_in_evidence_buffer: true }; }
function evidenceFromRecord(record = {}) { const text = cleanText(record); return { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text), word_count: record?.text?.word_count || 0, estimated_source_tokens: estimateSourceTokens(text.length), clean_text_lossless: text, evidence_policy: { admitted_source: true, discovery_only: false, full_text_lossless: true, summarized: false, compressed: false, truncated_by_stage_6_adapter: false } }; }
function extractPacket(evidenceJunction = {}) { return evidenceJunction?.downstream_packets?.[LEGAL_STAGE_KEY] || null; }
function compactTargetFeatureProfile(profile = {}) { return { target_profile: profile.target_profile || {}, primary_product: profile.primary_product || {}, product_feature_map: Array.isArray(profile.product_feature_map) ? profile.product_feature_map : [], limitations: Array.isArray(profile.limitations) ? profile.limitations : [] }; }
function exclusionBase(record = {}) { const text = cleanText(record); return { evidence_source_id: record.evidence_source_id || null, source_family: record.source_family || "unknown", source_url: record.url || null, final_url: record.final_url || null, title: titleOf(record), clean_text_length: text.length, estimated_source_tokens: estimateSourceTokens(text.length), clean_text_sha256: record?.text?.clean_text_sha256 || sha256(text) }; }
function compactText(value = "") { return String(value || "").replace(/\s+/g, " ").trim(); }
function clip(value = "", max = MAX_SIGNAL_SNIPPET_CHARS) { const text = compactText(value); return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`; }
function snippetAround(text = "", index = 0) { const start = Math.max(0, index - 80); const end = Math.min(text.length, index + 220); return clip(text.slice(start, end)); }
function findSignalMatch(text = "", patterns = []) { for (const pattern of patterns) { const match = pattern.exec(text); if (match) return { index: match.index || 0, value: match[0] || "" }; } return null; }
function buildLegalControlSignalMap(records = [], generatedAt = nowIso()) {
  const signals = [];
  const seen = new Set();
  for (const record of records) {
    if (signals.length >= MAX_CONTROL_SIGNALS) break;
    const text = compactText(cleanText(record));
    if (!text) continue;
    const sourceKey = record.final_url || record.url || record.evidence_source_id || titleOf(record) || "unknown_source";
    for (const definition of LEGAL_CONTROL_SIGNAL_DEFINITIONS) {
      if (signals.length >= MAX_CONTROL_SIGNALS) break;
      const key = `${sourceKey}::${definition.signal_type}::${definition.control_family}`;
      if (seen.has(key)) continue;
      const match = findSignalMatch(text, definition.patterns);
      if (!match) continue;
      seen.add(key);
      signals.push({
        signal_id: `legal_control_signal_${signals.length + 1}`,
        signal_type: definition.signal_type,
        control_family: definition.control_family,
        source_url: record.url || null,
        final_url: record.final_url || null,
        source_family: record.source_family || "unknown",
        title: titleOf(record),
        heading_or_anchor: definition.heading,
        matched_terms: definition.terms,
        matched_text: clip(match.value, 120),
        evidence_snippet: snippetAround(text, match.index),
        evidence_policy: {
          deterministic_signal_only: true,
          not_a_legal_conclusion: true,
          not_exclude_if_decision: true,
          full_text_available_in_evidence_buffer: true
        }
      });
    }
  }
  return {
    legal_control_signal_map_version: "legal_control_signal_map_v1",
    generated_at: generatedAt,
    extraction_policy: {
      deterministic_keyword_and_heading_scan: true,
      max_signals: MAX_CONTROL_SIGNALS,
      max_snippet_chars: MAX_SIGNAL_SNIPPET_CHARS,
      map_is_reading_aid_not_legal_conclusion: true,
      stage_6_model_must_verify_against_full_text: true
    },
    signal_count: signals.length,
    signals
  };
}

export function buildLegalStackReviewInput({ sourceBundle = {}, evidenceJunction = {}, targetFeatureProfile = null, runId = null, generatedAt = nowIso(), budget = {} } = {}) {
  const packet = extractPacket(evidenceJunction);
  const packetRecords = Array.isArray(packet?.source_records) ? packet.source_records : [];
  const sortedRecords = sortSources(packetRecords);
  const maxInputChars = normalizeLimit(budget.max_input_chars) || DEFAULT_MAX_INPUT_CHARS;
  const maxEstimatedTokens = normalizeLimit(budget.max_estimated_tokens) || DEFAULT_MAX_ESTIMATED_TOKENS;
  const maxSingleSourceChars = normalizeLimit(budget.max_single_source_chars) || DEFAULT_MAX_SINGLE_SOURCE_CHARS;
  const promptOverheadTokens = normalizeLimit(budget.prompt_overhead_tokens) || DEFAULT_PROMPT_OVERHEAD_TOKENS;
  const hardMode = shouldEnforce(budget);
  const effectiveSourceTokenLimit = Math.max(0, maxEstimatedTokens - promptOverheadTokens);
  const hardTokenCharLimit = effectiveSourceTokenLimit * ESTIMATED_CHARS_PER_TOKEN;
  const effectiveCharLimit = Math.min(maxInputChars, hardTokenCharLimit);
  const included = [];
  const excluded = [];
  const budgetWarnings = [];
  let usedChars = 0;
  for (const record of sortedRecords) {
    const text = cleanText(record);
    const textLength = text.length;
    const base = exclusionBase(record);
    if (!text) { excluded.push({ ...base, reason: "empty_clean_text" }); continue; }
    const singleOver = textLength > maxSingleSourceChars;
    const totalOver = usedChars + textLength > effectiveCharLimit;
    if (singleOver) budgetWarnings.push({ ...base, reason: "single_source_exceeds_guidance" });
    if (totalOver) budgetWarnings.push({ ...base, reason: "input_budget_guidance_exceeded" });
    if (hardMode && singleOver) { excluded.push({ ...base, reason: "single_source_exceeds_max_single_source_chars" }); continue; }
    if (hardMode && totalOver) { excluded.push({ ...base, reason: "input_budget_exceeded_by_source_selection" }); continue; }
    included.push(record);
    usedChars += textLength;
  }
  const estimatedSourceTokens = estimateSourceTokens(usedChars);
  const estimatedTotalPromptTokens = estimateTotalPromptTokens(usedChars, promptOverheadTokens);
  const hardFailure = hardMode && included.length === 0 && sortedRecords.some((record) => cleanText(record).length > 0);
  const limitations = [];
  if (excluded.length) limitations.push("Some admitted legal/governance sources were excluded because hard budget enforcement was explicitly enabled. They remain preserved in the Stage 3 evidence archive.");
  if (budgetWarnings.length && !hardMode) limitations.push("Stage 6 source budget was exceeded in guidance mode; all non-empty legal/governance sources were still included to prevent silent under-reading.");
  if (hardFailure) limitations.push("No non-empty legal/governance source could fit inside the configured Stage 6 input budget without truncation.");
  const legalControlSignalMap = buildLegalControlSignalMap(included, generatedAt);
  const adapterOutput = {
    legal_stack_review_input_version: "legal_stack_review_input_v1",
    run_id: runId || `legal_stack_review_input_${Date.now()}`,
    generated_at: generatedAt,
    legal_control_signal_map: legalControlSignalMap,
    source_bundle: {
      run_id: sourceBundle.run_id || null,
      source_mode: sourceBundle.source_mode || "runtime_discovery_capture",
      target_input: sourceBundle.target_input || evidenceJunction.target_input || {},
      source_review: {
        source_bundle_version: sourceBundle.source_bundle_version || null,
        evidence_junction_version: evidenceJunction.evidence_junction_version || null,
        source_bundle_sha256: evidenceJunction.source_bundle_sha256 || sourceBundle?.scrape_meta?.hashes?.raw_footprint_sha256 || null,
        packet_id: packet?.packet_id || null,
        downstream_stage: LEGAL_STAGE_KEY,
        packet_source_count: packetRecords.length,
        included_source_count: included.length,
        excluded_source_count: excluded.length,
        legal_control_signal_count: legalControlSignalMap.signal_count,
        packet_policy: packet?.packet_policy || {},
        dedupe_groups: packet?.dedupe_groups || [],
        routed_evidence: packet?.routed_evidence || [],
        embedded_artifact_instruction: "Inspect admitted legal/governance text and legal_control_signal_map before marking embedded legal controls absent."
      },
      artifact_inventory: included.map(artifactFromRecord),
      evidence_buffer: included.map(evidenceFromRecord),
      limitations: [...(Array.isArray(sourceBundle?.source_discovery?.coverage_gaps) ? sourceBundle.source_discovery.coverage_gaps.map((gap) => typeof gap === "string" ? gap : JSON.stringify(gap)) : []), ...limitations]
    },
    target_feature_profile: compactTargetFeatureProfile(targetFeatureProfile || {}),
    input_budget: {
      budget_status: hardFailure ? "TOKEN_BUDGET_EXCEEDED" : (excluded.length ? "PARTIAL_SOURCE_SELECTION" : (budgetWarnings.length ? "GUIDANCE_EXCEEDED_FULL_PACKET_INCLUDED" : "FULL_PACKET_INCLUDED")),
      enforcement_mode: hardMode ? "hard" : "guidance",
      max_input_chars: maxInputChars,
      max_estimated_tokens: maxEstimatedTokens,
      max_single_source_chars: maxSingleSourceChars,
      prompt_overhead_tokens: promptOverheadTokens,
      source_token_estimation_ratio_chars_per_token: ESTIMATED_CHARS_PER_TOKEN,
      estimated_input_chars: usedChars,
      estimated_source_tokens: estimatedSourceTokens,
      estimated_prompt_overhead_tokens: promptOverheadTokens,
      estimated_total_prompt_tokens: estimatedTotalPromptTokens,
      estimated_input_tokens: estimatedTotalPromptTokens,
      total_packet_sources: packetRecords.length,
      included_sources: included.map(artifactFromRecord),
      excluded_sources: excluded,
      budget_warnings: budgetWarnings,
      fail_loud_if_no_source_fits: hardMode,
      text_truncated: false,
      text_summarized: false,
      text_compressed: false
    },
    adapter_policy: {
      prompt_compatibility_mode: "legacy_source_bundle_fields",
      deterministic_legal_control_signal_map_built_from_full_text: true,
      full_stage_3_archive_preserved_upstream: true,
      model_input_uses_source_level_selection_only: true,
      budget_guidance_not_hard_cap_by_default: true,
      no_text_truncation: true,
      no_text_summary: true,
      no_text_compression: true,
      target_feature_profile_validated_upstream: true,
      legal_advice_forbidden: true,
      registry_evaluation_forbidden: true
    }
  };
  if (hardFailure) return { ok: false, status: 413, error_type: "TOKEN_BUDGET_EXCEEDED", error: "No legal/governance source could fit inside the configured Stage 6 input budget without truncation.", input_budget: adapterOutput.input_budget, legal_stack_review_input: adapterOutput };
  return { ok: true, status: 200, legal_stack_review_input: adapterOutput };
}
