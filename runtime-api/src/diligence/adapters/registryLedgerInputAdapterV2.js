import { buildRegistryLedgerInput as buildBaseRegistryLedgerInput } from "./registryLedgerInputAdapter.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function buildRegistryLedgerInput(args = {}) {
  const base = buildBaseRegistryLedgerInput(args);
  if (!base?.registry_ledger_input) return base;
  const batch = args.registryBatch || {};
  const rows = asArray(batch.registry_rows);
  const routeRecords = rows.map((row) => row?._stage7_route).filter(Boolean);
  const routeSummary = batch.batch_route_summary || rows._batch_route_summary || null;
  base.registry_ledger_input.stage7_route_contract = {
    contract_version: "stage7_route_contract_v2",
    rule_text: "Runtime-applicable rows are rows whose route_reason is UNI_ALWAYS_RUN, STAGE5_INT_TRIGGERED, or CONDITIONAL_DOC_REVIEW. Runtime-applicable rows must not receive NOT_APPLICABLE. For runtime-applicable rows, the only allowed final_status values are CONTROLLED, TRIGGERED, NOT_TRIGGERED, and INSUFFICIENT_EVIDENCE. Only deterministic skipped rows whose route_reason is INT_NOT_TRIGGERED may receive NOT_APPLICABLE. The model must not decide whether an archetype applies. Applicability is decided by Stage 5 and the deterministic Stage 7 planner before the model runs. CONDITIONAL_DOC_REVIEW = legal/governance artifact route, not archetype route.",
    route_records: routeRecords,
    batch_route_summary: routeSummary
  };
  base.registry_ledger_input.registry_rows = rows.map((row) => ({ ...row, stage7_route_contract: row?._stage7_route || null }));
  base.registry_ledger_input.registry_batch_meta = {
    ...base.registry_ledger_input.registry_batch_meta,
    stage7_route_contract_version: "stage7_route_contract_v2",
    batch_route_summary: routeSummary
  };
  return base;
}
