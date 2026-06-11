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

function push(errors, instancePath, message, params = {}) {
  errors.push({
    keyword: "target_feature_profile_guardrail",
    instancePath,
    schemaPath: "#/targetFeatureProfileGuardrails",
    message,
    params
  });
}

function walkKeys(value, errors, path = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkKeys(item, errors, `${path}/${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key}`;
    if (FORBIDDEN_KEYS.has(key)) push(errors, childPath, `forbidden key emitted: ${key}`, { key });
    if (typeof child === "string" && FORBIDDEN_THREAT_STATUSES.has(child.trim())) {
      push(errors, childPath, `forbidden registry status emitted: ${child}`, { value: child });
    }
    walkKeys(child, errors, childPath);
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
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

function quoteAppearsInSource(quote, sourceRecords = []) {
  const normalizedQuote = normalizeText(quote);
  if (!normalizedQuote) return false;
  return sourceRecords.some((record) => record.normalized_text.includes(normalizedQuote));
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

function verifyQuoteSource({ quote, sourceUrl, base, quoteKey = "evidence_quote", sourceKey = "source_url" }, errors, evidenceIndex) {
  if (!nonEmptyString(quote) || !nonEmptyString(sourceUrl)) return;
  const sourceMatches = matchingEvidenceRecords(sourceUrl, evidenceIndex);
  if (!sourceMatches.length) {
    push(errors, `${base}/${sourceKey}`, `${sourceKey} must match an admitted evidence_buffer source URL`, { source_url: sourceUrl });
    return;
  }
  if (!quoteAppearsInSource(quote, sourceMatches)) {
    push(errors, `${base}/${quoteKey}`, `${quoteKey} must appear in admitted clean_text_lossless for ${sourceKey}`, {
      source_url: sourceUrl,
      evidence_quote: quote
    });
  }
}

function validateEnum(value, allowed, errors, path, label) {
  if (!allowed.has(value)) push(errors, path, `${label} has invalid value: ${value}`, { value });
}

function collectFeatureIds(features) {
  return new Set(features.map((feature) => feature?.feature_id).filter((id) => typeof id === "string" && id.trim()));
}

function validateProvenanceQuoteList(list, { errors, evidenceIndex, base, kind }) {
  if (!Array.isArray(list)) return;
  list.forEach((item, index) => {
    const path = `${base}/${index}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      push(errors, path, `${kind} provenance entry must be an object`);
      return;
    }
    if (!nonEmptyString(item.evidence_quote)) push(errors, `${path}/evidence_quote`, `${kind} provenance requires evidence_quote`);
    if (!nonEmptyString(item.source_url)) push(errors, `${path}/source_url`, `${kind} provenance requires source_url`);
    if (item.confidence) validateEnum(item.confidence, ALLOWED_CONFIDENCE, errors, `${path}/confidence`, `${kind} confidence`);
    verifyQuoteSource({ quote: item.evidence_quote, sourceUrl: item.source_url, base: path }, errors, evidenceIndex);
  });
}

function validateFeature(feature, index, { errors, evidenceIndex, seenIds, threatMappingSupplied }) {
  const base = `/feature_inventory/${index}`;
  if (!feature || typeof feature !== "object" || Array.isArray(feature)) {
    push(errors, base, "feature must be an object");
    return;
  }

  if (!nonEmptyString(feature.feature_id)) {
    push(errors, `${base}/feature_id`, "feature_id must be non-empty");
  } else if (seenIds.has(feature.feature_id)) {
    push(errors, `${base}/feature_id`, "feature_id must be unique", { feature_id: feature.feature_id });
  } else {
    seenIds.add(feature.feature_id);
  }

  if (!["CORE", "SECONDARY"].includes(feature.feature_role)) push(errors, `${base}/feature_role`, "feature_role must be CORE or SECONDARY", { feature_role: feature.feature_role });
  if (feature.autonomy_level) validateEnum(feature.autonomy_level, ALLOWED_AUTONOMY_LEVELS, errors, `${base}/autonomy_level`, "autonomy_level");
  if (feature.human_review_signal) validateEnum(feature.human_review_signal, ALLOWED_HUMAN_REVIEW_SIGNALS, errors, `${base}/human_review_signal`, "human_review_signal");
  if (feature.external_action_signal) validateEnum(feature.external_action_signal, ALLOWED_TRI_STATE, errors, `${base}/external_action_signal`, "external_action_signal");
  if (feature.confidence) validateEnum(feature.confidence, ALLOWED_CONFIDENCE, errors, `${base}/confidence`, "feature confidence");

  if (!nonEmptyString(feature.feature_name)) push(errors, `${base}/feature_name`, "feature_name must be non-empty");
  if (!nonEmptyString(feature.commercial_function)) push(errors, `${base}/commercial_function`, "commercial_function must be non-empty");
  if (!nonEmptyString(feature.feature_description)) push(errors, `${base}/feature_description`, "feature_description must be non-empty");
  if (!nonEmptyString(feature.system_action)) push(errors, `${base}/system_action`, "system_action must be non-empty");
  if (!nonEmptyString(feature.output_or_result)) push(errors, `${base}/output_or_result`, "output_or_result must be non-empty");
  if (!nonEmptyString(feature.evidence_quote)) push(errors, `${base}/evidence_quote`, "evidence_quote must be non-empty for every final feature");
  if (!nonEmptyString(feature.feature_source_url)) push(errors, `${base}/feature_source_url`, "feature_source_url must be non-empty for every final feature");

  verifyQuoteSource({ quote: feature.evidence_quote, sourceUrl: feature.feature_source_url, base, sourceKey: "feature_source_url" }, errors, evidenceIndex);

  const channels = feature.delivery_channels || {};
  for (const channel of ["app", "api", "web"]) {
    validateEnum(channels[channel], ALLOWED_TRI_STATE, errors, `${base}/delivery_channels/${channel}`, `delivery_channels.${channel}`);
  }

  const codes = Array.isArray(feature.archetype_codes) ? feature.archetype_codes : [];
  const labels = Array.isArray(feature.archetype_labels) ? feature.archetype_labels : [];
  const archetypeProvenance = Array.isArray(feature.archetype_provenance) ? feature.archetype_provenance : [];
  const provenanceCodes = new Set(archetypeProvenance.map((entry) => entry?.archetype_code).filter(Boolean));
  for (const code of codes) {
    if (!ALLOWED_ARCHETYPE_CODES.has(code)) push(errors, `${base}/archetype_codes`, `invalid archetype code: ${code}`, { code });
    if (!provenanceCodes.has(code)) push(errors, `${base}/archetype_provenance`, `missing archetype provenance for code: ${code}`, { code });
  }
  for (const entry of archetypeProvenance) {
    if (entry?.archetype_code && !codes.includes(entry.archetype_code)) {
      push(errors, `${base}/archetype_provenance`, `archetype provenance emitted without matching archetype code: ${entry.archetype_code}`, { code: entry.archetype_code });
    }
  }
  const expectedLabels = codes.filter((code) => ALLOWED_ARCHETYPE_CODES.has(code)).map((code) => ARCHETYPE_LABELS[code]);
  for (const expected of expectedLabels) {
    if (!labels.includes(expected)) push(errors, `${base}/archetype_labels`, `missing archetype label for code: ${expected}`, { expected });
  }
  validateProvenanceQuoteList(archetypeProvenance, { errors, evidenceIndex, base: `${base}/archetype_provenance`, kind: "archetype" });

  const surfaces = Array.isArray(feature.surface_tokens) ? feature.surface_tokens : [];
  const surfaceProvenance = Array.isArray(feature.surface_provenance) ? feature.surface_provenance : [];
  const provenanceSurfaces = new Set(surfaceProvenance.map((entry) => entry?.surface_token).filter(Boolean));
  for (const token of surfaces) {
    if (!ALLOWED_SURFACE_TOKENS.has(token)) push(errors, `${base}/surface_tokens`, `invalid surface token: ${token}`, { token });
    if (!provenanceSurfaces.has(token)) push(errors, `${base}/surface_provenance`, `missing surface provenance for token: ${token}`, { token });
  }
  for (const entry of surfaceProvenance) {
    if (entry?.surface_token && !surfaces.includes(entry.surface_token)) {
      push(errors, `${base}/surface_provenance`, `surface provenance emitted without matching surface token: ${entry.surface_token}`, { token: entry.surface_token });
    }
  }
  validateProvenanceQuoteList(surfaceProvenance, { errors, evidenceIndex, base: `${base}/surface_provenance`, kind: "surface" });

  validateProvenanceQuoteList(feature.data_provenance, { errors, evidenceIndex, base: `${base}/data_provenance`, kind: "data" });

  const threats = Array.isArray(feature.linked_threat_ids) ? feature.linked_threat_ids : [];
  if (!threatMappingSupplied && threats.length > 0) {
    push(errors, `${base}/linked_threat_ids`, "linked_threat_ids must be empty unless explicit threat mapping context was supplied", { linked_threat_ids: threats });
  }
}

function validateTopLevelMaps(profile, { errors, featureIds }) {
  const dataMap = Array.isArray(profile.data_provenance_map) ? profile.data_provenance_map : [];
  dataMap.forEach((entry, index) => {
    const base = `/data_provenance_map/${index}`;
    if (entry?.feature_id && !featureIds.has(entry.feature_id)) {
      push(errors, `${base}/feature_id`, "data provenance feature_id must reference feature_inventory when supplied", { feature_id: entry.feature_id });
    }
  });

  const regulated = Array.isArray(profile.regulated_surface_map) ? profile.regulated_surface_map : [];
  regulated.forEach((entry, index) => {
    const base = `/regulated_surface_map/${index}`;
    if (!featureIds.has(entry?.feature_id)) push(errors, `${base}/feature_id`, "regulated surface feature_id must reference feature_inventory", { feature_id: entry?.feature_id });
    if (entry?.surface_token && !ALLOWED_SURFACE_TOKENS.has(entry.surface_token)) push(errors, `${base}/surface_token`, `invalid surface token: ${entry.surface_token}`, { token: entry.surface_token });
    if (entry?.int_ext_classification) validateEnum(entry.int_ext_classification, ALLOWED_INT_EXT, errors, `${base}/int_ext_classification`, "int_ext_classification");
    if (entry?.confidence) validateEnum(entry.confidence, ALLOWED_CONFIDENCE, errors, `${base}/confidence`, "regulated surface confidence");
  });

  const hints = Array.isArray(profile.architecture_hints) ? profile.architecture_hints : [];
  hints.forEach((entry, index) => {
    const base = `/architecture_hints/${index}`;
    if (!featureIds.has(entry?.feature_id)) push(errors, `${base}/feature_id`, "architecture hint feature_id must reference feature_inventory", { feature_id: entry?.feature_id });
    if (entry?.hint_type) validateEnum(entry.hint_type, ALLOWED_ARCH_HINT_TYPES, errors, `${base}/hint_type`, "hint_type");
    if (entry?.disposition) validateEnum(entry.disposition, ALLOWED_ARCH_HINT_DISPOSITIONS, errors, `${base}/disposition`, "disposition");
    if (entry?.confidence) validateEnum(entry.confidence, ALLOWED_CONFIDENCE, errors, `${base}/confidence`, "architecture hint confidence");
    verifyQuoteSource({ quote: entry?.evidence_quote, sourceUrl: entry?.source_url, base }, errors, arguments[1]?.evidenceIndex || { byUrl: new Map(), all: [] });
  });

  if (profile?.vault_feature_candidates && Object.prototype.hasOwnProperty.call(profile.vault_feature_candidates, "architecture")) {
    push(errors, "/vault_feature_candidates/architecture", "Stage 5 must not emit architecture Vault candidates");
  }
}

function validateCompatibilityAlias(profile, errors) {
  const alias = Array.isArray(profile.product_feature_map) ? profile.product_feature_map : [];
  if (!alias.length) return;
  // product_feature_map is a legacy compatibility alias. Canonical validation happens on feature_inventory.
  // The alias is intentionally non-blocking because downstream code can derive it deterministically.
}

export function validateTargetFeatureProfileGuardrails(profile, { threatMappingSupplied = false, evidenceBuffer = [] } = {}) {
  const errors = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    push(errors, "", "target_feature_profile must be an object");
    return { ok: false, errors };
  }

  const evidenceIndex = buildEvidenceIndex(evidenceBuffer);
  walkKeys(profile, errors, "");

  if (profile.feature_profile_version !== "feature_profile_v2") {
    push(errors, "/feature_profile_version", "feature_profile_version must be feature_profile_v2", { value: profile.feature_profile_version });
  }

  const features = Array.isArray(profile.feature_inventory) ? profile.feature_inventory : [];
  const seenIds = new Set();
  features.forEach((feature, index) => validateFeature(feature, index, { errors, evidenceIndex, seenIds, threatMappingSupplied }));

  const featureIds = collectFeatureIds(features);
  validateCompatibilityAlias(profile, errors);
  validateTopLevelMaps(profile, { errors, evidenceIndex, featureIds });

  return { ok: errors.length === 0, errors };
}
