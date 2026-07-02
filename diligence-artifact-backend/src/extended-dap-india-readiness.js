const EVIDENCE_STRENGTHS = Object.freeze(["strong", "partial", "weak", "not_visible", "conflicting"]);
const INTERNAL_STATUSES = Object.freeze(["FACTUAL_BASE_STRONG", "FACTUAL_BASE_PARTIAL", "FACTUAL_BASE_WEAK", "NOT_VISIBLE_PUBLIC_FOOTPRINT", "CONFLICTING_PUBLIC_SIGNALS"]);

const FIELD_DEFINITIONS = Object.freeze([
  f("market_scope_and_india_relevance", "Scope, Market & Applicability", "Market scope and India relevance", ["india", "indian", "global", "worldwide", ".in", "dpdp", "data principal"], ["TP.JUR.*", "DAP.READY.001"]),
  f("public_footprint_review_boundary", "Scope, Market & Applicability", "Public-footprint review boundary", ["privacy policy", "terms", "trust center", "security", "subprocessor", "dpa", "data processing"], ["DAP.LIM.*", "DAP.REQ.*"]),
  f("jurisdictional_applicability_assumptions", "Scope, Market & Applicability", "Jurisdictional applicability assumptions", ["india", "global", "jurisdiction", "applicable law", "governing law", "data principal"], ["DAP.READY.001", "DAP.LIM.*"]),

  f("activity_to_data_flow_map", "M8 Activity-to-Data Flow Integration", "Activity-to-data flow map", ["activity", "workflow", "upload", "input", "output", "api", "model", "processing"], ["DAP.FLOW.*", "DAP.OBJ.*"]),
  f("personal_data_categories_by_activity", "M8 Activity-to-Data Flow Integration", "Personal data categories by activity", ["personal data", "personal information", "email", "name", "phone", "account", "profile", "usage", "device", "location"], ["DAP.OBJ.001", "DAP.OBJ.002", "DAP.PARTY.*"]),
  f("input_output_and_derived_data_treatment", "M8 Activity-to-Data Flow Integration", "Input, output and derived data treatment", ["input", "prompt", "upload", "output", "generated", "derived", "embedding", "transcript", "telemetry"], ["DAP.OBJ.004", "DAP.OBJ.006", "DAP.FLOW.*"]),
  f("ai_model_processing_chain_by_activity", "M8 Activity-to-Data Flow Integration", "AI model processing chain by activity", ["model", "ai", "foundation model", "inference", "training", "fine-tuning", "embedding", "api"], ["DAP.DOM.*", "DAP.FLOW.*"]),
  f("activity_level_data_protection_risk_notes", "M8 Activity-to-Data Flow Integration", "Activity-level data-protection risk notes", ["sensitive", "high risk", "personal data", "children", "biometric", "health", "financial", "automated"], ["DAP.SENS.*", "DAP.READY.*"]),

  f("affected_person_categories", "Affected Persons", "Affected person categories", ["user", "customer", "developer", "employee", "consumer", "data subject", "data principal", "visitor"], ["DAP.PARTY.001", "DAP.PARTY.002"]),
  f("customer_user_data_principal_relationship", "Affected Persons", "Customer/user/data-principal relationship", ["customer", "end user", "user", "data subject", "data principal", "account", "enterprise"], ["DAP.PARTY.*", "DAP.ROLE.*"]),
  f("enterprise_vs_end_user_population_signal", "Affected Persons", "Enterprise versus end-user population signal", ["enterprise", "business", "developer", "consumer", "individual", "team", "organization"], ["DAP.PARTY.*", "DAP.ROLE.*"]),

  f("role_allocation_candidate", "Role & Responsibility", "Role allocation candidate", ["controller", "processor", "service provider", "data fiduciary", "data processor", "customer", "vendor", "on behalf"], ["DAP.ROLE.001", "DAP.ROLE.002", "DAP.ROLE.003"]),
  f("controller_processor_fiduciary_ambiguity", "Role & Responsibility", "Controller/processor/fiduciary ambiguity", ["controller", "processor", "fiduciary", "on behalf", "customer data", "data processing agreement", "dpa"], ["DAP.ROLE.006", "DAP.ROLE.008"]),
  f("customer_vendor_relationship_signal", "Role & Responsibility", "Customer/vendor relationship signal", ["customer", "vendor", "service provider", "subprocessor", "partner", "supplier", "third party"], ["DAP.ROLE.*", "DAP.VEND.*"]),
  f("role_confirmation_needed_for_docs", "Role & Responsibility", "Role confirmation needed for documents", ["controller", "processor", "fiduciary", "dpa", "customer data", "on behalf", "instructions"], ["DAP.REQ.*", "DAP.ROLE.008"]),

  f("privacy_notice_surface", "Notice, Purpose, Consent & Rights", "Privacy notice surface", ["privacy policy", "privacy notice", "notice", "personal data", "personal information"], ["DAP.CTRL.001", "DAP.CTRL.002"]),
  f("purpose_and_use_mapping", "Notice, Purpose, Consent & Rights", "Purpose and use mapping", ["purpose", "use", "process", "provide", "improve", "analytics", "marketing", "training"], ["DAP.AUTH.*", "DAP.FLOW.*"]),
  f("consent_authorization_posture", "Notice, Purpose, Consent & Rights", "Consent / authorization posture", ["consent", "authorize", "permission", "opt-in", "lawful basis", "instructions"], ["DAP.AUTH.*", "DAP.CTRL.*"]),
  f("withdrawal_deletion_export_routes", "Notice, Purpose, Consent & Rights", "Withdrawal, deletion and export routes", ["withdraw", "delete", "deletion", "export", "access", "correction", "portability", "settings"], ["DAP.CTRL.*", "DAP.RET.*"]),
  f("rights_and_grievance_route", "Notice, Purpose, Consent & Rights", "Rights and grievance route", ["rights", "grievance", "complaint", "contact", "dpo", "privacy@", "officer"], ["DAP.PARTY.006", "DAP.CTRL.*", "DAP.READY.005"]),
  f("language_accessibility_and_user_control_notes", "Notice, Purpose, Consent & Rights", "Language accessibility and user-control notes", ["language", "local language", "settings", "preferences", "dashboard", "account controls", "help center"], ["DAP.CTRL.*", "DAP.READY.*"]),

  f("vendor_and_subprocessor_inventory_visibility", "Vendors, Sharing & Transfers", "Vendor/subprocessor inventory visibility", ["subprocessor", "processor", "vendor", "supplier", "service provider", "third party", "partner"], ["DAP.VEND.001", "DAP.VEND.002"]),
  f("third_party_sharing_posture", "Vendors, Sharing & Transfers", "Third-party sharing posture", ["share", "disclose", "third party", "partner", "affiliate", "vendor", "service provider"], ["DAP.VEND.*", "DAP.LOC.*"]),
  f("cross_border_transfer_and_custody_posture", "Vendors, Sharing & Transfers", "Cross-border transfer and custody posture", ["transfer", "cross-border", "international", "worldwide", "location", "region", "hosting", "storage"], ["DAP.LOC.001", "DAP.LOC.002", "DAP.LOC.004"]),
  f("hosting_storage_location_visibility", "Vendors, Sharing & Transfers", "Hosting/storage location visibility", ["hosting", "hosted", "storage", "data center", "region", "cloud", "aws", "gcp", "azure"], ["DAP.LOC.*", "DAP.VEND.*"]),
  f("transfer_safeguard_and_change_notice_gaps", "Vendors, Sharing & Transfers", "Transfer safeguard and change-notice gaps", ["safeguard", "standard contractual", "transfer", "subprocessor notice", "change notice", "objection"], ["DAP.LOC.*", "DAP.REQ.*"]),

  f("retention_period_visibility", "Retention, Deletion, Logs & Portability", "Retention period visibility", ["retention", "retain", "retained", "storage period", "delete after", "backup"], ["DAP.RET.001", "DAP.RET.002"]),
  f("deletion_return_export_controls", "Retention, Deletion, Logs & Portability", "Deletion, return and export controls", ["delete", "deletion", "return", "export", "portability", "download", "erase"], ["DAP.RET.*", "DAP.CTRL.*"]),
  f("logging_telemetry_and_audit_trail_posture", "Retention, Deletion, Logs & Portability", "Logging, telemetry and audit-trail posture", ["log", "logging", "telemetry", "audit trail", "monitoring", "analytics", "diagnostic"], ["DAP.RET.*", "DAP.SEC.*"]),
  f("india_log_retention_cert_in_review_note", "Retention, Deletion, Logs & Portability", "India log-retention / CERT-In review note", ["cert-in", "six hour", "6 hour", "180 days", "six months", "log retention", "incident report"], ["DAP.READY.*", "DAP.RET.*", "DAP.SEC.*"]),

  f("security_control_visibility", "Security, Access & Incident", "Security-control visibility", ["security", "encryption", "tls", "aes", "soc 2", "iso 27001", "access control", "rbac"], ["DAP.SEC.001", "DAP.SEC.002"]),
  f("access_control_and_internal_governance_posture", "Security, Access & Incident", "Access-control and internal-governance posture", ["access control", "least privilege", "rbac", "employee access", "internal", "policy", "audit"], ["DAP.SEC.*", "DAP.READY.*"]),
  f("incident_breach_response_visibility", "Security, Access & Incident", "Incident/breach response visibility", ["incident", "breach", "notification", "security event", "report", "response plan"], ["DAP.SEC.*", "DAP.READY.*"]),
  f("security_certification_and_policy_reliance_limits", "Security, Access & Incident", "Security certification and policy reliance limits", ["soc 2", "iso 27001", "certification", "audit", "trust center", "security policy"], ["DAP.SEC.*", "DAP.LIM.*"]),

  f("children_sensitive_and_high_risk_context", "Sensitive, Children & High-Risk", "Children, sensitive and high-risk context", ["children", "minor", "under 18", "biometric", "health", "financial", "sensitive", "high risk"], ["DAP.SENS.*", "DAP.READY.*"]),
  f("ai_training_profiling_and_automated_decisioning_review_note", "Sensitive, Children & High-Risk", "AI training, profiling and automated-decisioning review note", ["training", "fine-tuning", "model improvement", "profiling", "automated decision", "human review", "inference", "ai"], ["DAP.DOM.*", "DAP.SENS.*", "DAP.READY.*"])
]);

export function buildExtendedDapIndiaReadinessProfile({ run = {}, artifacts = {} } = {}) {
  const rows = flattenArtifacts(artifacts);
  const m10 = unwrap(artifacts.data_provenance_profile, "data_provenance_profile");
  const m8 = unwrap(artifacts.target_feature_profile, "target_feature_profile");
  const activities = normalizeActivities(m8);
  const dataCategories = collectDataCategories(m10);
  const fields = FIELD_DEFINITIONS.map((definition, index) => deriveField({ definition, index, rows, activities, dataCategories, m10 }));
  const missing = fields.filter((field) => field.missing_proof_required).map((field) => ({
    request_id: `DAP-REQ-${String(field.field_index).padStart(3, "0")}`,
    field_id: field.field_id,
    field_title: field.field_title,
    field_status: field.status,
    status: "PROOF_REQUESTED",
    required_action: field.qualified_review_action,
    blocking: false,
    registry_basis: field.registry_basis
  }));
  const sections = Object.fromEntries([...new Set(fields.map((field) => field.category))].map((category) => [category, fields.filter((field) => field.category === category)]));
  const status = fields.some((field) => field.evidence_strength === "conflicting") ? "LOCKED_WITH_LIMITATIONS" : missing.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";
  return {
    extended_dap_india_readiness_profile: {
      artifact_type: "extended_dap_india_readiness_profile",
      profile_version: "extended_dap_india_readiness_v2_substantive_field_base",
      run_id: run.run_id || "UNKNOWN_RUN",
      generated_at: new Date().toISOString(),
      derivation_mode: "DETERMINISTIC_SUBSTANTIVE_FIELD_BASE_NO_MODEL",
      source_boundary: "PUBLIC_SOURCE_ONLY",
      base_m10_profile_ref: "data_provenance_profile",
      m8_activity_profile_ref: "target_feature_profile",
      registry_family_basis: "DAP.* rows from FIELD_DERIVATION_REGISTRY_v2_LOCKED.csv",
      output_policy: {
        machine_signal_statuses_are_internal_only: true,
        public_report_should_use_finding_factual_basis_limitation_action: true,
        no_legal_compliance_conclusion: true,
        no_dpdp_certification: true
      },
      status,
      lock_status: status,
      field_count: fields.length,
      expected_field_count: 36,
      evidence_strength_counts: countBy(fields, (field) => field.evidence_strength),
      status_counts: countBy(fields, (field) => field.status),
      activity_count: activities.length,
      data_category_count: dataCategories.length,
      fields,
      sections,
      public_report_seed: buildPublicReportSeed(fields),
      missing_proof_requests: missing,
      limitations: buildLimitations({ artifacts, fields, activities, dataCategories }),
      validation_quality_control_result: {
        status: fields.length === 36 && fields.every((field) => EVIDENCE_STRENGTHS.includes(field.evidence_strength)) ? (status === "LOCKED" ? "PASS" : "PASS_WITH_LIMITATION") : "REPAIR_REQUIRED",
        expected_field_count: 36,
        actual_field_count: fields.length,
        substantive_field_base: true,
        all_evidence_strengths_allowed: fields.every((field) => EVIDENCE_STRENGTHS.includes(field.evidence_strength)),
        deterministic: true,
        model_usage: "NONE_DETERMINISTIC"
      }
    }
  };
}

function f(field_id, category, field_title, terms, registry_basis) {
  return { field_id, category, field_title, terms, registry_basis };
}

function deriveField({ definition, index, rows, activities, dataCategories, m10 }) {
  const evidence = findRows(rows, definition.terms, 5);
  const linkedActivities = linkActivities(activities, definition.terms);
  const linkedDataCategories = linkDataCategories(dataCategories, definition.terms);
  const m10Basis = findM10Basis(m10, definition.terms);
  const strength = evidenceStrength({ evidence, linkedActivities, linkedDataCategories, m10Basis });
  const status = statusForStrength(strength);
  const finding = buildFinding({ definition, evidence, linkedActivities, linkedDataCategories, m10Basis, strength });
  const limitation = limitationFor({ definition, strength, evidence, linkedActivities });
  const qualifiedReviewAction = reviewActionFor({ definition, strength, limitation });
  return {
    field_index: index + 1,
    field_id: definition.field_id,
    field_title: definition.field_title,
    category: definition.category,
    finding,
    factual_basis: factualBasis({ evidence, linkedActivities, linkedDataCategories, m10Basis }),
    linked_m8_activity_ids: linkedActivities.map((activity) => activity.activity_id),
    linked_m8_activity_labels: linkedActivities.map((activity) => activity.label),
    linked_data_categories: linkedDataCategories,
    registry_basis: definition.registry_basis,
    source_evidence: evidence.map((row) => ({ artifact_name: row.artifact_name, source_path: row.path, excerpt: row.excerpt })),
    evidence_strength: strength,
    limitation,
    qualified_review_action: qualifiedReviewAction,
    status,
    value_summary: finding,
    question: definition.field_title,
    missing_proof_required: ["weak", "not_visible", "conflicting"].includes(strength),
    model_usage: "NONE_DETERMINISTIC"
  };
}

function evidenceStrength({ evidence, linkedActivities, linkedDataCategories, m10Basis }) {
  const score = evidence.length + linkedActivities.length + linkedDataCategories.length + (m10Basis ? 1 : 0);
  if (evidence.some((row) => /conflict|contradict|inconsistent/i.test(row.excerpt))) return "conflicting";
  if (score >= 4 && evidence.length >= 2) return "strong";
  if (score >= 2) return "partial";
  if (score === 1) return "weak";
  return "not_visible";
}

function statusForStrength(strength) {
  return ({ strong: "FACTUAL_BASE_STRONG", partial: "FACTUAL_BASE_PARTIAL", weak: "FACTUAL_BASE_WEAK", not_visible: "NOT_VISIBLE_PUBLIC_FOOTPRINT", conflicting: "CONFLICTING_PUBLIC_SIGNALS" })[strength] || "NOT_VISIBLE_PUBLIC_FOOTPRINT";
}

function buildFinding({ definition, evidence, linkedActivities, linkedDataCategories, m10Basis, strength }) {
  if (strength === "not_visible") return `${definition.field_title}: not substantively visible in the reviewed public materials.`;
  const parts = [];
  if (linkedActivities.length) parts.push(`linked to ${linkedActivities.length} public product/activity signal(s)`);
  if (linkedDataCategories.length) parts.push(`touching ${list(linkedDataCategories.slice(0, 5))}`);
  if (evidence.length) parts.push(`with public evidence from ${list(unique(evidence.map((row) => row.artifact_name)).slice(0, 3))}`);
  if (m10Basis) parts.push(`and corroborated by the base data profile`);
  const posture = strength === "strong" ? "is substantively supported by the public-footprint record" : strength === "partial" ? "is partially supported but requires confirmation before reliance" : "has only a weak public-footprint signal";
  return `${definition.field_title}: ${posture}${parts.length ? `, ${parts.join(", ")}` : ""}.`;
}

function factualBasis({ evidence, linkedActivities, linkedDataCategories, m10Basis }) {
  const basis = [];
  if (linkedActivities.length) basis.push(`M8 activities: ${list(linkedActivities.map((activity) => activity.label).slice(0, 4))}.`);
  if (linkedDataCategories.length) basis.push(`Data categories: ${list(linkedDataCategories.slice(0, 6))}.`);
  if (m10Basis) basis.push(`M10 profile basis: ${trunc(m10Basis)}.`);
  if (evidence.length) basis.push(`Public evidence: ${trunc(evidence[0].excerpt)}.`);
  return basis.length ? basis.join(" ") : "No specific public-footprint basis was captured for this field.";
}

function limitationFor({ definition, strength, evidence, linkedActivities }) {
  if (strength === "strong") return "No public-footprint limitation identified beyond qualified review before reliance.";
  if (strength === "partial") return "The public footprint supports the field directionally, but does not fully prove implementation, scope, or operational coverage.";
  if (strength === "weak") return "Only a weak public signal was found; the field should not be relied on for document assembly without confirmation.";
  if (strength === "conflicting") return "Public materials contain conflicting or ambiguous signals requiring reviewer resolution.";
  return `${definition.field_title} was not visible from reviewed public materials${linkedActivities.length || evidence.length ? " with sufficient specificity" : ""}.`;
}

function reviewActionFor({ definition, strength }) {
  if (strength === "strong") return `Confirm ${definition.field_title.toLowerCase()} during qualified review before final document reliance.`;
  if (strength === "partial") return `Confirm implementation scope and evidence for ${definition.field_title.toLowerCase()} before draft preparation.`;
  return `Request evidence or reviewer confirmation for ${definition.field_title.toLowerCase()} before document assembly reliance.`;
}

function buildPublicReportSeed(fields) {
  const groups = [
    ["processing_scope", "Processing scope and activity-data map", ["activity_to_data_flow_map", "personal_data_categories_by_activity", "input_output_and_derived_data_treatment"]],
    ["role_population", "Affected persons and role posture", ["affected_person_categories", "customer_user_data_principal_relationship", "role_allocation_candidate", "controller_processor_fiduciary_ambiguity"]],
    ["notice_rights", "Notice, purpose, consent and rights posture", ["privacy_notice_surface", "purpose_and_use_mapping", "consent_authorization_posture", "withdrawal_deletion_export_routes", "rights_and_grievance_route"]],
    ["vendors_transfers", "Vendor, sharing, transfer and custody posture", ["vendor_and_subprocessor_inventory_visibility", "third_party_sharing_posture", "cross_border_transfer_and_custody_posture", "hosting_storage_location_visibility"]],
    ["retention_security_ai", "Retention, security, incident and AI-control posture", ["retention_period_visibility", "logging_telemetry_and_audit_trail_posture", "security_control_visibility", "incident_breach_response_visibility", "ai_training_profiling_and_automated_decisioning_review_note"]],
    ["qualified_review", "Qualified-review priorities", ["role_confirmation_needed_for_docs", "transfer_safeguard_and_change_notice_gaps", "india_log_retention_cert_in_review_note", "children_sensitive_and_high_risk_context"]]
  ];
  return groups.map(([finding_id, title, fieldIds]) => {
    const selected = fields.filter((field) => fieldIds.includes(field.field_id));
    return {
      finding_id,
      title,
      field_ids: fieldIds,
      evidence_strength: aggregateStrength(selected),
      narrative: selected.map((field) => field.finding).join(" "),
      limitation: selected.map((field) => field.limitation).filter(Boolean).join(" "),
      qualified_review_action: selected.map((field) => field.qualified_review_action).filter(Boolean).slice(0, 3).join(" ")
    };
  });
}

function buildLimitations({ artifacts, fields, activities, dataCategories }) {
  const out = ["4B is a deterministic public-footprint field base. It does not decide DPDP applicability, compliance, adequacy, fiduciary/processor status, or local-law sufficiency."];
  if (!artifacts?.data_provenance_profile) out.push("Base data provenance profile unavailable or incomplete.");
  if (!activities.length) out.push("M8 activity profile did not expose activity rows for activity-linked data protection mapping.");
  if (!dataCategories.length) out.push("Base data profile did not expose structured data categories.");
  const weak = fields.filter((field) => ["weak", "not_visible", "conflicting"].includes(field.evidence_strength));
  if (weak.length) out.push(`${weak.length} substantive field(s) require proof or reviewer confirmation before document reliance.`);
  return out;
}

function normalizeActivities(m8) {
  const activities = Array.isArray(m8.activities) ? m8.activities : [];
  return activities.map((activity, index) => ({
    activity_id: activity.activity_display_id || activity.activity_id || `ACT-${String(index + 1).padStart(3, "0")}`,
    label: clean(activity.activity_feature_name || activity.related_product_service || activity.publicly_described_activity || activity.activity_summary || `Activity ${index + 1}`),
    text: clean(JSON.stringify(activity))
  }));
}

function collectDataCategories(m10) {
  const values = [];
  for (const key of ["data_categories", "personal_data_categories_by_activity", "sensitive_special_category_signals", "generated_output_and_derived_data_treatment", "ai_model_provider_processing_chain", "prompt_output_logging_telemetry_controls"]) collectPlainValues(m10?.[key], values);
  return unique(values.map(clean).filter(Boolean)).slice(0, 30);
}

function linkActivities(activities, terms) {
  const lowerTerms = terms.map((term) => String(term).toLowerCase());
  return activities.filter((activity) => lowerTerms.some((term) => activity.text.toLowerCase().includes(term))).slice(0, 6);
}

function linkDataCategories(categories, terms) {
  const lowerTerms = terms.map((term) => String(term).toLowerCase());
  return categories.filter((category) => lowerTerms.some((term) => String(category).toLowerCase().includes(term))).slice(0, 8);
}

function findM10Basis(m10, terms) {
  const values = [];
  collectPlainValues(m10, values);
  const lowerTerms = terms.map((term) => String(term).toLowerCase());
  return values.map(clean).find((value) => lowerTerms.some((term) => value.toLowerCase().includes(term))) || "";
}

function flattenArtifacts(artifacts) {
  const rows = [];
  for (const [artifactName, artifact] of Object.entries(artifacts || {})) flattenValue(rows, artifactName, artifactName, artifact);
  return rows;
}

function flattenValue(rows, artifactName, path, value) {
  if (value == null) return;
  if (["string", "number", "boolean"].includes(typeof value)) {
    const text = clean(String(value));
    if (text) rows.push({ artifact_name: artifactName, path, text, excerpt: trunc(text) });
    return;
  }
  if (Array.isArray(value)) return value.slice(0, 400).forEach((item, i) => flattenValue(rows, artifactName, `${path}[${i}]`, item));
  if (typeof value === "object") return Object.entries(value).slice(0, 400).forEach(([key, child]) => flattenValue(rows, artifactName, `${path}.${key}`, child));
}

function findRows(rows, terms, limit) {
  const lowerTerms = terms.map((term) => String(term).toLowerCase()).filter(Boolean);
  const found = [];
  for (const row of rows) {
    const lower = String(row.text || "").toLowerCase();
    if (!lower || !lowerTerms.some((term) => lower.includes(term))) continue;
    found.push(row);
    if (found.length >= limit) break;
  }
  return found;
}

function unwrap(value, key) {
  if (value?.[key] && typeof value[key] === "object") return value[key];
  if (value?.artifact?.[key] && typeof value.artifact[key] === "object") return value.artifact[key];
  return value && typeof value === "object" ? value : {};
}

function collectPlainValues(value, out) {
  if (value == null) return;
  if (["string", "number", "boolean"].includes(typeof value)) {
    const cleaned = clean(String(value));
    if (cleaned) out.push(cleaned);
    return;
  }
  if (Array.isArray(value)) return value.slice(0, 200).forEach((item) => collectPlainValues(item, out));
  if (typeof value === "object") return Object.values(value).slice(0, 200).forEach((item) => collectPlainValues(item, out));
}

function aggregateStrength(fields) {
  if (fields.some((field) => field.evidence_strength === "conflicting")) return "conflicting";
  if (fields.some((field) => field.evidence_strength === "strong")) return "partial";
  if (fields.some((field) => field.evidence_strength === "partial")) return "partial";
  if (fields.some((field) => field.evidence_strength === "weak")) return "weak";
  return "not_visible";
}

function countBy(items, fn) {
  return items.reduce((acc, item) => { const key = fn(item); acc[key] = (acc[key] || 0) + 1; return acc; }, {});
}
function list(values) { return values.filter(Boolean).join(", "); }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function trunc(value) { const s = clean(value); return s.length > 260 ? `${s.slice(0, 257)}...` : s; }
