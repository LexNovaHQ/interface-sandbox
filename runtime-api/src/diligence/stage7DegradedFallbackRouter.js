function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value || "").trim();
}

function asUpper(value) {
  return asText(value).toUpperCase();
}

function splitTokens(value) {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  return asText(value).split(/[|,;]/).map(asText).filter(Boolean);
}

function rowArchetype(row = {}) {
  return asUpper(row?.Threat_ID || row?.threat_id || "").split("_")[0] || asUpper(row?.Archetype || row?.archetype?.code || row?.archetype || row?.archetype_code || row?.Helper_Archetype || row?.helper_archetype || "");
}

function rowSurfaces(row = {}) {
  return splitTokens(row?.Surface || row?.surface?.tokens || row?.surface?.raw || row?.surface || row?.Surface_Tokens || row?.surface_tokens || row?.Surfaces || row?.surfaces);
}

function rowText(row = {}) {
  const trigger = row?.hunter_trigger && typeof row.hunter_trigger === "object" ? row.hunter_trigger : {};
  const conditions = trigger.conditions && typeof trigger.conditions === "object" ? Object.values(trigger.conditions) : [];
  return [
    row?.Threat_ID,
    row?.threat_id,
    row?.Threat_Name,
    row?.threat_name,
    row?.Subcategory,
    row?.subcat,
    row?.sub_category,
    row?.Pain_Category,
    row?.pain_category,
    row?.Pain_Tier,
    row?.Hunter_Trigger,
    trigger.raw,
    ...conditions,
    trigger.trigger_if,
    trigger.exclude_if,
    row?.Trigger,
    row?.trigger,
    row?.Legal_Pain,
    row?.legal_pain,
    row?.Lex_Nova_Fix,
    row?.fix_route,
    row?.fp_mechanism,
    row?.fp_impact,
    row?.Authority_IN,
    row?.Authority_EU,
    row?.Authority_US
  ].map(asText).filter(Boolean).join(" | ").toLowerCase();
}

const FALLBACK_RULES = [
  {
    id: "voice_audio_speech",
    pattern: /\b(voice|audio|speech|tts|text[-\s]?to[-\s]?speech|speech[-\s]?to[-\s]?text|transcription|speaker|clone|dubbing)\b/i,
    archetypes: ["TRN", "CRT", "CMP"],
    surfaces: ["Sensitive/Biometric", "PII", "Content&IP", "Enterprise-Private"],
    subcats: ["BIO", "PRV", "INF", "HAL", "CNS", "LIA"],
    keywords: ["voice", "audio", "speech", "biometric", "synthetic", "hallucination", "consent", "output"]
  },
  {
    id: "document_upload_ocr",
    pattern: /\b(document|documents|ocr|digitisation|digitization|file upload|uploaded file|pdf|image extraction|extraction|reader|read)\b/i,
    archetypes: ["RDR"],
    surfaces: ["PII", "Content&IP", "Enterprise-Private"],
    subcats: ["PRV", "INF", "LIA", "CNS"],
    keywords: ["document", "upload", "source material", "privacy", "ip", "confidential"]
  },
  {
    id: "agent_workflow_action",
    pattern: /\b(agent|agents|workflow|orchestrat|execute|action|tool|trigger|push outcome|send|create record|update|automation|integration|crm|core banking)\b/i,
    archetypes: ["DOE", "ORC"],
    surfaces: ["Enterprise-Private", "PII", "Infrastructure"],
    subcats: ["DEC", "LIA", "CNS", "PRV", "INF"],
    keywords: ["agent", "workflow", "external action", "integration", "automation", "human review", "liability"]
  },
  {
    id: "hr_employment_decisioning",
    pattern: /\b(hr|human resources|employment|employee|candidate|recruit|screening|hiring|workforce|interview)\b/i,
    archetypes: ["JDG", "RDR"],
    surfaces: ["Employment", "PII", "Enterprise-Private"],
    subcats: ["DEC", "PRV", "LIA", "CNS"],
    keywords: ["employment", "candidate", "decision", "human review", "privacy"]
  },
  {
    id: "financial_payment_banking",
    pattern: /\b(finance|financial|payment|payments|bank|banking|loan|credit|pricing|trading|core banking|transaction|billing)\b/i,
    archetypes: ["OPT", "DOE", "ORC", "JDG"],
    surfaces: ["Financial", "PII", "Enterprise-Private"],
    subcats: ["TRD", "DEC", "PRV", "LIA", "CNS"],
    keywords: ["financial", "payment", "loan", "pricing", "transaction", "market", "liability"]
  },
  {
    id: "model_api_infrastructure",
    pattern: /\b(model|models|api|sdk|developer|provider|subprocessor|infrastructure|cloud|hosting|vector|rag|fine[-\s]?tuning|integration|platform)\b/i,
    archetypes: ["ORC", "UNI"],
    surfaces: ["Infrastructure", "Enterprise-Private", "PII"],
    subcats: ["INF", "PRV", "LIA", "CNS"],
    keywords: ["model", "api", "subprocessor", "infrastructure", "provider", "training", "security"]
  },
  {
    id: "content_generation_translation",
    pattern: /\b(content|generate|generation|translation|translate|dubbing|subtitle|text|image|code|creative|output)\b/i,
    archetypes: ["CRT", "TRN", "RDR"],
    surfaces: ["Content&IP", "PII", "Enterprise-Private"],
    subcats: ["INF", "HAL", "CNS", "FRD", "LIA"],
    keywords: ["content", "translation", "output", "ip", "hallucination", "disclaimer", "consent"]
  }
];

function candidateText(candidate = {}) {
  return [
    candidate.candidate_name,
    candidate.previous_feature_id,
    candidate.reason,
    candidate.source_url,
    candidate.recommended_downstream_handling,
    candidate.candidate_type,
    candidate.product_area,
    candidate.deterministic_signals,
    candidate.possible_archetypes,
    candidate.possible_surfaces
  ].flatMap((item) => Array.isArray(item) ? item : [item]).map(asText).filter(Boolean).join(" | ");
}

function addAll(target, values = []) {
  for (const value of values) {
    const text = asText(value);
    if (text) target.add(text);
  }
}

function candidateRef(candidate = {}, index = 0) {
  return asText(candidate.previous_feature_id) || asText(candidate.candidate_id) || `UNRESOLVED_CANDIDATE_${index + 1}`;
}

export function buildStage5DegradedFallbackContext(profile = {}) {
  const quality = profile?.classification_quality || {};
  const unresolved = asArray(profile?.unresolved_feature_candidates);
  const fallbackRequired = quality?.fallback_routing_required === true || asUpper(quality?.status) === "DEGRADED" || unresolved.length > 0;
  const context = {
    fallback_context_version: "stage7_stage5_degraded_fallback_v1",
    enabled: false,
    classification_status: asText(quality?.status) || "UNKNOWN",
    fallback_routing_required: Boolean(fallbackRequired),
    unresolved_candidate_count: unresolved.length,
    inferred_archetypes: [],
    inferred_surfaces: [],
    inferred_subcats: [],
    inferred_keywords: [],
    candidate_refs: [],
    signal_rules_triggered: [],
    warnings: []
  };

  if (!fallbackRequired || !unresolved.length) return context;

  const archetypes = new Set();
  const surfaces = new Set();
  const subcats = new Set();
  const keywords = new Set();
  const refs = new Set();
  const rulesTriggered = new Set();

  unresolved.forEach((candidate, index) => {
    const text = candidateText(candidate);
    refs.add(candidateRef(candidate, index));
    for (const rule of FALLBACK_RULES) {
      if (!rule.pattern.test(text)) continue;
      rulesTriggered.add(rule.id);
      addAll(archetypes, rule.archetypes);
      addAll(surfaces, rule.surfaces);
      addAll(subcats, rule.subcats);
      addAll(keywords, rule.keywords);
    }
  });

  if (!rulesTriggered.size) {
    context.warnings.push("STAGE5_DEGRADED_FALLBACK_NO_SIGNAL_RULE_MATCH: unresolved candidates existed but no deterministic fallback signal rule matched.");
    return { ...context, candidate_refs: [...refs] };
  }

  return {
    ...context,
    enabled: true,
    inferred_archetypes: [...archetypes].sort(),
    inferred_surfaces: [...surfaces].sort(),
    inferred_subcats: [...subcats].sort(),
    inferred_keywords: [...keywords].sort(),
    candidate_refs: [...refs].sort(),
    signal_rules_triggered: [...rulesTriggered].sort()
  };
}

export function isStage5DegradedFallbackRow(row = {}, fallbackContext = {}) {
  if (!fallbackContext?.enabled) return false;
  const archetype = rowArchetype(row);
  if (archetype && asArray(fallbackContext.inferred_archetypes).map(asUpper).includes(archetype)) return true;

  const surfaces = rowSurfaces(row);
  if (surfaces.some((surface) => asArray(fallbackContext.inferred_surfaces).includes(surface))) return true;

  const text = rowText(row);
  if (asArray(fallbackContext.inferred_subcats).some((subcat) => new RegExp(`\\b${subcat}\\b`, "i").test(text))) return true;
  if (asArray(fallbackContext.inferred_keywords).some((keyword) => keyword && text.includes(String(keyword).toLowerCase()))) return true;

  return false;
}
