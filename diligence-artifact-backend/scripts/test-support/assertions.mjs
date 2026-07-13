import assert from "node:assert/strict";

export function assertSetEqual(actual, expected, label = "set") {
  assert.deepEqual(new Set(actual), new Set(expected), `${label} mismatch`);
}

export function findForbiddenKeys(value, forbiddenKeys, path = "artifact", found = []) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenKeys(item, forbiddenKeys, `${path}[${index}]`, found));
    return found;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) found.push(`${path}.${key}`);
    findForbiddenKeys(nested, forbiddenKeys, `${path}.${key}`, found);
  }
  return found;
}

export function assertNoForbiddenKeys(value, forbiddenKeys, label = "artifact") {
  const found = findForbiddenKeys(value, forbiddenKeys, label);
  assert.deepEqual(found, [], `${label}:${found.join(",")}`);
}

export function assertIncludesFailure(validation, fragment, label = "validation") {
  const failures = Array.isArray(validation?.failures) ? validation.failures : [];
  assert.ok(failures.some((failure) => String(failure).includes(fragment)), `${label} missing failure: ${fragment}`);
}

export function assertOwnPropertyAbsent(value, key, label = "object") {
  assert.equal(Object.prototype.hasOwnProperty.call(value, key), false, `${label} unexpectedly contains ${key}`);
}
