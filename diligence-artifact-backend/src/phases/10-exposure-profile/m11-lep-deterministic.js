const EXPECTED_LEP_ROWS = 22;

export function parseFieldDerivationRegistryYaml(content) {
  const text = String(content || "");
  const rows = [];
  let inRecords = false;
  let current = null;
  let currentKey = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (trimmed === "records:") {
      inRecords = true;
      continue;
    }
    if (!inRecords) continue;

    if (trimmed.startsWith("- ")) {
      if (current && Object.keys(current).length) rows.push(current);
      current = {};
      currentKey = null;
      const inline = trimmed.slice(2).trim();
      if (inline) applyKeyValue(current, inline);
      const inlineKey = inline.match(/^([A-Za-z0-9_]+):/);
      currentKey = inlineKey ? inlineKey[1] : null;
      continue;
    }

    if (!current) continue;
    const matchedKey = applyKeyValue(current, trimmed);
    if (matchedKey) {
      currentKey = matchedKey;
      continue;
    }

    if (currentKey) current[currentKey] = `${current[currentKey]} ${normalizeScalar(trimmed)}`.trim();
  }

  if (current && Object.keys(current).length) rows.push(current);
  return rows.filter((row) => row.Field_ID);
}

export function selectLepRows(fieldDerivationRows, { expectedCount = EXPECTED_LEP_ROWS } = {}) {
  const rows = Array.isArray(fieldDerivationRows) ? fieldDerivationRows : [];
  const selected = rows.filter((row) => String(row.Field_ID || "").trim().startsWith("LEP."));
  return {
    rows: selected,
    validation: validateLepRows(selected, { expectedCount })
  };
}

export function selectLepRowsFromRegistryText(fieldDerivationRegistryText, options = {}) {
  return selectLepRows(parseFieldDerivationRegistryYaml(fieldDerivationRegistryText), options);
}

export function validateLepRows(lepRows, { expectedCount = EXPECTED_LEP_ROWS } = {}) {
  const rows = Array.isArray(lepRows) ? lepRows : [];
  const failures = [];
  const ids = new Set();

  if (rows.length !== expectedCount) failures.push(`expected ${expectedCount} LEP rows, received ${rows.length}`);

  for (const row of rows) {
    const id = String(row.Field_ID || "").trim();
    if (!id) failures.push("LEP row missing Field_ID");
    if (id && !id.startsWith("LEP.")) failures.push(`non-LEP row selected: ${id}`);
    if (ids.has(id)) failures.push(`duplicate LEP Field_ID: ${id}`);
    ids.add(id);
    for (const required of ["Profile_Section", "Output_Field", "Mode", "Source_Basis", "Conditions", "Trigger_Outcome", "Exclude_Fallback", "Forbidden_Inference", "Lock_Status"]) {
      if (!(required in row)) failures.push(`${id || "LEP row"} missing ${required}`);
    }
  }

  return {
    ok: failures.length === 0,
    status: failures.length ? "REPAIR_REQUIRED" : "PASS",
    expected_lep_rows: expectedCount,
    loaded_lep_rows: rows.length,
    failures
  };
}

export function buildLepSelectorApplicationLedger(lepRows, outcomes = {}) {
  const rows = Array.isArray(lepRows) ? lepRows : [];
  return rows.map((row) => {
    const id = row.Field_ID;
    const outcome = outcomes[id] || {};
    return {
      Field_ID: id,
      Profile_Section: row.Profile_Section || "",
      Field_Family: row.Field_Family || "",
      Output_Field: row.Output_Field || "",
      Mode: row.Mode || "",
      Source_Basis: row.Source_Basis || "",
      Conditions: row.Conditions || "",
      Trigger_Outcome: row.Trigger_Outcome || "",
      Exclude_Fallback: row.Exclude_Fallback || "",
      Forbidden_Inference: row.Forbidden_Inference || "",
      Lock_Status: row.Lock_Status || "",
      applied: Boolean(outcome.applied),
      outcome: outcome.outcome || "ACCOUNTED_BY_M11_DETERMINISTIC_FORENSICS",
      limitation: outcome.limitation || ""
    };
  });
}

function applyKeyValue(target, line) {
  const match = line.match(/^([A-Za-z0-9_]+):(?:\s*(.*))?$/);
  if (!match) return "";
  target[match[1]] = normalizeScalar(match[2] || "");
  return match[1];
}

function normalizeScalar(value) {
  const text = String(value || "").trim();
  if (text.length >= 2 && text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replace(/''/g, "'");
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) return text.slice(1, -1).replace(/\\"/g, '"');
  return text;
}
