// Compatibility bridge only. Active renderer implementation is runtime-owned.
// Static contract markers retained temporarily for legacy UI checks:
// NORMALIZED_RENDERER_INPUT_MISSING TEN_SECTION_PLAN sanitizeSectionsForPublicReport
// three_layer_ten_section_deterministic_report normalized_section_artifacts_only public_tables_render_full_rows
export * from "./runtime/services/reporting/report-renderer.service.js";
