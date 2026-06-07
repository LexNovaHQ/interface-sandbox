import express from "express";
import helmet from "helmet";
import cors from "cors";
import { getRequiredRuntimeEnvStatus, readRuntimeEnv } from "./src/env.js";
import { createSmokeRouter } from "./src/routes/smokeRoutes.js";
import { createPoolRouter } from "./src/routes/poolRoutes.js";
import { createSourceDiscoveryRouter } from "./src/routes/sourceDiscoveryRoute.js";
import { createSourceCaptureRouter } from "./src/routes/sourceCaptureRoute.js";
const app = express();
const runtime = readRuntimeEnv();

app.use(helmet());
app.use(express.json({ limit: "4mb" }));
app.use(cors({ origin: runtime.allowed_origin }));

function requireToken(req, res, next) {
  const configured = process.env.RUNTIME_ACCESS_TOKEN;
  const provided = req.get("x-runtime-access-token") || req.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!configured) {
    return res.status(503).json({ ok: false, service: "lexnova-runtime-api", error_type: "AUTH_NOT_CONFIGURED" });
  }

  if (provided !== configured) {
    return res.status(401).json({ ok: false, service: "lexnova-runtime-api", error_type: "UNAUTHORIZED" });
  }

  return next();
}

function healthPayload() {
  const currentRuntime = readRuntimeEnv();
  const envStatus = getRequiredRuntimeEnvStatus();

  return {
    ok: envStatus.required_missing.length === 0,
    service: "lexnova-runtime-api",
    version: "0.3.0",
    phase: "phase_3_source_discovery_runtime",
    runtime: {
      node_env: currentRuntime.node_env,
      allowed_origin: currentRuntime.allowed_origin,
      access_token_configured: currentRuntime.runtime_access_token_configured
    },
    pools: currentRuntime.pools,
    env_status: envStatus,
    architecture: {
      cloudflare_role: "static_react_host_only",
      runtime_role: "cloud_run_intelligence_runtime",
      artificial_evidence_limits: false,
      automatic_batch_continuation_required: true
    }
  };
}

app.get("/health", (req, res) => {
  res.json(healthPayload());
});

app.get("/v1/runtime-status", requireToken, (req, res) => {
  res.json(healthPayload());
});

app.use("/v1/smoke", requireToken, createSmokeRouter());
app.use("/v1/pool", requireToken, createPoolRouter());
app.use("/v1/source-discovery", requireToken, createSourceDiscoveryRouter());
app.use("/v1/source-capture", requireToken, createSourceCaptureRouter());

app.use((req, res) => {
  res.status(404).json({ ok: false, service: "lexnova-runtime-api", error_type: "NOT_FOUND" });
});

app.use((error, req, res, next) => {
  res.status(500).json({ ok: false, service: "lexnova-runtime-api", error_type: "RUNTIME_ERROR", error: error?.message || String(error) });
});

app.listen(runtime.port, () => {
  console.log(`lexnova-runtime-api listening on ${runtime.port}`);
});




