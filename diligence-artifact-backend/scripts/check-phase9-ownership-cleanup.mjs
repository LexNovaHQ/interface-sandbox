import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const phaseRoot = "src/phases/09-exposure-profile";
const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
const phaseRunner = readFileSync(`${phaseRoot}/exposure-profile.runner.js`, "utf8");
const orchestrator = readFileSync(`${phaseRoot}/m11-orchestrator-m11v2.js`, "utf8");
const resolver = readFileSync(`${phaseRoot}/m11-batch-evidence-resolver.js`, "utf8");

const phaseFiles = ["exposure-profile.runner.js", "m11-orchestrator-m11v2.js", "m11-deterministic-system-m11v2.js", "m11-deterministic-system.js", "m11-status-finalizer.js", "m11-deterministic-forensics-m11v2.js", "m11-deterministic-forensics.js", "m11-forensic-trace-index.js", "m11-lep-deterministic.js", "m11-batch-evidence-resolver.js"];
for (const file of phaseFiles) assert.equal(existsSync(`${phaseRoot}/${file}`), true, `missing phase-owned M11 file ${file}`);

assert.ok(phaseRunner.includes("./m11-orchestrator-m11v2.js"));
assert.ok(orchestrator.includes('phase_owned_path: "src/phases/09-exposure-profile"'));
assert.ok(orchestrator.includes("../../runtime/services/artifacts.service.js"));
assert.ok(orchestrator.includes("../02-cartography-index/services/phase-route-runtime.reader.js"));
for (const marker of ["lossless_family__", "fallback_policy", "fallback evidence", "fallback_evidence"]) assert.equal(resolver.toLowerCase().includes(marker.toLowerCase()), false, `Phase 9 resolver retains retired evidence marker: ${marker}`);
for (const marker of ["lossless_root__company_identity", "lossless_root__privacy_data_processing", "lossless_root__security_trust_compliance", "legal_doc_", 'evidence_role: "PRIMARY_EVIDENCE"', 'direct_lossless_fallback_used: false', "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY"]) assert.ok(resolver.includes(marker), `Phase 9 resolver missing current routing marker: ${marker}`);

for (const file of ["m11-orchestrator.js", "m11-orchestrator-m11v2.js", "m11-deterministic-system-m11v2.js", "m11-deterministic-system.js", "m11-status-finalizer.js", "m11-deterministic-forensics-m11v2.js", "m11-deterministic-forensics.js", "m11-forensic-trace-index.js", "m11-lep-deterministic.js", "m11-batch-evidence-resolver.js"]) assert.equal(existsSync(`src/${file}`), false, `obsolete root M11 file still exists: ${file}`);

assert.ok(pipeline.includes('../../phases/09-exposure-profile/exposure-profile.runner.js'), "central pipeline must import Phase 9 directly");
assert.equal(pipeline.includes('../../m11-orchestrator.js'), false, "central pipeline must not use root M11 path");

console.log(JSON.stringify({ check: "Phase 9 ownership cleanup", status: "PASS", enforced_gates: ["M11_IMPLEMENTATION_PHASE_OWNED", "CENTRAL_PIPELINE_IMPORTS_PHASE9_DIRECTLY", "OBSOLETE_ROOT_M11_FILES_DELETED", "NO_RETIRED_LOSSLESS_FAMILY_INPUTS", "LOSSLESS_EVIDENCE_PRIMARY_NOT_FALLBACK", "P2G_2F_ROUTING_AUTHORITY_PRESERVED"] }, null, 2));