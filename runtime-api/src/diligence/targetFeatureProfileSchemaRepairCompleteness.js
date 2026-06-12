const CONF = new Set(["high", "medium", "low", "unknown"]);
const TRI = new Set(["true", "false", "unknown"]);
const DATA_SUBJECTS = new Set(["user", "customer", "employee", "consumer", "developer", "child", "business_entity", "unknown"]);
const DATA_ORIGINS = new Set(["user_provided", "customer_provided", "third_party_source", "public_web", "system_generated", "unknown"]);
const DATA_CATEGORIES = new Set(["prompt", "account", "contact", "uploaded_file", "generated_output", "audio", "text", "document", "image", "video", "code", "api_payload", "payment", "usage_log", "support", "sensitive", "unknown"]);
const SURFACES = new Set(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);
const ARCHETYPES = new Set(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);
const TOP = new Set(["feature_profile_version", "target_profile_ref", "feature_inventory", "product_feature_map", "data_provenance_map", "regulated_surface_map", "architecture_hints", "commercial_scan", "vault_feature_candidates", "evidence", "limitations"]);
const FEATURE = new Set(["feature_id", "feature_name", "feature_role", "commercial_function", "business_label_or_product_area", "feature_description", "actor_or_user", "input_data", "system_action", "output_or_result", "autonomy_level", "human_review_signal", "external_action_signal", "delivery_channels", "data_provenance", "archetype_codes", "archetype_labels", "archetype_provenance", "surface_tokens", "surface_provenance", "confidence", "evidence_quote", "feature_source_url", "evidence_refs", "linked_threat_ids"]);
const DATA = new Set(["data_origin", "data_subject", "data_category", "processing_context", "storage_or_retention_signal", "training_or_finetuning_signal", "source_url", "evidence_refs", "evidence_quote", "confidence"]);
const ARCH = new Set(["archetype_code", "registry_key_detection_logic", "matched_feature_behavior", "source_url", "evidence_refs", "evidence_quote", "confidence"]);
const SURF = new Set(["surface_token", "registry_key_surface_meaning", "matched_data_or_context", "source_url", "evidence_refs", "evidence_quote", "confidence"]);
const HINT = new Set(["hint_id", "feature_id", "hint_type", "hint_value", "disposition", "source_url", "evidence_refs", "evidence_quote", "confidence"]);
const FIELD_REF = new Set(["field_path", "evidence_refs", "basis", "confidence"]);
const COMMERCIAL = new Set(["distinct_commercial_outcomes_seen", "mapped_core_feature_ids", "source_coverage", "unmapped_outcomes_due_to_insufficient_detail", "completeness_status", "completeness_warnings"]);
const SOURCE_COVERAGE = new Set(["source_id", "source_url", "source_family", "coverage_status", "mapped_feature_ids", "unmapped_reason", "evidence_refs"]);
const VAULT = new Set(["baseline", "archetypes", "compliance"]);
const EVIDENCE = new Set(["field_evidence_refs", "unresolved_questions"]);
const COVERAGE_STATUS = new Set(["mapped", "supporting", "duplicate", "insufficient_detail", "non_feature_context"]);

const obj = (v) => v && typeof v === "object" && !Array.isArray(v);
const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/[_\s-]+/g, " ");
const str = (v, fallback = "not visible in admitted evidence") => {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (v === undefined || v === null || v === "") return fallback;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    const s = JSON.stringify(v);
    return s && s !== "{}" && s !== "[]" ? s : fallback;
  } catch {
    return fallback;
  }
};
const arr = (v) => Array.isArray(v) ? v.map((x) => str(x, "")).filter(Boolean) : (str(v, "") ? [str(v, "")] : []);
const first = (...xs) => xs.flat().find((x) => typeof x === "string" && x.trim())?.trim() || "";

function warn(profile, notes, path, reason, original, repaired) {
  if (JSON.stringify(original) === JSON.stringify(repaired)) return;
  notes.push(`${reason}:${path}`);
  if (!Array.isArray(profile.limitations)) profile.limitations = [];
  const line = `GUARDRAIL_WARNING ${path}: Stage 5 schema canonicalizer repaired non-critical issue before AJV ${JSON.stringify({ reason, original, repaired })}`;
  if (!profile.limitations.includes(line)) profile.limitations.push(line);
}
function addCompletenessWarning(profile, message) {
  if (!obj(profile.commercial_scan)) profile.commercial_scan = {};
  if (!Array.isArray(profile.commercial_scan.completeness_warnings)) profile.commercial_scan.completeness_warnings = [];
  if (!profile.commercial_scan.completeness_warnings.includes(message)) profile.commercial_scan.completeness_warnings.push(message);
  if (!Array.isArray(profile.limitations)) profile.limitations = [];
  const line = `COMPLETENESS_WARNING /commercial_scan: ${message}`;
  if (!profile.limitations.includes(line)) profile.limitations.push(line);
}
function strip(o, allowed, path, profile, notes) {
  if (!obj(o)) return;
  for (const k of Object.keys(o)) {
    if (!allowed.has(k)) {
      const old = o[k];
      delete o[k];
      warn(profile, notes, `${path}/${k}`, "stripped_additional_property", old, null);
    }
  }
}
function conf(v) { if (CONF.has(v)) return v; const x = norm(v); if (x.includes("high")) return "high"; if (x.includes("medium")) return "medium"; if (x.includes("low")) return "low"; return "unknown"; }
function tri(v) { if (TRI.has(v)) return v; const x = norm(v); if (v === true || /yes|true|present|available|supported|enabled|live/.test(x)) return "true"; if (v === false || /no|false|absent|unavailable|unsupported|disabled/.test(x)) return "false"; return "unknown"; }
function fromSet(v, set, fallback = "unknown") { if (set.has(v)) return v; const x = norm(v); for (const item of set) if (norm(item) === x) return item; return fallback; }
function dataSubject(v) { if (DATA_SUBJECTS.has(v)) return v; const x = norm(v); if (/employee|worker|staff/.test(x)) return "employee"; if (/developer/.test(x)) return "developer"; if (/child|minor/.test(x)) return "child"; if (/business|company|enterprise|merchant/.test(x)) return "business_entity"; if (/customer|client/.test(x)) return "customer"; if (/consumer/.test(x)) return "consumer"; if (/end user|enduser|user/.test(x)) return "user"; return "unknown"; }
function dataOrigin(v) { if (DATA_ORIGINS.has(v)) return v; const x = norm(v); if (/customer|enterprise|client/.test(x)) return "customer_provided"; if (/user/.test(x)) return "user_provided"; if (/third party|external/.test(x)) return "third_party_source"; if (/public|web/.test(x)) return "public_web"; if (/system|generated|model/.test(x)) return "system_generated"; return "unknown"; }
function dataCategory(v) { if (DATA_CATEGORIES.has(v)) return v; const x = norm(v); if (/audio|voice|speech/.test(x)) return "audio"; if (/prompt|input/.test(x)) return "prompt"; if (/account/.test(x)) return "account"; if (/contact|email|phone/.test(x)) return "contact"; if (/upload|file/.test(x)) return "uploaded_file"; if (/output|transcript|generated/.test(x)) return "generated_output"; if (/document|pdf|ocr/.test(x)) return "document"; if (/image|vision/.test(x)) return "image"; if (/video/.test(x)) return "video"; if (/code|sdk/.test(x)) return "code"; if (/api|payload/.test(x)) return "api_payload"; if (/payment|billing/.test(x)) return "payment"; if (/usage|log|analytics/.test(x)) return "usage_log"; if (/support|ticket/.test(x)) return "support"; if (/sensitive|pii|biometric/.test(x)) return "sensitive"; if (/text|content|message/.test(x)) return "text"; return "unknown"; }
function surface(v) { if (SURFACES.has(v)) return v; const x = norm(v); if (/consumer|public/.test(x)) return "Consumer-Public"; if (/enterprise|private/.test(x)) return "Enterprise-Private"; if (/pii|personal|user data/.test(x)) return "PII"; if (/employment|employee/.test(x)) return "Employment"; if (/sensitive|biometric|voiceprint/.test(x)) return "Sensitive/Biometric"; if (/financial|payment|loan|bank|credit/.test(x)) return "Financial"; if (/content|ip|copyright|transcript|document/.test(x)) return "Content&IP"; if (/safety|physical/.test(x)) return "Safety&Physical"; if (/infra|security|api|integration|system/.test(x)) return "Infrastructure"; if (/minor|child/.test(x)) return "Minors"; return null; }
function sourceOf(f) { return first(f?.feature_source_url, (f?.data_provenance || []).map((x) => x?.source_url), (f?.archetype_provenance || []).map((x) => x?.source_url), (f?.surface_provenance || []).map((x) => x?.source_url)); }
function refsOf(x = {}, f = {}) {
  const refs = arr(x.evidence_refs);
  for (const c of [x.evidence_ref_id, x.evidence_source_id, x.chunk_id, x.source_url, x.feature_source_url, ...(Array.isArray(f.evidence_refs) ? f.evidence_refs : [])]) {
    if (typeof c === "string" && c.trim() && !refs.includes(c.trim())) refs.push(c.trim());
  }
  const src = first(x.source_url, x.feature_source_url, f.feature_source_url, sourceOf(f));
  if (!refs.length && src) refs.push(src);
  return refs.length ? refs : ["UNRESOLVED_EVIDENCE_REF"];
}

function fixData(e, f, profile, notes, path) {
  const old = obj(e) ? { ...e } : e;
  const d = obj(e) ? { ...e } : {};
  strip(d, DATA, path, profile, notes);
  d.data_origin = dataOrigin(d.data_origin);
  d.data_subject = dataSubject(d.data_subject);
  d.data_category = dataCategory(d.data_category || f.input_data || f.feature_name);
  d.processing_context = str(d.processing_context, f.system_action || f.commercial_function);
  d.storage_or_retention_signal = str(d.storage_or_retention_signal);
  d.training_or_finetuning_signal = str(d.training_or_finetuning_signal);
  d.source_url = str(d.source_url || f.feature_source_url || sourceOf(f), "");
  d.evidence_refs = refsOf(d, f);
  d.evidence_quote = str(d.evidence_quote, "");
  d.confidence = conf(d.confidence);
  warn(profile, notes, path, "canonicalized_data_provenance", old, d);
  return d;
}
function fixArchetypeProvenance(e, f, profile, notes, path) {
  const old = obj(e) ? { ...e } : e;
  const p = obj(e) ? { ...e } : {};
  strip(p, ARCH, path, profile, notes);
  p.archetype_code = fromSet(String(p.archetype_code || "").toUpperCase(), ARCHETYPES, "");
  if (!p.archetype_code) return null;
  p.registry_key_detection_logic = str(p.registry_key_detection_logic);
  p.matched_feature_behavior = str(p.matched_feature_behavior, f.system_action || f.commercial_function);
  p.source_url = str(p.source_url || f.feature_source_url || sourceOf(f), "");
  p.evidence_refs = refsOf(p, f);
  p.evidence_quote = str(p.evidence_quote, "");
  p.confidence = conf(p.confidence);
  warn(profile, notes, path, "canonicalized_archetype_provenance", old, p);
  return p;
}
function fixSurfaceProvenance(e, f, profile, notes, path) {
  const old = obj(e) ? { ...e } : e;
  const p = obj(e) ? { ...e } : {};
  strip(p, SURF, path, profile, notes);
  p.surface_token = surface(p.surface_token) || "";
  if (!p.surface_token) return null;
  p.registry_key_surface_meaning = str(p.registry_key_surface_meaning);
  p.matched_data_or_context = str(p.matched_data_or_context, Array.isArray(f.input_data) ? f.input_data.join(", ") : f.commercial_function);
  p.source_url = str(p.source_url || f.feature_source_url || sourceOf(f), "");
  p.evidence_refs = refsOf(p, f);
  p.evidence_quote = str(p.evidence_quote, "");
  p.confidence = conf(p.confidence);
  warn(profile, notes, path, "canonicalized_surface_provenance", old, p);
  return p;
}
function fixFeature(f, i, profile, notes) {
  const old = obj(f) ? { ...f } : f;
  const x = obj(f) ? { ...f } : {};
  strip(x, FEATURE, `/feature_inventory/${i}`, profile, notes);
  x.feature_id = str(x.feature_id, `F${String(i + 1).padStart(3, "0")}`);
  x.feature_name = str(x.feature_name || x.business_label_or_product_area || x.commercial_function, `Runtime feature ${i + 1}`);
  x.feature_role = norm(x.feature_role).includes("secondary") ? "SECONDARY" : "CORE";
  x.commercial_function = str(x.commercial_function, x.feature_name);
  x.business_label_or_product_area = str(x.business_label_or_product_area, x.feature_name);
  x.feature_description = str(x.feature_description, x.commercial_function);
  x.actor_or_user = str(x.actor_or_user, "unknown");
  x.input_data = arr(x.input_data);
  x.system_action = str(x.system_action, x.commercial_function);
  x.output_or_result = str(x.output_or_result);
  x.autonomy_level = fromSet(x.autonomy_level, new Set(["none", "draft", "recommend", "execute", "unknown"]));
  x.human_review_signal = fromSet(x.human_review_signal, new Set(["required", "optional", "not_visible", "unknown"]));
  x.external_action_signal = tri(x.external_action_signal);
  const dc = obj(x.delivery_channels) ? x.delivery_channels : {};
  x.delivery_channels = { app: tri(dc.app), api: tri(dc.api), web: tri(dc.web) };
  x.feature_source_url = str(x.feature_source_url || sourceOf(x), "");
  x.evidence_refs = refsOf(x);
  x.evidence_quote = str(x.evidence_quote, "");
  x.confidence = conf(x.confidence);
  x.linked_threat_ids = [];
  const data = Array.isArray(x.data_provenance) ? x.data_provenance.filter(obj) : [];
  x.data_provenance = (data.length ? data : [{ source_url: x.feature_source_url, evidence_refs: x.evidence_refs }]).map((e, j) => fixData(e, x, profile, notes, `/feature_inventory/${i}/data_provenance/${j}`));
  x.archetype_provenance = (Array.isArray(x.archetype_provenance) ? x.archetype_provenance.filter(obj) : []).map((e, j) => fixArchetypeProvenance(e, x, profile, notes, `/feature_inventory/${i}/archetype_provenance/${j}`)).filter(Boolean);
  x.archetype_codes = [...new Set(arr(x.archetype_codes).map((c) => String(c).toUpperCase()).filter((c) => ARCHETYPES.has(c) && x.archetype_provenance.some((p) => p.archetype_code === c)))];
  x.archetype_labels = arr(x.archetype_labels);
  x.surface_provenance = (Array.isArray(x.surface_provenance) ? x.surface_provenance.filter(obj) : []).map((e, j) => fixSurfaceProvenance(e, x, profile, notes, `/feature_inventory/${i}/surface_provenance/${j}`)).filter(Boolean);
  x.surface_tokens = [...new Set(arr(x.surface_tokens).map(surface).filter((t) => t && x.surface_provenance.some((p) => p.surface_token === t)))];
  warn(profile, notes, `/feature_inventory/${i}`, "canonicalized_feature", old, x);
  return x;
}
function fixFieldRef(e, i, profile, notes) {
  const old = obj(e) ? { ...e } : e;
  const r = obj(e) ? { ...e } : {};
  strip(r, FIELD_REF, `/evidence/field_evidence_refs/${i}`, profile, notes);
  r.field_path = str(r.field_path, `unknown_${i + 1}`);
  r.evidence_refs = refsOf(r);
  r.basis = str(r.basis || e?.claim_supported || e?.evidence_quote, "weak/fallback evidence reference preserved as warning");
  r.confidence = conf(r.confidence);
  warn(profile, notes, `/evidence/field_evidence_refs/${i}`, "canonicalized_field_evidence_ref", old, r);
  return r;
}
function fixSourceCoverage(e, i, profile, notes) {
  const old = obj(e) ? { ...e } : e;
  const row = obj(e) ? { ...e } : {};
  strip(row, SOURCE_COVERAGE, `/commercial_scan/source_coverage/${i}`, profile, notes);
  row.source_id = str(row.source_id || row.evidence_source_id || row.source_ref, `SRC_UNKNOWN_${i + 1}`);
  row.source_url = str(row.source_url || row.url || row.final_url, "");
  row.source_family = str(row.source_family, "unknown");
  row.coverage_status = COVERAGE_STATUS.has(row.coverage_status) ? row.coverage_status : "insufficient_detail";
  row.mapped_feature_ids = arr(row.mapped_feature_ids);
  row.unmapped_reason = str(row.unmapped_reason, row.coverage_status === "mapped" || row.coverage_status === "supporting" ? "" : "not mapped by model");
  row.evidence_refs = refsOf(row);
  warn(profile, notes, `/commercial_scan/source_coverage/${i}`, "canonicalized_source_coverage", old, row);
  return row;
}
function fixArchitectureHint(e, i, profile, notes) {
  const old = obj(e) ? { ...e } : e;
  const h = obj(e) ? { ...e } : {};
  strip(h, HINT, `/architecture_hints/${i}`, profile, notes);
  h.hint_id = str(h.hint_id, `AH${String(i + 1).padStart(3, "0")}`);
  h.feature_id = str(h.feature_id, "UNKNOWN_FEATURE");
  h.hint_type = fromSet(h.hint_type, new Set(["memory", "model_provider", "cloud_host", "vector_db", "subprocessor", "integration", "unknown"]));
  h.hint_value = str(h.hint_value);
  h.disposition = fromSet(h.disposition, new Set(["prefill_candidate", "confirmation_only", "ignore"]), "confirmation_only");
  h.source_url = str(h.source_url, "");
  h.evidence_refs = refsOf(h);
  h.evidence_quote = str(h.evidence_quote, "");
  h.confidence = conf(h.confidence);
  warn(profile, notes, `/architecture_hints/${i}`, "canonicalized_architecture_hint", old, h);
  return h;
}
function inferCompleteness(profile) {
  const scan = profile.commercial_scan;
  const sourceCoverage = scan.source_coverage || [];
  const features = profile.feature_inventory || [];
  const outcomes = scan.distinct_commercial_outcomes_seen || [];
  const unmapped = scan.unmapped_outcomes_due_to_insufficient_detail || [];
  const coveredStatuses = new Set(["mapped", "supporting", "duplicate", "insufficient_detail", "non_feature_context"]);
  const incompleteSources = sourceCoverage.filter((row) => !coveredStatuses.has(row.coverage_status));
  const mappedCoverage = sourceCoverage.filter((row) => ["mapped", "supporting", "duplicate"].includes(row.coverage_status));
  const hasUnmapped = unmapped.length > 0 || sourceCoverage.some((row) => row.coverage_status === "insufficient_detail");

  if (!sourceCoverage.length) addCompletenessWarning(profile, "commercial_scan.source_coverage missing; Stage 5 source completeness cannot be verified");
  if (incompleteSources.length) addCompletenessWarning(profile, "commercial_scan.source_coverage contains unrecognized coverage statuses");
  if (features.length && outcomes.length && !mappedCoverage.length) addCompletenessWarning(profile, "commercial_scan has outcomes/features but no mapped/supporting source coverage");
  if (hasUnmapped) addCompletenessWarning(profile, "Stage 5 has unmapped outcomes or insufficient-detail source coverage; completeness is partial");

  if (!features.length || !sourceCoverage.length) return "THIN";
  if (hasUnmapped || incompleteSources.length) return "PARTIAL";
  return "COMPLETE";
}
function fixCommercialScan(scan, profile, notes) {
  const old = obj(scan) ? { ...scan } : scan;
  const c = obj(scan) ? { ...scan } : {};
  strip(c, COMMERCIAL, "/commercial_scan", profile, notes);
  c.distinct_commercial_outcomes_seen = arr(c.distinct_commercial_outcomes_seen);
  c.mapped_core_feature_ids = arr(c.mapped_core_feature_ids);
  c.source_coverage = (Array.isArray(c.source_coverage) ? c.source_coverage : []).map((row, i) => fixSourceCoverage(row, i, profile, notes));
  c.unmapped_outcomes_due_to_insufficient_detail = arr(c.unmapped_outcomes_due_to_insufficient_detail);
  c.completeness_warnings = arr(c.completeness_warnings);
  profile.commercial_scan = c;
  c.completeness_status = ["COMPLETE", "PARTIAL", "THIN"].includes(c.completeness_status) ? c.completeness_status : inferCompleteness(profile);
  if (c.completeness_status !== "COMPLETE") addCompletenessWarning(profile, `Stage 5 completeness_status=${c.completeness_status}`);
  warn(profile, notes, "/commercial_scan", "canonicalized_commercial_scan", old, c);
  return c;
}

export function repairTargetFeatureProfileForSchema(profile) {
  const notes = [];
  if (!obj(profile)) return { repaired: false, repair_notes: notes };
  if (!Array.isArray(profile.limitations)) profile.limitations = arr(profile.limitations);
  if (!Array.isArray(profile.feature_inventory) && Array.isArray(profile.product_feature_map)) profile.feature_inventory = profile.product_feature_map;
  strip(profile, TOP, "", profile, notes);
  const oldVersion = profile.feature_profile_version;
  profile.feature_profile_version = "feature_profile_v2";
  warn(profile, notes, "/feature_profile_version", "repaired_feature_profile_version", oldVersion, profile.feature_profile_version);
  const ref = obj(profile.target_profile_ref) ? profile.target_profile_ref : {};
  strip(ref, new Set(["target_profile_version", "brand_name", "legal_name", "domain"]), "/target_profile_ref", profile, notes);
  profile.target_profile_ref = {
    target_profile_version: str(ref.target_profile_version, "target_profile_v2"),
    brand_name: str(ref.brand_name, "unknown"),
    legal_name: str(ref.legal_name, "unknown"),
    domain: str(ref.domain, "unknown")
  };
  profile.feature_inventory = (Array.isArray(profile.feature_inventory) ? profile.feature_inventory : []).map((feature, i) => fixFeature(feature, i, profile, notes));
  profile.product_feature_map = [];
  profile.data_provenance_map = [];
  profile.feature_inventory.forEach((feature, featureIndex) => {
    feature.data_provenance.forEach((row) => {
      profile.data_provenance_map.push({ provenance_id: `DP${String(profile.data_provenance_map.length + 1).padStart(3, "0")}`, feature_id: feature.feature_id || `F${String(featureIndex + 1).padStart(3, "0")}`, ...row });
    });
  });
  profile.regulated_surface_map = [];
  profile.feature_inventory.forEach((feature) => {
    feature.surface_provenance.forEach((row) => {
      profile.regulated_surface_map.push({ surface_id: `RS${String(profile.regulated_surface_map.length + 1).padStart(3, "0")}`, feature_id: feature.feature_id, surface_token: row.surface_token, int_ext_classification: "unknown", basis: row.matched_data_or_context || row.registry_key_surface_meaning || "surface provenance", confidence: row.confidence || "unknown", evidence_refs: refsOf(row, feature) });
    });
  });
  profile.architecture_hints = (Array.isArray(profile.architecture_hints) ? profile.architecture_hints.filter(obj) : []).map((hint, i) => fixArchitectureHint(hint, i, profile, notes));
  profile.commercial_scan = fixCommercialScan(profile.commercial_scan, profile, notes);
  const vault = obj(profile.vault_feature_candidates) ? profile.vault_feature_candidates : {};
  strip(vault, VAULT, "/vault_feature_candidates", profile, notes);
  profile.vault_feature_candidates = { baseline: obj(vault.baseline) ? vault.baseline : {}, archetypes: obj(vault.archetypes) ? vault.archetypes : {}, compliance: obj(vault.compliance) ? vault.compliance : {} };
  const evidence = obj(profile.evidence) ? profile.evidence : {};
  strip(evidence, EVIDENCE, "/evidence", profile, notes);
  profile.evidence = { field_evidence_refs: (Array.isArray(evidence.field_evidence_refs) ? evidence.field_evidence_refs : []).map((ref, i) => fixFieldRef(ref, i, profile, notes)), unresolved_questions: arr(evidence.unresolved_questions) };
  return { repaired: notes.length > 0, repair_notes: notes };
}
