const RUN_STATUSES = ["CONTROLLED", "TRIGGERED", "NOT_TRIGGERED", "INSUFFICIENT_EVIDENCE"];
const SKIP_STATUSES = ["NOT_APPLICABLE"];
const RUN_REASONS = new Set(["UNI_ALWAYS_RUN", "STAGE5_INT_TRIGGERED", "CONDITIONAL_DOC_REVIEW"]);
const SKIP_REASONS = new Set(["INT_NOT_TRIGGERED"]);

function asText(value) {
  return String(value || "").trim();
}

function asUpper(value) {
  return asText(value).toUpperCase();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function splitTokens(value) {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  return asText(value).split(/[|,;]/).map(asText).filter(Boolean);
}

export function stage7RowId(row, index = 0) {
  return asText(row?.Threat_ID || row?.threat_id || `ROW_${index + 1}`);
}

export function stage7RowName(row) {
  return asText(row?.Threat_Name || row?.threat_name || "Unnamed row");
}

export function stage7RowArchetype(row) {
  return asUpper(row?.Threat_ID || row?.threat_id || "").split("_")[0] || asUpper(row?.Archetype || row?.archetype?.code || row?.archetype || row?.archetype_code || row?.Helper_Archetype || row?.helper_archetype || "");
}

export function stage7RowSurfaces(row) {
  return splitTokens(row?.Surface || row?.surface?.tokens || row?.surface?.raw || row?.surface || row?.Surface_Tokens || row?.surface_tokens || row?.Surfaces || row?.surfaces);
}

export function isStage7RunReason(reason) {
  return RUN_REASONS.has(asUpper(reason));
}

export function isStage7SkipReason(reason) {
  return SKIP_REASONS.has(asUpper(reason));
}

export function allowedStatusesForRoute(routeReason) {
  return isStage7RunReason(routeReason) ? [...RUN_STATUSES] : [...SKIP_STATUSES];
}

export function buildStage7RouteContract({ row = {}, index = 0, routeReason = "INT_NOT_TRIGGERED", featureRefs = [], activeArchetypes = [], activeSurfaces = [] } = {}) {
  const normalizedReason = asUpper(routeReason) || "INT_NOT_TRIGGERED";
  const shouldRun = isStage7RunReason(normalizedReason);
  const archetype = stage7RowArchetype(row);
  return {
    contract_version: "stage7_route_contract_v2",
    threat_id: stage7RowId(row, index),
    threat_name: stage7RowName(row),
    route: shouldRun ? "RUN" : "SKIP",
    route_reason: normalizedReason,
    route_family: normalizedReason === "UNI_ALWAYS_RUN" ? "UNIVERSAL" : normalizedReason === "STAGE5_INT_TRIGGERED" ? "ACTIVE_ARCHETYPE" : normalizedReason === "CONDITIONAL_DOC_REVIEW" ? "LEGAL_GOVERNANCE_ARTIFACT" : "NON_ACTIVE_ARCHETYPE",
    archetype,
    surfaces: stage7RowSurfaces(row),
    active_archetypes: asArray(activeArchetypes).map(asUpper).filter(Boolean),
    active_surfaces: asArray(activeSurfaces).map(asText).filter(Boolean),
    feature_refs: asArray(featureRefs).map(asText).filter(Boolean),
    allowed_final_statuses: allowedStatusesForRoute(normalizedReason),
    not_applicable_allowed: !shouldRun,
    rule_text: "Runtime-applicable rows are rows whose route_reason is UNI_ALWAYS_RUN, STAGE5_INT_TRIGGERED, or CONDITIONAL_DOC_REVIEW. Runtime-applicable rows must not receive NOT_APPLICABLE. For runtime-applicable rows, the only allowed final_status values are CONTROLLED, TRIGGERED, NOT_TRIGGERED, and INSUFFICIENT_EVIDENCE. Only deterministic skipped rows whose route_reason is INT_NOT_TRIGGERED may receive NOT_APPLICABLE. The model must not decide whether an archetype applies. Applicability is decided by Stage 5 and the deterministic Stage 7 planner before the model runs. CONDITIONAL_DOC_REVIEW = legal/governance artifact route, not archetype route."
  };
}

export function routeContractFromInputRow(row = {}, index = 0) {
  const contract = row?._stage7_route || row?.stage7_route_contract || row?._runtime_route || null;
  if (contract && typeof contract === "object" && !Array.isArray(contract)) return contract;
  const routeReason = stage7RowArchetype(row) === "UNI" ? "UNI_ALWAYS_RUN" : "STAGE5_INT_TRIGGERED";
  return buildStage7RouteContract({ row, index, routeReason, featureRefs: ["UNKNOWN"] });
}

export function routeMapFromInput(input = {}) {
  const map = new Map();
  for (const [index, row] of asArray(input?.registry_rows).entries()) {
    const contract = routeContractFromInputRow(row, index);
    map.set(stage7RowId(row, index), contract);
  }
  for (const contract of asArray(input?.stage7_route_contract?.route_records)) {
    if (contract?.threat_id) map.set(asText(contract.threat_id), contract);
  }
  return map;
}

export function deriveFinalStatusForRoute(entry = {}, routeContract = {}) {
  const routeReason = routeContract?.route_reason || entry?._stage7_route?.route_reason;
  if (!isStage7RunReason(routeReason)) return "NOT_APPLICABLE";
  if (entry.final_status === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  if (entry.trigger_if_result === true && entry.exclude_if_result === true) return "CONTROLLED";
  if (entry.trigger_if_result === true && entry.exclude_if_result === false) return "TRIGGERED";
  if (entry.trigger_if_result === false) return "NOT_TRIGGERED";
  return "INSUFFICIENT_EVIDENCE";
}

export function statusAllowedByRoute(status, routeContract = {}) {
  return allowedStatusesForRoute(routeContract?.route_reason).includes(status);
}

export function stage7RouteRuleText() {
  return "Runtime-applicable rows are rows whose route_reason is UNI_ALWAYS_RUN, STAGE5_INT_TRIGGERED, or CONDITIONAL_DOC_REVIEW. Runtime-applicable rows must not receive NOT_APPLICABLE. For runtime-applicable rows, the only allowed final_status values are CONTROLLED, TRIGGERED, NOT_TRIGGERED, and INSUFFICIENT_EVIDENCE. Only deterministic skipped rows whose route_reason is INT_NOT_TRIGGERED may receive NOT_APPLICABLE. The model must not decide whether an archetype applies. Applicability is decided by Stage 5 and the deterministic Stage 7 planner before the model runs. CONDITIONAL_DOC_REVIEW = legal/governance artifact route, not archetype route.";
}
