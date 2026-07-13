export const QR_TRI_STATE = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  UNRESOLVED: "UNRESOLVED"
});

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function hasOwn(object, key) {
  return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
}

export function hasMaterialValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.some(hasMaterialValue);
  if (isObject(value)) return Object.values(value).some(hasMaterialValue);
  return true;
}

export function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[_\s-]+/g, " ");
}

export function stableUnique(values = []) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = stableValueKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function stableValueKey(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value !== "object") return `${typeof value}:${String(value)}`;
  return `object:${JSON.stringify(sortObject(value))}`;
}

export function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]));
}

export function flattenMaterialValues(value) {
  if (Array.isArray(value)) return value.flatMap(flattenMaterialValues);
  return hasMaterialValue(value) ? [value] : [];
}

export function serializeSearchText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(serializeSearchText).filter(Boolean).join(" ");
  if (isObject(value)) return Object.entries(value).map(([key, nested]) => `${key} ${serializeSearchText(nested)}`).join(" ");
  return String(value);
}

export function resolvePathValues(root, expression) {
  const paths = splitExpression(expression);
  const combined = [];
  let found = false;
  for (const path of paths) {
    const resolved = resolveSinglePath(root, path);
    found ||= resolved.found;
    combined.push(...resolved.values);
  }
  return { found, values: stableUnique(combined.flatMap(flattenTerminal)) };
}

export function splitExpression(expression) {
  return String(expression || "")
    .split("+")
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveSinglePath(root, path) {
  const segments = String(path || "").split(".").map((value) => value.trim()).filter(Boolean);
  let nodes = [root];
  let found = false;
  for (const rawSegment of segments) {
    const wildcard = rawSegment.endsWith("[*]");
    const segment = wildcard ? rawSegment.slice(0, -3) : rawSegment;
    const next = [];
    let segmentFound = false;
    for (const node of nodes) {
      if (Array.isArray(node)) {
        for (const item of node) {
          const result = readSegment(item, segment, wildcard);
          segmentFound ||= result.found;
          next.push(...result.values);
        }
      } else {
        const result = readSegment(node, segment, wildcard);
        segmentFound ||= result.found;
        next.push(...result.values);
      }
    }
    if (!segmentFound) return { found: false, values: [] };
    found = true;
    nodes = next;
  }
  return { found, values: nodes };
}

function readSegment(node, segment, wildcard) {
  if (!isObject(node) && !Array.isArray(node)) return { found: false, values: [] };
  if (!segment) {
    const values = wildcard ? asArray(node) : [node];
    return { found: true, values };
  }
  if (!hasOwn(node, segment)) return { found: false, values: [] };
  const value = node[segment];
  if (wildcard) return { found: true, values: Array.isArray(value) ? value : [] };
  return { found: true, values: [value] };
}

function flattenTerminal(value) {
  if (Array.isArray(value)) return value.flatMap(flattenTerminal);
  return [value];
}

export function freezeDeep(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freezeDeep(child);
  return value;
}
