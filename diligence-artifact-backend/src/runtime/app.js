import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { config } from "./config.js";
import { requireApiKey } from "../auth.js";
import { healthRouter } from "./routes/health.routes.js";
import { operatorRouter } from "./routes/operator.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { sendError } from "./errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createRuntimeApp() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.allowedOrigin === "*" ? true : config.allowedOrigin }));
  app.use(express.json({ limit: config.expressJsonLimit }));

  app.use("/health", healthRouter);
  app.use("/public", publicRouter);
  app.use(express.static(path.join(__dirname, "../../public"), {
    extensions: ["html"],
    etag: false,
    lastModified: false,
    maxAge: 0,
    setHeaders(res) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
  }));

  app.use("/v1", requireApiKey);
  app.use("/v1", operatorRouter);

  app.use((error, _req, res, _next) => sendError(res, error));
  return app;
}
