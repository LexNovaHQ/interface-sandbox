const DOCUMENT_ORDER = ["ToS", "Privacy Policy", "DPA", "AUP", "SLA"];
const DOCUMENT_TYPES = new Set(DOCUMENT_ORDER);
const EVIDENCE_STATUSES = new Set(["INGESTED", "ABSENT", "ACCESS_FAILED", "INSUFFICIENT"]);
const REDLINE_TYPES = new Set(["QUOTE_VS_QUOTE", "CLAIM_VS_ABSENCE", "STACK_VS_REALITY"]);
const FORBIDDEN_KEYS = new Set([
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
  "html"
]);
const FORBIDDEN_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);
const LEGAL_ADVICE_GUIDANCE_PHRASES = [
  /\bcertif(?:y|ies|ied) compliance\b/i,
  /\bconfirmed violation\b/i,
  /\billegal\b/i,
  /\bunenforceable\b/i
];
const UNADMITTED_DOCUMENT_NOTE = "Model referenced a legal document URL that was not part of the admitted evidence buffer; document not treated as reviewed evidence.";

function push(errors, instancePath, message, params = {}) {
  errors.push({ keyword: "legal_stack_review_guardrail", instancePath, schemaPath: "#/legalStackReviewGuardrails", message, params });
}
function warn(warnings, instancePath, message, params = {}) {
  warnings.push({ keyword: "legal_stack_review_guidance", instancePath, schemaPath: "#/legalStackReviewGuidance", message, params });
}
function walk(value, errors, warnings, path = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { value.forEach((item, index) => walk(item, errors, warnings, `${path}/${index}`)); return; }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key}`;
    if (FORBIDDEN_KEYS.has(key)) push(errors, childPath, `forbidden key emitted: ${key}`, { key });
    if (typeof child === "string") {
      if (FORBIDDEN_STATUSES.has(child.trim())) push(errors, childPath, `forbidden registry status emitted: ${child}`, { value: child });
      for (const pattern of LEGAL_ADVICE_GUIDANCE_PHRASES) if (pattern.test(child)) warn(warnings, childPath, "legal-advice/compliance conclusion wording detected; treat as guidance, not runtime blocker", { value: child });
    }
    walk(child, errors, warnings, childPath);
  }
}
function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function normalizeUrl(value) { try { const url = new URL(value); url.hash = ""; if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/"; return url.toString(); } catch { return String(value || "").trim(); } }
function evidenceUrls(evidenceBuffer = []) { const urls = new Set(["N/A", "manual_text"]); for (const record of Array.isArray(evidenceBuffer) ? evidenceBuffer : []) { for (const value of [record?.source_url, record?.final_url, record?.url]) { if (typeof value === "string" && value.trim()) { urls.add(value.trim()); urls.add(normalizeUrl(value)); } } } return urls; }
function legalDocumentUrlIsAdmitted(documentUrl, admittedUrls) { return admittedUrls.has(documentUrl) || admittedUrls.has(normalizeUrl(documentUrl)); }
function downgradeUnadmittedLegalDocument(doc, warnings, base) {
  const emittedUrl = String(doc?.document_url || "").trim();
  doc.exists = false;
  doc.document_url = "N/A";
  doc.evidence_status = "INSUFFICIENT";
  doc.covers = null;
  doc.misses = [...new Set([...(Array.isArray(doc.misses) ? doc.misses : []), UNADMITTED_DOCUMENT_NOTE])];
  warn(warnings, `${base}/document_url`, "legal document URL was not admitted as evidence; downgraded document to insufficient evidence", { document_url: emittedUrl });
}

export function validateLegalStackReviewGuardrails(review, { evidenceBuffer = [], threatMappingSupplied = false } = {}) {
  const errors = [];
  const warnings = [];
  if (!review || typeof review !== "object" || Array.isArray(review)) {
    push(errors, "", "legal_stack_review must be an object");
    return { ok: false, errors, warnings };
  }
  walk(review, errors, warnings, "");
  const legalStack = Array.isArray(review.legal_stack) ? review.legal_stack : [];
  const admittedUrls = evidenceUrls(evidenceBuffer);

  if (legalStack.length !== 5) push(errors, "/legal_stack", "legal_stack must contain exactly five entries", { count: legalStack.length });
  legalStack.forEach((doc, index) => {
    const base = `/legal_stack/${index}`;
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) { push(errors, base, "legal_stack item must be an object"); return; }
    const expectedType = DOCUMENT_ORDER[index];
    if (doc.document_type !== expectedType) push(errors, `${base}/document_type`, `document_type must be ${expectedType} at index ${index}`, { expected: expectedType, actual: doc.document_type });
    if (!DOCUMENT_TYPES.has(doc.document_type)) push(errors, `${base}/document_type`, `invalid document_type: ${doc.document_type}`, { document_type: doc.document_type });
    if (typeof doc.exists !== "boolean") push(errors, `${base}/exists`, "exists must be boolean");
    if (!EVIDENCE_STATUSES.has(doc.evidence_status)) push(errors, `${base}/evidence_status`, `invalid evidence_status: ${doc.evidence_status}`, { evidence_status: doc.evidence_status });
    if (doc.exists === true) {
      if (!nonEmptyString(doc.document_url)) {
        push(errors, `${base}/document_url`, "existing document_url must be non-empty");
      } else if (!legalDocumentUrlIsAdmitted(doc.document_url, admittedUrls)) {
        downgradeUnadmittedLegalDocument(doc, warnings, base);
      }
      if (doc.exists === true && !Array.isArray(doc.covers)) push(errors, `${base}/covers`, "existing document covers must be an array");
    }
    if (!Array.isArray(doc.misses)) push(errors, `${base}/misses`, "misses must be an array");
    const threats = Array.isArray(doc.linked_threat_ids) ? doc.linked_threat_ids : [];
    if (!threatMappingSupplied && threats.length > 0) push(errors, `${base}/linked_threat_ids`, "linked_threat_ids must be empty unless explicit threat mapping context was supplied", { linked_threat_ids: threats });
  });

  const redlines = Array.isArray(review.document_stack_redline) ? review.document_stack_redline : [];
  redlines.forEach((item, index) => {
    const base = `/document_stack_redline/${index}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) { push(errors, base, "document_stack_redline item must be an object"); return; }
    if (!REDLINE_TYPES.has(item.type)) push(errors, `${base}/type`, `invalid redline type: ${item.type}`, { type: item.type });
    for (const field of ["mismatch_id", "type", "quote", "source", "feature_ref", "claim_type", "contradicts"]) if (!nonEmptyString(item[field])) push(errors, `${base}/${field}`, `${field} must be non-empty`);
  });
  return { ok: errors.length === 0, errors, warnings };
}
