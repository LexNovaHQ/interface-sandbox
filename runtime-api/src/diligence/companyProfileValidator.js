const CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function add(errors, instancePath, message) {
  errors.push({ keyword: "validation", instancePath, schemaPath: "companyProfile", message, params: {} });
}

function requireString(obj, key, path, errors) {
  if (typeof obj?.[key] !== "string") add(errors, `${path}/${key}`, "must be string");
}

function requireStringArray(obj, key, path, errors) {
  if (!Array.isArray(obj?.[key]) || obj[key].some((item) => typeof item !== "string")) add(errors, `${path}/${key}`, "must be array of strings");
}

function requireConfidence(obj, key, path, errors) {
  if (!CONFIDENCE.has(obj?.[key])) add(errors, `${path}/${key}`, "must be high, medium, low, or unknown");
}

function requireObject(obj, key, path, errors) {
  if (!isObject(obj?.[key])) add(errors, `${path}/${key}`, "must be object");
  return isObject(obj?.[key]) ? obj[key] : {};
}

function validateEvidenceSource(item, path, errors) {
  if (!isObject(item)) return add(errors, path, "must be object");
  requireString(item, "evidence_source_id", path, errors);
  requireString(item, "source_url", path, errors);
  requireString(item, "claim_supported", path, errors);
  requireConfidence(item, "confidence", path, errors);
}

export function validateCompanyProfile(data) {
  const errors = [];
  if (!isObject(data)) {
    add(errors, "", "must be object");
    return { ok: false, errors };
  }

  if (data.company_profile_version !== "company_profile_v1") add(errors, "/company_profile_version", "must equal company_profile_v1");

  const identity = requireObject(data, "company_identity", "", errors);
  for (const key of ["brand_name", "legal_or_corporate_name", "website", "domain", "headquarters_or_origin_signal", "corporate_status_signal"]) requireString(identity, key, "/company_identity", errors);
  requireConfidence(identity, "identity_confidence", "/company_identity", errors);

  const business = requireObject(data, "business_model", "", errors);
  for (const key of ["company_type", "primary_customer_type", "sales_motion", "revenue_model_signal", "enterprise_or_self_serve_signal"]) requireString(business, key, "/business_model", errors);
  requireConfidence(business, "business_model_confidence", "/business_model", errors);

  const market = requireObject(data, "market_context", "", errors);
  requireString(market, "industry", "/market_context", errors);
  requireStringArray(market, "target_geographies", "/market_context", errors);
  requireStringArray(market, "target_languages", "/market_context", errors);
  requireStringArray(market, "regulated_sector_exposure", "/market_context", errors);
  requireString(market, "public_sector_or_enterprise_signal", "/market_context", errors);
  requireConfidence(market, "market_context_confidence", "/market_context", errors);

  const operating = requireObject(data, "operating_profile", "", errors);
  for (const key of ["high_level_offering", "ai_system_type", "deployment_model_signal"]) requireString(operating, key, "/operating_profile", errors);
  requireStringArray(operating, "user_data_touchpoints", "/operating_profile", errors);
  requireStringArray(operating, "customer_data_touchpoints", "/operating_profile", errors);
  requireConfidence(operating, "operating_profile_confidence", "/operating_profile", errors);

  const assumptions = requireObject(data, "downstream_assumptions", "", errors);
  for (const key of ["for_product_profile", "for_legal_review", "for_registry_matching", "assumption_warnings"]) requireStringArray(assumptions, key, "/downstream_assumptions", errors);

  const evidence = requireObject(data, "evidence", "", errors);
  for (const key of ["primary_company_sources", "supporting_company_sources"]) {
    if (!Array.isArray(evidence[key])) add(errors, `/evidence/${key}`, "must be array");
    else evidence[key].forEach((item, index) => validateEvidenceSource(item, `/evidence/${key}/${index}`, errors));
  }
  requireStringArray(evidence, "evidence_notes", "/evidence", errors);
  requireStringArray(evidence, "unresolved_questions", "/evidence", errors);

  requireStringArray(data, "limitations", "", errors);
  return { ok: errors.length === 0, errors };
}
