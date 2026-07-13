import { asArray, freezeDeep, hasMaterialValue, hasOwn, isObject, normalizeText, resolvePathValues, serializeSearchText, stableUnique } from "../runtime/phase13-value-utils.js";

export const PHASE12_QR_VALUE_RESOLVER_VERSION = "phase13_phase12_qr_value_resolver.v1";

export function resolvePhase12QrValues({ authority, phase12_report_artifacts = {}, reviewer_values = {}, run_mode = "PRODUCTION" } = {}) {
  if (!authority?.registries) throw new Error("QR_VALUE_RESOLVER_AUTHORITY_INVALID");
  const overrides = indexOverrides(authority);
  const field_resolutions = {};
  for (const loaded of authority.registries) for (const field of asArray(loaded.registry.fields)) {
    field_resolutions[field.qr_field_id] = resolveField({
      field,
      registryId: loaded.registry.registry_id,
      phase12ReportArtifacts: phase12_report_artifacts,
      reviewerRecord: reviewer_values[field.qr_field_id],
      runMode: run_mode,
      overrides: overrides.get(`${loaded.registry.registry_id}:${field.qr_field_id}`) || new Map()
    });
  }
  const rows = Object.values(field_resolutions);
  const total = (key) => rows.reduce((sum, row) => sum + row.source_counts[key], 0);
  return freezeDeep({
    artifact_type: "qr_phase12_value_resolution",
    artifact_version: "phase13_qr_phase12_value_resolution.v1",
    resolver_version: PHASE12_QR_VALUE_RESOLVER_VERSION,
    status: rows.some((row) => row.unresolved_atomic_fields.length) ? "LOCKED_WITH_LIMITATIONS" : "LOCKED",
    run_mode: runMode(run_mode),
    phase12_is_sole_diligence_prefill_authority: true,
    reviewer_precedence_enabled: true,
    market_based_demo_is_not_evidence: true,
    binding_override_count: asArray(authority.catalog?.binding_overrides).length,
    field_resolutions,
    counts: {
      field_count: rows.length,
      atomic_value_count: rows.reduce((sum, row) => sum + row.atomic_value_count, 0),
      reviewer_atomic_count: total("REVIEWER"),
      phase12_atomic_count: total("PHASE_12"),
      market_based_atomic_count: total("MARKET_BASED"),
      unresolved_atomic_count: total("UNRESOLVED")
    }
  });
}

export function resolveField({ field, registryId, phase12ReportArtifacts, reviewerRecord, runMode, overrides = new Map() }) {
  const keys = asArray(field.atomic_fields);
  const candidates = Object.fromEntries(keys.map((key) => [key, []]));
  const binding_traces = [];
  asArray(field.phase12_bridge?.bindings).forEach((raw, index) => {
    const binding = applyOverride(raw, overrides.get(index));
    const resolved = resolveBinding(field, binding, phase12ReportArtifacts);
    binding_traces.push({ binding_index: index, ...resolved.trace });
    for (const [key, value] of Object.entries(resolved.atomic_values)) if (hasOwn(candidates, key) && hasMaterialValue(value)) {
      candidates[key].push({ value, field_ids: resolved.trace.field_ids, route_ids: resolved.trace.route_ids, report_artifact: binding.report_artifact });
    }
  });

  const atomic_values = {};
  const source_counts = { REVIEWER: 0, PHASE_12: 0, MARKET_BASED: 0, UNRESOLVED: 0 };
  const unresolved_atomic_fields = [];
  const demo = field.demo_fallback?.atomic_values || {};
  for (const key of keys) {
    const reviewer = reviewerValue(reviewerRecord, key, keys.length === 1);
    const phase12 = mergeCandidates(candidates[key], key, field);
    let source = "UNRESOLVED", value = null, provenance = [];
    if (reviewer.found) [source, value] = ["REVIEWER", reviewer.value];
    else if (phase12.found) [source, value, provenance] = ["PHASE_12", phase12.value, candidates[key]];
    else if (hasOwn(demo, key) && hasMaterialValue(demo[key])) [source, value] = ["MARKET_BASED", demo[key]];
    else unresolved_atomic_fields.push(key);
    source_counts[source] += 1;
    atomic_values[key] = atomicRecord({ key, value, source, provenance, reviewerRecord, runMode });
  }
  return freezeDeep({
    qr_field_id: field.qr_field_id,
    canonical_key: field.canonical_key,
    label: field.label,
    registry_id: registryId,
    registry_scope: field.registry_scope,
    lane: field.lane,
    section_id: field.section_id,
    shape: field.shape,
    fillability: field.fillability,
    phase12_linked: field.phase12_bridge?.linked === true,
    atomic_value_count: keys.length,
    atomic_values,
    binding_traces,
    source_counts,
    source_mix: Object.keys(source_counts).filter((key) => source_counts[key]),
    unresolved_atomic_fields,
    review_state: reviewState(reviewerRecord),
    limitation: reviewerRecord?.limitation || reviewerRecord?.reviewer_limitation || "",
    not_applicable: reviewerRecord?.not_applicable === true || normalizeText(reviewerRecord?.review_status) === "not applicable",
    demo_visible_label: field.demo_fallback?.visible_label || "{MARKET BASED}",
    market_based_demo_is_not_evidence: true,
    document_bindings: field.document_bindings,
    ui: field.ui || {}
  });
}

function indexOverrides(authority) {
  const fields = new Map();
  for (const loaded of authority.registries) for (const field of asArray(loaded.registry.fields)) fields.set(`${loaded.registry.registry_id}:${field.qr_field_id}`, field);
  const out = new Map();
  for (const item of asArray(authority.catalog?.binding_overrides)) {
    const key = `${item.registry_id}:${item.qr_field_id}`, index = Number(item.binding_index), field = fields.get(key);
    if (!field) throw new Error(`QR_BINDING_OVERRIDE_FIELD_UNKNOWN:${key}`);
    if (!Number.isInteger(index) || index < 0 || index >= asArray(field.phase12_bridge?.bindings).length) throw new Error(`QR_BINDING_OVERRIDE_INDEX_INVALID:${key}:${item.binding_index}`);
    if (!out.has(key)) out.set(key, new Map());
    if (out.get(key).has(index)) throw new Error(`QR_BINDING_OVERRIDE_DUPLICATE:${key}:${index}`);
    out.get(key).set(index, item);
  }
  return out;
}

function applyOverride(binding, override) {
  if (!override) return binding;
  for (const key of Object.keys(override)) if (!["override_id", "registry_id", "qr_field_id", "binding_index", "reason", "replace_filters"].includes(key)) throw new Error(`QR_BINDING_OVERRIDE_OPERATION_FORBIDDEN:${key}`);
  return { ...binding, filters: override.replace_filters === undefined ? binding.filters : override.replace_filters };
}

function resolveBinding(field, binding, artifacts) {
  const artifact = unwrap(artifacts[binding.report_artifact]);
  if (!artifact) return emptyTrace(binding, "REPORT_ARTIFACT_MISSING");
  if (binding.binding_type === "PHASE12_FIELD_ID") {
    const finding = findings(artifact).find((row) => row.field_id === binding.field_id);
    return finding && hasMaterialValue(finding.value)
      ? result(field, binding, [finding.value], [binding.field_id], [binding.route_id].filter(Boolean))
      : emptyTrace(binding, "FINDING_UNRESOLVED", [binding.field_id]);
  }
  if (binding.binding_type === "PHASE12_FIELD_FAMILY") {
    const rows = familyFindings(artifact, binding.field_id_prefix, binding.canonical_label_query);
    const values = rows.map((row) => row.value).filter(hasMaterialValue);
    return values.length ? result(field, binding, values, rows.map((row) => row.field_id), rows.map((row) => `P12.ROUTE.${row.field_id}`)) : emptyTrace(binding, "FAMILY_UNRESOLVED", rows.map((row) => row.field_id));
  }
  if (binding.binding_type === "PHASE12_STRUCTURED_FIELD") {
    const selected = resolvePathValues(artifact, binding.value_selector);
    if (!selected.found) return emptyTrace(binding, "STRUCTURED_SELECTOR_UNRESOLVED");
    const matched = selected.values.filter((value) => matches(value, binding.filters || {}));
    const atomic_values = structured(field, binding, selected.values, matched);
    return Object.values(atomic_values).some(hasMaterialValue)
      ? { atomic_values, trace: trace(binding, "RESOLVED", [], [], selected.values.length, matched.length) }
      : emptyTrace(binding, "STRUCTURED_VALUE_UNRESOLVED");
  }
  throw new Error(`QR_PHASE12_BINDING_TYPE_UNSUPPORTED:${field.qr_field_id}:${binding.binding_type}`);
}

function result(field, binding, values, field_ids, route_ids) {
  return { atomic_values: project(field, binding, values), trace: trace(binding, "RESOLVED", field_ids, route_ids, values.length, values.length) };
}
function emptyTrace(binding, status, field_ids = []) { return { atomic_values: {}, trace: trace(binding, status, field_ids, field_ids.map((id) => `P12.ROUTE.${id}`), 0, 0) }; }
function trace(binding, status, field_ids, route_ids, selected_value_count, matched_value_count) { return { status, binding_type: binding.binding_type, report_artifact: binding.report_artifact, selector: binding.value_selector, transform: binding.transform, field_ids, route_ids, selected_value_count, matched_value_count }; }

function project(field, binding, values) {
  const fills = asArray(binding.fills), out = {};
  if (!fills.length) return out;
  if (fills.length === 1) return { [fills[0]]: projected(values, fills[0], field) };
  const objects = values.flatMap((value) => Array.isArray(value) ? value : [value]).filter(isObject);
  for (const fill of fills) {
    const hits = objects.flatMap((object) => findByKey(object, fill));
    if (hits.some(hasMaterialValue)) out[fill] = projected(hits, fill, field);
  }
  const booleanFills = fills.filter((fill) => !hasOwn(out, fill) && typeof field.demo_fallback?.atomic_values?.[fill] === "boolean");
  if (booleanFills.length) Object.assign(out, classify(booleanFills, serializeSearchText(values)));
  if (!Object.keys(out).length && values.some(hasMaterialValue)) out[fills[0]] = projected(values, fills[0], field);
  return out;
}

function structured(field, binding, selected, matched) {
  const fills = asArray(binding.fills), mode = String(binding.transform || "").toUpperCase(), values = matched.length ? matched : selected;
  if (["BOOLEAN_ANY_MATCH", "BOOLEAN_SEMANTIC_MATCH"].includes(mode)) return selected.length && fills[0] ? { [fills[0]]: matched.length > 0 } : {};
  if (mode === "COLLECT_MATCHES") return fills[0] && matched.length ? { [fills[0]]: stableUnique(matched.flatMap(flatten).filter(hasMaterialValue)) } : {};
  if (mode === "MULTI_BOOLEAN_CLASSIFICATION") return classify(fills, serializeSearchText(values));
  if (mode === "PROJECT_VERSION_CONTROL_SIGNAL") return matched.length ? { [fills[0]]: true, ...(fills[1] ? { [fills[1]]: serializeSearchText(matched).trim() || "Version-control evidence identified" } : {}) } : {};
  return project(field, binding, values);
}

function matches(value, filters) {
  const text = normalizeText(serializeSearchText(value));
  return Object.entries(filters).every(([key, expected]) => {
    if (key === "contains") return text.includes(normalizeText(expected));
    if (key === "contains_any" || key === "evidence_contains_any") return asArray(expected).some((item) => text.includes(normalizeText(item)));
    if (key === "equals") return equal(value, expected);
    if (["mechanics_or_surface", "surface_contains", "output_or_action"].includes(key)) return text.includes(normalizeText(expected));
    if (key === "behavior_class_codes_any") return asArray(expected).some((item) => named(value, "behavior_class_codes").some((code) => equal(code, item)));
    return named(value, key).some((candidate) => equal(candidate, expected));
  });
}

function classify(fills, textValue) {
  const text = normalizeText(textValue), out = {};
  for (const fill of fills) out[fill] = String(fill).replace(/\[\]$/, "").split(/[^a-zA-Z0-9]+/).filter((token) => token.length > 2).some((token) => text.includes(normalizeText(token)));
  return out;
}

function mergeCandidates(candidates, key, field) {
  const values = candidates.map((row) => row.value).filter(hasMaterialValue);
  if (!values.length) return { found: false, value: null };
  if (String(key).endsWith("[]") || field.shape === "LIST") return { found: true, value: stableUnique(values.flatMap(flatten).filter(hasMaterialValue)) };
  if (field.shape === "BOOLEAN" || values.every((value) => typeof value === "boolean")) return { found: true, value: values.some(Boolean) };
  const unique = stableUnique(values.flatMap((value) => Array.isArray(value) ? value : [value]));
  return { found: true, value: unique.length === 1 ? unique[0] : unique };
}
function projected(values, key, field) { const rows = stableUnique(values.flatMap(flatten).filter(hasMaterialValue)); if (!rows.length) return null; if (String(key).endsWith("[]") || field.shape === "LIST") return rows; if (field.shape === "BOOLEAN") return rows.some(bool); return rows.length === 1 ? rows[0] : rows; }
function atomicRecord({ key, value, source, provenance, reviewerRecord, runMode }) { return freezeDeep({ atomic_key: key, value, source, phase12_field_ids: stableUnique(provenance.flatMap((row) => row.field_ids || [])), route_ids: stableUnique(provenance.flatMap((row) => row.route_ids || [])), report_artifacts: stableUnique(provenance.map((row) => row.report_artifact).filter(Boolean)), reviewer_action: reviewerRecord?.review_status || reviewerRecord?.action || null, demo_not_evidence: source === "MARKET_BASED", requires_section_attestation: true, value_state: source === "MARKET_BASED" ? runMode === "DEMO" ? "DEMO_PREFILLED" : "PROPOSED_MARKET_BASED" : source === "UNRESOLVED" ? "UNRESOLVED" : "RESOLVED" }); }
function reviewerValue(record, key, single) { if (!record || typeof record !== "object") return { found: false }; if (isObject(record.atomic_values) && hasOwn(record.atomic_values, key)) return { found: true, value: record.atomic_values[key] }; if (hasOwn(record, key)) return { found: true, value: record[key] }; return single && hasOwn(record, "value") ? { found: true, value: record.value } : { found: false }; }
function reviewState(record) { return !record ? "UNCHANGED" : record.not_applicable ? "NOT_APPLICABLE" : record.limitation || record.reviewer_limitation ? "LIMITATION_ADDED" : "EDITED"; }
function findings(artifact) { return Array.isArray(artifact?.findings) ? artifact.findings : Array.isArray(artifact?.rows) ? artifact.rows.filter((row) => row.field_id) : []; }
function familyFindings(artifact, prefix, queries) { const rows = findings(artifact).filter((row) => String(row.field_id || "").startsWith(String(prefix || ""))), q = asArray(queries).map(normalizeText).filter(Boolean); if (!q.length) return rows; const filtered = rows.filter((row) => q.some((needle) => normalizeText(row.label).includes(needle))); return filtered.length ? filtered : rows; }
function unwrap(value) { return !value || typeof value !== "object" ? null : isObject(value.artifact) ? value.artifact : isObject(value.payload) ? value.payload : value; }
function findByKey(root, key) { const out = []; walk(root, (candidate, value) => { if (normKey(candidate) === normKey(key) && hasMaterialValue(value)) out.push(value); }); return out; }
function named(root, key) { const out = []; walk(root, (candidate, value) => { if (normKey(candidate) === normKey(key)) out.push(...flatten(value)); }); return out; }
function walk(value, visit) { if (Array.isArray(value)) return value.forEach((item) => walk(item, visit)); if (!isObject(value)) return; for (const [key, nested] of Object.entries(value)) { visit(key, nested); walk(nested, visit); } }
function flatten(value) { return Array.isArray(value) ? value.flatMap(flatten) : [value]; }
function normKey(value) { return String(value || "").replace(/\[\]$/, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function equal(left, right) { if (Array.isArray(left)) return left.some((item) => equal(item, right)); if (Array.isArray(right)) return right.some((item) => equal(left, item)); return normalizeText(left) === normalizeText(right); }
function bool(value) { if (typeof value === "boolean") return value; const text = normalizeText(value); if (["yes", "true", "present", "active", "enabled"].includes(text)) return true; if (["no", "false", "absent", "inactive", "disabled"].includes(text)) return false; return hasMaterialValue(value); }
function runMode(value) { return normalizeText(value) === "demo" ? "DEMO" : "PRODUCTION"; }
