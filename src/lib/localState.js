const isBrowser = typeof window !== "undefined" && window.localStorage;
const LEDGER_KEY = "interface:handoffLedger";

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

export function readHandoffLedger() {
  return readState(LEDGER_KEY) || [];
}

export function saveHandoffLedger(entries) {
  return writeState(LEDGER_KEY, entries);
}
