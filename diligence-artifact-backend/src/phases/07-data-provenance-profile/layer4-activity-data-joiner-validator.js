const FORBIDDEN_KEYS = Object.freeze(["excerpt", "excerpts", "raw_text", "clean_text", "content", "body", "html", "markdown", "text", "final_value", "final_dap_value", "compliance_status"]);

export function validatePhase7ActivityDataFlowCandidateMap(candidateMap) {
  const errors = [];
  if (!candidateMap || candidateMap.artifact_type !== "activity_data_flow_candidate_map") errors.push("wrong_activity_data_flow_map_type");
  if (candidateMap?.join_policy?.deterministic_only !== true) errors.push("join_not_deterministic_only");
  if (candidateMap?.join_policy?.no_model_calls !== true) errors.push("model_calls_not_forbidden");
  if (candidateMap?.join_policy?.no_final_dap_values !== true) errors.push("final_dap_values_not_forbidden");
  if (candidateMap?.join_policy?.no_excerpts !== true) errors.push("excerpts_not_forbidden");
  const activities = candidateMap?.normalized_activities || [];
  const joined = candidateMap?.activity_data_flow_candidates || [];
  if (!Array.isArray(activities)) errors.push("normalized_activities_not_array");
  if (!Array.isArray(joined)) errors.push("joined_candidates_not_array");
  if (activities.length !== joined.length) errors.push("activity_join_count_mismatch");
  assertNoForbiddenKeys(candidateMap, "activity_data_flow_candidate_map", errors);
  for (const row of joined) {
    if (!row.activity_join_id) errors.push("missing_activity_join_id");
    if (!row.activity_reference) errors.push(`missing_activity_reference:${row.activity_join_id}`);
    if (!Array.isArray(row.candidate_dap_families) || row.candidate_dap_families.length < 3) errors.push(`missing_candidate_families:${row.activity_join_id}`);
    for (const family of ["DAP.PARTY", "DAP.OBJ", "DAP.FLOW"]) if (!row.candidate_dap_families.includes(family)) errors.push(`missing_base_family:${row.activity_join_id}:${family}`);
    if (!["ACTIVITY_DAP_JOIN_READY", "ACTIVITY_DAP_JOIN_REQUIRES_NAVIGATION_REPAIR"].includes(row.join_status)) errors.push(`bad_join_status:${row.activity_join_id}:${row.join_status}`);
    if (!["DERIVED_CROSS_ROUTE", "NAVIGATION_DEFECT_REPAIR_REQUIRED"].includes(row.anti_unknown_status)) errors.push(`bad_anti_unknown_status:${row.activity_join_id}:${row.anti_unknown_status}`);
  }
  return Object.freeze({
    status: errors.length ? "REPAIR_REQUIRED" : "PASS",
    checked_activities: activities.length,
    checked_joined_candidates: joined.length,
    deterministic_only: candidateMap?.join_policy?.deterministic_only === true,
    no_final_dap_values: candidateMap?.join_policy?.no_final_dap_values === true,
    no_excerpts: candidateMap?.join_policy?.no_excerpts === true && !errors.some((error) => error.includes("forbidden_key")),
    errors
  });
}

function assertNoForbiddenKeys(value, path, errors) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`, errors));
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.includes(key)) errors.push(`forbidden_key:${path}.${key}`);
    if (child && typeof child === "object") assertNoForbiddenKeys(child, `${path}.${key}`, errors);
  }
}
