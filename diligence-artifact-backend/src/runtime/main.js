import { config } from "./config.js";
import { createRuntimeApp } from "./app.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function startRuntimeServer() {
  const app = createRuntimeApp();
  return app.listen(config.port, () => {
    console.log(`${config.serviceName} central runtime listening on :${config.port}`);
  });
}

const invokedEntrypoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
const runtimeEntrypoint = path.resolve(fileURLToPath(import.meta.url));

if (invokedEntrypoint === runtimeEntrypoint) {
  startRuntimeServer();
}
