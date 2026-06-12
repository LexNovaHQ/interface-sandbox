const CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);
const TRI_STATE = new Set(["true", "false", "unknown"]);
const DATA_ORIGINS = new Set(["user_provided", "customer_provided", "third_party_source", "public_web", "system_generated", "unknown"]);
const DATA_SUBJECTS = new Set(["user", "customer", "employee", "consumer", "developer", "child", "business_entity", "unknown"]);
const DATA_CATEGORIES = new Set(["prompt", "account", "contact", "uploaded_file", "generated_output", "audio", "text", "document", "image", "video", "code", "api_payload", "payment", "usage_log", "support", "sensitive", "unknown"]);
const AUTONOMY = new Set(["none", "draft", "recommend", "execute", "unknown"]);
const HUMAN_REVIEW = new Set(["required", "optional", "not_visible", "unknown"]);
const INT_EXT = new Set(["internal", "external", "both", "unknown"]);
const HINT_TYPE = new Set(["memory", "model_provider", "cloud_host", "vector_db", "subprocessor", "integration", "unknown"]);
const HINT_DISPOSITION = new Set(["prefill_candidate", "confirmation_only", "ignore"]);
const SURFACES = new Set(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);

function norm(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[_\s-]+/g, " ");
}

function addLimitation(profile, path, reason, original, repaired) {
  if (!profile || typeof profile !== "object") return;
  if (!Array.isArray(profile.limitations)) profile.limitations = [];
  const warning = `GUARDRAIL_WARNING ${path}: schema enum drift repaired before AJV {"reason":"${reason}","original":${JSON.stringify(original)},"repaired":${JSON.stringify(repaired)}}`;
  if (!profile.limitations.includes(warning)) profile.limitations.push(warning);
}

function note(notes, profile, path, reason, original, repaired) {
  if (original === repaired) return;
  notes.push(`${reason}:${path}:${JSON.stringify(original)}=>${JSON.stringify(repaired)}`);
  addLimitation(profile, path, reason, original, repaired);
}

function fromSet(value, allowed, fallback = "unknown") {
  if (allowed.has(value)) return value;
  const lowered = norm(value);
  for (const item of allowed) if (norm(item) === lowered) return item;
  return fallback;
}

function confidence(value) {
  if (CONFIDENCE.has(value)) return value;
  const lowered = norm(value);
  if (lowered.includes("high")) return "high";
  if (lowered.includes("medium")) return "medium";
  if (lowered.includes("low")) return "low";
  return "unknown";
}

function triState(value) {
  if (TRI_STATE.has(value)) return value;
  if (value === true || /^(yes|true|present|available|supported)$/i.test(String(value || "").trim())) return "true";
  if (value === false || /^(no|false|absent|unavailable|unsupported)$/i.test(String(value || "").trim())) return "false";
  return "unknown";
}

function dataSubject(value) {
  if (DATA_SUBJECTS.has(value)) return value;
  const lowered = norm(value);
  if (lowered.includes("employee") || lowered.includes("worker") || lowered.includes("staff")) return "employee";
  if (lowered.includes("developer")) return "developer";
  if (lowered.includes("child") || lowered.includes("minor")) return "child";
  if (lowered.includes("business") || lowered.includes("company") || lowered.includes("enterprise") || lowered.includes("merchant")) return "business_entity";
  if (lowered.includes("customer") || lowered.includes("client")) return "customer";
  if (lowered.includes("consumer")) return "consumer";
  if (lowered.includes("end user") || lowered.includes("enduser") || lowered.includes("user")) return "user";
  return "unknown";
}

function dataOrigin(value) {
  if (DATA_ORIGINS.has(value)) return value;
  const lowered = norm(value);
  if (lowered.includes("customer") || lowered.includes("enterprise")) return "customer_provided";
  if (lowered.includes("user")) return "user_provided";
  if (lowered.includes("third party") || lowered.includes("external")) return "third_party_source";
  if (lowered.includes("public") || lowered.includes("web")) return "public_web";
  if (lowered.includes("system") || lowered.includes("generated")) return "system_generated";
  return "unknown";
}

function dataCategory(value) {
  if (DATA_CATEGORIES.has(value)) return value;
  const lowered = norm(value);
  if (lowered.includes("audio") || lowered.includes("voice") || lowered.includes("speech")) return "audio";
  if (lowered.includes("prompt") || lowered.includes("input")) return "prompt";
  if (lowered.includes("account")) return "account";
  if (lowered.includes("contact") || lowered.includes("email") || lowered.includes("phone")) return "contact";
  if (lowered.includes("upload") || lowered.includes("file")) return "uploaded_file";
  if (lowered.includes("output") || lowered.includes("transcript") || lowered.includes("generated")) return "generated_output";
  if (lowered.includes("document") || lowered.includes("pdf") || lowered.includes("ocr")) return "document";
  if (lowered.includes("image") || lowered.includes("vision")) return "image";
  if (lowered.includes("video")) return "video";
  if (lowered.includes("code") || lowered.includes("sdk")) return "code";
  if (lowered.includes("api") || lowered.includes("payload")) return "api_payload";
  if (lowered.includes("payment") || lowered.includes("billing")) return "payment";
  if (lowered.includes("usage") || lowered.includes("log") || lowered.includes("analytics")) return "usage_log";
  if (lowered.includes("support") || lowered.includes("ticket")) return "support";
  if (lowered.includes("sensitive") || lowered.includes("pii") || lowered.includes("biometric")) return "sensitive";
  if (lowered.includes("text")) return "text";
  return "unknown";
}

function surfaceToken(value) {
  if (SURFACES.has(value)) return value;
  const lowered = norm(value);
  if (lowered.includes("consumer") || lowered.includes("public")) return "Consumer-Public";
  if (lowered.includes("enterprise") || lowered.includes("private")) return "Enterprise-Private";
  if (lowered.includes("pii") || lowered.includes("personal")) return "PII";
  if (lowered.includes("employment") || lowered.includes("employee")) return "Employment";
  if (lowered.includes("sensitive") || lowered.includes("biometric")) return "Sensitive/Biometric";
  if (lowered.includes("financial") || lowered.includes("payment") || lowered.includes("loan") || lowered.includes("bank")) return "Financial";
  if (lowered.includes("content") || lowered.includes("ip") || lowered.includes("copyright")) return "Content&IP";
  if (lowered.includes("safety") || lowered.includes("physical")) return "Safety&Physical";
  if (lowered.includes("infra") || lowered.includes("security")) return "Infrastructure";
  if (lowered.includes("minor") || lowered.includes("child")) return "Minors";
  return null;
}

function repairField(obj, key, base, notes, profile, fn, reason) {
  if (!obj || typeof obj !== "object" || obj[key] == null) return;
  const original = obj[key];
  const repaired = fn(original);
  obj[key] = repaired;
  note(notes, profile, `${base}/${key}`, reason, original, repaired);
}

function repairDataEntry(entry, base, notes, profile) {
  repairField(entry, "data_origin", base, notes, profile, dataOrigin, "repaired_data_origin_enum");
  repairField(entry, "data_subject", base, notes, profile, dataSubject, "repaired_data_subject_enum");
  repairField(entry, "data_category", base, notes, profile, dataCategory, "repaired_data_category_enum");
  repairField(entry, "confidence", base, notes, profile, confidence, "repaired_confidence_enum");
}

export function repairTargetFeatureProfileForSchema(profile) {
  const notes = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return { repaired: false, repair_notes: notes };

  if (profile.feature_profile_version && profile.feature_profile_version !== "feature_profile_v2") {
    const original = profile.feature_profile_version;
    profile.feature_profile_version = "feature_profile_v2";
    note(notes, profile, "/feature_profile_version", "repaired_feature_profile_version", original, profile.feature_profile_version);
  }

  const features = Array.isArray(profile.feature_inventory) ? profile.feature_inventory : [];
  features.forEach((feature, featureIndex) => {
    if (!feature || typeof feature !== "object") return;
    const base = `/feature_inventory/${featureIndex}`;
    repairField(feature, "feature_role", base, notes, profile, (value) => String(value || "").toLowerCase().includes("secondary") ? "SECONDARY" : "CORE", "repaired_feature_role_enum");
    repairField(feature, "autonomy_level", base, notes, profile, (value) => fromSet(value, AUTONOMY), "repaired_autonomy_level_enum");
    repairField(feature, "human_review_signal", base, notes, profile, (value) => fromSet(value, HUMAN_REVIEW), "repaired_human_review_signal_enum");
    repairField(feature, "external_action_signal", base, notes, profile, triState, "repaired_external_action_signal_enum");
    repairField(feature, "confidence", base, notes, profile, confidence, "repaired_confidence_enum");

    if (feature.delivery_channels && typeof feature.delivery_channels === "object") {
      for (const channel of ["app", "api", "web"]) repairField(feature.delivery_channels, channel, `${base}/delivery_channels`, notes, profile, triState, `repaired_delivery_${channel}_enum`);
    }

    if (Array.isArray(feature.data_provenance)) feature.data_provenance.forEach((entry, index) => repairDataEntry(entry, `${base}/data_provenance/${index}`, notes, profile));
    for (const listKey of ["archetype_provenance", "surface_provenance"]) {
      if (Array.isArray(feature[listKey])) feature[listKey].forEach((entry, index) => repairField(entry, "confidence", `${base}/${listKey}/${index}`, notes, profile, confidence, "repaired_confidence_enum"));
    }

    if (Array.isArray(feature.surface_tokens)) {
      feature.surface_tokens = feature.surface_tokens.map((token, index) => {
        const repaired = surfaceToken(token) || token;
        note(notes, profile, `${base}/surface_tokens/${index}`, "repaired_surface_token_enum", token, repaired);
        return repaired;
      }).filter((token) => SURFACES.has(token));
    }
  });

  if (Array.isArray(profile.data_provenance_map)) profile.data_provenance_map.forEach((entry, index) => repairDataEntry(entry, `/data_provenance_map/${index}`, notes, profile));
  if (Array.isArray(profile.regulated_surface_map)) profile.regulated_surface_map.forEach((entry, index) => {
    const base = `/regulated_surface_map/${index}`;
    repairField(entry, "surface_token", base, notes, profile, (value) => surfaceToken(value) || "PII", "repaired_surface_token_enum");
    repairField(entry, "int_ext_classification", base, notes, profile, (value) => fromSet(value, INT_EXT), "repaired_int_ext_classification_enum");
    repairField(entry, "confidence", base, notes, profile, confidence, "repaired_confidence_enum");
  });
  if (Array.isArray(profile.architecture_hints)) profile.architecture_hints.forEach((entry, index) => {
    const base = `/architecture_hints/${index}`;
    repairField(entry, "hint_type", base, notes, profile, (value) => fromSet(value, HINT_TYPE), "repaired_hint_type_enum");
    repairField(entry, "disposition", base, notes, profile, (value) => fromSet(value, HINT_DISPOSITION, "confirmation_only"), "repaired_disposition_enum");
    repairField(entry, "confidence", base, notes, profile, confidence, "repaired_confidence_enum");
  });

  if (profile.vault_feature_candidates && typeof profile.vault_feature_candidates === "object" && Object.prototype.hasOwnProperty.call(profile.vault_feature_candidates, "architecture")) {
    delete profile.vault_feature_candidates.architecture;
    if (!Array.isArray(profile.limitations)) profile.limitations = [];
    const warning = "GUARDRAIL_WARNING /vault_feature_candidates/architecture: architecture candidates are not emitted by Stage 5 and were stripped before AJV";
    if (!profile.limitations.includes(warning)) profile.limitations.push(warning);
    notes.push("stripped_vault_architecture_candidates_before_schema_validation");
  }

  return { repaired: notes.length > 0, repair_notes: notes };
}
