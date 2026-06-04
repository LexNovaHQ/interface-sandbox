export const SKELETON_SAFETY_BOUNDARIES = {
  liveGroqCalls: false,
  scraping: false,
  pdfUpload: false,
  clientData: false,
  finalLegalClauses: false,
  crmIntegration: false
};

export function assertSkeletonOnly() {
  return SKELETON_SAFETY_BOUNDARIES;
}
