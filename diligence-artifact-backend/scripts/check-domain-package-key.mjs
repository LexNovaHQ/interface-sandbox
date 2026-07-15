import assert from "node:assert/strict";
import { loadDomainPackageKeyV0 } from "../src/runtime/domain-gate/package-catalog.loader.js";

const key = await loadDomainPackageKeyV0();
for (const marker of [
  "DOMAIN_PACKAGE_KEY_v0",
  "passive manifest/control layer",
  "Primary Domain Packages",
  "Capability Overlays",
  "Regulatory Overlays",
  "Review Overlays",
  "Pre-Phase 1 may not produce `LOCKED`",
  "No domain or overlay may be locked from model reasoning alone",
  "pre_phase_1_domain_preflight"
]) assert.ok(key.includes(marker), `DOMAIN_PACKAGE_KEY_v0.md missing marker: ${marker}`);

console.log(JSON.stringify({ check: "domain package key", status: "PASS" }, null, 2));
