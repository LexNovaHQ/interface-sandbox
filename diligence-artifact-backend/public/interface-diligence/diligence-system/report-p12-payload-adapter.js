(function () {
  "use strict";

  const BRIDGE_VERSION = "interface_p12_frontend_bridge.v1";
  const REPORT_ENDPOINT_FRAGMENT = "/public/diligence-system/report/";
  const EXPECTED_SCHEMA_VERSION = "renderer_payload.v14.co_p12_05";
  const EXPECTED_RENDERER_SOURCE = "report_manifest_clean_profiles";
  const EXPECTED_SECTION_IDS = Object.freeze(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
  const STALE_RENDERER_SOURCES = new Set(["normalized_section_artifacts_only"]);
  const LEGACY_SECTION_IDS = new Set([
    "matter_overview",
    "executive_summary",
    "target_profile",
    "product_activity_ip_profile",
    "data_provenance_controls",
    "legal_document_control_review",
    "exposure_findings",
    "review_route_handoff_plan",
    "clarification_missing_source_queue",
    "methodology_limitations_public_annexure"
  ]);
  const RAW_LEGACY_KEYS = Object.freeze([
    "section_list",
    "raw_final_output_handoff",
    "normalized_report_manifest"
  ]);

  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!nativeFetch) throw new Error("P12_FRONTEND_BRIDGE_FETCH_UNAVAILABLE");

  window.fetch = async function interfaceP12FetchBridge(input, init) {
    const response = await nativeFetch(input, init);
    if (!isReportEndpoint(input)) return response;

    const clone = response.clone();
    const json = await clone.json().catch(function () { return null; });
    if (!response.ok || !json || !json.renderer_payload) return response;

    const bridged = {
      ...json,
      renderer_payload: adaptRendererPayload(json.renderer_payload)
    };

    return new Response(JSON.stringify(bridged), {
      status: response.status,
      statusText: response.statusText,
      headers: jsonHeaders(response.headers)
    });
  };

  document.addEventListener("DOMContentLoaded", installReportBridgeLinks);

  window.InterfaceP12RendererBridge = Object.freeze({
    version: BRIDGE_VERSION,
    expected_schema_version: EXPECTED_SCHEMA_VERSION,
    expected_renderer_source: EXPECTED_RENDERER_SOURCE,
    expected_section_ids: EXPECTED_SECTION_IDS.slice(),
    stale_renderer_sources: Array.from(STALE_RENDERER_SOURCES),
    legacy_section_ids: Array.from(LEGACY_SECTION_IDS),
    adaptRendererPayload
  });

  function isReportEndpoint(input) {
    const url = typeof input === "string" ? input : input?.url;
    return typeof url === "string" && url.includes(REPORT_ENDPOINT_FRAGMENT);
  }

  function jsonHeaders(headers) {
    const next = new Headers(headers || {});
    next.set("content-type", "application/json; charset=utf-8");
    return next;
  }

  function adaptRendererPayload(payload) {
    assertP12Payload(payload);

    const sections = payload.sections.map(function (section, index) {
      const sectionId = String(section.section_id || "").padStart(2, "0");
      const sectionNumber = Number(section.section_number || index + 1);
      const sectionTitle = section.section_title || `Report Section ${sectionId}`;
      return {
        ...section,
        section_id: sectionId,
        section_number: sectionNumber,
        section_anchor: `report-section-${sectionId}`,
        section_nav_label: `${sectionId} ${sectionTitle}`,
        public_navigation_index: index + 1,
        subsections: Array.isArray(section.subsections) ? section.subsections.map(normalizePublicSubsection) : []
      };
    });

    const bridged = {
      ...payload,
      sections,
      frontend_bridge: {
        version: BRIDGE_VERSION,
        source: EXPECTED_RENDERER_SOURCE,
        section_ids: EXPECTED_SECTION_IDS.slice(),
        note: "Phase 12 section_order validated and converted into public report navigation metadata. Exposure stream scope normalized to public labels without substantive reinterpretation."
      },
      public_report_navigation: sections.map(function (section) {
        return {
          section_id: section.section_id,
          section_number: section.section_number,
          section_title: section.section_title,
          section_anchor: section.section_anchor,
          section_nav_label: section.section_nav_label
        };
      })
    };

    // Current report document renders from `sections`. The bridge validates raw
    // `section_order`, converts it into public navigation metadata, and strips the
    // raw key before handing off to the browser renderer.
    delete bridged.section_order;
    return bridged;
  }

  function normalizePublicSubsection(subsection = {}) {
    return {
      ...subsection,
      stream_scope: normalizeStreamScope(subsection.stream_scope)
    };
  }

  function normalizeStreamScope(value) {
    const normalized = String(value || "").toUpperCase();
    if (normalized === "PRIMARY" || normalized === "PRIMARY SECTOR") return "Primary Sector";
    if (normalized === "OVERLAY" || normalized === "CAPABILITY OVERLAY") return "Capability Overlay";
    return value || null;
  }

  function assertP12Payload(payload) {
    if (!payload || typeof payload !== "object") fail("P12_FRONTEND_BRIDGE_PAYLOAD_MISSING");
    if (payload.schema_version !== EXPECTED_SCHEMA_VERSION) fail(`P12_FRONTEND_BRIDGE_SCHEMA_INVALID:${payload.schema_version || "missing"}`);
    if (STALE_RENDERER_SOURCES.has(payload.renderer_source)) fail(`P12_FRONTEND_BRIDGE_STALE_RENDERER_SOURCE:${payload.renderer_source}`);
    if (payload.renderer_source !== EXPECTED_RENDERER_SOURCE) fail(`P12_FRONTEND_BRIDGE_RENDERER_SOURCE_INVALID:${payload.renderer_source || "missing"}`);
    for (const key of RAW_LEGACY_KEYS) if (Object.prototype.hasOwnProperty.call(payload, key)) fail(`P12_FRONTEND_BRIDGE_LEGACY_KEY_PRESENT:${key}`);
    if (!Array.isArray(payload.sections)) fail("P12_FRONTEND_BRIDGE_SECTIONS_MISSING");
    const sectionIds = payload.sections.map(function (section) { return String(section?.section_id || "").padStart(2, "0"); });
    if (sectionIds.some(function (id) { return LEGACY_SECTION_IDS.has(id); })) fail("P12_FRONTEND_BRIDGE_LEGACY_SECTION_ID_PRESENT");
    if (JSON.stringify(sectionIds) !== JSON.stringify(EXPECTED_SECTION_IDS)) fail(`P12_FRONTEND_BRIDGE_SECTION_ORDER_INVALID:${sectionIds.join(",")}`);
    if (payload.section_order && JSON.stringify(payload.section_order) !== JSON.stringify(EXPECTED_SECTION_IDS)) fail("P12_FRONTEND_BRIDGE_SECTION_ORDER_FIELD_INVALID");
  }

  function installReportBridgeLinks() {
    const runId = queryParam("run_id");
    if (!runId) return;
    const qrHref = "qualified-review.html?run_id=" + encodeURIComponent(runId);
    const annexureHref = "technical-annexure.html?run_id=" + encodeURIComponent(runId);
    ["headerQualifiedReviewLink", "qualifiedReviewButton", "reportFooterQualifiedReviewButton"].forEach(function (id) {
      const node = document.getElementById(id);
      if (node) node.href = qrHref;
    });
    const annexure = document.getElementById("technicalAnnexureButton");
    if (annexure) {
      annexure.href = annexureHref;
      annexure.target = "_blank";
      annexure.rel = "noopener";
    }
  }

  function queryParam(name) {
    return new URLSearchParams(window.location.search || "").get(name) || "";
  }

  function fail(message) {
    throw new Error(message);
  }
})();
