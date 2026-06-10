import { REPORT_TITLE, REPORT_SUBTITLE, REVIEW_READY_DISCLAIMER } from "./reportTerminologyMap.js";

export const REPORT_SECTION_KEYS = Object.freeze([
  "matter_overview",
  "executive_exposure_summary",
  "evidence_reviewed",
  "product_activity_profile",
  "legal_risk_surface_map",
  "legal_stack_control_review",
  "exposure_findings",
  "evidence_gaps_clarification_points",
  "implications_remediation_path",
  "methodology_limitations_review_notes",
  "forensic_ledger_appendix"
]);

export const REPORT_SECTION_HEADINGS = Object.freeze({
  matter_overview: "Matter Overview",
  executive_exposure_summary: "Executive Exposure Summary",
  evidence_reviewed: "Evidence Reviewed",
  product_activity_profile: "Product & Activity Profile",
  legal_risk_surface_map: "Legal Risk Surface Map",
  legal_stack_control_review: "Legal Stack & Control Review",
  exposure_findings: "Exposure Findings",
  evidence_gaps_clarification_points: "Evidence Gaps & Clarification Points",
  implications_remediation_path: "Implications & Remediation Path",
  methodology_limitations_review_notes: "Methodology, Limitations & Review Notes",
  forensic_ledger_appendix: "Forensic Ledger Appendix"
});

export const REPORT_NAVIGATION = Object.freeze([
  { key: "matter_overview", label: "Overview" },
  { key: "executive_exposure_summary", label: "Executive Summary" },
  { key: "evidence_reviewed", label: "Evidence & Profile" },
  { key: "legal_stack_control_review", label: "Legal Stack" },
  { key: "exposure_findings", label: "Findings" },
  { key: "implications_remediation_path", label: "Remediation Path" },
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
    navigation: REPORT_NAVIGATION,
    disclaimer: REVIEW_READY_DISCLAIMER,
    report_data: Object.fromEntries(REPORT_SECTION_KEYS.map((key) => [key, makeSection(key)]))
  };
}
