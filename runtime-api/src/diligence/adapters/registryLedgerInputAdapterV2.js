import { buildRegistryLedgerInput as buildBaseRegistryLedgerInput } from "./registryLedgerInputAdapter.js";
import { buildStage7RouteContract } from "../stage7RouteContract.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function routeForRow(row, index) {
  if (row?._stage7_route) return row._stage7_route;
  if (row?.stage7_route_contract) return row.stage7_route_contract;
  const id = String(row?.Threat_ID || row?.threat_id || "");
  const routeReason = id.startsWith("UNI_") ? "UNI_ALWAYS_RUN" : "STAGE5_INT_TRIGGERED";
  return buildStage7RouteContract({ row, index, routeReason, featureRefs: row?.feature_refs || ["UNKNOWN"] });
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
    rule_text: "Runtime-applicable rows are rows whose route_reason is UNI_ALWAYS_RUN, STAGE5_INT_TRIGGERED, or CONDITIONAL_DOC_REVIEW. Runtime-applicable rows must not receive NOT_APPLICABLE. For runtime-applicable rows, the only allowed final_status values are CONTROLLED, TRIGGERED, NOT_TRIGGERED, and INSUFFICIENT_EVIDENCE. Only deterministic skipped rows whose route_reason is INT_NOT_TRIGGERED may receive NOT_APPLICABLE. The model must not decide whether an archetype applies. Applicability is decided by Stage 5 and the deterministic Stage 7 planner before the model runs. CONDITIONAL_DOC_REVIEW = legal/governance artifact route, not archetype route.",
    route_records: routeRecords,
    batch_route_summary: routeSummary
  };
  base.registry_ledger_input.registry_rows = rows.map((row, index) => ({ ...row, stage7_route_contract: routeForRow(row, index) }));
  base.registry_ledger_input.registry_batch_meta = {
    ...base.registry_ledger_input.registry_batch_meta,
    stage7_route_contract_version: "stage7_route_contract_v2",
    batch_route_summary: routeSummary
  };
  return base;
}
