import { asArray, safeObject, safeText, unique } from "./report-safe-language.js";
import { NORMALIZATION_MAP_VERSION } from "./report-normalization-map.js";

export const FORENSIC_ANNEXURE_NORMALIZER_VERSION = "forensic_annexure_normalizer_v1_deterministic_manifest_only";

const REVIEW_READY_BOUNDARY_NOTICE = "This is a public-footprint diligence artifact and Review-Ready Draft support material. It is not legal advice, does not decide compliance, liability, enforceability, or legal sufficiency, and requires local counsel / qualified reviewer review before reliance.";
const PUBLIC_FOOTPRINT_LIMITATION = "This report is limited to reviewed public materials, admitted source artifacts, and locked backend diligence outputs. It does not verify private implementation, customer contracts, internal controls, or non-public operating facts.";
const DISPLAY_RULE = "Manifest only — full payload preserved as backend artifact";

const ANNEXURE_ARTIFACTS = Object.freeze([
  ["source_family_index", "A1", "Source Discovery", "AGENT_1B_EXTRACT", "source index"],
  ["source_discovery_handoff", "A2", "Source Discovery", "M6_BUCKET_INDEX", "handoff"],
  ["target_profile", "M7", "Target Profile", "M7_TARGET_PROFILE", "profile"],
  ["target_profile_forensics", "M7", "Target Profile", "M7_TARGET_PROFILE_FORENSICS", "forensics"],
  ["feature_candidate_inventory", "M8", "Feature Candidate Inventory", "M8_FEATURE_CANDIDATE_INVENTORY", "workpad / inventory"],
  ["target_feature_profile", "M8", "Target Feature Profile", "M8_TARGET_FEATURE_PROFILE", "profile"],
  ["target_feature_profile_forensics", "M8", "Target Feature Profile", "M8_TARGET_FEATURE_PROFILE_FORENSICS", "forensics"],
  ["legal_cartography_index", "M9", "Legal Cartography", "M9", "index"],
  ["data_provenance_profile", "M10", "Data Provenance", "M10", "profile"],
  ["data_provenance_profile_forensics", "M10", "Data Provenance", "M10_FORENSICS", "forensics"],
  ["extended_dap_india_readiness_profile", "4B", "Extended DAP", "AGENT_4B_EXTENDED_DAP_INDIA_READINESS", "profile"],
  ["integrated_dap_report", "4C", "Integrated DAP", "AGENT_4C_INTEGRATED_DAP_REPORT", "integrated report"],
  ["exposure_registry_route_plan", "M11", "Exposure Registry", "M11", "route plan"],
  ["exposure_registry_workpad_98", "M11", "Exposure Registry", "M11", "full workpad"],
  ["exposure_registry_controlled_profile", "M11", "Exposure Registry", "M11", "controlled profile"],
  ["exposure_registry_triggered_profile", "M11", "Exposure Registry", "M11", "triggered profile"],
  ["exposure_registry_profile_forensics", "M11", "Exposure Registry", "M11", "forensics"],
  ["challenge_gate", "M12", "Challenge Gate", "M12", "challenge gate"],
  ["normalized_report_manifest", "NORMALIZER", "Normalized Compiler", "NORMALIZED_COMPILER", "manifest"],
  ["normalizer_validation", "NORMALIZER", "Normalized Compiler", "NORMALIZED_COMPILER", "validation"]
]);

export function buildMethodologyLimitationsForensicAnnexureSection({ run = {}, artifacts = {}, baseOutput = {}, sectionStatus = "LOCKED_WITH_LIMITATIONS" } = {}) {
  const section = {
    section_id: "methodology_limitations_forensic_annexure",
    artifact_name: "normalized_section__methodology_limitations_forensic_annexure",
    section_title: "10. Methodology, Limitations & Forensic Annexure",
    section_order: 14,
    section_status: sectionStatus,
    display_section_status: sectionStatus,
    reviewer_summary: "Deterministic methodology, reliance boundary, upstream artifact manifest, provenance summary, and limitation/repair ledger. Full forensic and workpad payloads are preserved as backend artifacts and are not rendered inline.",
    subsections: [
      subsection("review_methodology_reliance_boundary", "10.1 Review Methodology & Reliance Boundary", [field("methodology_boundary", "Review methodology and reliance boundary", methodologyBoundary({ run, baseOutput }), "normalized_profiler", "methodology_boundary")]),
      subsection("upstream_artifact_annexure_manifest", "10.2 Upstream Artifact Annexure Manifest", [field("annexure_manifest", "Upstream artifact annexure manifest", annexureManifest({ artifacts, baseOutput }), "normalized_profiler", "artifact_presence_manifest")]),
      subsection("workpad_route_ledger_summary", "10.3 Workpad & Route Ledger Summary", [field("workpad_route_ledger_summary", "Workpad and route ledger summary", workpadRouteLedgerSummary({ artifacts, baseOutput }), "normalized_profiler", "workpad_route_ledger_counts")]),
      subsection("provenance_source_custody_summary", "10.4 Provenance & Source-Custody Summary", [field("provenance_source_custody_summary", "Provenance and source-custody summary", provenanceSourceCustodySummary({ run, artifacts, baseOutput }), "normalized_profiler", "provenance_source_custody_scan")]),
      subsection("limitation_repair_reinvestigation_ledger", "10.5 Limitation, Repair & Reinvestigation Ledger", [field("limitation_repair_reinvestigation_ledger", "Limitation, repair and reinvestigation ledger", limitationRepairLedger({ artifacts, baseOutput }), "normalized_profiler", "limitation_repair_warning_scan")]),
      subsection("technical_annexure_access_note", "10.6 Technical Annexure Access Note", [field("technical_annexure_access_note", "Technical annexure access note", technicalAnnexureAccessNote(), "normalized_profiler", "technical_annexure_access_note")])
    ],
    section_limitations: [],
    source_artifacts_used: ["normalized_report_manifest", "normalizer_validation", ...ANNEXURE_ARTIFACTS.map(([name]) => name)],
    normalization: {
      profiler_version: FORENSIC_ANNEXURE_NORMALIZER_VERSION,
      normalization_map_version: NORMALIZATION_MAP_VERSION,
      deterministic_only: true,
      manifest_only: true,
      full_forensic_payload_rendered_inline: false,
      legal_conclusion_generated: false
    },
    vault_mapping: { eligible_for_vault: false, vault_category: "methodology_limitations_forensic_annexure", requires_confirmation_before_assembly: true }
  };
  return section;
}

function methodologyBoundary({ run = {}, baseOutput = {} }) {
  const final = safeObject(baseOutput.final_output_handoff?.final_output_handoff || baseOutput.final_output_handoff);
  const trace = safeObject(final.compiler_trace);
  return {
    Run_ID: safeText(run.run_id || final.run_meta?.run_id, "Run ID not specified"),
    Target_URL: safeText(run.root_url || run.target_url || final.run_meta?.target_url, "Target URL not specified"),
    Source_Mode: safeText(run.source_mode || "url", "Source mode not specified"),
    Pipeline_Stages: ["Source discovery", "Target profile", "Feature profile", "Legal cartography", "Data provenance / DAP", "Exposure registry", "Challenge gate", "Deterministic normalization", "Renderer"],
    Public_Footprint_Limitation: PUBLIC_FOOTPRINT_LIMITATION,
    Review_Ready_Boundary: REVIEW_READY_BOUNDARY_NOTICE,
    No_Post_M12_Model_Generation: trace.model_used_after_m12 === false || trace.deterministic_only === true,
    Deterministic_Normalization: trace.deterministic_only === true,
    Section_789_Split: trace.section_789_artifact_split === true
  };
}

function annexureManifest({ artifacts = {}, baseOutput = {} }) {
  const merged = { ...artifacts, normalized_report_manifest: baseOutput.normalized_report_manifest, normalizer_validation: baseOutput.normalizer_validation };
  return ANNEXURE_ARTIFACTS.map(([artifactName, module, agent, phase, artifactType], index) => {
    const artifact = unwrapArtifact(merged[artifactName], artifactName);
    const present = hasContent(artifact);
    return {
      Annexure_Ref: `ANNEX-${module}-${String(index + 1).padStart(3, "0")}`,
      Module_Agent: agent,
      Phase: phase,
      Artifact_Name: artifactName,
      Artifact_Type: artifactType,
      Presence: present ? "present" : "missing or not loaded",
      Lock_Status: detectLockStatus(artifact, baseOutput, artifactName),
      Row_Object_Count: present ? rowOrObjectCount(artifact) : 0,
      Contains_Provenance_Metadata: present ? yesNo(containsKeyLike(artifact, /provenance|metadata|manifest|trace/i)) : "No",
      Contains_Source_Custody_Trace: present ? yesNo(containsKeyLike(artifact, /source|custody|evidence|artifact_ref|unit_ref|family/i)) : "No",
      Contains_Limitation_Repair_Ledger: present ? yesNo(containsKeyLike(artifact, /limitation|warning|repair|reinvestigation|failure|missing/i)) : "No",
      Display_Rule: DISPLAY_RULE
    };
  });
}

function workpadRouteLedgerSummary({ artifacts = {}, baseOutput = {} }) {
  const featureCandidateInventory = unwrapArtifact(artifacts.feature_candidate_inventory, "feature_candidate_inventory");
  const legal = unwrapArtifact(artifacts.legal_cartography_index, "legal_cartography_index");
  const integrated = unwrapArtifact(artifacts.integrated_dap_report, "integrated_dap_report");
  const route = unwrapArtifact(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan");
  const workpad = unwrapArtifact(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98");
  const triggered = unwrapArtifact(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile");
  const controlled = unwrapArtifact(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile");
  const challenge = unwrapArtifact(artifacts.challenge_gate, "challenge_gate");
  return [
    metric("Feature candidate count", countFirstArray(featureCandidateInventory, ["feature_candidates", "candidates", "canonical_candidates", "candidate_inventory"]), "feature_candidate_inventory"),
    metric("Legal cartography document rows", asArray(legal.document_coverage_index).length, "legal_cartography_index.document_coverage_index"),
    metric("Legal cartography unit rows", asArray(legal.document_structure_index).length, "legal_cartography_index.document_structure_index"),
    metric("Integrated DAP qualified-review queue rows", asArray(integrated.qualified_review_queue).length, "integrated_dap_report.qualified_review_queue"),
    metric("M11 route rows", asArray(route.route_rows).length, "exposure_registry_route_plan.route_rows"),
    metric("M11 batch count", asArray(route.batch_plan).length, "exposure_registry_route_plan.batch_plan"),
    metric("M11 workpad rows", asArray(workpad.registry_rows).length, "exposure_registry_workpad_98.registry_rows"),
    metric("M11 triggered rows", asArray(triggered.triggered_rows).length, "exposure_registry_triggered_profile.triggered_rows"),
    metric("M11 controlled rows", asArray(controlled.controlled_rows).length, "exposure_registry_controlled_profile.controlled_rows"),
    metric("M12 challenge findings", countChallengeRows(challenge), "challenge_gate"),
    metric("Normalized section artifacts", asArray(baseOutput.normalized_report_manifest?.section_artifacts).length, "normalized_report_manifest.section_artifacts")
  ];
}

function provenanceSourceCustodySummary({ run = {}, artifacts = {}, baseOutput = {} }) {
  const sourceFamilyIndex = unwrapArtifact(artifacts.source_family_index, "source_family_index");
  const dynamicManifest = safeObject(artifacts.normalized_compiler_dynamic_artifact_manifest);
  const final = safeObject(baseOutput.final_output_handoff?.final_output_handoff || baseOutput.final_output_handoff);
  const trace = safeObject(final.compiler_trace);
  const familyKeys = Object.keys(artifacts || {}).filter((key) => key.startsWith("lossless_family__"));
  return {
    Source_Family_Index_Present: yesNo(hasContent(sourceFamilyIndex)),
    Lossless_Family_Shards_Resolved: yesNo(trace.lossless_family_shards_resolved === true || containsKeyLike(sourceFamilyIndex, /shard|part|resolved/i)),
    Uploaded_Documents_Included: yesNo(Boolean(run.uploaded_source_documents?.document_count || run.uploaded_source_documents?.length || artifacts.uploaded_source_document_index || artifacts.uploaded_source_document_corpus)),
    Target_Families_Present: familyPresence(familyKeys, "T"),
    Product_Families_Present: familyPresence(familyKeys, "P"),
    Legal_Governance_Families_Present: familyPresence(familyKeys, "L"),
    Data_Families_Present: familyPresence(familyKeys, "D"),
    Dynamic_M11_Batch_Artifacts_Loaded: Number(dynamicManifest.loaded_batch_artifacts || 0),
    Dynamic_M12_Batch_Validation_Artifacts_Loaded: Number(dynamicManifest.loaded_batch_validation_artifacts || 0),
    Missing_Static_Artifacts: asArray(artifacts.normalized_compiler_missing_static_artifacts),
    Missing_Dynamic_Batch_Artifacts: asArray(dynamicManifest.missing_batch_artifacts),
    Missing_Dynamic_Batch_Validation_Artifacts: asArray(dynamicManifest.missing_batch_validation_artifacts)
  };
}

function limitationRepairLedger({ artifacts = {}, baseOutput = {} }) {
  const rows = [];
  const scanSources = [
    ["M7", "target_profile_forensics", unwrapArtifact(artifacts.target_profile_forensics, "target_profile_forensics")],
    ["M8", "target_feature_profile_forensics", unwrapArtifact(artifacts.target_feature_profile_forensics, "target_feature_profile_forensics")],
    ["M10", "data_provenance_profile_forensics", unwrapArtifact(artifacts.data_provenance_profile_forensics, "data_provenance_profile_forensics")],
    ["4C", "integrated_dap_report", unwrapArtifact(artifacts.integrated_dap_report, "integrated_dap_report")],
    ["M11", "exposure_registry_route_plan", unwrapArtifact(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan")],
    ["M11", "exposure_registry_workpad_98", unwrapArtifact(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98")],
    ["M11", "exposure_registry_profile_forensics", unwrapArtifact(artifacts.exposure_registry_profile_forensics, "exposure_registry_profile_forensics")],
    ["M12", "challenge_gate", unwrapArtifact(artifacts.challenge_gate, "challenge_gate")],
    ["NORMALIZER", "normalizer_validation", baseOutput.normalizer_validation]
  ];
  for (const [module, artifactName, artifact] of scanSources) {
    for (const item of extractLimitationItems(artifact)) {
      rows.push({
        Limitation_Ref: `LIM-${String(rows.length + 1).padStart(3, "0")}`,
        Source_Module: module,
        Source_Artifact: artifactName,
        Limitation_Type: classifyLimitation(item),
        Affected_Field_Row: affectedFieldRow(item),
        Blocking: isBlocking(item) ? "Yes" : "No",
        Reviewer_Action: reviewerActionForLimitation(item)
      });
    }
  }
  return rows;
}

function technicalAnnexureAccessNote() {
  return "Full upstream forensic ledgers, workpads, route plans, validation ledgers, and source-custody traces are preserved as locked backend artifacts. This public report renders only a forensic annexure manifest and deterministic summaries to avoid truncation and preserve review usability. Qualified reviewers should inspect the referenced backend artifacts before relying on any Review-Ready draft output.";
}

function extractLimitationItems(root, path = "") {
  if (!root || typeof root !== "object") return [];
  const items = [];
  if (Array.isArray(root)) {
    for (const [index, value] of root.entries()) items.push(...extractLimitationItems(value, `${path}[${index}]`));
    return items;
  }
  for (const [key, value] of Object.entries(root)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (/limitation|warning|repair|reinvestigation|failure|failures|missing|controlled_failure/i.test(key)) {
      if (Array.isArray(value)) for (const item of value.slice(0, 50)) items.push({ path: nextPath, value: summarizeValue(item) });
      else if (value && typeof value === "object") items.push({ path: nextPath, value: summarizeValue(value) });
      else if (value !== undefined && value !== null && value !== "") items.push({ path: nextPath, value: safeText(value, "Limitation recorded") });
    }
    if (value && typeof value === "object") items.push(...extractLimitationItems(value, nextPath));
  }
  return dedupeLimitationItems(items).slice(0, 80);
}

function dedupeLimitationItems(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.path}:${item.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function classifyLimitation(item) {
  const text = `${item.path} ${item.value}`.toLowerCase();
  if (/repair|reinvestigation/.test(text)) return "repair / reinvestigation";
  if (/failure|controlled_failure|missing/.test(text)) return "missing-source / failure";
  if (/warning/.test(text)) return "warning";
  return "limitation";
}

function affectedFieldRow(item) {
  const text = safeText(item.value, "Limitation recorded");
  const threat = text.match(/[A-Z]{3}_[A-Z]{3}_[0-9]{3}/)?.[0];
  return threat || safeText(item.path, "Affected row not specified");
}

function isBlocking(item) {
  return /repair|required|failure|controlled_failure|missing|block|not visible|insufficient/i.test(`${item.path} ${item.value}`);
}

function reviewerActionForLimitation(item) {
  if (isBlocking(item)) return "Qualified reviewer should resolve or confirm before downstream reliance.";
  return "Qualified reviewer should preserve this limitation in review notes and verify before reliance.";
}

function unwrapArtifact(value, key) {
  const object = safeObject(value);
  return safeObject(object[key] || object.artifact?.[key] || object);
}

function hasContent(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(String(value).trim());
}

function rowOrObjectCount(value) {
  if (Array.isArray(value)) return value.length;
  if (!value || typeof value !== "object") return hasContent(value) ? 1 : 0;
  const firstArray = findFirstArray(value);
  return firstArray ? firstArray.length : Object.keys(value).length;
}

function countFirstArray(object, keys) {
  for (const key of keys) if (Array.isArray(object?.[key])) return object[key].length;
  const first = findFirstArray(object);
  return first ? first.length : 0;
}

function findFirstArray(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return value;
  for (const nested of Object.values(value)) {
    if (Array.isArray(nested)) return nested;
    const found = findFirstArray(nested);
    if (found) return found;
  }
  return null;
}

function containsKeyLike(value, pattern, depth = 0) {
  if (!value || typeof value !== "object" || depth > 8) return false;
  if (Array.isArray(value)) return value.slice(0, 20).some((item) => containsKeyLike(item, pattern, depth + 1));
  for (const [key, nested] of Object.entries(value)) {
    if (pattern.test(key)) return true;
    if (nested && typeof nested === "object" && containsKeyLike(nested, pattern, depth + 1)) return true;
  }
  return false;
}

function detectLockStatus(artifact, baseOutput, artifactName) {
  if (!hasContent(artifact)) return "missing or not loaded";
  return safeText(artifact.lock_status || artifact.status || artifact.validation_status || baseOutput.normalized_report_manifest?.validation_status, artifactName === "normalizer_validation" ? baseOutput.normalizer_validation?.status : "present");
}

function countChallengeRows(challenge) {
  return countFirstArray(challenge, ["challenge_findings", "findings", "failures", "warnings", "limitations"]);
}

function metric(Metric, Count, Source) {
  return { Metric, Count, Source };
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function familyPresence(keys, prefix) {
  return yesNo(keys.some((key) => key.startsWith(`lossless_family__${prefix}`)));
}

function summarizeValue(value) {
  if (typeof value === "string") return safeText(value, "Limitation recorded");
  if (!value || typeof value !== "object") return safeText(value, "Limitation recorded");
  const o = safeObject(value);
  return safeText(o.message || o.failure || o.warning || o.limitation || o.reason || o.status || o.field || o.Threat_ID || o.artifact_name || JSON.stringify(trimObject(o)), "Limitation recorded");
}

function trimObject(object) {
  return Object.fromEntries(Object.entries(object).slice(0, 8).map(([key, value]) => [key, typeof value === "object" ? "[object]" : value]));
}

function subsection(subsection_id, subsection_title, fields) {
  return { subsection_id, subsection_title, fields: asArray(fields) };
}

function field(field_id, label, value, source_artifact, source_path) {
  return { field_id, label, value, source_artifact, source_path, evidence_refs: [], limitation: "", qualified_review_note: "Qualified reviewer should verify before reliance.", technical_refs: {} };
}
