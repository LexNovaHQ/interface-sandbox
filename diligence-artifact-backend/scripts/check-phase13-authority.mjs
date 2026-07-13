import { loadAndValidateQrRegistryAuthority } from "../src/phases/13-qualified-review/registry/index.js";

try {
  const { validation } = loadAndValidateQrRegistryAuthority();
  console.log("Phase 13 QR authority validation: PASS");
  console.log(JSON.stringify(validation.counts, null, 2));
  if (validation.warnings.length) {
    console.log("Warnings:");
    for (const warning of validation.warnings) console.log(`- ${warning.code}`);
  }
} catch (error) {
  console.error("Phase 13 QR authority validation: FAIL");
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
}
