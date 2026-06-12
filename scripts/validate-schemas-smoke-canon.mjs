import { SCHEMA_PATHS } from "../src/lib/schemas.js";
import { loadSchema, validateJsonSchema, formatSchemaErrors } from "../src/wrapper/diligence/validation/index.js";

const DISCLAIMER = "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.";

function refs(node, out = new Set()) {
  if (!node || typeof node !== "object") return out;
  if (typeof node.$ref === "string") out.add(node.$ref);
  for (const value of Object.values(node)) Array.isArray(value) ? value.forEach((v) => refs(v, out)) : refs(value, out);
  return out;
}
function resolve(schema, pointer) {
  if (!pointer || pointer === "#") return schema;
  const parts = pointer.slice(2).split("/").map((x) => x.replace(/~1/g, "/").replace(/~0/g, "~"));
  let cur = schema;
  for (const part of parts) { cur = cur?.[part]; if (cur === undefined) throw new Error(`Unresolved schema reference: ${pointer}`); }
}
function assertRefs(schema) { const r = refs(schema); r.forEach((x) => resolve(schema, x)); return r.size; }
function fixture() {
  return {
    diligence_run: { run_id: "schema-smoke-run", source_mode: "url", compiler_status: "completed" },
    source_bundle_summary: {},
    target_profile_v2: {},
    feature_profile_v2: { feature_profile_version: "feature_profile_v2", feature_inventory: [], product_feature_map: [] },
    legal_stack: [],
    document_stack_redline: [],
    threat_registry_summary: { registry_count_loaded: 0, registry_count_evaluated: 0, status_counts: { TRIGGERED: 0, CONTROLLED: 0, NOT_TRIGGERED: 0, NOT_APPLICABLE: 0, INSUFFICIENT_EVIDENCE: 0 } },
    feature_to_threat_matrix: [],
    findings: [],
    controlled_rows: [],
    insufficient_evidence_rows: [],
    assembly_route: { recommended_package: "INSUFFICIENT_PUBLIC_EVIDENCE", document_routes: [], route_reasoning: "Schema smoke fixture only.", local_counsel_review_required: true, vault_confirmation_question_count: 0, backend_assembler_note: "Node 5B derives backend-owned handoff fields deterministically." },
    report_data: { executive_report: {}, full_forensic_record: { source_review: {}, artifact_inventory: [], feature_inventory: [], feature_to_threat_matrix: [], document_stack_redline: [], triggered_findings: [], controlled_rows: [], insufficient_evidence_rows: [], assembly_route: {}, technical_audit_log: [] } },
    technical_audit_log: [],
    threat_findings: [],
    vault_confirmation_questions: [],
    disclaimer: DISCLAIMER
  };
}

const loaded = [];
for (const key of Object.keys(SCHEMA_PATHS)) { const schema = await loadSchema(key, { bypassCache: true }); loaded.push({ key, refs: assertRefs(schema) }); }
const schema = await loadSchema("compilerOutput", { bypassCache: true });
if (validateJsonSchema(schema, {}).ok) throw new Error("Expected empty compiler output to fail.");
const result = validateJsonSchema(schema, fixture());
if (!result.ok) throw new Error(`Canonical compiler fixture failed:\n${formatSchemaErrors(result.errors)}`);
console.log("Canonical schema smoke validation passed.");
loaded.forEach((x) => console.log(`- ${x.key}: ${x.refs} refs`));
