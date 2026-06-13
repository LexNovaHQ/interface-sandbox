#!/usr/bin/env node

import path from "node:path";

process.env.STAGE6_AUDIT_MODE = "stage6a_legal_cartography";
process.env.STAGE6_E2E_CACHE_PATH =
  process.env.STAGE6A_E2E_CACHE_PATH ||
  process.env.STAGE6_E2E_CACHE_PATH ||
  path.join(process.cwd(), ".runtime-e2e-cache", "stage6a-legal-cartography.json");

await import("./e2e-stage6-legal-stack-review.mjs");
