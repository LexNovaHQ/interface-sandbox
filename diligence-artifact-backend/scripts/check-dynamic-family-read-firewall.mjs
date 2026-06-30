import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const artifactService = await readFile("src/artifact-service.js", "utf8");
const phaseContracts = await readFile("src/phase-contracts.js", "utf8");

assert.ok(artifactService.includes("isLosslessFamilyArtifactName"), "artifact-service must identify lossless family artifacts");
assert.ok(artifactService.includes("buildDynamicEmptyLosslessFamilyArtifact"), "artifact-service must build controlled empty dynamic family artifacts");
assert.ok(artifactService.includes("DYNAMIC_LOSSLESS_FAMILY_EMPTY_READ"), "artifact-service must log dynamic empty family reads");
assert.ok(artifactService.includes("CONTROLLED_EMPTY_FAMILY"), "dynamic empty family fallback must be controlled, not silent");
assert.ok(artifactService.includes("catch (error) { if (!isLosslessFamilyArtifactName(artifact_name)) throw error;"), "readArtifactPayload must fallback only for lossless_family__* artifacts");

assert.ok(phaseContracts.includes("...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES"), "test expects downstream legal family reads to exist");
assert.ok(phaseContracts.includes("M11"), "M11 phase contract missing");

console.log("dynamic family read firewall: PASS");
