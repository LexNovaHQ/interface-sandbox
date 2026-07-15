import { startRuntimeServer } from "./src/runtime/main.js";

// Compatibility shell only.
// Production must boot the central runtime, not the retired reviewer-runner stack.
if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  startRuntimeServer();
}

export { startRuntimeServer };
