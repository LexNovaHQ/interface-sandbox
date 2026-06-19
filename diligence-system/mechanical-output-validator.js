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

export const REQUIRED_KEYS_BY_PHASE = {
  P1: [
    "source_discovery_forensic_ledger",
    "source_discovery_trace",
    "source_discovery_handoff"
  ],
  P2: [
    "target_profile_forensic_ledger",
    "target_profile_trace",
    "target_profile"
  ],
  P3: [
    "feature_profile_forensic_ledger",
    "feature_function_trace",
    "target_feature_profile"
  ],
  P4: [
    "legal_cartography_forensic_ledger",
    "legal_cartography_trace",
    "legal_cartography_index"
  ],
  P5: [
    "data_provenance_forensic_ledger",
    "data_provenance_trace",
    "target_data_provenance_profile"
  ],
  P6: [
    "exposure_profile_forensic_ledger",
    "registry_evaluation_trace",
    "target_exposure_profile"
  ],
  P7: [
    "final_output_forensic_ledger",
    "final_compiler_trace",
    "final_output_handoff"
  ]
};

export const CANONICAL_P1_PHASE_PACKAGE_KEYS = [
  "target_profile_package",
  "feature_profile_package",
  "legal_cartography_package",
  "data_provenance_package",
  "registry_support_package",
  "final_source_coverage_package"
];

const P1_PHASE_PACKAGE_ALIASES = {
  target_feature_package: "feature_profile_package",
  data_provenance_packages: "data_provenance_package",
  legal_governance_evidence_package: "legal_cartography_package",
  legal_governance_lossless_evidence_package: "registry_support_package"
};

const CONTROLLED_STATUS_VALUES = new Set([
  "ADMITTED",
  "REJECTED",
  "QUARANTINED",
  "LIMITATION_REVIEW",
  "DEFERRED",
  "UNKNOWN",
  "ABSENT",
  "PRESENT",
  "NOT_APPLICABLE",
  "CONTROLLED_FAILURE",
  "PASS",
  "WARN",
  "FAIL"
]);

export function requiredKeysForPhase(phaseId, promptParsedRequiredKeys = []) {
  return unique([
    ...(REQUIRED_KEYS_BY_PHASE[phaseId] || []),
    ...(Array.isArray(promptParsedRequiredKeys) ? promptParsedRequiredKeys : [])
  ]);
}

export function normalizeP1PhasePackages(p1 = {}) {
  const handoff = p1?.source_discovery_handoff;
  if (!isPlainObject(handoff)) return p1;
  const packages = isPlainObject(handoff.phase_packages) ? handoff.phase_packages : {};
  for (const [oldKey, canonicalKey] of Object.entries(P1_PHASE_PACKAGE_ALIASES)) {
    if (packages[canonicalKey] === undefined && packages[oldKey] !== undefined) {
      packages[canonicalKey] = packages[oldKey];
    }
  }
  handoff.phase_packages = packages;
  return p1;
}

export function validateMechanicalPhaseOutput({ phaseId, rawText, parsed, requiredTopLevelKeys = [], context = {} } = {}) {
  const errors = [];
  const warnings = [];
  const required = requiredKeysForPhase(phaseId, requiredTopLevelKeys);

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
    runPhaseSpecificValidation({ phaseId, parsed, errors, warnings, context });
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

function runPhaseSpecificValidation({ phaseId, parsed, errors, warnings, context }) {
  if (phaseId === "P1") validateP1({ parsed: normalizeP1PhasePackages(parsed), errors, warnings, context });
  if (phaseId === "P2") validateObjectKeys({ parsed, errors, objectKeys: ["target_profile", "target_profile_forensic_ledger", "target_profile_trace"] });
  if (phaseId === "P3") validateP3({ parsed, errors, warnings });
  if (phaseId === "P4") validateP4({ parsed, errors });
  if (phaseId === "P5") validateP5({ parsed, errors, warnings });
  if (phaseId === "P6") validateP6({ parsed, errors, warnings });
  if (phaseId === "P7") validateP7({ parsed, errors, warnings });
}

function validateP1({ parsed, errors, warnings, context }) {
  const handoff = parsed.source_discovery_handoff;
  if (!isPlainObject(handoff)) {
    errors.push("P1_HANDOFF_NOT_OBJECT");
    return;
  }

  if (handoff.admitted_sources !== undefined && !Array.isArray(handoff.admitted_sources)) {
    errors.push("P1_ADMITTED_SOURCES_NOT_ARRAY");
  }
  if (handoff.evidence_box_manifest !== undefined && !Array.isArray(handoff.evidence_box_manifest)) {
    errors.push("P1_EVIDENCE_BOX_MANIFEST_NOT_ARRAY");
  }

  const packages = handoff.phase_packages;
  if (!isPlainObject(packages)) {
    errors.push("P1_PHASE_PACKAGES_NOT_OBJECT");
  } else {
    for (const key of CANONICAL_P1_PHASE_PACKAGE_KEYS) {
      if (!(Array.isArray(packages[key]) || isPlainObject(packages[key]))) {
        errors.push(`P1_CANONICAL_PHASE_PACKAGE_MISSING_OR_INVALID:${key}`);
      }
    }
  }

  const s0Count = Number(context?.s0_candidate_count);
  if (Number.isFinite(s0Count) && s0Count > 0 && !hasCandidateAccounting(handoff)) {
    warnings.push("P1_CANDIDATE_ACCOUNTING_OR_COVERAGE_STATUS_MISSING");
  }

  for (const source of Array.isArray(handoff.admitted_sources) ? handoff.admitted_sources : []) {
    const admitted = String(source?.admission_status || source?.status || "").toUpperCase() === "ADMITTED";
    if (admitted && Boolean(source?.snippet_only || source?.snippet_only_source || source?.phase1_admission_forbidden)) {
      errors.push("P1_SNIPPET_ONLY_SOURCE_ADMITTED");
    }
  }
}

function validateP3({ parsed, errors }) {
  validateObjectKeys({ parsed, errors, objectKeys: ["target_feature_profile", "feature_profile_forensic_ledger", "feature_function_trace"] });
  const profile = parsed.target_feature_profile;
  const inventory = profile?.feature_inventory || profile?.features || profile?.feature_list;
  if (inventory !== undefined && !Array.isArray(inventory)) errors.push("P3_FEATURE_INVENTORY_NOT_ARRAY");
  if (Object.prototype.hasOwnProperty.call(parsed, "registry_ledger")) errors.push("P3_FORBIDDEN_TOP_LEVEL_REGISTRY_LEDGER");
}

function validateP4({ parsed, errors }) {
  if (!(isPlainObject(parsed.legal_cartography_index) || Array.isArray(parsed.legal_cartography_index))) {
    errors.push("P4_LEGAL_CARTOGRAPHY_INDEX_NOT_OBJECT_OR_ARRAY");
  }
  validateObjectKeys({ parsed, errors, objectKeys: ["legal_cartography_forensic_ledger", "legal_cartography_trace"] });
  if (Object.prototype.hasOwnProperty.call(parsed, "target_data_provenance_profile")) errors.push("P4_FORBIDDEN_TARGET_DATA_PROVENANCE_PROFILE");
  if (Object.prototype.hasOwnProperty.call(parsed, "target_exposure_profile")) errors.push("P4_FORBIDDEN_TARGET_EXPOSURE_PROFILE");
}

function validateP5({ parsed, errors, warnings }) {
  validateObjectKeys({ parsed, errors, objectKeys: ["target_data_provenance_profile", "data_provenance_forensic_ledger", "data_provenance_trace"] });
  const profile = parsed.target_data_provenance_profile;
  if (isPlainObject(profile) && !hasAnyKey(profile, ["anti_unknown_protocol", "anti_unknown_protocol_status", "unknown_data_protocol"])) {
    warnings.push("P5_ANTI_UNKNOWN_PROTOCOL_FIELDS_ABSENT");
  }
  warnInvalidStatuses({ value: profile, warnings, label: "P5" });
}

function validateP6({ parsed, errors, warnings }) {
  validateObjectKeys({ parsed, errors, objectKeys: ["target_exposure_profile", "exposure_profile_forensic_ledger", "registry_evaluation_trace"] });
  const ledger = parsed.target_exposure_profile?.registry_ledger;
  if (!Array.isArray(ledger) || ledger.length === 0) {
    errors.push("P6_REGISTRY_LEDGER_MISSING_OR_EMPTY");
  } else if (ledger.length !== 98) {
    warnings.push(`P6_REGISTRY_LEDGER_LENGTH_NOT_98:${ledger.length}`);
  }
  warnInvalidStatuses({ value: parsed.target_exposure_profile, warnings, label: "P6" });
}

function validateP7({ parsed, errors, warnings }) {
  validateObjectKeys({ parsed, errors, objectKeys: ["final_output_handoff", "final_compiler_trace", "final_output_forensic_ledger"] });
  const handoff = parsed.final_output_handoff;
  if (isPlainObject(handoff) && !hasAnyKey(handoff, ["screen_report_payload", "integrated_json_report", "vault_assembler_handoff"])) {
    errors.push("P7_RENDERER_HANDOFF_PAYLOAD_MISSING");
  }
  if (isPlainObject(handoff) && !referencesUpstream(handoff)) {
    warnings.push("P7_UPSTREAM_REFERENCE_NOT_DETECTABLE");
  }
}

function validateObjectKeys({ parsed, errors, objectKeys }) {
  for (const key of objectKeys) {
    if (!isPlainObject(parsed[key])) errors.push(`${key.toUpperCase()}_NOT_OBJECT`);
  }
}

function hasCandidateAccounting(handoff) {
  return hasAnyKey(handoff, [
    "candidate_accounting",
    "candidate_coverage_status",
    "coverage_status",
    "source_coverage_status",
    "candidate_source_accounting"
  ]);
}

function warnInvalidStatuses({ value, warnings, label }) {
  for (const [path, status] of collectStatusFields(value)) {
    const text = String(status || "").trim().toUpperCase();
    if (text && !CONTROLLED_STATUS_VALUES.has(text)) warnings.push(`${label}_UNCONTROLLED_STATUS_VALUE:${path}:${text}`);
  }
}

function collectStatusFields(value, path = "$", out = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStatusFields(item, `${path}[${index}]`, out));
    return out;
  }
  if (!isPlainObject(value)) return out;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (/status$/i.test(key) && typeof child === "string") out.push([childPath, child]);
    else collectStatusFields(child, childPath, out);
  }
  return out;
}

function referencesUpstream(value) {
  const text = JSON.stringify(value || {});
  return /\b(P1|P2|P3|P4|P5|P6|source_discovery|target_profile|target_feature|legal_cartography|data_provenance|exposure_profile)\b/i.test(text);
}

function hasAnyKey(value, keys) {
  if (!isPlainObject(value)) return false;
  return keys.some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function validatePromptStackReadiness({ missingFiles = [] } = {}) {
  const missing = Array.isArray(missingFiles) ? missingFiles : [];
  return {
    ok: missing.length === 0,
    errors: missing.map((file) => `PROMPT_FILE_MISSING:${file}`),
    mechanical_only: true
  };
}
