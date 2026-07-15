import { compilePhase12DirectReportProjection } from "./phase12-projection-adapter.js";

export function compileFinalOutputHandoff({ run = {}, artifacts = {} } = {}) {
  return compilePhase12DirectReportProjection({ run, artifacts });
}

export { compilePhase12DirectReportProjection };
