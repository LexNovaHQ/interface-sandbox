import { STORAGE_KEYS } from "./constants.js";

const isBrowser = typeof window !== "undefined" && window.localStorage;

export function readState(key) {
  if (!isBrowser) return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeState(key, value) {
  if (!isBrowser) return value;
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function clearState(key) {
  if (!isBrowser) return;
  window.localStorage.removeItem(key);
}

export function readLastDiligenceReport() {
  return readState(STORAGE_KEYS.diligenceReport);
}

export function saveDiligenceArtifacts(payload) {
  if (payload?.source_bundle) {
    writeState(STORAGE_KEYS.sourceBundle, payload.source_bundle);
  }

  if (payload) {
    writeState(STORAGE_KEYS.diligenceReport, payload);
  }
}

export function saveAssemblyOutput(payload) {
  return writeState(STORAGE_KEYS.assemblyOutput, payload);
}

export function saveDeliveryState(payload) {
  return writeState(STORAGE_KEYS.deliveryState, payload);
}

export function saveMaintenanceRun(payload) {
  return writeState(STORAGE_KEYS.maintenanceRun, payload);
}
