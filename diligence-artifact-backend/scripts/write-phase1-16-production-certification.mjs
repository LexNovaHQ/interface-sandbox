import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PRODUCTION_GATE_CHECKS } from "./production-gate.manifest.mjs";
import { POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT } from "../src/runtime/contracts/post-review-production-cutover.contract.js";

const outputPath = resolve(process.cwd(), process.argv[2] || "phase1-16-production-certification.json");
const receipt = {
  artifact_type: "phase1_16_source_production_certification",
  artifact_version: "phase1_16_source_production_certification.v1",
  status: "PASS",
  certified_scope: "SOURCE_AND_REPOSITORY_RUNTIME_PHASES_1_THROUGH_16",
  certification_command: "npm run check:critical",
  production_gate_suite_count: PRODUCTION_GATE_CHECKS.length,
  production_gate_suite_ids: PRODUCTION_GATE_CHECKS.map((check) => check.id),
  repository: process.env.GITHUB_REPOSITORY || "LexNovaHQ/interface-sandbox",
  branch_or_ref: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || "domain-gate-v0-preflight",
  commit_sha: process.env.GITHUB_SHA || "LOCAL_CHECKOUT",
  workflow_run_id: process.env.GITHUB_RUN_ID || "LOCAL_EXECUTION",
  workflow_run_attempt: process.env.GITHUB_RUN_ATTEMPT || "1",
  certified_at: new Date().toISOString(),
  post_review_cutover: {
    cutover_version: POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.cutover_version,
    active: POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.active,
    runtime_sequence: POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.runtime_sequence,
    legacy_authorities: POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.retired_authorities
  },
  boundaries: {
    source_certification_complete: true,
    github_actions_execution_complete: Boolean(process.env.GITHUB_ACTIONS),
    live_cloud_tasks_execution_included: false,
    live_firestore_drive_execution_included: false,
    deployment_or_external_launch_authorization_included: false,
    generated_documents_are_review_ready_drafts: true,
    local_counsel_review_required: true,
    legal_architect_not_law_firm: true
  }
};

writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(`PHASE1_16_PRODUCTION_CERTIFICATION_WRITTEN:${outputPath}`);
console.log(JSON.stringify(receipt, null, 2));
