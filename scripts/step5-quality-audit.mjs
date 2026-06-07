import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE = "https://sandbox.lexnovahq.com";
const TARGET_URL = "https://sarvam.ai";

const endpoints = {
  evidence_refiner: `${BASE}/api/diligence-evidence-refiner`,
  target_feature_profile: `${BASE}/api/diligence-target-feature-profile`,
  legal_stack_review: `${BASE}/api/diligence-legal-stack-review`,
  registry_ledger: `${BASE}/api/diligence-registry-ledger`,
  operator_challenge: `${BASE}/api/diligence-operator-challenge`,
  final_compiler: `${BASE}/api/diligence-final-compiler`
};

const safeVaultFields = new Set([
  "baseline.company",
  "baseline.entity_type",
  "baseline.address",
  "baseline.legal_email",
  "baseline.privacy_email",
  "baseline.products",
  "baseline.jurisdiction.country",
  "baseline.jurisdiction.state",
  "baseline.market",
  "baseline.delivery.app",
  "baseline.delivery.api",
  "baseline.revenue_model",
  "baseline.acv",
  "baseline.has_beta",
  "baseline.output_ownership",
  "baseline.sla_type",
  "baseline.integrations.slack",
  "baseline.integrations.crm",
  "baseline.integrations.stripe",
  "baseline.integrations.github",
  "baseline.integrations.webhooks",
  "architecture.memory",
  "architecture.models",
  "architecture.sub_processors.openai",
  "architecture.sub_processors.anthropic",
  "architecture.sub_processors.google",
  "architecture.sub_processors.cohere",
  "architecture.sub_processors.mistral",
  "architecture.sub_processors.url",
  "architecture.cloud_host",
  "architecture.vector_db",
  "archetypes.is_generalist",
  "archetypes.is_doer",
  "archetypes.is_orchestrator",
  "archetypes.is_creator",
  "archetypes.is_reader",
  "archetypes.conversational_ui",
  "archetypes.sens_bio",
  "archetypes.is_judge",
  "archetypes.is_judge_hr",
  "archetypes.is_judge_legal",
  "archetypes.is_optimizer",
  "archetypes.sens_fin",
  "archetypes.is_shield",
  "archetypes.is_mover",
  "archetypes.agent_limits.session_cap",
  "archetypes.agent_limits.period_cap",
  "archetypes.agent_limits.retry_limit",
  "archetypes.agent_limits.loop_threshold",
  "compliance.processes_pii",
  "compliance.eu_users",
  "compliance.ca_users",
  "compliance.sens_health",
  "compliance.sens_fin",
  "compliance.sens_employment",
  "compliance.minors",
  "compliance.distress"
]);

const registry = {
  registry_count: 3,
  threats: [
    {
      _registry_position: 1,
      threat_id: "SMOKE-001",
      threat_name: "Unreviewed AI output reliance",
      pain_tier: "T1",
      pain_category: "Reliance / output risk",
      archetype: "AI assistant",
      surface: "web app, API",
      legal_pain: "Users may rely on AI outputs without review.",
      fp_mechanism: "Product describes AI answer generation but does not show visible reliance controls in the admitted source.",
      fp_impact: "Potential mismatch between product function and contractual/product disclaimers.",
      lex_nova_fix: "Review-ready AI output reliance clause and user review duty.",
      trigger_conditions: ["AI generates answers or summaries", "User may rely on output"],
      exclude_conditions: ["Clear human review workflow shown", "Clear no-reliance warning shown"]
    },
    {
      _registry_position: 2,
      threat_id: "SMOKE-002",
      threat_name: "Missing public AI/data processing posture",
      pain_tier: "T1",
      pain_category: "Privacy / data processing",
      archetype: "AI platform",
      surface: "website, API, enterprise product",
      legal_pain: "Product may process user or customer data but the public footprint may not clearly explain processing boundaries.",
      fp_mechanism: "Public product pages describe AI capability, integrations, or API use without equally visible data-processing controls.",
      fp_impact: "Enterprise buyers may ask for privacy, DPA, and data-use answers before procurement.",
      lex_nova_fix: "Review-ready privacy/DPA issue map and public data-use clarification route.",
      trigger_conditions: ["Product mentions AI/API/customer data", "Public footprint lacks clear processing explanation"],
      exclude_conditions: ["Clear DPA available", "Clear privacy/data-use controls visible"]
    },
    {
      _registry_position: 3,
      threat_id: "SMOKE-003",
      threat_name: "API/service terms coverage gap",
      pain_tier: "T2",
      pain_category: "Commercial terms / API risk",
      archetype: "API-enabled AI product",
      surface: "API, developer docs, web app",
      legal_pain: "API or service capability may create usage-limit, output, SLA, and misuse questions not visibly covered by basic public pages.",
      fp_mechanism: "Public product footprint shows technical service delivery but legal-stack visibility is thin or incomplete.",
      fp_impact: "Buyer review may stall on usage restrictions, output reliance, acceptable use, and support commitments.",
      lex_nova_fix: "Review-ready ToS/AUP/SLA/API terms issue pack.",
      trigger_conditions: ["API or platform delivery is visible", "Legal/service coverage is not clearly surfaced"],
      exclude_conditions: ["Complete ToS/AUP/SLA/API terms visible", "No API/platform delivery visible"]
    }
  ]
};

const registry_key = {
  version: "step5-quality-audit",
  note: "Controlled three-threat registry for real-output quality audit."
};

function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function str(value) { return value === undefined || value === null ? "" : String(value).trim(); }
function hasText(value) { return str(value).length > 0; }
function lower(value) { return str(value).toLowerCase(); }

function addFinding(checks, name, status, detail) {
  checks.push({ name, status, detail });
}

function scoreStatus(checks) {
  const fail = checks.filter((c) => c.status === "FAIL").length;
  const warn = checks.filter((c) => c.status === "WARN").length;
  if (fail > 0) return "FAIL";
  if (warn > 0) return "WARN";
  return "PASS";
}

function auditResult(result) {
  const checks = [];
  const output = obj(result.compiler_output);
  const artifacts = obj(result.pipeline_artifacts);
  const sourceCollection = obj(artifacts.source_collection);
  const sourceBundle = obj(artifacts.source_bundle);
  const merged = obj(artifacts.merged_registry_result);
  const findings = arr(output.findings);
  const controlled = arr(output.controlled_rows);
  const insufficient = arr(output.insufficient_evidence_rows);
  const threatFindings = arr(output.threat_findings);
  const matrix = arr(output.feature_to_threat_matrix);
  const vaultQuestions = arr(output.vault_confirmation_questions);
  const legalStack = arr(output.legal_stack);
  const redline = arr(output.document_stack_redline);
  const reportData = obj(output.report_data);
  const executive = obj(reportData.executive_report);
  const forensic = obj(reportData.full_forensic_record);
  const sourceRecords = arr(sourceCollection.raw_footprint?.records);
  const sourceCorpus = sourceRecords.map((r) => str(r.raw_text)).join("\\n\\n");
  const knownThreatIds = new Set(registry.threats.map((t) => t.threat_id));

  addFinding(checks, "Pipeline completed", result.ok === true && result.status === "completed" ? "PASS" : "FAIL", `status=${result.status}`);
  addFinding(checks, "Real URL was attempted", sourceCollection.scrape_meta?.pages_attempted >= 1 ? "PASS" : "FAIL", `pages_attempted=${sourceCollection.scrape_meta?.pages_attempted}`);
  addFinding(checks, "Real URL was read", sourceCollection.scrape_meta?.pages_read >= 1 ? "PASS" : "FAIL", `pages_read=${sourceCollection.scrape_meta?.pages_read}`);
  addFinding(checks, "Registry count evaluated", merged.registry_count_evaluated === registry.registry_count ? "PASS" : "FAIL", `evaluated=${merged.registry_count_evaluated}, expected=${registry.registry_count}`);
  addFinding(checks, "Compiler completed", output.diligence_run?.compiler_status === "completed" ? "PASS" : "FAIL", `compiler_status=${output.diligence_run?.compiler_status}`);

  const unknownFindingIds = findings.filter((f) => !knownThreatIds.has(f.threat_id));
  addFinding(checks, "Findings map to known registry threats", unknownFindingIds.length === 0 ? "PASS" : "FAIL", unknownFindingIds.map((f) => f.threat_id).join(", ") || "all known");

  const missingEvidence = findings.filter((f) => !hasText(f.evidence?.proof_citation) || !hasText(f.evidence?.extracted_excerpt));
  addFinding(checks, "Findings include evidence citation and excerpt", missingEvidence.length === 0 ? "PASS" : "FAIL", missingEvidence.map((f) => f.threat_id).join(", ") || "all findings have evidence");

  const excerptNotInSource = findings.filter((f) => {
    const excerpt = str(f.evidence?.extracted_excerpt);
    return excerpt.length >= 20 && sourceCorpus && !sourceCorpus.includes(excerpt);
  });
  addFinding(checks, "Evidence excerpts appear in admitted source text", excerptNotInSource.length === 0 ? "PASS" : "WARN", excerptNotInSource.map((f) => f.threat_id).join(", ") || "all excerpts found or too short to test");

  const missingRoutes = findings.filter((f) => arr(f.document_routes).length === 0);
  addFinding(checks, "Triggered findings have document routes", missingRoutes.length === 0 ? "PASS" : "FAIL", missingRoutes.map((f) => f.threat_id).join(", ") || "all routed");

  const matrixBad = matrix.filter((row) => !hasText(row.feature_ref) || !Array.isArray(row.triggered_threat_ids) || !Array.isArray(row.document_routes));
  addFinding(checks, "Feature-to-threat matrix is hydrated", matrixBad.length === 0 && matrix.length > 0 ? "PASS" : "FAIL", `matrix_rows=${matrix.length}, bad_rows=${matrixBad.length}`);

  const unsafeVault = vaultQuestions.filter((q) => !safeVaultFields.has(q.field_path));
  addFinding(checks, "Vault questions use safe canonical fields", unsafeVault.length === 0 ? "PASS" : "FAIL", unsafeVault.map((q) => q.field_path).join(", ") || "all safe");

  const disclaimer = lower(output.disclaimer);
  const hasNoLegalAdvice = disclaimer.includes("no legal advice");
  const hasReview = disclaimer.includes("legal review") || disclaimer.includes("local counsel") || disclaimer.includes("qualified legal");
  addFinding(checks, "Disclaimer preserves Legal Architecture boundary", hasNoLegalAdvice && hasReview ? "PASS" : "FAIL", output.disclaimer || "missing disclaimer");

  const advicePhrases = ["you are legally required", "you must comply", "this is lawful", "this is illegal", "guaranteed compliant"];
  const outputText = lower(JSON.stringify(output));
  const foundAdvicePhrase = advicePhrases.find((phrase) => outputText.includes(phrase));
  addFinding(checks, "No obvious legal-advice language", foundAdvicePhrase ? "WARN" : "PASS", foundAdvicePhrase || "no banned phrase found");

  const fullTriggerRate = findings.length === registry.registry_count && controlled.length === 0 && insufficient.length === 0;
  addFinding(checks, "Over-trigger risk review", fullTriggerRate ? "WARN" : "PASS", fullTriggerRate ? "All smoke threats triggered; acceptable for broad smoke registry, not acceptable proof for full registry." : "Not all threats triggered");

  addFinding(checks, "Legal stack exists", legalStack.length > 0 ? "PASS" : "WARN", `legal_stack_rows=${legalStack.length}`);
  addFinding(checks, "Document redline exists", redline.length > 0 ? "PASS" : "WARN", `redline_rows=${redline.length}`);
  addFinding(checks, "Threat findings mirror exists", threatFindings.length === findings.length ? "PASS" : "WARN", `threat_findings=${threatFindings.length}, findings=${findings.length}`);
  addFinding(checks, "Executive material highlights exist", arr(executive.material_highlights).length > 0 ? "PASS" : "WARN", `highlights=${arr(executive.material_highlights).length}`);
  addFinding(checks, "Forensic record mirrors core arrays", arr(forensic.triggered_findings).length === findings.length ? "PASS" : "WARN", `forensic_triggered=${arr(forensic.triggered_findings).length}, findings=${findings.length}`);

  const commercialSummary = {
    target_url: TARGET_URL,
    source_mode: sourceCollection.source_mode,
    pages_attempted: sourceCollection.scrape_meta?.pages_attempted,
    pages_read: sourceCollection.scrape_meta?.pages_read,
    registry_count_evaluated: merged.registry_count_evaluated,
    findings_count: findings.length,
    controlled_count: controlled.length,
    insufficient_count: insufficient.length,
    vault_question_count: vaultQuestions.length,
    document_route_count: new Set(findings.flatMap((f) => arr(f.document_routes))).size
  };

  return {
    audit_status: scoreStatus(checks),
    generated_at: new Date().toISOString(),
    run_id: result.run_id,
    commercial_summary: commercialSummary,
    checks,
    next_gate: scoreStatus(checks) === "FAIL" ? "FIX_BEFORE_FULL_REGISTRY" : "MANUAL_REVIEW_BEFORE_FULL_REGISTRY"
  };
}

function toMarkdown(audit) {
  const lines = [];
  lines.push(`# Step 5 Quality Audit — ${audit.audit_status}`);
  lines.push("");
  lines.push(`Run ID: ${audit.run_id}`);
  lines.push(`Generated: ${audit.generated_at}`);
  lines.push("");
  lines.push("## Commercial Summary");
  for (const [key, value] of Object.entries(audit.commercial_summary)) {
    lines.push(`- ${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
  }
  lines.push("");
  lines.push("## Checks");
  for (const check of audit.checks) {
    lines.push(`- ${check.status} — ${check.name}: ${check.detail}`);
  }
  lines.push("");
  lines.push(`## Next Gate`);
  lines.push(audit.next_gate);
  lines.push("");
  lines.push("## Blunt Interpretation");
  if (audit.audit_status === "FAIL") {
    lines.push("Do not run the full registry. Fix the failed quality gates first.");
  } else if (audit.audit_status === "WARN") {
    lines.push("The engine is mechanically usable, but the output still needs manual review before a full 98-threat run.");
  } else {
    lines.push("The controlled output passed automated quality checks. Manual review is still required before full registry execution.");
  }
  return lines.join("\\n");
}

async function main() {
  const server = await createServer({
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true }
  });

  try {
    const diligence = await server.ssrLoadModule("/src/wrapper/diligence/index.js");

    const result = await diligence.runDiligencePipeline(
      {
        run_id: "step5-quality-audit-" + new Date().toISOString().replace(/[:.]/g, "-"),
        primary_url: TARGET_URL
      },
      {
        endpoints,
        registry,
        registry_key,
        registryBatchSize: 3,
        sourceTimeoutMs: 30000,
        sourceMaxCharacters: 18000,
        stageOptions: {
          model: "gemini-3.1-flash-lite",
          temperature: 0,
          maxOutputTokens: 8192
        },
        stageOptionOverrides: {
          final_compiler: {
            model: "gemini-3.1-flash-lite",
            temperature: 0,
            maxOutputTokens: 16384
          }
        }
      }
    );

    const audit = auditResult(result);
    const outDir = resolve("step5-quality-audit", result.run_id || "failed-run");
    await mkdir(outDir, { recursive: true });

    await writeFile(resolve(outDir, "full-result.json"), JSON.stringify(result, null, 2));
    await writeFile(resolve(outDir, "compiler-output.json"), JSON.stringify(result.compiler_output || null, null, 2));
    await writeFile(resolve(outDir, "pipeline-artifacts.json"), JSON.stringify(result.pipeline_artifacts || null, null, 2));
    await writeFile(resolve(outDir, "audit-summary.json"), JSON.stringify(audit, null, 2));
    await writeFile(resolve(outDir, "audit-report.md"), toMarkdown(audit));

    console.log("STEP 5 QUALITY AUDIT COMPLETE");
    console.log(JSON.stringify({
      audit_status: audit.audit_status,
      run_id: audit.run_id,
      output_dir: outDir,
      next_gate: audit.next_gate,
      commercial_summary: audit.commercial_summary,
      failed_checks: audit.checks.filter((c) => c.status === "FAIL"),
      warnings: audit.checks.filter((c) => c.status === "WARN")
    }, null, 2));
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error("STEP 5 QUALITY AUDIT FAILED");
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
