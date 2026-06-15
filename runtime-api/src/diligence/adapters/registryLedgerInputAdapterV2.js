import { buildRegistryLedgerInput as buildBaseRegistryLedgerInput } from "./registryLedgerInputAdapter.js";
import { buildStage7RouteContract, stage7RouteRuleText } from "../stage7RouteContract.js";
import { buildStage7EvidenceSafetyPacket } from "../stage7EvidenceSafetyPacket.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function routeForRow(row, index) {
  if (row?._stage7_route) return row._stage7_route;
  if (row?.stage7_route_contract) return row.stage7_route_contract;
  const id = String(row?.Threat_ID || row?.threat_id || "");
  const routeReason = id.startsWith("UNI_") ? "UNI_ALWAYS_RUN" : "STAGE5_INT_TRIGGERED";
  return buildStage7RouteContract({ row, index, routeReason, featureRefs: row?.feature_refs || ["UNKNOWN"] });
}

function legalCartographyFromArgs(args = {}, input = {}) {
  return args.legalCartography
    || args.legal_cartography
    || input?.legal_cartography
    || input?.stage6_review?.legal_document_cartography
    || input?.stage6_to_stage7_adapter?.legal_document_cartography
    || null;
}

function dataProfileFromArgs(args = {}, input = {}) {
  return args.dataProvenanceProfile
    || args.data_provenance_profile
    || input?.data_provenance_profile
    || input?.stage6_review?.data_provenance_profile
    || input?.stage6_to_stage7_adapter?.data_provenance_profile
    || null;
}

function evidenceExpansionModeFromBatch(batch = {}, budget = {}) {
  const mode = String(budget.stage7_source_text_mode || budget.source_text_mode || "").trim().toLowerCase();
  if (["full", "full_text", "raw_full_text", "expansion"].includes(mode)) return true;
  if (["profile", "profile_only", "manifest", "manifest_only"].includes(mode)) return false;
  return Boolean(batch?.reinvestigation_request);
}

export function buildRegistryLedgerInput(args = {}) {
  const base = buildBaseRegistryLedgerInput(args);
  if (!base?.registry_ledger_input) return base;
  const batch = args.registryBatch || {};
  const rows = asArray(batch.registry_rows);
  const routeRecords = rows.map(routeForRow).filter(Boolean);
  const routeSummary = batch.batch_route_summary || rows._batch_route_summary || null;
  base.registry_ledger_input.stage7_route_contract = {
    contract_version: "stage7_route_contract_v2",
    rule_text: stage7RouteRuleText(),
    route_records: routeRecords,
    batch_route_summary: routeSummary
  };
  if (batch.reinvestigation_request) base.registry_ledger_input.stage7_reinvestigation_request = batch.reinvestigation_request;
  base.registry_ledger_input.registry_rows = rows.map((row, index) => ({ ...row, stage7_route_contract: routeForRow(row, index) }));

  const evidenceSafety = buildStage7EvidenceSafetyPacket({
    registryRows: base.registry_ledger_input.registry_rows,
    targetProfile: args.targetProfile || base.registry_ledger_input.target_profile,
    targetFeatureProfile: args.targetFeatureProfile || base.registry_ledger_input.target_feature_profile,
    legalCartography: legalCartographyFromArgs(args, base.registry_ledger_input),
    dataProvenanceProfile: dataProfileFromArgs(args, base.registry_ledger_input),
    stage6Review: asObject(args.stage6Review || base.registry_ledger_input.stage6_review),
    registryBatch: batch,
    expansionMode: evidenceExpansionModeFromBatch(batch, args.budget || {})
  });
  base.registry_ledger_input.stage7_evidence_safety = evidenceSafety;
  base.registry_ledger_input.stage7_evidence_coverage_manifest = evidenceSafety.coverage_manifest;

  base.registry_ledger_input.registry_batch_meta = {
    ...base.registry_ledger_input.registry_batch_meta,
    stage7_route_contract_version: "stage7_route_contract_v2",
    stage7_evidence_safety_version: evidenceSafety.evidence_safety_version,
    batch_route_summary: routeSummary,
    reinvestigation: Boolean(batch.reinvestigation_request),
    evidence_expansion_mode: evidenceSafety.expansion_mode,
    evidence_coverage_summary: evidenceSafety.coverage_summary
  };
  return base;
}
