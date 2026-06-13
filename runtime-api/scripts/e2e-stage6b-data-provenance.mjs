#!/usr/bin/env node

import path from "node:path";

const defaultCachePath = path.join(process.cwd(), ".runtime-e2e-cache", "stage6b-data-provenance.json");
process.env.STAGE6_AUDIT_MODE = "stage6b_data_provenance";
process.env.STAGE6_E2E_CACHE_PATH = process.env.STAGE6B_E2E_CACHE_PATH || process.env.STAGE6_E2E_CACHE_PATH || defaultCachePath;

await import("./e2e-stage6-legal-stack-review.mjs");
