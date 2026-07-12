import { asArray, safeObject } from "./report-safe-language.js";

const T = ["T1", "T2", "T3", "T4", "T5"];
const TH = "Th" + "reat";
const ID = TH + "_ID";
const NAME = TH + "_Name";
const SECTIONS = [
  "exposure_summary_harm_mechanism_workpad_summary",
  "exposure_diagnosis_table",
  "exposure_control_discipline",
  "review_route_action_plan",
  "control_handoff_readiness"
];

export function normalizeExposureTierSections(base = {}, artifacts = {}) {
  const context = buildContext(artifacts);
  const out = { ...safeObject(base) };
  for (const id of SECTIONS) {
    const key = `normalized_section__${id}`;
    if (!out[key]) continue;
    out[key] = normalizeSection(out[key], context);
  }
  return out;
}

function normalizeSection(section = {}, context) {
  const object = safeObject(section);
  return {
    ...object,
    subsections: asArray(object.subsections).map((sub) => normalizeSubsection(sub, context)),
    normalization: { ...(object.normalization || {}), exposure_tier_carry_forward: true, exposure_tier_sort_locked: true }
  };
}

function normalizeSubsection(subsection = {}, context) {
  const id = String(subsection.subsection_id || "");
  return {
    ...safeObject(subsection),
    fields: asArray(subsection.fields).map((field) => normalizeField(field, context, id))
  };
}

function normalizeField(field = {}, context, subsectionId) {
  const object = safeObject(field);
  if (!Array.isArray(object.value)) return object;
  const value = sortRows(object.value.map((row) => enrichRow(row, context, subsectionId)));
  return { ...object, value };
}

function enrichRow(row, context, subsectionId) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const out = { ...row };
  const id = String(out[ID] || out["th" + "reat_id"] || "").trim();
  const meta = context.byId.get(id) || {};
  const tier = normTier(out.Pain_Tier || out.Priority || out.Highest_Tier || out.Highest_Priority || out.review_priority_tier || meta.Pain_Tier || context.groupTier.get(groupKey(out)));
  const depth = out.Pain_Depth || out.Depth || out.review_depth || meta.Pain_Depth || "";
  if (tier && !out.Pain_Tier) out.Pain_Tier = tier;
  if (tier && subsectionId === "workpad_only_summary" && !out.Highest_Tier) out.Highest_Tier = tier;
  if (tier && subsectionId === "handoff_readiness_summary" && !out.Highest_Tier) out.Highest_Tier = tier;
  if (depth && !out.Pain_Depth) out.Pain_Depth = depth;
  if (meta.registry_order !== undefined && out.registry_order === undefined) out.registry_order = meta.registry_order;
  return out;
}

function buildContext(artifacts = {}) {
  const byId = new Map();
  const grouped = new Map();
  const plan = unwrap(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan");
  const workpad = unwrap(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98");
  const triggered = unwrap(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile");
  const controlled = unwrap(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile");
  asArray(plan.route_rows).forEach((row) => addMeta(byId, row));
  asArray(workpad.registry_rows).forEach((row) => {
    const meta = addMeta(byId, row);
    const tier = normTier(meta?.Pain_Tier);
    if (!tier) return;
    const key = groupKey(row);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ Pain_Tier: tier });
  });
  asArray(triggered.triggered_rows).forEach((row) => addMeta(byId, row));
  asArray(controlled.controlled_rows).forEach((row) => addMeta(byId, row));
  return { byId, groupTier: new Map([...grouped.entries()].map(([key, rows]) => [key, highestTier(rows)])) };
}

function addMeta(map, row = {}) {
  const material = safeObject(row.material_projection || row.deterministic_registry_spine || row.registry_row || row);
  const id = String(row[ID] || material[ID] || "").trim();
  if (!id) return null;
  const prev = map.get(id) || {};
  const meta = {
    Pain_Tier: normTier(material.Pain_Tier || row.Pain_Tier || prev.Pain_Tier),
    Pain_Depth: material.Pain_Depth || row.Pain_Depth || prev.Pain_Depth || "",
    registry_order: row.registry_order ?? material.registry_order ?? prev.registry_order
  };
  map.set(id, meta);
  return meta;
}

function sortRows(rows) {
  return [...asArray(rows)].sort((a, b) => rank(a) - rank(b) || exposureNo(a) - exposureNo(b) || Number(a?.registry_order ?? 9999) - Number(b?.registry_order ?? 9999) || String(a?.[ID] || a?.Subcat || a?.Handoff_State || "").localeCompare(String(b?.[ID] || b?.Subcat || b?.Handoff_State || "")));
}

function rank(row) {
  const i = T.indexOf(normTier(row?.Pain_Tier || row?.Priority || row?.Highest_Tier || row?.Highest_Priority || row?.review_priority_tier));
  return i === -1 ? 999 : i;
}

function exposureNo(row) {
  const match = String(row?.Exposure_ID || row?.display_exposure_id || "").match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 9999;
}

function highestTier(rows) {
  return asArray(rows).map((row) => normTier(row?.Pain_Tier || row?.Priority || row?.Highest_Tier || row?.Highest_Priority)).filter(Boolean).sort((a, b) => T.indexOf(a) - T.indexOf(b))[0] || "";
}

function normTier(value) {
  const raw = String(value || "").trim().toUpperCase();
  return T.includes(raw) ? raw : "";
}

function groupKey(row = {}) {
  const material = safeObject(row.material_projection || row);
  const subcat = String(row.Subcat || row.Subcategory || row.subcategory || material.Subcategory || part(row[ID] || material[ID], 1) || "UNKNOWN").split("—")[0].trim().toUpperCase() || "UNKNOWN";
  const reason = String(row.Route_Reason || row.route_reason || material.route_reason || "WORKPAD_ONLY").trim() || "WORKPAD_ONLY";
  return `${subcat}::${reason}`;
}

function unwrap(value, key) {
  const object = safeObject(value);
  return safeObject(object[key] || object.artifact?.[key] || object);
}

function part(id, index) {
  return String(id || "").split("_")[index] || "";
}
