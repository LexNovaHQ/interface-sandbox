import fs from "node:fs";

const file = "scripts/check-phase7-data-provenance-profile.mjs";
let source = fs.readFileSync(file, "utf8");
let changed = false;

const duplicateBefore = '"dap_semantic_batch_route_manifest",\n    ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_")),';
const duplicateAfter = '...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_")),';
if (source.includes(duplicateBefore)) {
  source = source.replace(duplicateBefore, duplicateAfter);
  changed = true;
} else if (!source.includes(duplicateAfter)) {
  throw new Error("PHASE7_OUTPUT_CHECK_DEDUP_MARKER_MISSING");
}

const oldLayer5Read = 'assert.deepEqual(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads, ["dap_semantic_batch_route_manifest", ...PHASE7_DAP_BATCH_ARTIFACT_NAMES(), ...phase7ValidationNames()]);';
const currentLayer5Read = 'assert.deepEqual(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads, ["dap_semantic_batch_route_manifest", ...PHASE7_DAP_BATCH_ARTIFACT_NAMES, ...phase7ValidationNames()]);';
const alternativeLayer5Read = 'assert.deepEqual(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads, ["dap_semantic_batch_route_manifest", ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_") && name !== "dap_semantic_batch_route_manifest"), ...phase7ValidationNames()]);';
if (source.includes(oldLayer5Read)) {
  source = source.replace(oldLayer5Read, currentLayer5Read);
  changed = true;
} else if (!source.includes(currentLayer5Read) && !source.includes(alternativeLayer5Read)) {
  throw new Error("PHASE7_LAYER5_BATCH_ARTIFACT_EXPECTATION_MARKER_MISSING");
}

const helperPattern = /\nfunction PHASE7_DAP_BATCH_ARTIFACT_NAMES\(\) \{\n  return PHASE7_DAP_SEMANTIC_BATCH_PLAN\.map\(\(batch\) => batch\.expected_artifact_name\);\n\}\n/;
if (helperPattern.test(source)) {
  source = source.replace(helperPattern, "\n");
  changed = true;
}

const functionPattern = /function assertNoLegacyArtifactsOrPrompts\(\) \{[\s\S]*?\n\}\n\nfunction collectFiles/;
const replacement = [
  'function assertNoLegacyArtifactsOrPrompts() {',
  '  const retired = ["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "m10_selected_legal_support_packet"];',
  '  for (const artifactName of retired) {',
  '    assert.equal(ARTIFACT_NAMES.includes(artifactName), false, `${artifactName} must not be active artifact`);',
  '  }',
  '',
  '  const promptFiles = collectFiles(["agent-packages/agent_4_data_privacy"]);',
  '  for (const file of promptFiles) {',
  '    const text = fs.readFileSync(path.join(repoRoot, file), "utf8");',
  '    for (const forbidden of ["M10_LEAN_INPUT_CONTRACT", "extended_dap_india_readiness_profile", "integrated_dap_report"]) {',
  '      assert.equal(text.includes(forbidden), false, `${file} contains retired Phase7/M10 prompt marker ${forbidden}`);',
  '    }',
  '  }',
  '',
  '  const phase7Files = collectFiles(["src/phases/07-data-provenance-profile"]);',
  '  const activeKeys = ["artifact_type", "artifact_name", "material_source_of_truth", "expected_artifact_name", "compatibility_outputs", "material_outputs", "writes"];
  for (const file of phase7Files) {',
  '    const lines = fs.readFileSync(path.join(repoRoot, file), "utf8").split(/\\r?\\n/);',
  '    for (let index = 0; index < lines.length; index += 1) {',
  '      const line = lines[index];',
  '      const context = lines.slice(Math.max(0, index - 2), index + 1).join(" ");',
  '      if (!activeKeys.some((key) => context.includes(key))) continue;',
  '      for (const artifactName of retired) {',
  '        const doubleQuoted = `"${artifactName}"`;',
  '        const singleQuoted = `\'${artifactName}\'`;',
  '        const exactIdentityPresent = line.includes(doubleQuoted) || line.includes(singleQuoted);',
  '        assert.equal(exactIdentityPresent, false, `${file}:${index + 1} actively emits retired Phase7/M10 artifact ${artifactName}`);',
  '      }',
  '    }',
  '  }',
  '}',
  '',
  'function collectFiles'
].join("\n");
if (functionPattern.test(source)) {
  const replaced = source.replace(functionPattern, replacement);
  if (replaced !== source) {
    source = replaced;
    changed = true;
  }
} else if (!source.includes("function assertNoLegacyArtifactsOrPrompts()") || !source.includes("extended_dap_india_readiness_profile") || !source.includes("integrated_dap_report")) {
  throw new Error("PHASE7_LEGACY_SCANNER_FUNCTION_MARKER_MISSING");
}

if (changed) {
  fs.writeFileSync(file, source);
  console.log("Phase 7 output assertion and exact-identity legacy scan: APPLIED");
} else {
  console.log("Phase 7 output assertion and exact-identity legacy scan: ALREADY_SYNCED");
}
