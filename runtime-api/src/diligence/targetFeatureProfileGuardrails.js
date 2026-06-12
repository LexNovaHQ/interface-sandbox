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

function pushRepair(repairs, instancePath, action, params = {}) {
  repairs.push({
    severity: "REPAIRABLE",
    instancePath,
    action,
    ...params
  });
}

function writeWarningToLimitations(profile, warning) {
  if (!profile || typeof profile !== "object") return;
  if (!Array.isArray(profile.limitations)) profile.limitations = [];
  const mapped = `GUARDRAIL_WARNING ${warning.instancePath || "/"}: ${warning.message} ${JSON.stringify(warning.params || {})}`;
  if (!profile.limitations.includes(mapped)) profile.limitations.push(mapped);
}

function warnAndLimit(profile, warnings, instancePath, message, params = {}) {
  const warning = issue("target_feature_profile_guardrail_warning", "WARNING", instancePath, message, params);
  warnings.push(warning);
  writeWarningToLimitations(profile, warning);
  return warning;
}

function walkAndRepairCrossStageKeys(value, { warnings, repairs, profile }, path = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkAndRepairCrossStageKeys(item, { warnings, repairs, profile }, `${path}/${index}`));
    return;
  }

  for (const key of Object.keys(value)) {
    const childPath = `${path}/${key}`;
    const child = value[key];

    if (FORBIDDEN_KEYS.has(key)) {
      delete value[key];
      warnAndLimit(profile, warnings, childPath, `forbidden cross-stage key stripped before guardrail validation: ${key}`, { key });
      pushRepair(repairs, childPath, "stripped_forbidden_cross_stage_key", { key });
      continue;
    }

    if (typeof child === "string" && FORBIDDEN_THREAT_STATUSES.has(child.trim())) {
      warnAndLimit(profile, warnings, childPath, `forbidden Stage 7 registry status appeared in Stage 5 field; passed with warning`, { value: child });
    }

    walkAndRepairCrossStageKeys(child, { warnings, repairs, profile }, childPath);
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
    const url = new URL(/^https?:\/\//i.test(String(value || "")) ? value : `https://${value}`);
    url.hash = "";
    url.search = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return String(value || "").trim();
  }
}

function hostnameFor(value) {
  try {
    const url = new URL(/^https?:\/\//i.test(String(value || "")) ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function addDomain(domains, value) {
  const host = hostnameFor(value);
  if (host && host !== "unknown") domains.add(host);
}

function collectPackageDomains(packageInput = {}) {
  const domains = new Set();
  addDomain(domains, packageInput?.source_bundle?.target_input?.primary_url);
  addDomain(domains, packageInput?.source_bundle?.target_input?.registrable_domain);
  addDomain(domains, packageInput?.target_profile_v2?.identity?.domain);
  addDomain(domains, packageInput?.target_profile_v2?.identity?.website);
  addDomain(domains, packageInput?.target_profile_v2?.product_baseline?.website);

  const evidence = Array.isArray(packageInput?.source_bundle?.evidence_buffer) ? packageInput.source_bundle.evidence_buffer : [];
  evidence.forEach((record) => {
    addDomain(domains, record?.source_url);
    addDomain(domains, record?.final_url);
    addDomain(domains, record?.url);
  });

  return domains;
}

function isFirstPartyUrl(sourceUrl, packageDomains) {
  const host = hostnameFor(sourceUrl);
  if (!host) return false;
  for (const domain of packageDomains) {
    if (host === domain || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`)) return true;
  }
  return false;
}

function evidenceUrlKeys(record = {}) {
  return [record.source_url, record.final_url, record.url, record.feature_source_url, record.document_url]
    .filter((value) => typeof value === "string" && value.trim())
    .flatMap((value) => {
      const normalized = normalizeUrl(value);
      return [value.trim(), normalized].filter(Boolean);
    });
}

function sourceText(record = {}) {
  return record?.clean_text_lossless || record?.text?.clean_text_lossless || record?.evidence_text || "";
}

function sourceRecordFromObject(record = {}, sourceKey = "source_url") {
  const text = sourceText(record);
  return {
    evidence_source_id: record?.evidence_source_id || record?.source_id || record?.id || null,
    source_family: record?.source_family || record?.evidence_scope || "package_source",
    source_url: record?.source_url || record?.url || record?.feature_source_url || record?.document_url || record?.[sourceKey] || null,
    final_url: record?.final_url || null,
    clean_text_lossless: text,
    normalized_text: normalizeText(text),
    admission_scope: text ? "stage_evidence_buffer" : "package_source"
  };
}

function indexRecord(byUrl, all, record = {}, sourceKey = "source_url") {
  const indexed = sourceRecordFromObject(record, sourceKey);
  all.push(indexed);
  for (const key of evidenceUrlKeys(record)) {
    if (!byUrl.has(key)) byUrl.set(key, []);
    byUrl.get(key).push(indexed);
  }
}

function harvestPackageSourceRecords(value, out = [], seen = new WeakSet()) {
  if (!value || typeof value !== "object") return out;
  if (seen.has(value)) return out;
  seen.add(value);

  if (!Array.isArray(value)) {
    for (const sourceKey of ["source_url", "final_url", "url", "feature_source_url", "document_url"]) {
      if (nonEmptyString(value[sourceKey])) {
        out.push({
          evidence_source_id: value.evidence_source_id || value.source_id || value.id || null,
          source_family: value.source_family || value.evidence_scope || "package_source",
          source_url: value.source_url || value.url || value.feature_source_url || value.document_url || value[sourceKey],
          final_url: value.final_url || null,
          clean_text_lossless: sourceText(value),
          normalized_text: normalizeText(sourceText(value)),
          admission_scope: sourceText(value) ? "package_source_with_text" : "package_source_without_stage_text"
        });
        break;
      }
    }
  }

  for (const child of Array.isArray(value) ? value : Object.values(value)) harvestPackageSourceRecords(child, out, seen);
  return out;
}

function buildEvidenceIndex(evidenceBuffer = [], packageInput = {}) {
  const byUrl = new Map();
  const all = [];
  for (const record of Array.isArray(evidenceBuffer) ? evidenceBuffer : []) indexRecord(byUrl, all, record);
  for (const record of harvestPackageSourceRecords(packageInput)) {
    for (const key of evidenceUrlKeys(record)) {
      if (!byUrl.has(key)) byUrl.set(key, []);
      byUrl.get(key).push(record);
    }
    all.push(record);
  }
  return { byUrl, all, packageDomains: collectPackageDomains(packageInput) };
}

function quoteFragments(quote) {
  const normalized = normalizeText(quote);
  if (!normalized) return [];
  return normalized
    .split(/(?<=[.!?;:])\s+|\s+-\s+|\s+•\s+/u)
    .map((fragment) => fragment.replace(/^[\s,.;:!?( )"']+|[\s,.;:!?( )"']+$/g, "").trim())
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
  if (!normalizedQuote || !record?.normalized_text) return null;
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
      const id = `${record.evidence_source_id || ""}|${record.source_url || ""}|${record.final_url || ""}|${record.admission_scope || ""}`;
      if (seen.has(id)) continue;
      seen.add(id);
      matches.push(record);
    }
  }
  return matches;
}

function verifyQuoteSource({ owner, quoteKey = "evidence_quote", sourceKey = "source_url", base, profile }, errors, warnings, repairs, evidenceIndex) {
  const quote = owner?.[quoteKey];
  const sourceUrl = owner?.[sourceKey];
  if (!nonEmptyString(quote) || !nonEmptyString(sourceUrl)) return;

  const sourceMatches = matchingEvidenceRecords(sourceUrl, evidenceIndex);
  if (!sourceMatches.length) {
    if (isFirstPartyUrl(sourceUrl, evidenceIndex.packageDomains)) {
      warnAndLimit(profile, warnings, `${base}/${sourceKey}`, `${sourceKey} is first-party but was not found in the current run package; passed with warning`, { source_url: sourceUrl, admission_status: "first_party_not_package_indexed" });
      return;
    }
    pushBlocking(errors, `${base}/${sourceKey}`, `${sourceKey} must be a first-party source admitted somewhere in the diligence package`, { source_url: sourceUrl });
    return;
  }

  const textMatches = sourceMatches.filter((record) => nonEmptyString(record.clean_text_lossless));
  if (!textMatches.length) {
    warnAndLimit(profile, warnings, `${base}/${sourceKey}`, `${sourceKey} is a first-party package source outside the current stage evidence_buffer; quote exactness skipped`, { source_url: sourceUrl, admission_status: "cross_package_first_party_source_admitted_without_stage_text" });
    return;
  }

  for (const record of textMatches) {
    const match = findQuoteMatch(quote, record);
    if (!match) continue;
    if (match.replacement && normalizeText(match.replacement) !== normalizeText(quote)) {
      owner[quoteKey] = match.replacement;
      pushRepair(repairs, `${base}/${quoteKey}`, "quote_replaced_with_admitted_source_text", {
        source_url: sourceUrl,
        original_quote: quote,
        repaired_quote: match.replacement,
        match_status: match.status
      });
    }
    return;
  }

  warnAndLimit(profile, warnings, `${base}/${quoteKey}`, `${quoteKey} did not exactly map to admitted clean_text_lossless; passed with warning`, { source_url: sourceUrl, evidence_quote: quote });
}

function validateEnum(value, allowed, errors, warnings, path, label, profile) {
  if (!allowed.has(value)) warnAndLimit(profile, warnings, path, `${label} has invalid value; passed with warning`, { value });
}

function collectFeatureIds(features) {
  return new Set(features.map((feature) => feature?.feature_id).filter((id) => typeof id === "string" && id.trim()));
}

function validateDataProvenanceEntry(item, { errors, warnings, repairs, evidenceIndex, base, profile }) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    pushBlocking(errors, base, "data provenance entry must be an object");
    return;
  }
  if (!ALLOWED_DATA_ORIGINS.has(item.data_origin)) warnAndLimit(profile, warnings, `${base}/data_origin`, `data_origin has invalid value; passed with warning`, { value: item.data_origin });
  if (!ALLOWED_DATA_SUBJECTS.has(item.data_subject)) warnAndLimit(profile, warnings, `${base}/data_subject`, `data_subject has invalid value; passed with warning`, { value: item.data_subject });
  if (!ALLOWED_DATA_CATEGORIES.has(item.data_category)) warnAndLimit(profile, warnings, `${base}/data_category`, `data_category has invalid value; passed with warning`, { value: item.data_category });
  if (!nonEmptyString(item.processing_context)) warnAndLimit(profile, warnings, `${base}/processing_context`, "data provenance missing processing_context; passed with warning");
  if (!nonEmptyString(item.storage_or_retention_signal)) warnAndLimit(profile, warnings, `${base}/storage_or_retention_signal`, "data provenance missing storage_or_retention_signal; passed with warning");
  if (!nonEmptyString(item.training_or_finetuning_signal)) warnAndLimit(profile, warnings, `${base}/training_or_finetuning_signal`, "data provenance missing training_or_finetuning_signal; passed with warning");
  if (!nonEmptyString(item.evidence_quote)) warnAndLimit(profile, warnings, `${base}/evidence_quote`, "data provenance missing evidence_quote; passed with warning");
  if (!nonEmptyString(item.source_url)) warnAndLimit(profile, warnings, `${base}/source_url`, "data provenance missing source_url; passed with warning");
  if (item.confidence) validateEnum(item.confidence, ALLOWED_CONFIDENCE, errors, warnings, `${base}/confidence`, "data confidence", profile);
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
    if (!nonEmptyString(item.evidence_quote)) warnAndLimit(profile, warnings, `${path}/evidence_quote`, `${kind} provenance missing evidence_quote; passed with warning`);
    if (!nonEmptyString(item.source_url)) warnAndLimit(profile, warnings, `${path}/source_url`, `${kind} provenance missing source_url; passed with warning`);
    if (item.confidence) validateEnum(item.confidence, ALLOWED_CONFIDENCE, errors, warnings, `${path}/confidence`, `${kind} confidence`, profile);
    verifyQuoteSource({ owner: item, base: path, profile }, errors, warnings, repairs, evidenceIndex);
  });
}

function runtimeFillDataProvenance(feature, base, { warnings, repairs, profile }) {
  if (!Array.isArray(feature.data_provenance)) feature.data_provenance = [];
  if (feature.data_provenance.length > 0) return;
  feature.data_provenance.push({
    data_origin: "unknown",
    data_subject: "unknown",
    data_category: "unknown",
    processing_context: feature.system_action || feature.commercial_function || "not visible in admitted evidence",
    storage_or_retention_signal: "not visible in admitted evidence",
    training_or_finetuning_signal: "not visible in admitted evidence",
    evidence_quote: feature.evidence_quote || "not visible in admitted evidence",
    source_url: feature.feature_source_url || "",
    confidence: "unknown",
    runtime_filled: true
  });
  warnAndLimit(profile, warnings, `${base}/data_provenance`, "missing data provenance runtime-filled from feature evidence; passed with warning");
  pushRepair(repairs, `${base}/data_provenance`, "runtime_filled_missing_data_provenance");
}

function syncArchetypeLabels(feature, base, { warnings, repairs, profile }) {
  const codes = Array.isArray(feature.archetype_codes) ? feature.archetype_codes : [];
  if (!Array.isArray(feature.archetype_labels)) feature.archetype_labels = [];
  for (const code of codes) {
    const expected = ARCHETYPE_LABELS[code];
    if (expected && !feature.archetype_labels.includes(expected)) {
      feature.archetype_labels.push(expected);
      warnAndLimit(profile, warnings, `${base}/archetype_labels`, `missing archetype label runtime-filled for code: ${code}`, { code, expected });
      pushRepair(repairs, `${base}/archetype_labels`, "runtime_filled_missing_archetype_label", { code, expected });
    }
  }
}

function clearLinkedThreatIds(feature, base, { warnings, repairs, profile }) {
  const threats = Array.isArray(feature.linked_threat_ids) ? feature.linked_threat_ids : [];
  if (threats.length > 0) {
    feature.linked_threat_ids = [];
    warnAndLimit(profile, warnings, `${base}/linked_threat_ids`, "linked_threat_ids emitted before threat mapping; cleared and passed with warning", { linked_threat_ids: threats });
    pushRepair(repairs, `${base}/linked_threat_ids`, "cleared_premature_linked_threat_ids", { linked_threat_ids: threats });
  }
}

function validateFeature(feature, index, { errors, warnings, repairs, evidenceIndex, seenIds, threatMappingSupplied, profile }) {
  const base = `/feature_inventory/${index}`;
  if (!feature || typeof feature !== "object" || Array.isArray(feature)) {
    pushBlocking(errors, base, "feature must be an object");
    return;
  }
  if (!nonEmptyString(feature.feature_id)) {
    feature.feature_id = `runtime_feature_${index + 1}`;
    warnAndLimit(profile, warnings, `${base}/feature_id`, "feature_id missing; runtime-filled deterministic feature_id", { feature_id: feature.feature_id });
    pushRepair(repairs, `${base}/feature_id`, "runtime_filled_missing_feature_id", { feature_id: feature.feature_id });
  }
  if (seenIds.has(feature.feature_id)) {
    const original = feature.feature_id;
    feature.feature_id = `${feature.feature_id}_${index + 1}`;
    warnAndLimit(profile, warnings, `${base}/feature_id`, "duplicate feature_id repaired deterministically", { original_feature_id: original, repaired_feature_id: feature.feature_id });
    pushRepair(repairs, `${base}/feature_id`, "deduplicated_feature_id", { original_feature_id: original, repaired_feature_id: feature.feature_id });
  }
  seenIds.add(feature.feature_id);

  if (!["CORE", "SECONDARY"].includes(feature.feature_role)) {
    const original = feature.feature_role;
    feature.feature_role = String(feature.feature_role || "").toLowerCase().includes("secondary") ? "SECONDARY" : "CORE";
    warnAndLimit(profile, warnings, `${base}/feature_role`, "feature_role repaired to canonical enum", { original_feature_role: original, repaired_feature_role: feature.feature_role });
    pushRepair(repairs, `${base}/feature_role`, "repaired_feature_role_enum", { original_feature_role: original, repaired_feature_role: feature.feature_role });
  }

  if (feature.autonomy_level) validateEnum(feature.autonomy_level, ALLOWED_AUTONOMY_LEVELS, errors, warnings, `${base}/autonomy_level`, "autonomy_level", profile);
  if (feature.human_review_signal) validateEnum(feature.human_review_signal, ALLOWED_HUMAN_REVIEW_SIGNALS, errors, warnings, `${base}/human_review_signal`, "human_review_signal", profile);
  if (feature.external_action_signal) validateEnum(feature.external_action_signal, ALLOWED_TRI_STATE, errors, warnings, `${base}/external_action_signal`, "external_action_signal", profile);
  if (feature.confidence) validateEnum(feature.confidence, ALLOWED_CONFIDENCE, errors, warnings, `${base}/confidence`, "feature confidence", profile);

  for (const [key, fallback] of [
    ["feature_name", `Runtime feature ${index + 1}`],
    ["commercial_function", "not visible in admitted evidence"],
    ["feature_description", "not visible in admitted evidence"],
    ["system_action", "not visible in admitted evidence"],
    ["output_or_result", "not visible in admitted evidence"]
  ]) {
    if (!nonEmptyString(feature[key])) {
      feature[key] = fallback;
      warnAndLimit(profile, warnings, `${base}/${key}`, `${key} missing; runtime-filled placeholder`, { repaired_value: fallback });
      pushRepair(repairs, `${base}/${key}`, `runtime_filled_missing_${key}`, { repaired_value: fallback });
    }
  }

  if (!nonEmptyString(feature.evidence_quote)) warnAndLimit(profile, warnings, `${base}/evidence_quote`, "evidence_quote missing; passed with warning");
  if (!nonEmptyString(feature.feature_source_url)) pushBlocking(errors, `${base}/feature_source_url`, "feature_source_url must be present to preserve evidence chain");
  verifyQuoteSource({ owner: feature, quoteKey: "evidence_quote", sourceKey: "feature_source_url", base, profile }, errors, warnings, repairs, evidenceIndex);

  const channels = feature.delivery_channels || {};
  for (const channel of ["app", "api", "web"]) {
    if (channels[channel]) validateEnum(channels[channel], ALLOWED_TRI_STATE, errors, warnings, `${base}/delivery_channels/${channel}`, `delivery_channels.${channel}`, profile);
  }

  runtimeFillDataProvenance(feature, base, { warnings, repairs, profile });
  feature.data_provenance.forEach((item, provenanceIndex) => validateDataProvenanceEntry(item, { errors, warnings, repairs, evidenceIndex, base: `${base}/data_provenance/${provenanceIndex}`, profile }));

  const codes = Array.isArray(feature.archetype_codes) ? feature.archetype_codes : [];
  const archetypeProvenance = Array.isArray(feature.archetype_provenance) ? feature.archetype_provenance : [];
  for (const code of codes) {
    if (!ALLOWED_ARCHETYPE_CODES.has(code)) warnAndLimit(profile, warnings, `${base}/archetype_codes`, `invalid archetype code dropped/passed with warning: ${code}`, { code });
    if (!archetypeProvenance.some((entry) => entry?.archetype_code === code)) warnAndLimit(profile, warnings, `${base}/archetype_provenance`, `missing archetype provenance for code; passed with warning: ${code}`, { code });
  }
  for (const entry of archetypeProvenance) {
    if (entry?.archetype_code && !codes.includes(entry.archetype_code)) warnAndLimit(profile, warnings, `${base}/archetype_provenance`, `archetype provenance emitted without matching archetype code; passed with warning: ${entry.archetype_code}`, { code: entry.archetype_code });
  }
  syncArchetypeLabels(feature, base, { warnings, repairs, profile });
  validateProvenanceQuoteList(archetypeProvenance, { errors, warnings, repairs, evidenceIndex, base: `${base}/archetype_provenance`, kind: "archetype", profile });

  const surfaces = Array.isArray(feature.surface_tokens) ? feature.surface_tokens : [];
  const surfaceProvenance = Array.isArray(feature.surface_provenance) ? feature.surface_provenance : [];
  for (const token of surfaces) {
    if (!ALLOWED_SURFACE_TOKENS.has(token)) warnAndLimit(profile, warnings, `${base}/surface_tokens`, `invalid surface token; passed with warning: ${token}`, { token });
    if (!surfaceProvenance.some((entry) => entry?.surface_token === token)) warnAndLimit(profile, warnings, `${base}/surface_provenance`, `missing surface provenance for token; passed with warning: ${token}`, { token });
  }
  for (const entry of surfaceProvenance) {
    if (entry?.surface_token && !surfaces.includes(entry.surface_token)) warnAndLimit(profile, warnings, `${base}/surface_provenance`, `surface provenance emitted without matching surface token; passed with warning: ${entry.surface_token}`, { token: entry.surface_token });
  }
  validateProvenanceQuoteList(surfaceProvenance, { errors, warnings, repairs, evidenceIndex, base: `${base}/surface_provenance`, kind: "surface", profile });

  if (!threatMappingSupplied) clearLinkedThreatIds(feature, base, { warnings, repairs, profile });
}

function validateTopLevelMaps(profile, { errors, warnings, repairs, evidenceIndex, featureIds }) {
  const dataMap = Array.isArray(profile.data_provenance_map) ? profile.data_provenance_map : [];
  dataMap.forEach((entry, index) => {
    const base = `/data_provenance_map/${index}`;
    if (!entry?.feature_id || !featureIds.has(entry.feature_id)) warnAndLimit(profile, warnings, `${base}/feature_id`, "data provenance feature_id does not reference feature_inventory; passed with warning", { feature_id: entry?.feature_id });
    if (!nonEmptyString(entry?.provenance_id)) warnAndLimit(profile, warnings, `${base}/provenance_id`, "data_provenance_map entry missing provenance_id; passed with warning");
    validateDataProvenanceEntry(entry, { errors, warnings, repairs, evidenceIndex, base, profile });
  });

  const regulated = Array.isArray(profile.regulated_surface_map) ? profile.regulated_surface_map : [];
  regulated.forEach((entry, index) => {
    const base = `/regulated_surface_map/${index}`;
    if (!featureIds.has(entry?.feature_id)) warnAndLimit(profile, warnings, `${base}/feature_id`, "regulated surface feature_id does not reference feature_inventory; passed with warning", { feature_id: entry?.feature_id });
    if (entry?.surface_token && !ALLOWED_SURFACE_TOKENS.has(entry.surface_token)) warnAndLimit(profile, warnings, `${base}/surface_token`, `invalid surface token; passed with warning: ${entry.surface_token}`, { token: entry.surface_token });
    if (entry?.int_ext_classification) validateEnum(entry.int_ext_classification, ALLOWED_INT_EXT, errors, warnings, `${base}/int_ext_classification`, "int_ext_classification", profile);
    if (entry?.confidence) validateEnum(entry.confidence, ALLOWED_CONFIDENCE, errors, warnings, `${base}/confidence`, "regulated surface confidence", profile);
  });

  const hints = Array.isArray(profile.architecture_hints) ? profile.architecture_hints : [];
  hints.forEach((entry, index) => {
    const base = `/architecture_hints/${index}`;
    if (!featureIds.has(entry?.feature_id)) warnAndLimit(profile, warnings, `${base}/feature_id`, "architecture hint feature_id does not reference feature_inventory; passed with warning", { feature_id: entry?.feature_id });
    if (entry?.hint_type) validateEnum(entry.hint_type, ALLOWED_ARCH_HINT_TYPES, errors, warnings, `${base}/hint_type`, "hint_type", profile);
    if (entry?.disposition) validateEnum(entry.disposition, ALLOWED_ARCH_HINT_DISPOSITIONS, errors, warnings, `${base}/disposition`, "disposition", profile);
    if (entry?.confidence) validateEnum(entry.confidence, ALLOWED_CONFIDENCE, errors, warnings, `${base}/confidence`, "architecture hint confidence", profile);
    verifyQuoteSource({ owner: entry, base, profile }, errors, warnings, repairs, evidenceIndex);
  });

  if (profile?.vault_feature_candidates && Object.prototype.hasOwnProperty.call(profile.vault_feature_candidates, "architecture")) {
    delete profile.vault_feature_candidates.architecture;
    warnAndLimit(profile, warnings, "/vault_feature_candidates/architecture", "Stage 5 architecture Vault candidates stripped; passed with warning");
    pushRepair(repairs, "/vault_feature_candidates/architecture", "stripped_stage5_architecture_vault_candidates");
  }
}

function validateCompatibilityAlias(profile, warnings, repairs) {
  const alias = Array.isArray(profile.product_feature_map) ? profile.product_feature_map : [];
  if (alias.length) {
    const warning = issue("target_feature_profile_guardrail_warning", "WARNING", "/product_feature_map", "product_feature_map is legacy; cleared and ignored in favor of canonical feature_inventory", { count: alias.length });
    warnings.push(warning);
    writeWarningToLimitations(profile, warning);
    profile.product_feature_map = [];
    pushRepair(repairs, "/product_feature_map", "cleared_legacy_product_feature_map", { count: alias.length });
  }
}

export function validateTargetFeatureProfileGuardrails(profile, { threatMappingSupplied = false, evidenceBuffer = [], packageInput = null } = {}) {
  const errors = [];
  const warnings = [];
  const repairs = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    pushBlocking(errors, "", "target_feature_profile must be an object");
    return { ok: false, errors, warnings, repairs };
  }

  const effectivePackageInput = packageInput || {};
  const evidenceIndex = buildEvidenceIndex(evidenceBuffer, effectivePackageInput);

  walkAndRepairCrossStageKeys(profile, { warnings, repairs, profile });

  if (profile.feature_profile_version !== "feature_profile_v2") pushBlocking(errors, "/feature_profile_version", "feature_profile_version must be feature_profile_v2", { value: profile.feature_profile_version });

  const features = Array.isArray(profile.feature_inventory) ? profile.feature_inventory : [];
  if (features.length === 0) pushBlocking(errors, "/feature_inventory", "feature_inventory must contain at least one canonical feature");
  const seenIds = new Set();
  features.forEach((feature, index) => validateFeature(feature, index, { errors, warnings, repairs, evidenceIndex, seenIds, threatMappingSupplied, profile }));
  const featureIds = collectFeatureIds(features);
  validateCompatibilityAlias(profile, warnings, repairs);
  validateTopLevelMaps(profile, { errors, warnings, repairs, evidenceIndex, featureIds });

  return { ok: errors.length === 0, errors, warnings, repairs };
}
