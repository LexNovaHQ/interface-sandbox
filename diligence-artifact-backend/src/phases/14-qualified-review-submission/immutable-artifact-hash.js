import { createHash } from "node:crypto";

export function canonicalizeImmutableValue(value) {
  if (Array.isArray(value)) return value.map(canonicalizeImmutableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalizeImmutableValue(value[key])]));
}

export function hashImmutableArtifact(value) {
  return createHash("sha256").update(JSON.stringify(canonicalizeImmutableValue(value))).digest("hex");
}

export function freezeImmutableArtifact(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freezeImmutableArtifact(child);
  return value;
}
