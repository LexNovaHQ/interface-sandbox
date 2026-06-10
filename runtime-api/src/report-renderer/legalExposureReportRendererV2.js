import { escapeHtml, navBar, pageStyles, rail } from "./htmlReportPrimitives.js";
import { renderEvidenceAndProfile, renderExecutiveSummary, renderMatterOverview } from "./legalExposureReportFrontSections.js";
import { renderAppendix, renderFindings, renderLegalStack, renderRemediation } from "./legalExposureReportBackSections.js";

export function renderLegalExposureReport(stage9ReportData) {
  const report = stage9ReportData?.report?.report_data || stage9ReportData?.report_data || stage9ReportData || {};
  const title = stage9ReportData?.report?.report_title || "Legal Exposure Diligence Report";
  const generatedAt = stage9ReportData?.generated_at || stage9ReportData?.report?.generated_at || "";
  const body = `${navBar()}<div class="layout">${rail()}<main>${renderMatterOverview(report)}${renderExecutiveSummary(report)}${renderEvidenceAndProfile(report)}${renderLegalStack(report)}${renderFindings(report)}${renderRemediation(report)}${renderAppendix(report)}</main></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>${pageStyles()}</style></head><body data-generated-at="${escapeHtml(generatedAt)}">${body}</body></html>`;
}
