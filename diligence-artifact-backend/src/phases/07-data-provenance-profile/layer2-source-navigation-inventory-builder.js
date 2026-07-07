import { controlledStatusForFamilyCoverage, controlledStatusForRoute } from "./layer2-anti-unknown-protocol.js";
import { buildPhase7DapFamilyRouteObligationMatrix } from "./layer2-dap-family-route-obligation-matrix.js";
import { classifyPhase7SourceDocumentType } from "./layer2-source-document-type-classifier.js";
import { buildPhase7CrossRouteRescuePlan } from "./layer2-cross-route-rescue-planner.js";

const BLOCKED_VALUE_KEYS = Object.freeze(["excerpt", "excerpts", "raw_text", "clean_text", "content", "body", "html", "markdown", "text"]);
const ROUTE_KEY_PATTERN = /(url|route|path|href|source|document|doc|page|section|anchor|locator|title|heading|family|artifact|ref|id|name)/i;

export function buildPhase7SourceNavigationInventory({ dapRegistryManifest, artifacts = {} } = {}) {
  if (!dapRegistryManifest || dapRegistryManifest.artifact_type !== "dap_registry_manifest") throw new Error("PHASE7_LAYER2_REQUIRES_DAP_REGISTRY_MANIFEST");
  const obligationMatrix = buildPhase7DapFamilyRouteObligationMatrix({ dapRegistryManifest });
  const routeInventory = buildAdmittedSourceRouteInventory({ artifacts });
  const coverageMatrix = buildCoverageMatrix({ obligationMatrix, routeInventory });
  const rescuePlan = buildPhase7CrossRouteRescuePlan({ obligationMatrix, routeInventory });
  const absenceLedger = buildAbsenceLedger({ routeInventory, coverageMatrix });
  return Object.freeze({
    artifact_type: "dap_source_navigation_inventory",
    manifest_version: "phase7_layer2_source_navigation_inventory_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_2_DAP_SOURCE_NAVIGATION_INVENTORY",
    navigation_policy: Object.freeze({ pinpoint_navigation_only: true, no_excerpts: true, no_full_document_payloads: true, legal_lossless_uses_legal_cartography_locator: true, d_family_navigation_supported: true }),
    registry_family_route_obligation_matrix: obligationMatrix,
    admitted_source_route_inventory: routeInventory,
    document_type_classification_map: routeInventory.map((row) => Object.freeze({ route_id: row.route_id, document_type: row.document_type, source_family: row.source_family, pinpoint_locator: row.pinpoint_locator })),
    dap_family_source_coverage_matrix: coverageMatrix,
    targeted_scan_obligation_queue: buildTargetedScanQueue({ coverageMatrix }),
    cross_route_rescue_plan: rescuePlan,
    source_absence_access_failure_ledger: absenceLedger,
    anti_unknown_navigation_gate_result: Object.freeze({ status: "PENDING_LAYER2_GATE" })
  });
}

export function buildAdmittedSourceRouteInventory({ artifacts = {} } = {}) {
  const rows = [];
  const seen = new Set();
  for (const [artifactName, artifact] of Object.entries(artifacts || {})) collectRows({ rows, seen, artifactName, node: artifact, path: artifactName, sourceFamily: sourceFamilyForArtifact(artifactName), viaLegalMap: artifactName === "legal_cartography_index" });
  return rows.map((row, index) => Object.freeze({ ...row, route_id: `DAP-NAV-${String(index + 1).padStart(4, "0")}` }));
}

function collectRows({ rows, seen, artifactName, node, path, sourceFamily, viaLegalMap }) {
  if (node == null) return;
  if (Array.isArray(node)) return node.forEach((item, index) => collectRows({ rows, seen, artifactName, node: item, path: `${path}[${index}]`, sourceFamily, viaLegalMap }));
  if (typeof node !== "object") return;
  const objectRow = rowFromObject({ artifactName, node, path, sourceFamily, viaLegalMap });
  if (objectRow) pushUnique(rows, seen, objectRow);
  for (const [key, value] of Object.entries(node)) {
    if (BLOCKED_VALUE_KEYS.includes(key)) continue;
    if (value && typeof value === "object") collectRows({ rows, seen, artifactName, node: value, path: `${path}.${key}`, sourceFamily, viaLegalMap });
    else if (ROUTE_KEY_PATTERN.test(key) && safeLocator(value)) pushUnique(rows, seen, makeRouteRow({ artifactName, sourceFamily, path: `${path}.${key}`, locator: String(value).trim(), label: key, viaLegalMap }));
  }
}

function rowFromObject({ artifactName, node, path, sourceFamily, viaLegalMap }) {
  const locator = firstSafe(node.url, node.href, node.source_url, node.route, node.path, node.source_path, node.document_url, node.locator, node.section_path, node.anchor, node.id);
  const label = firstSafe(node.title, node.label, node.name, node.document_type, node.source_type, node.family, node.section_title);
  if (!locator && !label) return null;
  return makeRouteRow({ artifactName, sourceFamily, path, locator: locator || label, label, viaLegalMap });
}

function makeRouteRow({ artifactName, sourceFamily, path, locator, label, viaLegalMap }) {
  const legalFamily = /^lossless_family__L\d_/i.test(sourceFamily);
  const dataFamily = /^lossless_family__D\d_/i.test(sourceFamily);
  const documentType = classifyPhase7SourceDocumentType({ artifact_name: artifactName, source_family: sourceFamily, source_url_or_route: locator, route_label: label, path, locator_kind: viaLegalMap ? "legal_cartography_locator" : "source_route" });
  return Object.freeze({
    route_id: "",
    source_artifact: artifactName,
    source_family: sourceFamily,
    source_url_or_route: locator,
    route_label: label || "",
    artifact_path: path,
    document_type: documentType,
    route_status: "ADMITTED_NAVIGATION_REF",
    access_status: "ROUTE_PRESENT_LAYER2",
    text_status: "TEXT_NOT_READ_LAYER2",
    legal_cartography_locator_required: legalFamily,
    legal_cartography_locator_present: !legalFamily || viaLegalMap,
    d_family_direct_navigation: dataFamily,
    pinpoint_locator: Object.freeze({ artifact_name: artifactName, artifact_path: path, locator, document_type: documentType, via_legal_cartography: Boolean(viaLegalMap) }),
    full_document_read_allowed: false,
    excerpt_allowed: false,
    primary_dap_families_supported: familiesForDocumentType(documentType, true),
    secondary_dap_families_supported: familiesForDocumentType(documentType, false),
    cross_route_rescue_allowed: true,
    anti_unknown_effect: controlledStatusForRoute({ route_status: "ADMITTED_NAVIGATION_REF", cross_route_rescue_allowed: true }),
    downstream_layer_3_instruction: "Use this pinpoint locator only; do not pass full source payloads from Layer 2."
  });
}

function buildCoverageMatrix({ obligationMatrix, routeInventory }) {
  return obligationMatrix.map((obligation) => {
    const primaryRoutes = routeInventory.filter((row) => obligation.primary_required_document_types.includes(row.document_type));
    const secondaryRoutes = routeInventory.filter((row) => obligation.secondary_allowed_document_types.includes(row.document_type));
    return Object.freeze({
      registry_family: obligation.registry_family,
      material_section_ids: obligation.material_section_ids,
      primary_required_document_types: obligation.primary_required_document_types,
      secondary_allowed_document_types: obligation.secondary_allowed_document_types,
      primary_route_ids: primaryRoutes.map((row) => row.route_id),
      secondary_route_ids: secondaryRoutes.map((row) => row.route_id),
      mandatory_before_unresolved: obligation.mandatory_before_unresolved,
      family_navigation_status: controlledStatusForFamilyCoverage({ primaryRoutes, secondaryRoutes, mandatory: obligation.mandatory_before_unresolved }),
      anti_unknown_obligation: obligation.anti_unknown_obligation
    });
  });
}

function buildTargetedScanQueue({ coverageMatrix }) {
  return coverageMatrix.filter((row) => row.family_navigation_status === "UPSTREAM_SOURCE_REPAIR_REQUIRED" || row.family_navigation_status === "SOURCE_NOT_ROUTED_BY_M6").map((row) => Object.freeze({ registry_family: row.registry_family, reason: row.family_navigation_status, required_document_types: row.primary_required_document_types }));
}

function buildAbsenceLedger({ routeInventory, coverageMatrix }) {
  const badLegal = routeInventory.filter((row) => row.legal_cartography_locator_required && !row.legal_cartography_locator_present).map((row) => Object.freeze({ route_id: row.route_id, status: "NAVIGATION_DEFECT_REPAIR_REQUIRED", reason: "legal_lossless_without_legal_cartography_locator" }));
  const gaps = coverageMatrix.filter((row) => row.family_navigation_status === "UPSTREAM_SOURCE_REPAIR_REQUIRED" || row.family_navigation_status === "SOURCE_NOT_ROUTED_BY_M6").map((row) => Object.freeze({ registry_family: row.registry_family, status: row.family_navigation_status, reason: "no_pinpoint_route" }));
  return Object.freeze([...badLegal, ...gaps]);
}

function familiesForDocumentType(documentType, primary) {
  const map = { privacy_notice: [["DAP.PARTY", "DAP.ROLE", "DAP.AUTH", "DAP.CTRL", "DAP.CONTACT", "DAP.SENS"], ["DAP.VEND", "DAP.LOC", "DAP.RET"]], dpa: [["DAP.ROLE", "DAP.VEND", "DAP.LOC", "DAP.RET", "DAP.SEC"], ["DAP.AUTH", "DAP.CTRL"]], subprocessor_list: [["DAP.VEND", "DAP.LOC"], ["DAP.SEC"]], security_trust: [["DAP.SEC"], ["DAP.VEND", "DAP.LOC", "DAP.RET"]], cookie_tracking_notice: [["DAP.CTRL", "DAP.CM"], ["DAP.AUTH"]], ai_policy: [["DAP.DOM"], ["DAP.AUTH", "DAP.SENS", "DAP.SEC"]], docs_api_data_flow: [["DAP.FLOW", "DAP.OBJ", "DAP.DOM"], ["DAP.AUTH", "DAP.RET"]], help_rights_request: [["DAP.CTRL", "DAP.CONTACT", "DAP.RET"], ["DAP.CM"]], retention_deletion_export: [["DAP.RET"], ["DAP.CTRL"]], incident_breach_security: [["DAP.SEC"], ["DAP.RET"]], terms: [["DAP.ROLE", "DAP.AUTH"], ["DAP.CTRL", "DAP.VEND"]], direct_legal_signal_profile: [["DAP.CONTACT", "DAP.CM"], []], upstream_activity_profile: [["DAP.PARTY", "DAP.OBJ", "DAP.FLOW"], ["DAP.AUTH", "DAP.SENS", "DAP.DOM"]], upstream_target_profile: [["DAP.PARTY", "DAP.ROLE", "DAP.LIM"], []], legal_navigation_ref: [["DAP.ROLE", "DAP.READY"], ["DAP.CONTACT", "DAP.AUTH"]] };
  return Object.freeze((map[documentType] || [[], []])[primary ? 0 : 1]);
}

function sourceFamilyForArtifact(artifactName) { return String(artifactName).startsWith("lossless_family__") ? artifactName : artifactName; }
function pushUnique(rows, seen, row) { const key = `${row.source_artifact}|${row.artifact_path}|${row.source_url_or_route}|${row.document_type}`; if (!seen.has(key)) { seen.add(key); rows.push(row); } }
function firstSafe(...values) { const found = values.find(safeLocator); return found ? String(found).trim() : ""; }
function safeLocator(value) { const text = String(value ?? "").trim(); return Boolean(text && text.length <= 240 && !/\n/.test(text)); }
