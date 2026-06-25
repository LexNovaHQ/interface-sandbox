const REQUIRED_TOP_LEVEL_KEYS = Object.freeze([
  "target_profile",
  "target_profile_forensics",
  "target_feature_profile",
  "target_feature_profile_forensics"
]);

const MODEL_LOCK_STATUSES = Object.freeze([
  "LOCKED",
  "LOCKED_WITH_LIMITATIONS",
  "REPAIR_REQUIRED",
  "CONTROLLED_FAILURE"
]);

const FORBIDDEN_KEYS = Object.freeze([
  "source_discovery_handoff",
  "legal_cartography_index",
  "data_provenance_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload",
  "screen_report_payload",
  "target_data_provenance_profile",
  "target_exposure_profile",
  "bucket_handoff",
  "discovered_route_inventory",
  "route_execution_ledger",
  "source_coverage_gates",
  "missing_limited_primary_sources"
]);

const FORBIDDEN_STRING_VALUES = Object.freeze([
  "<phase_output",
  "</phase_output>",
  "agent_2_target_feature",
  "agent_1_source_legal",
  "M6_M9",
  "bucket_handoff",
  "discovered_route_inventory",
  "route_execution_ledger",
  "source_coverage_gates",
  "missing_limited_primary_sources",
  "target_data_provenance_profile",
  "target_exposure_profile"
]);

const PLACEHOLDER_PATH_PATTERNS = Object.freeze([
  /target_profile\.tp_id_\d+/i,
  /target_feature_profile\.tf_id_\d+/i,
  /target_profile\.field_\d+/i,
  /target_feature_profile\.field_\d+/i
]);

const SOURCE_ID_PATTERN = /\b(?:T[0-4]|P[1-5]|D[1-5]|L[1-6])_[A-Z0-9_]+\.SRC\.\d{3}\b/g;
const URL_PATTERN = /https?:\/\/[^\s,"'<>\])}]+/g;

const URL_FIELDS = Object.freeze([
  "url",
  "source_url",
  "sourceUrl",
  "canonical_url",
  "canonicalUrl",
  "final_url",
  "finalUrl",
  "href",
  "source"
]);

const SOURCE_ID_FIELDS = Object.freeze([
  "source_id",
  "sourceId",
  "source_ref",
  "sourceRef",
  "source_artifact",
  "sourceArtifact",
  "id"
]);

export function validateM7M8TargetFeatureOutput(output, context = {}) {
  const failures = [];

  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return fail(["missing output object"]);
  }

  const keys = Object.keys(output);
  const missing = REQUIRED_TOP_LEVEL_KEYS.filter((key) => !(key in output));
  const extra = keys.filter((key) => !REQUIRED_TOP_LEVEL_KEYS.includes(key));

  if (missing.length) failures.push(`missing top-level keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`extra top-level keys: ${extra.join(",")}`);

  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!output[key] || typeof output[key] !== "object" || Array.isArray(output[key])) {
      failures.push(`${key} must be an object`);
    }
  }

  for (const forbidden of FORBIDDEN_KEYS) {
    if (containsKey(output, forbidden)) failures.push(`forbidden key present: ${forbidden}`);
  }

  for (const forbidden of FORBIDDEN_STRING_VALUES) {
    if (containsStringValue(output, forbidden)) failures.push(`forbidden stale reference present: ${forbidden}`);
  }

  for (const pattern of PLACEHOLDER_PATH_PATTERNS) {
    if (containsStringPattern(output, pattern)) failures.push(`placeholder path present: ${pattern.source}`);
  }

  validateArtifactLockStatus(output.target_profile, failures, "target_profile");
  validateArtifactLockStatus(output.target_feature_profile, failures, "target_feature_profile");
  validateFeatureArchetypeSignal(output.target_feature_profile, failures);
  validateForensicObjects(output, failures);
  validateSourceCustody(output, context.artifacts || {}, failures);

  return failures.length ? fail(failures) : { status: "PASS", failed_gates: [], repair_instructions: [] };
}

export function resolveM7M8LockStatus(output) {
  const statuses = [
    readArtifactStatus(output?.target_profile),
    readArtifactStatus(output?.target_feature_profile),
    readArtifactStatus(output?.target_profile_forensics),
    readArtifactStatus(output?.target_feature_profile_forensics)
  ].filter(Boolean);

  if (statuses.includes("CONTROLLED_FAILURE")) return "CONTROLLED_FAILURE";
  if (statuses.includes("REPAIR_REQUIRED")) return "REPAIR_REQUIRED";
  if (statuses.includes("LOCKED_WITH_LIMITATIONS")) return "LOCKED_WITH_LIMITATIONS";
  if (statuses.includes("LOCKED")) return "LOCKED";
  return "REPAIR_REQUIRED";
}

function validateArtifactLockStatus(artifact, failures, name) {
  const status = readArtifactStatus(artifact);
  if (!status) {
    failures.push(`${name} missing lock_status or validation_status`);
    return;
  }
  if (!MODEL_LOCK_STATUSES.includes(status)) {
    failures.push(`${name} invalid lock status: ${status}`);
  }
}

function readArtifactStatus(artifact) {
  if (!artifact || typeof artifact !== "object") return "";
  return artifact.lock_status || artifact.validation_status || artifact.status || "";
}

function validateFeatureArchetypeSignal(targetFeatureProfile, failures) {
  if (!targetFeatureProfile || typeof targetFeatureProfile !== "object") return;
  if (!containsKeyMatching(targetFeatureProfile, /archetype/i) && !containsStringPattern(targetFeatureProfile, /\b(UNI|DOE|JDG|CMP|CRT|RDR|ORC|TRN|SHD|OPT|MOV)\b/)) {
    failures.push("target_feature_profile missing archetype derivation signal");
  }
}

function validateForensicObjects(output, failures) {
  const targetForensics = output.target_profile_forensics;
  const featureForensics = output.target_feature_profile_forensics;
  if (!targetForensics || typeof targetForensics !== "object" || Array.isArray(targetForensics)) return;
  if (!featureForensics || typeof featureForensics !== "object" || Array.isArray(featureForensics)) return;

  if (!hasForensicSignal(targetForensics)) failures.push("target_profile_forensics missing forensic/provenance signal");
  if (!hasForensicSignal(featureForensics)) failures.push("target_feature_profile_forensics missing forensic/provenance signal");
}

function validateSourceCustody(output, artifacts, failures) {
  const sourceIndex = buildSourceIndex(artifacts);
  const emittedRefs = collectSourceReferenceObjects(output);

  if (!emittedRefs.length) return;

  if (!sourceIndex.size) {
    failures.push("source-aware validation could not build upstream source index from M7_M8 artifacts");
    return;
  }

  for (const ref of emittedRefs) {
    const sourceIds = unique(extractSourceIds(ref.value));
    if (!sourceIds.length) continue;

    const providedUrls = extractUrlsFromValue(ref.value);
    if (!providedUrls.length) {
      failures.push(`source reference missing source_url/source_urls at ${ref.path}: ${sourceIds.join(",")}`);
      continue;
    }

    for (const sourceId of sourceIds) {
      const upstream = sourceIndex.get(sourceId);
      if (!upstream) {
        failures.push(`unknown source_id not present in loaded upstream artifacts at ${ref.path}: ${sourceId}`);
        continue;
      }

      if (!upstream.urls.length) {
        failures.push(`upstream source_id has no URL available for validation: ${sourceId}`);
        continue;
      }

      const matched = providedUrls.some((url) => upstream.urls.some((known) => normalizeUrl(url) === normalizeUrl(known)));
      if (!matched) {
        failures.push(`source_id/source_url mismatch at ${ref.path}: ${sourceId} expected one of ${upstream.urls.join(" | ")} but got ${providedUrls.join(" | ")}`);
      }
    }
  }
}

function buildSourceIndex(artifacts) {
  const index = new Map();

  walk(artifacts, (value, path) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;

    const ids = unique(SOURCE_ID_FIELDS.flatMap((field) => extractSourceIds(value[field])));
    if (!ids.length) return;

    const urls = unique(URL_FIELDS.flatMap((field) => extractUrlsFromValue(value[field])));
    const title = firstString(value.title, value.page_title, value.source_title, value.document_title, value.name);

    for (const id of ids) {
      const existing = index.get(id) || { urls: [], titles: [], paths: [] };
      existing.urls = unique([...existing.urls, ...urls]);
      if (title) existing.titles = unique([...existing.titles, title]);
      existing.paths = unique([...existing.paths, path]);
      index.set(id, existing);
    }
  });

  return index;
}

function collectSourceReferenceObjects(output) {
  const refs = [];

  walk(output, (value, path) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const serialized = JSON.stringify(value);
    const sourceIds = extractSourceIds(serialized);
    if (!sourceIds.length) return;

    const hasStructuredSourceField = Object.keys(value).some((key) => /source(_|-)?(id|ref|artifact|url|urls)/i.test(key));
    const hasFreeTextSourceId = Object.values(value).some((item) => typeof item === "string" && extractSourceIds(item).length);

    if (hasStructuredSourceField || hasFreeTextSourceId) {
      refs.push({ path, value });
    }
  });

  return refs;
}

function extractSourceIds(value) {
  if (typeof value === "string") return value.match(SOURCE_ID_PATTERN) || [];
  if (Array.isArray(value)) return value.flatMap((item) => extractSourceIds(item));
  if (value && typeof value === "object") return Object.values(value).flatMap((item) => extractSourceIds(item));
  return [];
}

function extractUrlsFromValue(value) {
  if (typeof value === "string") return value.match(URL_PATTERN) || [];
  if (Array.isArray(value)) return value.flatMap((item) => extractUrlsFromValue(item));
  if (value && typeof value === "object") return Object.values(value).flatMap((item) => extractUrlsFromValue(item));
  return [];
}

function normalizeUrl(value) {
  return String(value || "")
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function hasForensicSignal(value) {
  return containsKeyMatching(value, /(source|evidence|forensic|derivation|provenance|ledger|confidence)/i);
}

function fail(failures) {
  return {
    status: "REPAIR_REQUIRED",
    failed_gates: failures,
    repair_instructions: [
      "Return exactly target_profile, target_profile_forensics, target_feature_profile, and target_feature_profile_forensics.",
      "Use backend artifact names only, include lock_status or validation_status on target_profile and target_feature_profile, include feature archetype derivation, and do not emit upstream/downstream artifacts or XML phase blocks.",
      "Every emitted source_id/source_ref/source_artifact containing a *.SRC.NNN value must include a matching source_url/source_urls copied from the loaded upstream artifact. Do not relabel, reorder, or remap source IDs."
    ]
  };
}

function walk(value, visitor, path = "$") {
  visitor(value, path);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    walk(item, visitor, `${path}.${key}`);
  }
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  return Object.values(value).some((item) => containsKey(item, key));
}

function containsKeyMatching(value, pattern) {
  if (!value || typeof value !== "object") return false;
  return Object.keys(value).some((key) => pattern.test(key)) || Object.values(value).some((item) => containsKeyMatching(item, pattern));
}

function containsStringValue(value, needle) {
  if (typeof value === "string") return value.includes(needle);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => containsStringValue(item, needle));
}

function containsStringPattern(value, pattern) {
  if (typeof value === "string") return pattern.test(value);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => containsStringPattern(item, pattern));
}
