import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PIPELINE_CONTRACTS as PHASE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const directSignal = "legal_signal_derivation_profile";
const dataSignalLock = "DATA_PROVENANCE_DIRECT_LEGAL_SIGNAL_BEHAVIOR_LOCK.md";
const dataProvenanceContract = PHASE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4;

assert.ok(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads.includes(directSignal));
assert.ok(dataProvenanceContract.reads.includes(directSignal));
assert.ok(dataProvenanceContract.prompt_files.some((file) => file.endsWith(dataSignalLock)));

const targetPrompt = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md"), "utf8");
assert.ok(targetPrompt.includes("Target Profile Review"));
assert.ok(targetPrompt.includes("SOURCE_CONFLICT -> do not choose a winner"));
assert.ok(targetPrompt.includes("Target Profile Review must not use raw `legal_cartography_index` as model evidence."));

const authority = fs.readFileSync(path.join(repoRoot, "references/registry/M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml"), "utf8");
assert.ok(authority.includes("TARGET_PROFILE_REVIEW_DERIVATION_AUTHORITY"));
assert.ok(authority.includes("direct_signal_is_not_legal_advice: true"));
assert.ok(authority.includes("SOURCE_CONFLICT: no_winner_record_conflict_limitation"));

const dataLock = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_4_data_privacy", dataSignalLock), "utf8");
assert.ok(dataLock.includes("Data Provenance Profile"));
assert.ok(dataLock.includes("privacy_grievance_contact_signal_map"));
assert.ok(dataLock.includes("consent_manager_signal_map"));
assert.ok(dataLock.includes("They must not create new top-level fields."));
assert.ok(dataLock.includes("SOURCE_CONFLICT -> do not choose a winner"));

const contactConsentAddendum = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_4_data_privacy/M10_QR_CONTACT_CONSENT_MANAGER_ADDENDUM.md"), "utf8");
assert.ok(contactConsentAddendum.includes("legal_signal_derivation_profile"));
assert.ok(contactConsentAddendum.includes("Do not use `m10_selected_legal_support_packet`."));
assert.equal(contactConsentAddendum.includes("as secondary support where D-family material is insufficient"), false);

console.log("direct legal signal behavior: PASS");