import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import yaml from "js-yaml";
import { PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { INTERNAL_JOB_CONTRACT_STATUS } from "../src/runtime/contracts/internal-job.contract.js";
import { CENTRAL_ARTIFACT_GROUPS } from "../src/runtime/contracts/artifacts.contract.js";
import { artifactMatchesPermission, AGENT_ARTIFACT_PERMISSIONS } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { loadDomainDerivationRegistryV0, listPackageKeyFiles } from "../src/runtime/domain-gate/domain-derivation-registry.loader.js";

const root = resolve(process.cwd());
const outDir = join(root, "audit-output");
mkdirSync(outDir, { recursive: true });
const findings = [];
const evidence = {};
const add = (severity, id, title, detail, paths = []) => findings.push({ severity, id, title, detail, paths });
const text = (p) => readFileSync(join(root, p), "utf8");

const jobs = Object.keys(PIPELINE_CONTRACTS);
const missingNext = [];
for (const [job, contract] of Object.entries(PIPELINE_CONTRACTS)) {
  if (contract.next && !PIPELINE_CONTRACTS[contract.next] && !["AWAITING_QUALIFIED_REVIEW", "AWAITING_ASSEMBLY"].includes(contract.next)) missingNext.push({ job, next: contract.next });
}
evidence.pipeline = { job_count: jobs.length, jobs, missing_next: missingNext, status: PIPELINE_CONTRACT_STATUS, internal_status: INTERNAL_JOB_CONTRACT_STATUS };
if (missingNext.length) add("CRITICAL", "GRAPH_MISSING_NEXT", "Pipeline graph references undefined jobs", missingNext, ["src/runtime/contracts/pipeline.contract.js"]);

const falseFlags = [];
for (const [job, contract] of Object.entries(PIPELINE_CONTRACTS)) for (const [key, value] of Object.entries(contract)) if (value === false && /production|deployment|cutover|routing|active/i.test(key)) falseFlags.push({ job, key });
evidence.pipeline.false_flags = falseFlags;
if (falseFlags.length) add("HIGH", "CONTRACT_FALSE_PRODUCTION_FLAGS", "Canonical contracts still advertise incomplete production/cutover flags", falseFlags, ["src/runtime/contracts/pipeline.contract.js"]);

const artifactGroupMisses = [];
for (const [job, contract] of Object.entries(PIPELINE_CONTRACTS)) {
  const group = CENTRAL_ARTIFACT_GROUPS[contract.central_phase_id] || [];
  for (const write of contract.writes || []) if (!String(write).includes("{") && !group.includes(write)) artifactGroupMisses.push({ job, central_phase_id: contract.central_phase_id, write });
}
evidence.pipeline.central_artifact_group_misses = artifactGroupMisses;
if (artifactGroupMisses.length) add("HIGH", "CENTRAL_ARTIFACT_GROUP_DRIFT", "Pipeline writes are absent from their central artifact group", artifactGroupMisses, ["src/runtime/contracts/artifacts.contract.js", "src/runtime/contracts/pipeline.contract.js"]);

const permissionMisses = [];
for (const [job, contract] of Object.entries(PIPELINE_CONTRACTS)) {
  const actor = contract.agent_id || contract.actor_id;
  const permissions = AGENT_ARTIFACT_PERMISSIONS[actor]?.writes || [];
  for (const write of contract.writes || []) if (!String(write).includes("{") && !permissions.some((p) => artifactMatchesPermission(write, p))) permissionMisses.push({ job, actor, write });
}
evidence.pipeline.permission_misses = permissionMisses;
if (permissionMisses.length) add("CRITICAL", "WRITE_PERMISSION_DRIFT", "Pipeline write is not authorized for its actor", permissionMisses, ["src/runtime/contracts/artifact-permissions.contract.js"]);

const catalog = JSON.parse(text("references/domain-packages/package-catalog.v0.json"));
const keyFiles = await listPackageKeyFiles();
const { registry } = await loadDomainDerivationRegistryV0();
const primaryPackages = catalog.primary_domain_packages || [];
const keys = {};
for (const [pkg, file] of Object.entries(keyFiles)) {
  const parsed = yaml.load(text(`references/registry/${file}`)) || {};
  const requiredAxes = ["derivation_order", "behavior_class", "lane", "surface", "subcat", "compliance_framework", "severity", "domain_derivation_rules"];
  keys[pkg] = { file, version: parsed?.registry_key?.version || "", missing_axes: requiredAxes.filter((x) => !parsed[x]), primary_rule: parsed?.domain_derivation_rules?.primary_domain_rule?.rule_id || "", overlay_count: parsed?.regulatory_overlay?.overlays?.length || 0 };
}
const catalogWithoutKeys = primaryPackages.filter((pkg) => !["unknown"].includes(pkg) && !keyFiles[pkg]);
const keyWithoutCatalog = Object.keys(keyFiles).filter((pkg) => !primaryPackages.includes(pkg));
const primaryRules = registry.rules.filter((r) => r.rule_type === "PRIMARY_DOMAIN");
evidence.registry = { catalog_primary_packages: primaryPackages, key_files: keyFiles, keys, catalog_without_keys: catalogWithoutKeys, keys_without_catalog: keyWithoutCatalog, assembled_rule_count: registry.rules.length, primary_rules: primaryRules.map((r) => ({ rule_id: r.rule_id, package_id: r.package_id, trigger_if: r.trigger_if, exclude_if: r.exclude_if })) };
if (catalogWithoutKeys.length) add("CRITICAL", "DOMAIN_CATALOG_KEY_GAP", "Catalog primary domains have no registry key and cannot be auto-selected by 3B", catalogWithoutKeys, ["references/domain-packages/package-catalog.v0.json", "references/registry/"]);
for (const [pkg, info] of Object.entries(keys)) if (info.missing_axes.length) add("CRITICAL", "DOMAIN_KEY_STRUCTURE_GAP", `Registry key ${pkg} is missing required common structure`, info, [`references/registry/${info.file}`]);
if (keyWithoutCatalog.length) add("HIGH", "DOMAIN_KEY_CATALOG_DRIFT", "Registry keys exist outside the catalog", keyWithoutCatalog, ["references/domain-packages/package-catalog.v0.json"]);

const domainValidator = text("src/phases/03-domain-derivation/validators/domain-derivation.validator.js");
const modelControlsExclude = /validator_exclude_result:\s*Boolean\(row\?\.exclude_result/.test(domainValidator);
const modelFallbackPackage = /selected_package:\s*selected\?\.package_id\s*\|\|\s*modelPrimary\.selected_package/.test(domainValidator);
const allFailuresBlock = /const status = failures\.length \? CONTROLLED_FAILURE_STATUS/.test(domainValidator);
evidence.domain_derivation = { model_controls_exclude_result: modelControlsExclude, model_selected_package_fallback: modelFallbackPackage, all_validation_failures_become_controlled_failure: allFailuresBlock };
if (modelControlsExclude) add("CRITICAL", "P3B_EXCLUDE_NOT_DETERMINISTIC", "3B trusts the model's exclude_result instead of evaluating registry exclude_if", "validator_exclude_result is copied from model output", ["src/phases/03-domain-derivation/validators/domain-derivation.validator.js"]);
if (modelFallbackPackage) add("CRITICAL", "P3B_UNGATED_PACKAGE_FALLBACK", "3B can retain a model-selected package when no deterministic primary rule fires", "selected_package falls back to modelPrimary.selected_package while status becomes REVIEW_REQUIRED", ["src/phases/03-domain-derivation/validators/domain-derivation.validator.js"]);
if (allFailuresBlock) add("HIGH", "P3B_FAILURE_CLASS_COLLAPSE", "3B collapses structural and evidentiary/material failures into CONTROLLED_FAILURE", "Non-critical missing anchors/conflicts can stop the run instead of reinvestigation and limitation", ["src/phases/03-domain-derivation/validators/domain-derivation.validator.js"]);

const activeRoots = ["src", "agent-packages", "prompts"];
const extensions = [".js", ".mjs", ".md", ".yaml", ".yml"];
const files = [];
function walk(dir) { for (const name of readdirSync(dir)) { const p = join(dir, name); const rel = relative(root, p).replaceAll("\\", "/"); if (rel.startsWith("archive-legacy/") || rel.includes("node_modules/")) continue; const s = statSync(p); if (s.isDirectory()) walk(p); else if (extensions.some((ext) => name.endsWith(ext))) files.push(rel); } }
for (const dir of activeRoots) if (existsSync(join(root, dir))) walk(join(root, dir));
const statusHits = [];
const reinvestigationFiles = [];
for (const file of files) {
  const body = text(file);
  const hits = [...body.matchAll(/\b(REPAIR_REQUIRED|CONTROLLED_FAILURE|BLOCKED|LOCKED_WITH_LIMITATIONS|PASS_WITH_WARNINGS|REINVESTIGAT(?:E|ION|ED)|retry|rerun)\b/gi)].map((m) => m[1].toUpperCase());
  if (hits.length) statusHits.push({ file, counts: Object.fromEntries([...new Set(hits)].map((h) => [h, hits.filter((x) => x === h).length])) });
  if (/reinvestigat/i.test(body)) reinvestigationFiles.push(file);
}
evidence.blocking = { status_hits: statusHits, reinvestigation_files: reinvestigationFiles };

const pipelineService = text("src/runtime/services/pipeline.service.js");
const catchesAllAsControlledFailure = /catch \(error\)[\s\S]{0,500}status: "CONTROLLED_FAILURE"/.test(pipelineService);
const advanceOk = [...(pipelineService.match(/const ADVANCE_OK = new Set\(\[([^\]]+)/)?.[1] || "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
evidence.blocking.pipeline_service = { catches_all_errors_as_controlled_failure: catchesAllAsControlledFailure, advance_ok_statuses: advanceOk };
if (catchesAllAsControlledFailure) add("HIGH", "RUNTIME_ERROR_CLASS_COLLAPSE", "Central runtime converts every thrown error into CONTROLLED_FAILURE", "Infrastructure, parser, contract, model and non-critical validator exceptions are not classified before stopping the run", ["src/runtime/services/pipeline.service.js"]);

const activeRepairRequired = statusHits.filter((x) => x.counts.REPAIR_REQUIRED && (x.file.startsWith("src/") || x.file.startsWith("agent-packages/") || x.file.startsWith("prompts/")));
if (activeRepairRequired.length) add("HIGH", "ACTIVE_REPAIR_REQUIRED_AUTHORITY", "Active runtime/prompt assets still authorize REPAIR_REQUIRED", activeRepairRequired, activeRepairRequired.map((x) => x.file));

const suspiciousValidators = [];
for (const file of files.filter((x) => /validator|validation|orchestrator|runner/.test(x) && x.startsWith("src/"))) {
  const body = text(file);
  if (!/REPAIR_REQUIRED|CONTROLLED_FAILURE/.test(body)) continue;
  if (/evidence|missing|incomplete|coverage|row count|unknown|conflict|thin|weak|support/i.test(body)) suspiciousValidators.push(file);
}
evidence.blocking.suspicious_validators = suspiciousValidators;
if (suspiciousValidators.length) add("HIGH", "NONCRITICAL_BLOCKER_RISK", "Validators mix repair/control-failure statuses with evidentiary or completeness checks", suspiciousValidators, suspiciousValidators);

const phase11Only = reinvestigationFiles.filter((x) => x.startsWith("src/phases/11-") || x.includes("agent_5_exposure_registry") || x.includes("agent_7"));
evidence.blocking.reinvestigation_scope = { total_files: reinvestigationFiles.length, phase11_related: phase11Only.length, outside_phase11: reinvestigationFiles.filter((x) => !phase11Only.includes(x)) };

const routeBuilderCandidates = ["src/phases/02-cartography-index/builders/phase-routing-manifest.builder.js", "src/phases/02-cartography-index/orchestrators/phase-routing-manifest.orchestrator.js"];
const routeFiles = routeBuilderCandidates.filter((p) => existsSync(join(root, p)));
const routeSources = routeFiles.map((p) => text(p)).join("\n");
const routingSignals = { reads_domain_derivation_profile: /domain_derivation_profile/.test(routeSources), emits_active_run_package_manifest: /active_run_package_manifest/.test(routeSources), centralized_authority_marker: /P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY/.test(routeSources) };
evidence.routing = { files: routeFiles, signals: routingSignals };
if (!routingSignals.centralized_authority_marker) add("CRITICAL", "P2G_AUTHORITY_MARKER_MISSING", "P2G source does not expose the centralized authority marker", routeFiles, routeFiles);

const strictFalse = [];
for (const [index, line] of pipelineService.split("\n").entries()) if (line.includes("strict: false")) strictFalse.push({ line: index + 1, text: line.trim() });
evidence.runtime_reads = { strict_false_calls: strictFalse };
if (strictFalse.length) add("MEDIUM", "NON_STRICT_RUNTIME_READS", "Live runtime has non-strict artifact reads that can silently convert missing artifacts to null", strictFalse, ["src/runtime/services/pipeline.service.js"]);

const receiptPath = "receipts/CO_P13_16_CERTIFIED.json";
evidence.certification = { receipt_present: existsSync(join(root, receiptPath)), source_only: true };

const rank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
findings.sort((a, b) => rank[b.severity] - rank[a.severity] || a.id.localeCompare(b.id));
const summary = { critical: findings.filter((x) => x.severity === "CRITICAL").length, high: findings.filter((x) => x.severity === "HIGH").length, medium: findings.filter((x) => x.severity === "MEDIUM").length, low: findings.filter((x) => x.severity === "LOW").length };
const report = { audit_id: "E2E_PRODUCTION_SYNC_AUDIT_2026_07_14", branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || "", commit: process.env.GITHUB_SHA || "", summary, findings, evidence };
writeFileSync(join(outDir, "production_pipeline_audit.json"), JSON.stringify(report, null, 2));
let md = `# End-to-End Production Pipeline Audit\n\nCommit: \`${report.commit}\`\n\n## Summary\n\n- Critical: ${summary.critical}\n- High: ${summary.high}\n- Medium: ${summary.medium}\n- Low: ${summary.low}\n\n## Findings\n\n`;
for (const f of findings) md += `### ${f.severity} — ${f.id}\n\n**${f.title}**\n\n${typeof f.detail === "string" ? f.detail : "```json\n" + JSON.stringify(f.detail, null, 2) + "\n```"}\n\nPaths: ${f.paths.map((p) => `\`${p}\``).join(", ")}\n\n`;
writeFileSync(join(outDir, "production_pipeline_audit.md"), md);
console.log(JSON.stringify({ summary, finding_ids: findings.map((x) => `${x.severity}:${x.id}`), registry_keys: Object.keys(keyFiles), catalog_without_keys: catalogWithoutKeys, primary_rules: primaryRules.length, status_hit_files: statusHits.length }, null, 2));
