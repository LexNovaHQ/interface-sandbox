import fs from "node:fs";

const file = "scripts/check-phase7-data-provenance-profile.mjs";
let source = fs.readFileSync(file, "utf8");

const duplicateBefore = '...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_")),';
const duplicateAfter = '...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_") && name !== "dap_semantic_batch_route_manifest"),';
if (!source.includes(duplicateBefore)) throw new Error("PHASE7_OUTPUT_CHECK_DEDUP_MARKER_MISSING");
source = source.replace(duplicateBefore, duplicateAfter);

const functionPattern = /function assertNoLegacyArtifactsOrPrompts\(\) \{[\s\S]*?\n\}\n\nfunction collectFiles/;
if (!functionPattern.test(source)) throw new Error("PHASE7_LEGACY_SCANNER_FUNCTION_MARKER_MISSING");
const replacement = `function assertNoLegacyArtifactsOrPrompts() {
  const retired = ["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "m10_selected_legal_support_packet"];
  for (const artifactName of retired) {
    assert.equal(ARTIFACT_NAMES.includes(artifactName), false, \`\${artifactName} must not be active artifact\`);
  }

  const promptFiles = collectFiles(["agent-packages/agent_4_data_privacy"]);
  for (const file of promptFiles) {
    const text = fs.readFileSync(path.join(repoRoot, file), "utf8");
    for (const forbidden of ["M10_LEAN_INPUT_CONTRACT", "extended_dap_india_readiness_profile", "integrated_dap_report"]) {
      assert.equal(text.includes(forbidden), false, \`\${file} contains retired Phase7/M10 prompt marker \${forbidden}\`);
    }
  }

  const phase7Files = collectFiles(["src/phases/07-data-provenance-profile"]);
  const activeKeys = ["artifact_type", "artifact_name", "material_source_of_truth", "expected_artifact_name", "compatibility_outputs", "material_outputs", "writes"];
  for (const file of phase7Files) {
    const lines = fs.readFileSync(path.join(repoRoot, file), "utf8").split(/\\r?\\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const context = lines.slice(Math.max(0, index - 2), index + 1).join(" ");
      if (!activeKeys.some((key) => context.includes(key))) continue;
      for (const artifactName of retired) {
        assert.equal(line.includes(artifactName), false, \`\${file}:\${index + 1} actively emits retired Phase7/M10 artifact \${artifactName}\`);
      }
    }
  }
}

function collectFiles`;
source = source.replace(functionPattern, replacement);

fs.writeFileSync(file, source);
console.log("Phase 7 output assertion and active-emission legacy scan: APPLIED");
