const ALLOWED_ARCHETYPE_CODES = new Set(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);
const ARCHETYPE_LABELS = Object.freeze({
  UNI: "Universal",
  DOE: "The Doer",
  JDG: "The Judge",
  CMP: "The Companion",
  CRT: "The Creator",
  RDR: "The Reader",
  ORC: "The Orchestrator",
  TRN: "The Translator",
  SHD: "The Shield",
  OPT: "The Optimizer",
  MOV: "The Mover"
});
const ALLOWED_SURFACE_TOKENS = new Set([
  "Consumer-Public",
  "Enterprise-Private",
  "PII",
  "Employment",
  "Sensitive/Biometric",
  "Financial",
  "Content&IP",
  "Safety&Physical",
  "Infrastructure",
  "Minors"
]);
const ALLOWED_CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);
const ALLOWED_TRI_STATE = new Set(["true", "false", "unknown"]);
const ALLOWED_AUTONOMY_LEVELS = new Set(["none", "draft", "recommend", "execute", "unknown"]);
const ALLOWED_HUMAN_REVIEW_SIGNALS = new Set(["required", "optional", "not_visible", "unknown"]);
const ALLOWED_INT_EXT = new Set(["internal", "external", "both", "unknown"]);
const ALLOWED_ARCH_HINT_TYPES = new Set(["memory", "model_provider", "cloud_host", "vector_db", "subprocessor", "integration", "unknown"]);
const ALLOWED_ARCH_HINT_DISPOSITIONS = new Set(["prefill_candidate", "confirmation_only", "ignore"]);
const ALLOWED_DATA_ORIGINS = new Set(["user_provided", "customer_provided", "third_party_source", "public_web", "system_generated", "unknown"]);
const ALLOWED_DATA_SUBJECTS = new Set(["user", "customer", "employee", "consumer", "developer", "child", "business_entity", "unknown"]);
const ALLOWED_DATA_CATEGORIES = new Set(["prompt", "account", "contact", "uploaded_file", "generated_output", "audio", "text", "document", "image", "video", "code", "api_payload", "payment", "usage_log", "support", "sensitive", "unknown"]);

const FORBIDDEN_KEYS = new Set([
  "target_profile",
  "primary_product",
  "raw_feature_candidates",
  "feature_map_scratchpad",
  "company_name",
  "website",
  "legal_entity",
  "hq_jurisdiction",
  "actual_processing_location",
  "data_sovereignty_signature",
  "legal_stack_review",
  "document_stack_redline",
  "legal_stack_assessment",
  "registry_ledger",
  "registry_evaluation",
  "final_status",
  "controlled_rows",
  "insufficient_evidence_rows",
  "operator_challenge",
  "report_data",
  "technical_audit_log",
  "assembly_route",
  "vault_confirmation_questions",
  "vault_prefill_suggestions",
  "vault_payload",
  "handoff_envelope",
  "assembly_handoff",
  "html"
]);
const FORBIDDEN_THREAT_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);

function issue(keyword, severity, instancePath, message, params = {}) {
  return {
    keyword,
    severity,
    instancePath,
    schemaPath: "#/targetFeatureProfileGuardrails",
    message,
    params
  };
}

function pushBlocking(errors, instancePath, message, params = {}) {
  errors.push(issue("target_feature_profile_guardrail", "BLOCKING", instancePath, message, params));
}

function pushWarning(warnings, instancePath, message, params = {}) {
  warnings.push(issue("target_feature_profile_guardrail_warning", "WARNING", instancePath, message, params));
}

function walkKeys(value, errors, path = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkKeys(item, errors, `${path}/${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key}`;
    if (FORBIDDEN_KEYS.has(key)) pushBlocking(errors, childPath, `forbidden key emitted: ${key}`, { key });
    if (typeof child === "string" && FORBIDDEN_THREAT_STATUSES.has(child.trim())) {
      pushBlocking(errors, childPath, `forbidden registry status emitted: ${child}`, { value: child });
    }
    walkKeys(child, errors, childPath);
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\bdigitisation\b/g, "digitization")
    .replace(/\bdigitise\b/g, "digitize")
    .replace(/\bdigitised\b/g, "digitized")
    .replace(/\bdigitising\b/g, "digitizing")
    .replace(/\bdiarisation\b/g, "diarization")
    .replace(/\borganisation\b/g, "organization")
    .replace(/\borganisational\b/g, "organizational")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return String(value || "").trim();
  }
}

function evidenceUrlKeys(record = {}) {
  return [record.source_url, record.final_url, record.url, record.feature_source_url]
    .filter((value) => typeof value === "string" && value.trim())
    .flatMap((value) => {
      const normalized = normalizeUrl(value);
      return [value.trim(), normalized].filter(Boolean);
    });
}

function buildEvidenceIndex(evidenceBuffer = []) {
  const byUrl = new Map();
  const all = [];
  for (const record of Array.isArray(evidenceBuffer) ? evidenceBuffer : []) {
    const text = record?.clean_text_lossless || record?.text?.clean_text_lossless || record?.evidence_text || "";
    const indexed = {
      evidence_source_id: record?.evidence_source_id || record?.source_id || null,
      source_family: record?.source_family || record?.evidence_scope || "unknown",
      source_url: record?.source_url || record?.url || null,
      final_url: record?.final_url || null,
      clean_text_lossless: text,
      normalized_text: normalizeText(text)
    };
    all.push(indexed);
    for (const key of evidenceUrlKeys(record)) {
      if (!byUrl.has(key)) byUrl.set(key, []);
      byUrl.get(key).push(indexed);
    }
  }
  return { byUrl, all };
}

function quoteFragments(quote) {
  const normalized = normalizeText(quote);
  if (!normalized) return [];
  return normalized
    .split(/(?<=[.!?;:])\s+|\s+-\s+|\s+•\s+/u)
    .map((fragment) => fragment.replace(/^[\s,.;:!?()"']+|[\s,.;:!?()"']+$/g, "").trim())
    .filter((fragment) => {
      if (fragment.length >= 18) return true;
      return fragment.split(/\s+/).filter(Boolean).length >= 2 && fragment.length >= 8;
    });
}

function tokenSet(value) {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "into", "your", "you", "our", "are", "can", "will", "api", "apis", "built", "accurate", "source", "model"]);
  return new Set(normalizeText(value).split(/[^a-z0-9]+/).filter((token) => token.length >= 4 && !stop.has(token)));
}

function overlapScore(needle, candidate) {
  const n = tokenSet(needle);
  const c = tokenSet(candidate);
  if (!n.size || !c.size) return 0;
  let hits = 0;
  for (const token of n) if (c.has(token)) hits += 1;
  return hits / Math.max(3, n.size);
}

function candidateSnippets(text = "") {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const sentenceLike = cleaned
    .split(/(?<=[.!?])\s+|\s+[|•]\s+|\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 25 && item.length <= 520);
  const words = cleaned.split(/\s+/).filter(Boolean);
  const windows = [];
  for (let i = 0; i < words.length; i += 8) {
    const window = words.slice(i, i + 60).join(" ").trim();
    if (window.length >= 25 && window.length <= 800) windows.push(window);
  }
  return [...new Set([...sentenceLike, ...windows])];
}

function findQuoteMatch(quote, record) {
  const normalizedQuote = normalizeText(quote);
  if (!normalizedQuote) return null;
  if (record.normalized_text.includes(normalizedQuote)) {
    return { status: "exact_or_normalized", replacement: String(quote || "").trim() };
  }
  const fragments = quoteFragments(quote);
  if (fragments.length >= 2) {
    const positions = [];
    let coveredChars = 0;
    for (const fragment of fragments) {
      const index = record.normalized_text.indexOf(fragment);
      if (index === -1) {
        positions.length = 0;
        break;
      }
      positions.push(index);
      coveredChars += fragment.length;
    }
    if (positions.length) {
      const min = Math.min(...positions);
      const max = Math.max(...positions);
      const quoteLength = normalizedQuote.length || 1;
      const coverage = coveredChars / quoteLength;
      if (coverage >= 0.72 && max - min <= 900) {
        let best = null;
        for (const candidate of candidateSnippets(record.clean_text_lossless)) {
          const score = overlapScore(quote, candidate);
          if (!best || score > best.score) best = { quote: candidate, score };
        }
        if (best && best.score >= 0.18) return { status: "local_window_repaired", replacement: best.quote };
        return { status: "local_window_warning", replacement: null };
      }
    }
  }
  let best = null;
  for (const candidate of candidateSnippets(record.clean_text_lossless)) {
    const score = overlapScore(quote, candidate);
    if (!best || score > best.score) best = { quote: candidate, score };
  }
  if (best && best.score >= 0.32) return { status: "token_overlap_repaired", replacement: best.quote };
  return null;
}

function matchingEvidenceRecords(sourceUrl, evidenceIndex) {
  const keys = evidenceUrlKeys({ source_url: sourceUrl });
  const matches = [];
  const seen = new Set();
  for (const key of keys) {
    for (const record of evidenceIndex.byUrl.get(key) || []) {
      const id = `${record.evidence_source_id || ""}|${record.source_url || ""}|${record.final_url || ""}`;
      if (seen.has(id)) continue;
      seen.add(id);
      matches.push(record);
    }
  }
  return matches;
}

function writeWarningToLimitations(profile, warning) {
  if (!profile || typeof profile !== "object") return;
  if (!Array.isArray(profile.limitations)) profile.limitations = [];
  const mapped = `GUARDRAIL_WARNING ${warning.instancePath || "/"}: ${warning.message} ${JSON.stringify(warning.params || {})}`;
  if (!profile.limitations.includes(mapped)) profile.limitations.push(mapped);
}

function verifyQuoteSource({ owner, quoteKey = "evidence_quote", sourceKey = "source_url", base, profile }, errors, warnings, repairs, evidenceIndex) {
  const quote = owner?.[quoteKey];
  const sourceUrl = owner?.[sourceKey];
  if (!nonEmptyString(quote) || !nonEmptyString(sourceUrl)) return;
  const sourceMatches = matchingEvidenceRecords(sourceUrl, evidenceIndex);
  if (!sourceMatches.length) {
    pushBlocking(errors, `${base}/${sourceKey}`, `${sourceKey} must match an admitted evidence_buffer source URL`, { source_url: sourceUrl });
    return;
  }
  for (const record of sourceMatches) {
    const match = findQuoteMatch(quote, record);
    if (!match) continue;
    if (match.replacement && normalizeText(match.replacement) !== normalizeText(quote)) {
      owner[quoteKey] = match.replacement;
      repairs.push({ instancePath: `${base}/${quoteKey}`, action: "quote_replaced_with_admitted_source_text", source_url: sourceUrl, original_quote: quote, repaired_quote: match.replacement, match_status: match.status });
    }
    return;
  }
  const warning = issue("target_feature_profile_guardrail_warning", "WARNING", `${base}/${quoteKey}`, `${quoteKey} did not exactly map to admitted clean_text_lossless; passed with warning`, { source_url: sourceUrl, evidence_quote: quote });
  warnings.push(warning);
  writeWarningToLimitations(profile, warning);
}

function validateEnum(value, allowed, errors, path, label) {
  if (!allowed.has(value)) pushBlocking(errors, path, `${label} has invalid value: ${value}`, { value });
}

function collectFeatureIds(features) {
  return new Set(features.map((feature) => feature?.feature_id).filter((id) => typeof id === "string" && id.trim()));
}

function validateDataProvenanceEntry(item, { errors, warnings, repairs, evidenceIndex, base, profile }) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    pushBlocking(errors, base, "data provenance entry must be an object");
    return;
  }
  if (!ALLOWED_DATA_ORIGINS.has(item.data_origin)) pushBlocking(errors, `${base}/data_origin`, `data_origin has invalid value: ${item.data_origin}`, { value: item.data_origin });
  if (!ALLOWED_DATA_SUBJECTS.has(item.data_subject)) pushBlocking(errors, `${base}/data_subject`, `data_subject has invalid value: ${item.data_subject}`, { value: item.data_subject });
  if (!ALLOWED_DATA_CATEGORIES.has(item.data_category)) pushBlocking(errors, `${base}/data_category`, `data_category has invalid value: ${item.data_category}`, { value: item.data_category });
  if (!nonEmptyString(item.processing_context)) pushBlocking(errors, `${base}/processing_context`, "data provenance requires processing_context");
  if (!nonEmptyString(item.storage_or_retention_signal)) pushBlocking(errors, `${base}/storage_or_retention_signal`, "data provenance requires storage_or_retention_signal");
  if (!nonEmptyString(item.training_or_finetuning_signal)) pushBlocking(errors, `${base}/training_or_finetuning_signal`, "data provenance requires training_or_finetuning_signal");
  if (!nonEmptyString(item.evidence_quote)) pushBlocking(errors, `${base}/evidence_quote`, "data provenance requires evidence_quote");
  if (!nonEmptyString(item.source_url)) pushBlocking(errors, `${base}/source_url`, "data provenance requires source_url");
  if (item.confidence) validateEnum(item.confidence, ALLOWED_CONFIDENCE, errors, `${base}/confidence`, "data confidence");
  verifyQuoteSource({ owner: item, base, profile }, errors, warnings, repairs, evidenceIndex);
}

function validateProvenanceQuoteList(list, { errors, warnings, repairs, evidenceIndex, base, kind, profile }) {
  if (!Array.isArray(list)) return;
  list.forEach((item, index) => {
    const path = `${base}/${index}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      pushBlocking(errors, path, `${kind} provenance entry must be an object`);
      return;
    }
    if (!nonEmptyString(item.evidence_quote)) pushBlocking(errors, `${path}/evidence_quote`, `${kind} provenance requires evidence_quote`);
    if (!nonEmptyString(item.source_url)) pushBlocking(errors, `${path}/source_url`, `${kind} provenance requires source_url`);
    if (item.confidence) validateEnum(item.confidence, ALLOWED_CONFIDENCE, errors, `${path}/confidence`, `${kind} confidence`);
    verifyQuoteSource({ owner: item, base: path, profile }, errors, warnings, repairs, evidenceIndex);
  });
}

function validateFeature(feature, index, { errors, warnings, repairs, evidenceIndex, seenIds, threatMappingSupplied, profile }) {
  const base = `/feature_inventory/${index}`;
  if (!feature || typeof feature !== "object" || Array.isArray(feature)) {
    pushBlocking(errors, base, "feature must be an object");
    return;
  }
  if (!nonEmptyString(feature.feature_id)) {
    pushBlocking(errors, `${base}/feature_id`, "feature_id must be non-empty");
  } else if (seenIds.has(feature.feature_id)) {
    pushBlocking(errors, `${base}/feature_id`, "feature_id must be unique", { feature_id: feature.feature_id });
  } else {
    seenIds.add(feature.feature_id);
  }
  if (!["CORE", "SECONDARY"].includes(feature.feature_role)) pushBlocking(errors, `${base}/feature_role`, "feature_role must be CORE or SECONDARY", { feature_role: feature.feature_role });
  if (feature.autonomy_level) validateEnum(feature.autonomy_level, ALLOWED_AUTONOMY_LEVELS, errors, `${base}/autonomy_level`, "autonomy_level");
  if (feature.human_review_signal) validateEnum(feature.human_review_signal, ALLOWED_HUMAN_REVIEW_SIGNALS, errors, `${base}/human_review_signal`, "human_review_signal");
  if (feature.external_action_signal) validateEnum(feature.external_action_signal, ALLOWED_TRI_STATE, errors, `${base}/external_action_signal`, "external_action_signal");
  if (feature.confidence) validateEnum(feature.confidence, ALLOWED_CONFIDENCE, errors, `${base}/confidence`, "feature confidence");
  if (!nonEmptyString(feature.feature_name)) pushBlocking(errors, `${base}/feature_name`, "feature_name must be non-empty");
  if (!nonEmptyString(feature.commercial_function)) pushBlocking(errors, `${base}/commercial_function`, "commercial_function must be non-empty");
  if (!nonEmptyString(feature.feature_description)) pushBlocking(errors, `${base}/feature_description`, "feature_description must be non-empty");
  if (!nonEmptyString(feature.system_action)) pushBlocking(errors, `${base}/system_action`, "system_action must be non-empty");
  if (!nonEmptyString(feature.output_or_result)) pushBlocking(errors, `${base}/output_or_result`, "output_or_result must be non-empty");
  if (!nonEmptyString(feature.evidence_quote)) pushBlocking(errors, `${base}/evidence_quote`, "evidence_quote must be non-empty for every final feature");
  if (!nonEmptyString(feature.feature_source_url)) pushBlocking(errors, `${base}/feature_source_url`, "feature_source_url must be non-empty for every final feature");
  verifyQuoteSource({ owner: feature, quoteKey: "evidence_quote", sourceKey: "feature_source_url", base, profile }, errors, warnings, repairs, evidenceIndex);

  const channels = feature.delivery_channels || {};
  for (const channel of ["app", "api", "web"]) validateEnum(channels[channel], ALLOWED_TRI_STATE, errors, `${base}/delivery_channels/${channel}`, `delivery_channels.${channel}`);

  const dataProvenance = Array.isArray(feature.data_provenance) ? feature.data_provenance : [];
  if (dataProvenance.length === 0) pushBlocking(errors, `${base}/data_provenance`, "every emitted feature requires at least one data provenance entry");
  dataProvenance.forEach((item, provenanceIndex) => validateDataProvenanceEntry(item, { errors, warnings, repairs, evidenceIndex, base: `${base}/data_provenance/${provenanceIndex}`, profile }));

  const codes = Array.isArray(feature.archetype_codes) ? feature.archetype_codes : [];
  const labels = Array.isArray(feature.archetype_labels) ? feature.archetype_labels : [];
  const archetypeProvenance = Array.isArray(feature.archetype_provenance) ? feature.archetype_provenance : [];
  const provenanceCodes = new Set(archetypeProvenance.map((entry) => entry?.archetype_code).filter(Boolean));
  for (const code of codes) {
    if (!ALLOWED_ARCHETYPE_CODES.has(code)) pushBlocking(errors, `${base}/archetype_codes`, `invalid archetype code: ${code}`, { code });
    if (!provenanceCodes.has(code)) pushBlocking(errors, `${base}/archetype_provenance`, `missing archetype provenance for code: ${code}`, { code });
  }
  for (const entry of archetypeProvenance) {
    if (entry?.archetype_code && !codes.includes(entry.archetype_code)) pushBlocking(errors, `${base}/archetype_provenance`, `archetype provenance emitted without matching archetype code: ${entry.archetype_code}`, { code: entry.archetype_code });
  }
  for (const code of codes.filter((item) => ALLOWED_ARCHETYPE_CODES.has(item))) {
    const expected = ARCHETYPE_LABELS[code];
    if (!labels.includes(expected)) pushBlocking(errors, `${base}/archetype_labels`, `missing archetype label for code: ${code}`, { expected });
  }
  validateProvenanceQuoteList(archetypeProvenance, { errors, warnings, repairs, evidenceIndex, base: `${base}/archetype_provenance`, kind: "archetype", profile });

  const surfaces = Array.isArray(feature.surface_tokens) ? feature.surface_tokens : [];
  const surfaceProvenance = Array.isArray(feature.surface_provenance) ? feature.surface_provenance : [];
  const provenanceSurfaces = new Set(surfaceProvenance.map((entry) => entry?.surface_token).filter(Boolean));
  for (const token of surfaces) {
    if (!ALLOWED_SURFACE_TOKENS.has(token)) pushBlocking(errors, `${base}/surface_tokens`, `invalid surface token: ${token}`, { token });
    if (!provenanceSurfaces.has(token)) pushBlocking(errors, `${base}/surface_provenance`, `missing surface provenance for token: ${token}`, { token });
  }
  for (const entry of surfaceProvenance) {
    if (entry?.surface_token && !surfaces.includes(entry.surface_token)) pushBlocking(errors, `${base}/surface_provenance`, `surface provenance emitted without matching surface token: ${entry.surface_token}`, { token: entry.surface_token });
  }
  validateProvenanceQuoteList(surfaceProvenance, { errors, warnings, repairs, evidenceIndex, base: `${base}/surface_provenance`, kind: "surface", profile });

  const threats = Array.isArray(feature.linked_threat_ids) ? feature.linked_threat_ids : [];
  if (!threatMappingSupplied && threats.length > 0) pushBlocking(errors, `${base}/linked_threat_ids`, "linked_threat_ids must be empty unless explicit threat mapping context was supplied", { linked_threat_ids: threats });
}

function validateTopLevelMaps(profile, { errors, warnings, repairs, evidenceIndex, featureIds }) {
  const dataMap = Array.isArray(profile.data_provenance_map) ? profile.data_provenance_map : [];
  dataMap.forEach((entry, index) => {
    const base = `/data_provenance_map/${index}`;
    if (!entry?.feature_id || !featureIds.has(entry.feature_id)) pushBlocking(errors, `${base}/feature_id`, "data provenance feature_id must reference feature_inventory", { feature_id: entry?.feature_id });
    if (!nonEmptyString(entry?.provenance_id)) pushBlocking(errors, `${base}/provenance_id`, "data_provenance_map entry requires provenance_id");
    validateDataProvenanceEntry(entry, { errors, warnings, repairs, evidenceIndex, base, profile });
  });

  const regulated = Array.isArray(profile.regulated_surface_map) ? profile.regulated_surface_map : [];
  regulated.forEach((entry, index) => {
    const base = `/regulated_surface_map/${index}`;
    if (!featureIds.has(entry?.feature_id)) pushBlocking(errors, `${base}/feature_id`, "regulated surface feature_id must reference feature_inventory", { feature_id: entry?.feature_id });
    if (entry?.surface_token && !ALLOWED_SURFACE_TOKENS.has(entry.surface_token)) pushBlocking(errors, `${base}/surface_token`, `invalid surface token: ${entry.surface_token}`, { token: entry.surface_token });
    if (entry?.int_ext_classification) validateEnum(entry.int_ext_classification, ALLOWED_INT_EXT, errors, `${base}/int_ext_classification`, "int_ext_classification");
    if (entry?.confidence) validateEnum(entry.confidence, ALLOWED_CONFIDENCE, errors, `${base}/confidence`, "regulated surface confidence");
  });

  const hints = Array.isArray(profile.architecture_hints) ? profile.architecture_hints : [];
  hints.forEach((entry, index) => {
    const base = `/architecture_hints/${index}`;
    if (!featureIds.has(entry?.feature_id)) pushBlocking(errors, `${base}/feature_id`, "architecture hint feature_id must reference feature_inventory", { feature_id: entry?.feature_id });
    if (entry?.hint_type) validateEnum(entry.hint_type, ALLOWED_ARCH_HINT_TYPES, errors, `${base}/hint_type`, "hint_type");
    if (entry?.disposition) validateEnum(entry.disposition, ALLOWED_ARCH_HINT_DISPOSITIONS, errors, `${base}/disposition`, "disposition");
    if (entry?.confidence) validateEnum(entry.confidence, ALLOWED_CONFIDENCE, errors, `${base}/confidence`, "architecture hint confidence");
    verifyQuoteSource({ owner: entry, base, profile }, errors, warnings, repairs, evidenceIndex);
  });

  if (profile?.vault_feature_candidates && Object.prototype.hasOwnProperty.call(profile.vault_feature_candidates, "architecture")) pushBlocking(errors, "/vault_feature_candidates/architecture", "Stage 5 must not emit architecture Vault candidates");
}

function validateCompatibilityAlias(profile, warnings) {
  const alias = Array.isArray(profile.product_feature_map) ? profile.product_feature_map : [];
  if (alias.length) {
    const warning = issue("target_feature_profile_guardrail_warning", "WARNING", "/product_feature_map", "product_feature_map is legacy; cleared and ignored in favor of canonical feature_inventory", { count: alias.length });
    warnings.push(warning);
    writeWarningToLimitations(profile, warning);
    profile.product_feature_map = [];
  }
}

export function validateTargetFeatureProfileGuardrails(profile, { threatMappingSupplied = false, evidenceBuffer = [] } = {}) {
  const errors = [];
  const warnings = [];
  const repairs = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    pushBlocking(errors, "", "target_feature_profile must be an object");
    return { ok: false, errors, warnings, repairs };
  }
  const evidenceIndex = buildEvidenceIndex(evidenceBuffer);
  walkKeys(profile, errors, "");
  if (profile.feature_profile_version !== "feature_profile_v2") pushBlocking(errors, "/feature_profile_version", "feature_profile_version must be feature_profile_v2", { value: profile.feature_profile_version });
  const features = Array.isArray(profile.feature_inventory) ? profile.feature_inventory : [];
  const seenIds = new Set();
  features.forEach((feature, index) => validateFeature(feature, index, { errors, warnings, repairs, evidenceIndex, seenIds, threatMappingSupplied, profile }));
  const featureIds = collectFeatureIds(features);
  validateCompatibilityAlias(profile, warnings);
  validateTopLevelMaps(profile, { errors, warnings, repairs, evidenceIndex, featureIds });
  return { ok: errors.length === 0, errors, warnings, repairs };
}
