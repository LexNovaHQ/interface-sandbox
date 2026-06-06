import assemblyOutputSchema from "../../../../data/schemas/assemblyOutput.schema.json";
import compilerOutputSchema from "../../../../data/schemas/compilerOutput.schema.json";
import { createHandoffEnvelope, validateHandoffEnvelope } from "../../contracts/handoffEnvelope.js";
import { formatSchemaErrors, validateJsonSchema } from "../validation/index.js";
import {
  FORBIDDEN_NODE5B_INPUT_FIELDS,
  VAULT_GROUPS,
  getVaultGroup,
  isAllowedVaultPath,
  normalizeVaultFieldPath
} from "./vaultAllowlist.js";

const ARCHETYPE_PREFILL_MAP = Object.freeze({
  UNI: ["archetypes.is_generalist"],
  DOE: ["archetypes.is_doer"],
  ORC: ["archetypes.is_orchestrator"],
  CRT: ["archetypes.is_creator"],
  RDR: ["archetypes.is_reader"],
  CMP: ["archetypes.conversational_ui"],
  TRN: ["archetypes.sens_bio"],
  JDG: ["archetypes.is_judge", "archetypes.is_judge_hr", "archetypes.is_judge_legal"],
  OPT: ["archetypes.is_optimizer", "archetypes.sens_fin"],
  SHD: ["archetypes.is_shield"],
  MOV: ["archetypes.is_mover"]
});

const SURFACE_PREFILL_MAP = Object.freeze([
  { pattern: /\bPII\b|personal data|privacy/i, path: "compliance.processes_pii", value: "yes" },
  { pattern: /EU|GDPR|European/i, path: "compliance.eu_users", value: true },
  { pattern: /California|CCPA|CPRA/i, path: "compliance.ca_users", value: true },
  { pattern: /health|medical|patient/i, path: "compliance.sens_health", value: true },
  { pattern: /financial|finance|trading|payment|credit/i, path: "compliance.sens_fin", value: true },
  { pattern: /employment|HR|hiring|employee/i, path: "compliance.sens_employment", value: true },
  { pattern: /minor|child|children|student/i, path: "compliance.minors", value: true },
  { pattern: /distress|crisis|vulnerable/i, path: "compliance.distress", value: true }
]);

const INTEGRATION_PREFILL_MAP = Object.freeze([
  { pattern: /slack/i, path: "baseline.integrations.slack" },
  { pattern: /salesforce|hubspot|crm/i, path: "baseline.integrations.crm" },
  { pattern: /stripe|payment/i, path: "baseline.integrations.stripe" },
  { pattern: /github/i, path: "baseline.integrations.github" },
  { pattern: /webhook|api event/i, path: "baseline.integrations.webhooks" }
]);

function nowIso() {
  return new Date().toISOString();
}

function getRunId(compilerOutput) {
  return compilerOutput?.diligence_run?.run_id || compilerOutput?.run_id || `run-${Date.now()}`;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function warning(code, message) {
  return `W001 | ${code} | ${message}`;
}

function createEmptyVaultPrefill() {
  return {
    baseline: {},
    architecture: {},
    archetypes: {},
    compliance: {}
  };
}

function createSuggestion(value, basis, confidence = "high", sourceFindingIds = []) {
  return {
    value,
    basis,
    confidence,
    source_finding_ids: Array.isArray(sourceFindingIds) ? sourceFindingIds.map(String) : []
  };
}

function setPrefill(prefill, fieldPath, suggestion, warnings) {
  const normalizedPath = normalizeVaultFieldPath(fieldPath);
  const group = getVaultGroup(normalizedPath);

  if (!group || !isAllowedVaultPath(normalizedPath)) {
    warnings.push(warning("INVALID_VAULT_PATH", `Skipped invalid Vault field path: ${fieldPath}`));
    return false;
  }

  const localPath = normalizedPath.split(".").slice(1).join(".");
  prefill[group][localPath] = suggestion;
  return true;
}

function collectArchetypeCodes(compilerOutput) {
  const values = [];

  function pushCode(value) {
    if (!value) return;
    const raw = typeof value === "string" ? value : value.code || value.archetype || value.archetype_code;
    const code = String(raw || "").trim().toUpperCase();
    if (code) values.push(code);
  }

  (compilerOutput.product_feature_map || []).forEach((feature) => {
    pushCode(feature.archetype);
    pushCode(feature.archetype_code);
    (feature.archetype_codes || []).forEach(pushCode);
  });

  (compilerOutput.findings || []).forEach((finding) => {
    pushCode(finding.archetype);
    pushCode(finding.archetype_code);
  });

  (compilerOutput.feature_to_threat_matrix || []).forEach((item) => {
    (item.archetype_codes || []).forEach(pushCode);
  });

  return [...new Set(values)];
}

function collectSurfaceStrings(compilerOutput) {
  const chunks = [];

  function add(value) {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach(add);
    else if (typeof value === "object") chunks.push(JSON.stringify(value));
    else chunks.push(String(value));
  }

  (compilerOutput.product_feature_map || []).forEach((feature) => {
    add(feature.surface);
    add(feature.surface_tokens);
    add(feature.description);
    add(feature.feature_name);
  });

  (compilerOutput.findings || []).forEach((finding) => {
    add(finding.surface_tokens);
    add(finding.pain_category);
    add(finding.registry_payload?.legal_pain);
    add(finding.registry_payload?.fp_mechanism);
  });

  (compilerOutput.feature_to_threat_matrix || []).forEach((item) => {
    add(item.surface_tokens);
    add(item.summary);
  });

  return chunks.join("\n");
}

function getFindingIdsForArchetype(compilerOutput, archetypeCode) {
  return (compilerOutput.findings || [])
    .filter((finding) => String(finding.archetype || "").toUpperCase().includes(archetypeCode))
    .map((finding) => finding.finding_id || finding.threat_id)
    .filter(Boolean);
}

function deriveArchetypePrefill(compilerOutput, prefill, warnings) {
  collectArchetypeCodes(compilerOutput).forEach((code) => {
    const paths = ARCHETYPE_PREFILL_MAP[code];
    if (!paths) return;

    paths.forEach((path) => {
      setPrefill(
        prefill,
        path,
        createSuggestion(true, `Derived from public feature/finding archetype ${code}.`, "high", getFindingIdsForArchetype(compilerOutput, code)),
        warnings
      );
    });
  });
}

function deriveSurfacePrefill(compilerOutput, prefill, warnings) {
  const surfaceText = collectSurfaceStrings(compilerOutput);

  SURFACE_PREFILL_MAP.forEach((rule) => {
    if (!rule.pattern.test(surfaceText)) return;
    setPrefill(
      prefill,
      rule.path,
      createSuggestion(rule.value, `Derived from public feature/finding surface signal matching ${rule.pattern}.`, "medium", []),
      warnings
    );
  });
}

function deriveBaselinePrefill(compilerOutput, prefill, warnings) {
  const companyName = compilerOutput.target_profile?.company_name || compilerOutput.target_profile?.company || "";
  if (companyName && !/unknown|placeholder|n\/a/i.test(String(companyName))) {
    setPrefill(prefill, "baseline.company", createSuggestion(companyName, "Derived from compiler_output.target_profile.company_name.", "high", ["target_profile"]), warnings);
  }

  const productName = compilerOutput.primary_product?.name || compilerOutput.primary_product?.product_name || compilerOutput.primary_product?.summary || "";
  if (productName) {
    setPrefill(prefill, "baseline.products", createSuggestion([productName], "Derived from compiler_output.primary_product.", "high", ["primary_product"]), warnings);
  }

  const jurisdiction = compilerOutput.target_profile?.hq_jurisdiction || compilerOutput.target_profile?.jurisdiction || {};
  if (typeof jurisdiction === "string" && jurisdiction.trim()) {
    setPrefill(prefill, "baseline.jurisdiction.country", createSuggestion(jurisdiction.trim(), "Derived from target_profile jurisdiction string; founder should confirm exact country/state.", "medium", ["target_profile"]), warnings);
  } else if (jurisdiction && typeof jurisdiction === "object") {
    if (jurisdiction.country) setPrefill(prefill, "baseline.jurisdiction.country", createSuggestion(jurisdiction.country, "Derived from target_profile.hq_jurisdiction.country.", "high", ["target_profile"]), warnings);
    if (jurisdiction.state) setPrefill(prefill, "baseline.jurisdiction.state", createSuggestion(jurisdiction.state, "Derived from target_profile.hq_jurisdiction.state.", "high", ["target_profile"]), warnings);
  }

  const market = compilerOutput.target_profile?.market || compilerOutput.primary_product?.market || "";
  if (market) {
    setPrefill(prefill, "baseline.market", createSuggestion(market, "Derived from target/product market classification.", "medium", ["target_profile", "primary_product"]), warnings);
  }

  const surfaceText = collectSurfaceStrings(compilerOutput);
  if (/app|dashboard|interface|browser|web app/i.test(surfaceText)) {
    setPrefill(prefill, "baseline.delivery.app", createSuggestion(true, "Derived from public product delivery signal indicating app/UI.", "medium", []), warnings);
  }
  if (/\bapi\b|developer docs|webhook|sdk/i.test(surfaceText)) {
    setPrefill(prefill, "baseline.delivery.api", createSuggestion(true, "Derived from public product delivery signal indicating API/developer surface.", "medium", []), warnings);
  }
  if (/beta|early access|preview|waitlist|alpha|experimental/i.test(surfaceText)) {
    setPrefill(prefill, "baseline.has_beta", createSuggestion(true, "Derived from public beta/preview/early-access signal.", "medium", []), warnings);
  }

  INTEGRATION_PREFILL_MAP.forEach((rule) => {
    if (!rule.pattern.test(surfaceText)) return;
    setPrefill(prefill, rule.path, createSuggestion(true, `Derived from public integration signal matching ${rule.pattern}.`, "medium", []), warnings);
  });
}

function deriveArchitecturePrefill(compilerOutput, prefill, warnings) {
  const surfaceText = collectSurfaceStrings(compilerOutput);
  const providerRules = [
    { pattern: /openai|gpt/i, path: "architecture.sub_processors.openai" },
    { pattern: /anthropic|claude/i, path: "architecture.sub_processors.anthropic" },
    { pattern: /google|gemini|vertex/i, path: "architecture.sub_processors.google" },
    { pattern: /cohere/i, path: "architecture.sub_processors.cohere" },
    { pattern: /mistral/i, path: "architecture.sub_processors.mistral" }
  ];

  providerRules.forEach((rule) => {
    if (!rule.pattern.test(surfaceText)) return;
    setPrefill(prefill, rule.path, createSuggestion(true, `Derived from explicit public model/provider signal matching ${rule.pattern}.`, "medium", []), warnings);
  });

  if (/RAG|retrieval augmented generation|stateless|fine[- ]?tuning/i.test(surfaceText)) {
    const value = surfaceText.match(/RAG|retrieval augmented generation/i) ? "RAG" : surfaceText.match(/stateless/i) ? "stateless" : "fine-tuning";
    setPrefill(prefill, "architecture.memory", createSuggestion(value, "Derived from explicit public architecture/memory signal.", "medium", []), warnings);
  }

  if (/self[- ]?hosted model|third[- ]party model/i.test(surfaceText)) {
    const value = /self[- ]?hosted model/i.test(surfaceText) ? "self-hosted" : "third-party";
    setPrefill(prefill, "architecture.models", createSuggestion(value, "Derived from explicit public model architecture signal.", "medium", []), warnings);
  }
}

function transformConfirmationQuestions(compilerOutput, warnings) {
  return (compilerOutput.vault_confirmation_questions || []).flatMap((question) => {
    const originalPath = question.field_path;
    const normalizedPath = normalizeVaultFieldPath(originalPath);

    if (originalPath !== normalizedPath) {
      warnings.push(warning("SCHEMA_BRIDGE_TRANSFORM", `Mapped ${originalPath} to ${normalizedPath}.`));
    }

    if (!isAllowedVaultPath(normalizedPath)) {
      warnings.push(warning("INVALID_VAULT_PATH", `Excluded confirmation question for invalid Vault path: ${originalPath}`));
      return [];
    }

    return [{
      field_path: normalizedPath,
      question: question.question || `Please confirm ${normalizedPath}.`,
      why_it_matters: question.why_it_matters || "Required for Assembly document routing.",
      source_context: [
        Array.isArray(question.source_finding_ids) && question.source_finding_ids.length
          ? `source_finding_ids=${question.source_finding_ids.join(",")}`
          : "source_finding_ids=none",
        question.priority ? `priority=${question.priority}` : "priority=UNSPECIFIED"
      ].join("; "),
      required_for: compilerOutput.assembly_route?.recommended_package || "Assembly routing and local counsel review"
    }];
  });
}

function deriveThreatFindings(compilerOutput) {
  if (Array.isArray(compilerOutput.threat_findings) && compilerOutput.threat_findings.length) {
    return compilerOutput.threat_findings;
  }

  return (compilerOutput.findings || []).map((finding) => ({
    finding_id: finding.finding_id,
    threat_id: finding.threat_id,
    threat_name: finding.threat_name,
    linked_feature_ids: finding.linked_feature_ids || [],
    document_routes: finding.document_routes || finding.redline_route || [],
    vault_dependencies: finding.vault_dependencies || [],
    severity: finding.pain_tier || finding.pain_depth || "UNSPECIFIED",
    status: "TRIGGERED"
  }));
}

function validateCompilerInput(compilerOutput) {
  const errors = [];
  const schemaValidation = validateJsonSchema(compilerOutputSchema, compilerOutput);

  if (!schemaValidation.ok) {
    errors.push(`COMPILER_SCHEMA_INVALID: ${formatSchemaErrors(schemaValidation.errors)}`);
  }

  FORBIDDEN_NODE5B_INPUT_FIELDS.forEach((field) => {
    if (hasOwn(compilerOutput, field)) {
      errors.push(`FORBIDDEN_BACKEND_FIELD: compiler output contains ${field}`);
    }
  });

  return errors;
}

function createSummary(compilerOutput) {
  const company = compilerOutput.target_profile?.company_name || compilerOutput.target_profile?.company || "target";
  const product = compilerOutput.primary_product?.name || compilerOutput.primary_product?.product_name || "product";
  return `Assembly handoff for ${company} / ${product}`;
}

export function assembleNode5B(compilerOutput, options = {}) {
  const compilerErrors = validateCompilerInput(compilerOutput);
  if (compilerErrors.length) {
    return {
      ok: false,
      error_type: "COMPILER_OUTPUT_INVALID",
      errors: compilerErrors
    };
  }

  const warnings = [];
  const runId = getRunId(compilerOutput);
  const createdAt = options.createdAt || nowIso();
  const vault_prefill_suggestions = createEmptyVaultPrefill();

  deriveArchetypePrefill(compilerOutput, vault_prefill_suggestions, warnings);
  deriveSurfacePrefill(compilerOutput, vault_prefill_suggestions, warnings);
  deriveBaselinePrefill(compilerOutput, vault_prefill_suggestions, warnings);
  deriveArchitecturePrefill(compilerOutput, vault_prefill_suggestions, warnings);

  const vault_confirmation_questions = transformConfirmationQuestions(compilerOutput, warnings);

  const assembly_handoff = {
    handoff_meta: {
      run_id: runId,
      created_at: createdAt,
      source_engine: "diligence",
      target_engine: "assembly",
      compiler_schema: "compilerOutput.schema.json",
      assembler_contract: "NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1"
    },
    target_profile: compilerOutput.target_profile,
    feature_map: compilerOutput.product_feature_map || [],
    threat_findings: deriveThreatFindings(compilerOutput),
    document_stack_status: compilerOutput.legal_stack || [],
    vault_prefill_suggestions,
    vault_confirmation_questions,
    assembly_route_recommendation: compilerOutput.assembly_route || {},
    warnings
  };

  const assemblyValidation = validateJsonSchema(assemblyOutputSchema, assembly_handoff);
  if (!assemblyValidation.ok) {
    return {
      ok: false,
      error_type: "ASSEMBLY_OUTPUT_INVALID",
      errors: assemblyValidation.errors,
      error_summary: formatSchemaErrors(assemblyValidation.errors),
      assembly_handoff
    };
  }

  const handoff_id = options.handoffId || undefined;
  const payloadRef = options.payloadRef || `interface_handoff_payloads/${handoff_id || "pending"}`;
  const handoff_envelope = createHandoffEnvelope({
    runId,
    sourceEngine: "diligence",
    targetEngine: "assembly",
    payloadType: "assembly_handoff_payload",
    payloadRef,
    summary: createSummary(compilerOutput),
    warnings
  });

  const envelopeValidation = validateHandoffEnvelope(handoff_envelope);
  if (!envelopeValidation.valid) {
    return {
      ok: false,
      error_type: "HANDOFF_ENVELOPE_INVALID",
      errors: envelopeValidation.errors,
      assembly_handoff,
      handoff_envelope
    };
  }

  const payload_ref = payloadRef === "interface_handoff_payloads/pending"
    ? `interface_handoff_payloads/${handoff_envelope.handoff_id}`
    : payloadRef;

  return {
    ok: true,
    node: "5B",
    run_id: runId,
    vault_prefill_suggestions,
    assembly_handoff,
    handoff_envelope: {
      ...handoff_envelope,
      payload_ref
    },
    persistence_plan: {
      payload_collection: "interface_handoff_payloads",
      envelope_collection: "interface_handoffs",
      stage_output_path: `interface_runs/${runId}/stage_outputs/node_5b_backend_assembler`,
      payload_ref
    },
    warnings
  };
}

export function assertNode5BAssembled(result) {
  if (!result?.ok) {
    throw new Error(`Node 5B assembly failed: ${(result?.errors || [result?.error_type || "unknown error"]).join(" | ")}`);
  }

  return result;
}
