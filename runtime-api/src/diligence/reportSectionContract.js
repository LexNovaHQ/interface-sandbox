import { REPORT_TITLE, REPORT_SUBTITLE, REVIEW_READY_DISCLAIMER } from "./reportTerminologyMap.js";

export const REPORT_SECTION_KEYS = Object.freeze([
  "matter_overview",
  "executive_summary",
  "target_profile",
  "product_activity_ip_profile",
  "data_risk_provenance_controls",
  "legal_document_control_review",
  "exposure_findings",
  "implications_remediation_path",
  "evidence_gaps_clarification_points",
  "methodology_limitations_review_notes",
  "forensic_ledger_appendix"
]);

export const REPORT_SECTION_HEADINGS = Object.freeze({
  matter_overview: "Matter Overview",
  executive_summary: "Executive Summary",
  target_profile: "Target Profile",
  product_activity_ip_profile: "Product, Activity & IP Profile",
  data_risk_provenance_controls: "Data Risk, Provenance & Controls",
  legal_document_control_review: "Legal Document & Control Review",
  exposure_findings: "Exposure Findings",
  implications_remediation_path: "Implications & Remediation Path",
  evidence_gaps_clarification_points: "Evidence Gaps & Clarification Points",
  methodology_limitations_review_notes: "Methodology, Limitations & Review Notes",
  forensic_ledger_appendix: "Forensic Ledger Appendix"
});

export const REPORT_NAVIGATION = Object.freeze([
  { key: "matter_overview", label: "Overview" },
  { key: "executive_summary", label: "Executive Summary" },
  { key: "target_profile", label: "Target" },
  { key: "product_activity_ip_profile", label: "Product & IP" },
  { key: "data_risk_provenance_controls", label: "Data" },
  { key: "legal_document_control_review", label: "Legal Docs" },
  { key: "exposure_findings", label: "Findings" },
  { key: "implications_remediation_path", label: "Remediation" },
  { key: "evidence_gaps_clarification_points", label: "Gaps" },
  { key: "methodology_limitations_review_notes", label: "Methodology" },
  { key: "forensic_ledger_appendix", label: "Appendix" }
]);

export function makeSection(key, body = {}) {
  return {
    key,
    heading: REPORT_SECTION_HEADINGS[key] || key,
    ...body
  };
}

export function makeReportShell(meta = {}) {
  return {
    report_title: REPORT_TITLE,
    report_subtitle: REPORT_SUBTITLE,
    generated_at: meta.generated_at || new Date().toISOString(),
    report_status: "Review-Ready Draft — Counsel Review Required",
    report_version: "stage9_report_v2",
    navigation: REPORT_NAVIGATION,
    disclaimer: REVIEW_READY_DISCLAIMER,
    report_data: Object.fromEntries(REPORT_SECTION_KEYS.map((key) => [key, makeSection(key)]))
  };
}
