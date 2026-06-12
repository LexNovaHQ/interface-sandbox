const ARCHETYPES = new Set(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);
const SURFACES = new Set(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);
const CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);
const TRI_STATE = new Set(["true", "false", "unknown"]);
const FORBIDDEN_KEYS = new Set(["target_profile", "primary_product", "raw_feature_candidates", "feature_map_scratchpad", "company_name", "website", "legal_entity", "hq_jurisdiction", "actual_processing_location", "data_sovereignty_signature", "legal_stack_review", "document_stack_redline", "legal_stack_assessment", "registry_ledger", "registry_evaluation", "final_status", "controlled_rows", "insufficient_evidence_rows", "operator_challenge", "report_data", "technical_audit_log", "assembly_route", "vault_confirmation_questions", "vault_prefill_suggestions", "vault_payload", "handoff_envelope", "assembly_handoff", "html"]);
const THREAT_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);

function issue(keyword, severity, instancePath, message, params = {}) {
  return { keyword, severity, instancePath, schemaPath: "#/targetFeatureProfileGuardrails", message, params };
}
function pushBlocking(errors, path, message, params = {}) { errors.push(issue("target_feature_profile_guardrail", "BLOCKING", path, message, params)); }
function pushRepair(repairs, path, action, params = {}) { repairs.push({ severity: "REPAIRABLE", instancePath: path, action, ...params }); }
function writeLimitation(profile, warning) {
  if (!profile || typeof profile !== "object") return;
  if (!Array.isArray(profile.limitations)) profile.limitations = [];
  const line = `GUARDRAIL_WARNING ${warning.instancePath || "/"}: ${warning.message} ${JSON.stringify(warning.params || {})}`;
  if (!profile.limitations.includes(line)) profile.limitations.push(line);
}
function warn(profile, warnings, path, message, params = {}) {
  const item = issue("target_feature_profile_guardrail_warning", "WARNING", path, message, params);
  warnings.push(item);
  writeLimitation(profile, item);
}
function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function normalizeText(value) { return String(value || "").normalize("NFKC").toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\bdigitisation\b/g, "digitization").replace(/\s+/g, " ").trim(); }
function normalizeUrl(value) {
  try { const url = new URL(/^https?:\/\//i.test(String(value || "")) ? value : `https://${value}`); url.hash = ""; url.search = ""; if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/"; return url.toString(); } catch { return String(value || "").trim(); }
}
function hostnameFor(value) { try { const url = new URL(/^https?:\/\//i.test(String(value || "")) ? value : `https://${value}`); return url.hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } }
function addDomain(domains, value) { const host = hostnameFor(value); if (host && host !== "unknown") domains.add(host); }
function collectPackageDomains(packageInput = {}) {
  const domains = new Set();
  addDomain(domains, packageInput?.source_bundle?.target_input?.primary_url);
  addDomain(domains, packageInput?.source_bundle?.target_input?.registrable_domain);
  addDomain(domains, packageInput?.target_profile_v2?.identity?.domain);
  addDomain(domains, packageInput?.target_profile_v2?.identity?.website);
  addDomain(domains, packageInput?.company_profile?.identity?.domain);
  addDomain(domains, packageInput?.company_profile?.identity?.website);
  for (const record of packageInput?.source_bundle?.evidence_buffer || []) {
    addDomain(domains, record?.source_url); addDomain(domains, record?.final_url); addDomain(domains, record?.url);
  }
  return domains;
}
function isFirstPartyUrl(sourceUrl, domains) {
  const host = hostnameFor(sourceUrl);
  if (!host) return false;
  for (const domain of domains) if (host === domain || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`)) return true;
  return false;
}
function sourceText(record = {}) { return record.clean_text_lossless || record?.text?.clean_text_lossless || record.evidence_text || ""; }
function urlKeys(record = {}) { return [record.source_url, record.final_url, record.url, record.feature_source_url, record.document_url].filter(nonEmptyString).flatMap((v) => [String(v).trim(), normalizeUrl(v)]); }
function harvestPackageSources(value, out = [], seen = new WeakSet()) {
  if (!value || typeof value !== "object") return out;
  if (seen.has(value)) return out;
  seen.add(value);
  if (!Array.isArray(value)) {
    for (const key of ["source_url", "final_url", "url", "feature_source_url", "document_url"]) {
      if (nonEmptyString(value[key])) {
        out.push({ source_url: value.source_url || value.url || value.feature_source_url || value.document_url || value[key], final_url: value.final_url || null, clean_text_lossless: sourceText(value), normalized_text: normalizeText(sourceText(value)), admission_scope: sourceText(value) ? "package_source_with_text" : "package_source_without_stage_text" });
        break;
      }
    }
  }
  for (const child of Array.isArray(value) ? value : Object.values(value)) harvestPackageSources(child, out, seen);
  return out;
}
function buildEvidenceIndex(evidenceBuffer = [], packageInput = {}) {
  const byUrl = new Map();
  const add = (record, scope) => {
    const normalized = { ...record, clean_text_lossless: sourceText(record), normalized_text: normalizeText(sourceText(record)), admission_scope: scope };
    for (const key of urlKeys(record)) {
      if (!byUrl.has(key)) byUrl.set(key, []);
      byUrl.get(key).push(normalized);
    }
  };
  for (const record of Array.isArray(evidenceBuffer) ? evidenceBuffer : []) add(record, "stage_evidence_buffer");
  for (const record of harvestPackageSources(packageInput)) add(record, record.admission_scope || "package_source");
  return { byUrl, packageDomains: collectPackageDomains(packageInput) };
}
function matchingRecords(sourceUrl, evidenceIndex) {
  const keys = urlKeys({ source_url: sourceUrl });
  const out = [];
  const seen = new Set();
  for (const key of keys) for (const r of evidenceIndex.byUrl.get(key) || []) { const id = `${r.source_url}|${r.final_url}|${r.admission_scope}`; if (!seen.has(id)) { seen.add(id); out.push(r); } }
  return out;
}
function overlapScore(needle, candidate) {
  const words = (s) => new Set(normalizeText(s).split(/[^a-z0-9]+/).filter((x) => x.length >= 4));
  const n = words(needle); const c = words(candidate);
  if (!n.size || !c.size) return 0;
  let hits = 0; for (const x of n) if (c.has(x)) hits += 1;
  return hits / Math.max(3, n.size);
}
function snippets(text = "") {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const out = clean.split(/(?<=[.!?])\s+|\s+[|•]\s+|\n+/).filter((x) => x.length >= 25 && x.length <= 520);
  for (let i = 0; i < words.length; i += 8) { const w = words.slice(i, i + 60).join(" "); if (w.length >= 25 && w.length <= 800) out.push(w); }
  return [...new Set(out)];
}
function repairQuote(owner, quoteKey, sourceKey, base, profile, warnings, repairs, evidenceIndex) {
  const quote = owner?.[quoteKey]; const sourceUrl = owner?.[sourceKey];
  if (!nonEmptyString(sourceUrl)) { warn(profile, warnings, `${base}/${sourceKey}`, `${sourceKey} missing; passed with warning`); return; }
  const matches = matchingRecords(sourceUrl, evidenceIndex);
  if (!matches.length) {
    if (isFirstPartyUrl(sourceUrl, evidenceIndex.packageDomains)) { warn(profile, warnings, `${base}/${sourceKey}`, `${sourceKey} is first-party but not indexed in current package; passed with warning`, { source_url: sourceUrl }); return; }
    pushBlocking(profile.__errors, `${base}/${sourceKey}`, `${sourceKey} must be a first-party source admitted somewhere in the diligence package`, { source_url: sourceUrl });
    return;
  }
  if (!nonEmptyString(quote)) { warn(profile, warnings, `${base}/${quoteKey}`, `${quoteKey} missing; passed with warning`); return; }
  const textMatches = matches.filter((r) => nonEmptyString(r.clean_text_lossless));
  if (!textMatches.length) { warn(profile, warnings, `${base}/${sourceKey}`, `${sourceKey} is a package source without stage text; quote exactness skipped`, { source_url: sourceUrl }); return; }
  const normalizedQuote = normalizeText(quote);
  for (const record of textMatches) {
    if (record.normalized_text.includes(normalizedQuote)) return;
    let best = null;
    for (const candidate of snippets(record.clean_text_lossless)) { const score = overlapScore(quote, candidate); if (!best || score > best.score) best = { quote: candidate, score }; }
    if (best && best.score >= 0.32) { owner[quoteKey] = best.quote; pushRepair(repairs, `${base}/${quoteKey}`, "quote_replaced_with_admitted_source_text", { source_url: sourceUrl, original_quote: quote, repaired_quote: best.quote }); return; }
  }
  warn(profile, warnings, `${base}/${quoteKey}`, `${quoteKey} did not exactly map to admitted source text; passed with warning`, { source_url: sourceUrl, evidence_quote: quote });
}
function stripCrossStageKeys(value, profile, warnings, repairs, path = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((x, i) => stripCrossStageKeys(x, profile, warnings, repairs, `${path}/${i}`));
  for (const key of Object.keys(value)) {
    const p = `${path}/${key}`;
    if (FORBIDDEN_KEYS.has(key)) { delete value[key]; warn(profile, warnings, p, `forbidden cross-stage key stripped before guardrail validation: ${key}`, { key }); pushRepair(repairs, p, "stripped_forbidden_cross_stage_key", { key }); continue; }
    if (typeof value[key] === "string" && THREAT_STATUSES.has(value[key].trim())) warn(profile, warnings, p, "Stage 7 registry status appeared in Stage 5 field; passed with warning", { value: value[key] });
    stripCrossStageKeys(value[key], profile, warnings, repairs, p);
  }
}
function validEnum(value, set, profile, warnings, path, label) { if (value && !set.has(value)) warn(profile, warnings, path, `${label} has invalid value; passed with warning`, { value }); }
function clearLinkedThreatIds(feature, base, profile, warnings, repairs) {
  if (Array.isArray(feature.linked_threat_ids) && feature.linked_threat_ids.length) {
    const old = [...feature.linked_threat_ids]; feature.linked_threat_ids = [];
    warn(profile, warnings, `${base}/linked_threat_ids`, "linked_threat_ids emitted before threat mapping; cleared and passed with warning", { linked_threat_ids: old });
    pushRepair(repairs, `${base}/linked_threat_ids`, "cleared_premature_linked_threat_ids", { linked_threat_ids: old });
  }
}
function validateFeature(feature, index, context) {
  const { profile, errors, warnings, repairs, evidenceIndex, threatMappingSupplied } = context;
  const base = `/feature_inventory/${index}`;
  if (!feature || typeof feature !== "object" || Array.isArray(feature)) { warn(profile, warnings, base, "non-object feature dropped by canonicalizer/guardrail warning"); return false; }
  if (!nonEmptyString(feature.feature_id)) { feature.feature_id = `runtime_feature_${index + 1}`; warn(profile, warnings, `${base}/feature_id`, "feature_id missing; runtime-filled deterministic feature_id"); pushRepair(repairs, `${base}/feature_id`, "runtime_filled_missing_feature_id"); }
  if (!Array.isArray(feature.data_provenance) || !feature.data_provenance.length) { feature.data_provenance = [{ data_origin: "unknown", data_subject: "unknown", data_category: "unknown", processing_context: feature.system_action || "not visible in admitted evidence", storage_or_retention_signal: "not visible in admitted evidence", training_or_finetuning_signal: "not visible in admitted evidence", source_url: feature.feature_source_url || "", evidence_quote: feature.evidence_quote || "not visible in admitted evidence", confidence: "unknown" }]; warn(profile, warnings, `${base}/data_provenance`, "missing data provenance runtime-filled; passed with warning"); pushRepair(repairs, `${base}/data_provenance`, "runtime_filled_missing_data_provenance"); }
  validEnum(feature.confidence, CONFIDENCE, profile, warnings, `${base}/confidence`, "feature confidence");
  validEnum(feature.external_action_signal, TRI_STATE, profile, warnings, `${base}/external_action_signal`, "external_action_signal");
  repairQuote(feature, "evidence_quote", "feature_source_url", base, profile, warnings, repairs, evidenceIndex);
  feature.data_provenance.forEach((item, i) => repairQuote(item, "evidence_quote", "source_url", `${base}/data_provenance/${i}`, profile, warnings, repairs, evidenceIndex));
  const archetypeProvenance = Array.isArray(feature.archetype_provenance) ? feature.archetype_provenance : [];
  const surfaceProvenance = Array.isArray(feature.surface_provenance) ? feature.surface_provenance : [];
  for (const code of feature.archetype_codes || []) {
    if (!ARCHETYPES.has(code)) warn(profile, warnings, `${base}/archetype_codes`, `invalid archetype code; passed with warning: ${code}`, { code });
    if (!archetypeProvenance.some((p) => p?.archetype_code === code)) warn(profile, warnings, `${base}/archetype_provenance`, `missing archetype provenance for code; passed with warning: ${code}`, { code });
  }
  archetypeProvenance.forEach((item, i) => repairQuote(item, "evidence_quote", "source_url", `${base}/archetype_provenance/${i}`, profile, warnings, repairs, evidenceIndex));
  for (const token of feature.surface_tokens || []) {
    if (!SURFACES.has(token)) warn(profile, warnings, `${base}/surface_tokens`, `invalid surface token; passed with warning: ${token}`, { token });
    if (!surfaceProvenance.some((p) => p?.surface_token === token)) warn(profile, warnings, `${base}/surface_provenance`, `missing surface provenance for token; passed with warning: ${token}`, { token });
  }
  surfaceProvenance.forEach((item, i) => repairQuote(item, "evidence_quote", "source_url", `${base}/surface_provenance/${i}`, profile, warnings, repairs, evidenceIndex));
  if (!threatMappingSupplied) clearLinkedThreatIds(feature, base, profile, warnings, repairs);
  return true;
}
function validateTopLevelMaps(profile, context) {
  const { warnings, repairs, evidenceIndex } = context;
  const ids = new Set((profile.feature_inventory || []).map((f) => f.feature_id));
  for (const [i, entry] of (profile.data_provenance_map || []).entries()) {
    const base = `/data_provenance_map/${i}`;
    if (!ids.has(entry?.feature_id)) warn(profile, warnings, `${base}/feature_id`, "data provenance feature_id does not reference feature_inventory; passed with warning", { feature_id: entry?.feature_id });
    repairQuote(entry, "evidence_quote", "source_url", base, profile, warnings, repairs, evidenceIndex);
  }
  for (const [i, entry] of (profile.architecture_hints || []).entries()) repairQuote(entry, "evidence_quote", "source_url", `/architecture_hints/${i}`, profile, warnings, repairs, evidenceIndex);
  if (profile?.vault_feature_candidates?.architecture) { delete profile.vault_feature_candidates.architecture; warn(profile, warnings, "/vault_feature_candidates/architecture", "Stage 5 architecture Vault candidates stripped; passed with warning"); pushRepair(repairs, "/vault_feature_candidates/architecture", "stripped_stage5_architecture_vault_candidates"); }
  if (Array.isArray(profile.product_feature_map) && profile.product_feature_map.length) { const count = profile.product_feature_map.length; profile.product_feature_map = []; warn(profile, warnings, "/product_feature_map", "product_feature_map is legacy; cleared and ignored in favor of canonical feature_inventory", { count }); pushRepair(repairs, "/product_feature_map", "cleared_legacy_product_feature_map", { count }); }
}
export function validateTargetFeatureProfileGuardrails(profile, { threatMappingSupplied = false, evidenceBuffer = [], packageInput = null } = {}) {
  const errors = [];
  const warnings = [];
  const repairs = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) { pushBlocking(errors, "", "target_feature_profile must be an object"); return { ok: false, errors, warnings, repairs }; }
  Object.defineProperty(profile, "__errors", { value: errors, enumerable: false, configurable: true });
  const evidenceIndex = buildEvidenceIndex(evidenceBuffer, packageInput || {});
  stripCrossStageKeys(profile, profile, warnings, repairs);
  if (profile.feature_profile_version !== "feature_profile_v2") { const old = profile.feature_profile_version; profile.feature_profile_version = "feature_profile_v2"; warn(profile, warnings, "/feature_profile_version", "feature_profile_version repaired to feature_profile_v2", { old }); pushRepair(repairs, "/feature_profile_version", "repaired_feature_profile_version", { old, repaired: "feature_profile_v2" }); }
  if (!Array.isArray(profile.feature_inventory)) profile.feature_inventory = [];
  const valid = profile.feature_inventory.map((f, i) => validateFeature(f, i, { profile, errors, warnings, repairs, evidenceIndex, threatMappingSupplied })).filter(Boolean).length;
  if (valid === 0) pushBlocking(errors, "/feature_inventory", "feature_inventory must contain at least one usable canonical feature");
  validateTopLevelMaps(profile, { warnings, repairs, evidenceIndex });
  delete profile.__errors;
  return { ok: errors.length === 0, errors, warnings, repairs };
}
