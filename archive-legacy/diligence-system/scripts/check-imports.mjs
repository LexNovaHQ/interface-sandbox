// diligence-system/scripts/check-imports.mjs
const moduleSpecs = [
  "../server.js",
  "../phase-runner.js",
  "../source-adapter.js",
  "../gemini-client.js",
  "../mechanical-output-validator.js",
  "../reference-loader.js",
  "../run-store.js",
  "../run-manager.js",
  "../renderer.js",
];

const expectedExports = {
  "../phase-runner.js": ["loadPromptStack", "runPhaseStack", "runSingleNode"],
  "../run-store.js": [
    "createRunRecord",
    "readRunState",
    "writeRunState",
    "writeArtifact",
    "readArtifact",
    "readArtifacts",
    "listArtifacts",
    "markRunFailed",
  ],
  "../run-manager.js": ["createRun", "getRun", "advanceRun", "getRunResult"],
  "../renderer.js": ["renderDiligenceReport"],
};

const checkedModules = [];
const checkedExports = [];

for (const spec of moduleSpecs) {
  const mod = await import(spec);
  checkedModules.push(spec);

  for (const exportName of expectedExports[spec] || []) {
    if (!(exportName in mod)) {
      throw new Error(`MISSING_EXPORT:${spec}:${exportName}`);
    }
    checkedExports.push(`${spec}:${exportName}`);
  }
}

console.log(JSON.stringify({
  ok: true,
  checked_modules: checkedModules,
  checked_exports: checkedExports,
}));
