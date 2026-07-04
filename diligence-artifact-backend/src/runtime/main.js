import { config } from "../config.js";
import { createRuntimeApp } from "./app.js";

export function startRuntimeServer() {
  const app = createRuntimeApp();
  return app.listen(config.port, () => {
    console.log(`${config.serviceName} central runtime listening on :${config.port}`);
  });
}

if (process.argv[1] && process.argv[1].endsWith("src/runtime/main.js")) {
  startRuntimeServer();
}
