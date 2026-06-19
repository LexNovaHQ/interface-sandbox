export const REQUIRED_KEYS_BY_PHASE = {
  P1: [
    "source_discovery_handoff",
    "source_discovery_forensic_ledger",
    "source_discovery_trace"
  ],
  P2: [
    "target_profile",
    "target_profile_forensic_ledger",
    "target_profile_trace"
  ],
  P3: [
    "target_feature_profile",
    "feature_profile_forensic_ledger",
    "feature_function_trace"
  ],
  P4: [
    "legal_cartography_index",
    "legal_cartography_forensic_ledger",
    "legal_cartography_trace"
  ],
  P5: [
    "target_data_provenance_profile",
    "data_provenance_forensic_ledger",
    "data_provenance_trace"
  ],
  P6: [
    "target_exposure_profile",
    "exposure_profile_forensic_ledger",
    "registry_evaluation_trace"
  ],
  P7: [
    "final_output_handoff",
    "final_output_forensic_ledger",
    "final_compiler_trace"
  ]
};

const CANONICAL_P1_PHASE_PACKAGE_KEYS = [
  "target_profile_package",
  "feature_profile_package",
  "legal_cartography_package",
  "data_provenance_package",
  "registry_support_package",
  "final_source_coverage_package"
];

const P1_PHASE_PACKAGE_ALIASES = {
  target_profile_source_package: "target_profile_package",
  target_feature_package: "feature_profile_package",
  target_feature_profile_package: "feature_profile_package",
  legal_governance_package: "legal_cartography_package",
  legal_governance_evidence_package: "legal_cartography_package",
  legal_governance_lossless_evidence_package: "registry_support_package",
  data_profile_package: "data_provenance_package",
  data_provenance_packages: "data_provenance_package",
  exposure_profile_package: "registry_support_package",
  registry_evaluation_package: "registry_support_package",
  source_coverage_package: "final_source_coverage_package"
};

export function stripJsonFence(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : raw;
}

export function parseJsonObject(text) {
  const stripped = stripJsonFence(text);
  if (!stripped) {
    return {
      ok: false,
      parsed: null,
      error: "EMPTY_MODEL_OUTPUT",
      stripped
    };
  }

  try {
    const parsed = JSON.parse(stripped);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        parsed,
        error: "MODEL_OUTPUT_NOT_JSON_OBJECT",
        stripped
      };
    }
    return { ok: true, parsed, error: null, stripped };
  } catch (err) {
    return {
      ok: false,
      parsed: null,
      error: `JSON_PARSE_FAILED:${err?.message || String(err)}`,
      stripped
    };
  }
}

export function normalizeP1PhasePackages(parsed = {}) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return parsed;

  const handoff = parsed.source_discovery_handoff;
  if (!handoff || typeof handoff !== "object" || Array.isArray(handoff)) return parsed;

  const phasePackages =
    handoff.phase_packages &&
    typeof handoff.phase_packages === "object" &&
    !Array.isArray(handoff.phase_packages)
      ? handoff.phase_packages
      : {};

  const normalizedPhasePackages = { ...phasePackages };

  for (const [aliasKey, canonicalKey] of Object.entries(P1_PHASE_PACKAGE_ALIASES)) {
    const aliasValue =
      phasePackages[aliasKey] !== undefined
        ? phasePackages[aliasKey]
        : handoff[aliasKey];

    if (
      normalizedPhasePackages[canonicalKey] === undefined ||
      normalizedPhasePackages[canonicalKey] === null
    ) {
      normalizedPhasePackages[canonicalKey] = normalizeP1PackageValue(aliasValue);
    }
  }

  for (const canonicalKey of CANONICAL_P1_PHASE_PACKAGE_KEYS) {
    normalizedPhasePackages[canonicalKey] = normalizeP1PackageValue(
      normalizedPhasePackages[canonicalKey]
    );
  }

  return {
    ...parsed,
    source_discovery_handoff: {
      ...handoff,
      absence_records: normalizeP1ArrayValue(
        handoff.absence_records ?? handoff.documented_absences ?? []
      ),
      access_failed_sources: normalizeP1ArrayValue(
        handoff.access_failed_sources ?? handoff.fetch_failures ?? []
      ),
      phase_packages: normalizedPhasePackages
    }
  };
}

export function validateMechanicalPhaseOutput({
  phaseId,
  rawText,
  parsed,
  requiredTopLevelKeys = [],
  context = {}
} = {}) {
  const errors = [];
  const warnings = [];
  const required = Array.isArray(requiredTopLevelKeys) ? requiredTopLevelKeys : [];

  if (!phaseId) errors.push("PHASE_ID_MISSING");
  if (!String(rawText || "").trim()) errors.push("MODEL_OUTPUT_EMPTY");

  const rootIsObject = Boolean(parsed) && typeof parsed === "object" && !Array.isArray(parsed);
  if (!rootIsObject) {
    errors.push("MODEL_OUTPUT_ROOT_NOT_OBJECT");
  } else {
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(parsed, key)) {
        errors.push(`REQUIRED_TOP_LEVEL_KEY_MISSING:${key}`);
      }
    }

    validatePhaseSpecificShape({
      phaseId,
      parsed,
      errors,
      warnings,
      context
    });
  }

  return {
    ok: errors.length === 0,
    phase_id: phaseId || null,
    errors,
    warnings,
    mechanical_only: true,
    summary: {
      required_top_level_keys: required,
      present_top_level_keys: rootIsObject ? Object.keys(parsed) : [],
      raw_chars: String(rawText || "").length
    }
  };
}

function validatePhaseSpecificShape({ phaseId, parsed, errors, warnings, context }) {
  if (phaseId === "P1") {
    const handoff = parsed.source_discovery_handoff;
    if (!isPlainObject(handoff)) {
      errors.push("P1_SOURCE_DISCOVERY_HANDOFF_NOT_OBJECT");
      return;
    }

    const phasePackages = handoff.phase_packages;
    if (!isPlainObject(phasePackages)) {
      errors.push("P1_PHASE_PACKAGES_MISSING_OR_NOT_OBJECT");
      return;
    }

    for (const key of CANONICAL_P1_PHASE_PACKAGE_KEYS) {
  if (!Object.prototype.hasOwnProperty.call(phasePackages, key)) {
    errors.push(`P1_PHASE_PACKAGE_MISSING:${key}`);
    continue;
  }

  if (!isValidP1PackageValue(phasePackages[key])) {
    errors.push(`P1_PHASE_PACKAGE_INVALID:${key}`);
  }
}
    if (!Array.isArray(handoff.absence_records)) {
      errors.push("P1_ABSENCE_RECORDS_NOT_ARRAY");
    }

    if (!Array.isArray(handoff.access_failed_sources)) {
      errors.push("P1_ACCESS_FAILED_SOURCES_NOT_ARRAY");
    }

    if (!isPlainObject(parsed.source_discovery_forensic_ledger)) {
      errors.push("P1_FORENSIC_LEDGER_MISSING_OR_NOT_OBJECT");
    }

    if (!isPlainObject(parsed.source_discovery_trace)) {
      errors.push("P1_TRACE_MISSING_OR_NOT_OBJECT");
    }
  }

  if (phaseId === "P3") {
    const profile = parsed.target_feature_profile;
    if (!isPlainObject(profile)) {
      errors.push("P3_TARGET_FEATURE_PROFILE_NOT_OBJECT");
      return;
    }

    if (!Array.isArray(profile.feature_inventory)) {
      errors.push("P3_FEATURE_INVENTORY_NOT_ARRAY");
    }

    if (Array.isArray(profile.feature_inventory) && profile.feature_inventory.length === 0) {
      warnings.push("P3_FEATURE_INVENTORY_EMPTY");
    }
  }

  if (phaseId === "P6") {
    const profile = parsed.target_exposure_profile;
    if (!isPlainObject(profile)) {
      errors.push("P6_TARGET_EXPOSURE_PROFILE_NOT_OBJECT");
      return;
    }

    if (!Array.isArray(profile.registry_ledger)) {
      errors.push("P6_REGISTRY_LEDGER_NOT_ARRAY");
    }

    if (Array.isArray(profile.registry_ledger)) {
      const duplicateIds = findDuplicateValues(
        profile.registry_ledger.map((row) => getRegistryRowId(row)).filter(Boolean)
      );

      if (duplicateIds.length) {
        errors.push(`P6_REGISTRY_LEDGER_DUPLICATE_IDS:${duplicateIds.join(",")}`);
      }

      const expectedCount = Number(context?.expected_registry_row_count || 0);
      if (expectedCount > 0 && profile.registry_ledger.length !== expectedCount) {
        errors.push(`P6_REGISTRY_LEDGER_LENGTH_MISMATCH:${profile.registry_ledger.length}:${expectedCount}`);
      }
    }

    if (!isPlainObject(parsed.exposure_profile_forensic_ledger)) {
      errors.push("P6_FORENSIC_LEDGER_MISSING_OR_NOT_OBJECT");
    }

    if (!isPlainObject(parsed.registry_evaluation_trace)) {
      errors.push("P6_REGISTRY_EVALUATION_TRACE_MISSING_OR_NOT_OBJECT");
    }
  }

  if (phaseId === "P7") {
    const handoff = parsed.final_output_handoff;
    if (!isPlainObject(handoff)) {
      errors.push("P7_FINAL_OUTPUT_HANDOFF_NOT_OBJECT");
      return;
    }

    const hasRenderablePayload = Boolean(
      handoff.screen_report_payload ||
      handoff.integrated_json_report ||
      handoff.vault_assembler_handoff
    );

    if (!hasRenderablePayload) {
      errors.push("P7_RENDERABLE_HANDOFF_PAYLOAD_MISSING");
    }

    if (!isPlainObject(parsed.final_output_forensic_ledger)) {
      errors.push("P7_FORENSIC_LEDGER_MISSING_OR_NOT_OBJECT");
    }

    if (!isPlainObject(parsed.final_compiler_trace)) {
      errors.push("P7_FINAL_COMPILER_TRACE_MISSING_OR_NOT_OBJECT");
    }
  }
}

export function validatePromptStackReadiness({ missingFiles = [] } = {}) {
  const missing = Array.isArray(missingFiles) ? missingFiles : [];
  return {
    ok: missing.length === 0,
    errors: missing.map((file) => `PROMPT_FILE_MISSING:${file}`),
    mechanical_only: true
  };
}
function normalizeP1PackageValue(value) {
  if (Array.isArray(value)) return value;
  if (isPlainObject(value)) return value;
  return [];
}

function normalizeP1ArrayValue(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function isValidP1PackageValue(value) {
  return Array.isArray(value) || isPlainObject(value);
}
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRegistryRowId(row) {
  return String(
    row?.Threat_ID ||
    row?.threat_id ||
    row?.registry_row_id ||
    row?.row_id ||
    ""
  ).trim();
}

function findDuplicateValues(values) {
  const seen = new Set();
  const dupes = new Set();

  for (const value of values || []) {
    if (!value) continue;
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }

  return Array.from(dupes);
}
