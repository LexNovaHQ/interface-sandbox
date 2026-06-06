import { SCHEMA_PATHS } from "../src/lib/schemas.js";
import { loadSchema, validateJsonSchema, formatSchemaErrors } from "../src/wrapper/diligence/validation/index.js";

const DISCLAIMER = "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.";

function decodePointerSegment(segment) {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function resolveJsonPointer(rootSchema, pointer) {
  if (!pointer || pointer === "#") return rootSchema;

  if (!pointer.startsWith("#/")) {
    throw new Error(`Only local JSON pointers are supported in smoke checks. Received: ${pointer}`);
  }

  const parts = pointer.slice(2).split("/").map(decodePointerSegment);
  let current = rootSchema;

  for (const part of parts) {
    current = current?.[part];
    if (current === undefined) {
      throw new Error(`Unresolved schema reference: ${pointer}`);
    }
  }

  return current;
}

function collectRefs(node, refs = new Set()) {
  if (!node || typeof node !== "object") return refs;

  if (typeof node.$ref === "string") {
    refs.add(node.$ref);
  }

  Object.values(node).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => collectRefs(item, refs));
    } else if (value && typeof value === "object") {
      collectRefs(value, refs);
    }
  });

  return refs;
}

function assertSchemaRefsResolve(schema, label) {
  const refs = collectRefs(schema);

  refs.forEach((ref) => {
    resolveJsonPointer(schema, ref);
  });

  return refs.size;
}

function createMinimalCompilerOutput() {
  return {
    diligence_run: {
      run_id: "schema-smoke-run",
      source_mode: "url",
      compiler_status: "completed"
    },
    source_bundle_summary: {},
    target_profile: {},
    primary_product: {},
    product_feature_map: [],
    legal_stack: [],
    document_stack_redline: [],
    threat_registry_summary: {
      registry_count_loaded: 0,
      registry_count_evaluated: 0,
      status_counts: {
        TRIGGERED: 0,
        CONTROLLED: 0,
        NOT_TRIGGERED: 0,
        NOT_APPLICABLE: 0,
        INSUFFICIENT_EVIDENCE: 0
      }
    },
    feature_to_threat_matrix: [],
    findings: [],
    controlled_rows: [],
    insufficient_evidence_rows: [],
    assembly_route: {
      recommended_package: "INSUFFICIENT_PUBLIC_EVIDENCE",
      document_routes: [],
      route_reasoning: "Schema smoke fixture only.",
      local_counsel_review_required: true,
      vault_confirmation_question_count: 0,
      backend_assembler_note: "Node 5B derives backend-owned handoff fields deterministically."
    },
    report_data: {
      executive_report: {
        cover_and_reliance: {},
        scope_and_methodology: {},
        subject_profile: {},
        risk_posture_summary: {},
        material_highlights: [],
        triggered_findings_schedule: [],
        document_stack_verdict: {},
        recommended_route: {}
      },
      full_forensic_record: {
        source_review: {},
        artifact_inventory: [],
        product_feature_map: [],
        feature_to_threat_matrix: [],
        document_stack_redline: [],
        triggered_findings: [],
        controlled_rows: [],
        insufficient_evidence_rows: [],
        assembly_route: {},
        technical_audit_log: []
      }
    },
    technical_audit_log: [],
    threat_findings: [],
    vault_confirmation_questions: [],
    disclaimer: DISCLAIMER
  };
}

async function main() {
  const uniqueSchemaKeys = Object.keys(SCHEMA_PATHS);
  const loadedSchemas = [];

  for (const schemaKey of uniqueSchemaKeys) {
    const schema = await loadSchema(schemaKey, { bypassCache: true });
    const refCount = assertSchemaRefsResolve(schema, schemaKey);
    loadedSchemas.push({ schemaKey, title: schema.title ?? "Untitled", refCount });
  }

  const compilerSchema = await loadSchema("compilerOutput", { bypassCache: true });
  const invalidResult = validateJsonSchema(compilerSchema, {});

  if (invalidResult.ok) {
    throw new Error("Expected empty compiler output object to fail validation, but it passed.");
  }

  const validFixture = createMinimalCompilerOutput();
  const validResult = validateJsonSchema(compilerSchema, validFixture);

  if (!validResult.ok) {
    throw new Error(`Expected minimal compiler output fixture to pass validation:\n${formatSchemaErrors(validResult.errors)}`);
  }

  const manualUrlsFixture = createMinimalCompilerOutput();
  manualUrlsFixture.diligence_run.source_mode = "manual_urls";
  const manualUrlsResult = validateJsonSchema(compilerSchema, manualUrlsFixture);

  if (manualUrlsResult.ok) {
    throw new Error("Expected compilerOutput.source_mode=manual_urls to fail validation, but it passed.");
  }

  console.log("Schema smoke validation passed.");
  console.log(`Schemas loaded: ${loadedSchemas.length}`);
  loadedSchemas.forEach((item) => {
    console.log(`- ${item.schemaKey}: ${item.title} (${item.refCount} internal refs)`);
  });
}

main().catch((error) => {
  console.error("Schema smoke validation failed.");
  console.error(error?.stack ?? error?.message ?? error);
  process.exitCode = 1;
});
