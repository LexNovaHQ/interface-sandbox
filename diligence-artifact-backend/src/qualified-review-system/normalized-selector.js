export function readSelectorValues(object, path) {
  if (!path || String(path).startsWith("PRIVATE_INPUT.")) return [];
  let values = [object];
  for (const part of splitPath(String(path))) {
    values = values.flatMap((value) => step(value, part)).filter((value) => value !== undefined && value !== null);
    if (!values.length) return [];
  }
  return values;
}

export function firstSelectorValue(object, paths = []) {
  for (const path of asArray(paths).filter(Boolean)) {
    const values = readSelectorValues(object, path).filter(hasMeaningfulValue);
    if (values.length) return { value: values[0], selector: path, found: true };
  }
  return { value: "", selector: "", found: false };
}

export function hasMeaningfulValue(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (typeof value === "object") return Object.values(value).some(hasMeaningfulValue);
  const text = String(value).trim();
  return Boolean(text) && !/^not visible in reviewed public materials\.?$/i.test(text) && text !== "—";
}

export function valueToAnswer(value) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map(valueToAnswer).filter(Boolean).join("; ");
  if (typeof value === "object") return Object.entries(value).filter(([, nested]) => hasMeaningfulValue(nested)).map(([key, nested]) => `${label(key)}: ${valueToAnswer(nested)}`).filter(Boolean).join("; ");
  return String(value).trim();
}

function splitPath(path) {
  const parts = [];
  let current = "";
  let depth = 0;
  for (const char of path) {
    if (char === "." && depth === 0) {
      if (current) parts.push(current);
      current = "";
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") depth = Math.max(0, depth - 1);
    current += char;
  }
  if (current) parts.push(current);
  return parts;
}

function step(value, segment) {
  if (value === undefined || value === null) return [];
  if (Object.prototype.hasOwnProperty.call(Object(value), segment)) return [value[segment]];
  const match = String(segment).match(/^([^\[]+)(?:\[(.*)\])?$/);
  if (!match) return [];
  const prop = match[1];
  const selector = match[2];
  const next = value?.[prop];
  if (selector === undefined) return next === undefined ? [] : [next];
  if (selector === "*") return asArray(next);
  if (/^\d+$/.test(selector)) return [asArray(next)[Number(selector)]].filter((item) => item !== undefined);
  if (selector.includes("=")) {
    const [rawKey, ...rest] = selector.split("=");
    const key = rawKey.trim();
    const expected = rest.join("=").trim();
    return asArray(next).filter((item) => String(item?.[key] ?? item?.[key.toLowerCase()] ?? "") === expected);
  }
  if (next && typeof next === "object" && !Array.isArray(next)) return Object.prototype.hasOwnProperty.call(next, selector) ? [next[selector]] : [];
  return [];
}

function label(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function asArray(value) { return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]; }
