function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function unwrapStage6Review(value) {
  const object = asObject(value);
  return object.stage6_review ? asObject(object.stage6_review) : object;
}

function hasLegalCartography(value) {
  return Boolean(asObject(value).legal_document_cartography);
}

function hasDataProvenance(value) {
  return Boolean(asObject(value).data_provenance_profile);
}

function firstStage6A(input = {}) {
  const candidates = [
    input.stage6a_review,
    input.stage6a,
    input.stage6a_result,
    input.stage6a_output,
    input.stage6a_stage_output,
    input.stage6a_legal_document_cartography,
    input.stage6_reviews?.stage6a,
    input.components?.stage6a,
    input.stage6_review_a,
    input.stage6_review
  ];
  if (hasLegalCartography(input)) candidates.unshift(input);
  for (const candidate of candidates) {
    const review = unwrapStage6Review(candidate);
    if (hasLegalCartography(review)) return review;
  }
  return null;
}

function firstStage6B(input = {}) {
  const candidates = [
    input.stage6b_review,
    input.stage6b,
    input.stage6b_result,
    input.stage6b_output,
    input.stage6b_stage_output,
    input.stage6b_data_provenance,
    input.stage6_reviews?.stage6b,
    input.components?.stage6b,
    input.stage6_review_b,
    input.stage6_review
  ];
  if (hasDataProvenance(input)) candidates.unshift(input);
  for (const candidate of candidates) {
    const review = unwrapStage6Review(candidate);
    if (hasDataProvenance(review)) return review;
  }
  return null;
}

function uniqueBy(rows = [], keyFn) {
  const out = [];
  const seen = new Set();
  for (const row of asArray(rows)) {
    const key = keyFn(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function limitationKey(row = {}) {
  return [row.limitation_id, row.scope, row.reason_code, row.impact_code, row.message]
    .filter(Boolean)
    .join("::");
}

function absenceKey(row = {}) {
  return [row.signal_type, row.object_ref, row.search_scope, row.absence_basis]
    .filter(Boolean)
    .join("::");
}

function fallbackKey(row = {}) {
  return [row.source_record_ref, row.source_url, row.reason_for_fallback]
    .filter(Boolean)
    .join("::");
}

export function buildStage6IntegratedHandoff(input = {}) {
  const stage6a = firstStage6A(input);
  const stage6b = firstStage6B(input);

  if (!stage6a) {
    const error = new Error("Stage 6 integrated handoff requires a Stage 6A output with legal_document_cartography.");
    error.error_type = "STAGE6_INTEGRATED_MISSING_STAGE6A";
    throw error;
  }

  if (!stage6b) {
    const error = new Error("Stage 6 integrated handoff requires a Stage 6B output with data_provenance_profile.");
    error.error_type = "STAGE6_INTEGRATED_MISSING_STAGE6B";
    throw error;
  }

  const navA = asObject(stage6a.stage7_navigation_index);
  const navB = asObject(stage6b.stage7_navigation_index);

  return {
    stage6_review_version: "stage6_review_v1",
    stage6_component: "stage6_integrated_handoff",
    stage_role: "stage7_navigation_index",
    input_refs: {
      ...asObject(stage6a.input_refs),
      ...asObject(stage6b.input_refs)
    },
    legal_document_cartography: stage6a.legal_document_cartography,
    data_provenance_profile: stage6b.data_provenance_profile,
    stage7_navigation_index: {
      feature_to_data_flow_index: asArray(navB.feature_to_data_flow_index),
      feature_to_legal_unit_index: asArray(navA.feature_to_legal_unit_index),
      control_family_index: asArray(navA.control_family_index),
      data_signal_index: asArray(navB.data_signal_index),
      legal_unit_source_locator_index: asArray(navA.legal_unit_source_locator_index),
      absence_unknown_index: uniqueBy(
        [...asArray(navA.absence_unknown_index), ...asArray(navB.absence_unknown_index)],
        absenceKey
      ),
      fallback_source_packet: uniqueBy(
        [...asArray(navA.fallback_source_packet), ...asArray(navB.fallback_source_packet)],
        fallbackKey
      )
    },
    stage6_limitations: uniqueBy(
      [...asArray(stage6a.stage6_limitations), ...asArray(stage6b.stage6_limitations)],
      limitationKey
    )
  };
}

export function buildStage6ToStage7Adapter(stage6Review = {}) {
  return {
    adapter_version: "stage6_to_stage7_adapter_v1",
    source_component: "stage6_integrated_handoff",
    stage6_review_version: stage6Review.stage6_review_version || "stage6_review_v1",
    stage7_navigation_index: asObject(stage6Review.stage7_navigation_index),
    legal_document_cartography: stage6Review.legal_document_cartography || null,
    data_provenance_profile: stage6Review.data_provenance_profile || null,
    stage6_limitations: asArray(stage6Review.stage6_limitations)
  };
}

export function buildStage6IntegratedHandoffArtifact(input = {}, metadata = {}) {
  const stage6Review = buildStage6IntegratedHandoff(input);
  return {
    ok: true,
    stage_id: "stage6_integrated_handoff",
    stage6_review: stage6Review,
    stage6_to_stage7_adapter: buildStage6ToStage7Adapter(stage6Review),
    metadata
  };
}

export const stage6IntegratedHandoffBuilderInternals = {
  firstStage6A,
  firstStage6B,
  uniqueBy,
  limitationKey,
  absenceKey,
  fallbackKey
};
