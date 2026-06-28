const GROUPS = Object.freeze({
  AI_OUTPUT: ["output", "generated", "hallucination", "model response", "content generation", "api output"],
  AGENTIC: ["agent", "autonomous", "workflow", "orchestration", "tool call", "delegate", "action"],
  BIOMETRIC: ["biometric", "voiceprint", "speaker", "diarization", "face", "fingerprint", "vocal", "voice biometric"],
  CONSENT_UI: ["signup", "checkout", "consent", "clickwrap", "checkbox", "assent", "purchase", "subscribe", "renewal", "cancel", "mobile"],
  CONTENT_INGESTION: ["scrape", "crawl", "corpus", "training data", "publisher", "copyright", "dataset", "third-party content", "rag", "retrieval"],
  CONTROL_GAP: ["no standalone", "missing", "lacks", "does not", "not found", "absent", "no evidence", "not visible", "not publicly"],
  DIRECT_LEGAL: ["terms", "privacy", "dpa", "trust", "policy", "security", "published", "last modified", "source", "http"],
  FRAUD_CLAIMS: ["claim", "marketing", "deceptive", "misleading", "guarantee", "accuracy", "benchmark", "promise"],
  GOVERNANCE: ["aup", "ai use policy", "acceptable use", "subprocessor", "incident", "breach", "retention", "deletion", "cert-in", "dpa"],
  HIGH_STAKES: ["health", "medical", "credit", "employment", "hiring", "education", "housing", "insurance", "government", "criminal", "benefit"],
  JURISDICTION: ["illinois", "bipa", "texas", "colorado", "california", "cpra", "ccpa", "new york", "ny gbl", "rosca", "sebi", "eu ai act", "gdpr", "european union"],
  PERSONAL_DATA: ["personal data", "personal information", "pii", "user data", "voice biometric", "sensitive", "processor", "fiduciary", "privacy"],
  PHYSICAL: ["robot", "physical", "vehicle", "device", "field", "sensor", "real world", "embodied"],
  SECURITY: ["security", "encryption", "access", "incident", "vulnerability", "soc", "iso", "logging", "retention"],
  TRADING: ["trading", "securities", "investment", "market", "broker", "portfolio", "algo", "financial advice", "sebi"],
  TRANSFORMATIVE_USE: ["translation", "dubbing", "voice", "document", "digitisation", "ocr", "summary", "transcription"]
});

const PROFILES = Object.freeze({
  AGENTIC_CONTROL: { groups: ["AGENTIC", "CONTROL_GAP"], absenceAllowed: false, speculationSensitive: true },
  BIOMETRIC_STRICT: { groups: ["BIOMETRIC", "JURISDICTION", "CONTROL_GAP"], absenceAllowed: false, speculationSensitive: true },
  CONSENT_UI_DIRECT: { groups: ["CONSENT_UI", "CONTROL_GAP"], absenceAllowed: false, speculationSensitive: true },
  CONTENT_RIGHTS_DIRECT: { groups: ["CONTENT_INGESTION", "CONTROL_GAP"], absenceAllowed: false, speculationSensitive: true },
  FRAUD_DIRECT: { groups: ["FRAUD_CLAIMS", "DIRECT_LEGAL"], absenceAllowed: false, speculationSensitive: false },
  GOVERNANCE_GAP: { groups: ["GOVERNANCE", "CONTROL_GAP"], absenceAllowed: true, speculationSensitive: false },
  HIGH_STAKES_DECISION: { groups: ["HIGH_STAKES", "CONTROL_GAP"], absenceAllowed: false, speculationSensitive: true },
  OUTPUT_CONTROL: { groups: ["AI_OUTPUT", "CONTROL_GAP"], absenceAllowed: false, speculationSensitive: false },
  PERSONAL_DATA_CONTROL: { groups: ["PERSONAL_DATA", "CONTROL_GAP"], absenceAllowed: false, speculationSensitive: false },
  PHYSICAL_AI: { groups: ["PHYSICAL", "CONTROL_GAP"], absenceAllowed: false, speculationSensitive: true },
  SECURITY_GAP: { groups: ["SECURITY", "CONTROL_GAP"], absenceAllowed: true, speculationSensitive: false },
  TRADING_DIRECT: { groups: ["TRADING", "CONTROL_GAP"], absenceAllowed: false, speculationSensitive: true },
  TRANSFORMATIVE_OUTPUT: { groups: ["TRANSFORMATIVE_USE", "AI_OUTPUT"], absenceAllowed: false, speculationSensitive: false }
});

const STANDARD_BY_THREAT_ID = Object.freeze({
  TRN_BIO_001: "BIOMETRIC_STRICT", TRN_BIO_002: "BIOMETRIC_STRICT", TRN_BIO_003: "BIOMETRIC_STRICT", TRN_BIO_004: "BIOMETRIC_STRICT",
  UNI_CNS_001: "CONSENT_UI_DIRECT", UNI_CNS_002: "CONSENT_UI_DIRECT", UNI_CNS_003: "CONSENT_UI_DIRECT", UNI_CNS_004: "CONSENT_UI_DIRECT", UNI_CNS_005: "CONSENT_UI_DIRECT", UNI_CNS_006: "CONSENT_UI_DIRECT", UNI_CNS_007: "CONSENT_UI_DIRECT", UNI_CNS_IN1: "CONSENT_UI_DIRECT", UNI_CNS_IN2: "CONSENT_UI_DIRECT",
  JDG_DEC_001: "HIGH_STAKES_DECISION", JDG_DEC_002: "HIGH_STAKES_DECISION", JDG_DEC_003: "HIGH_STAKES_DECISION", JDG_DEC_004: "HIGH_STAKES_DECISION", JDG_DEC_005: "HIGH_STAKES_DECISION", JDG_DEC_006: "HIGH_STAKES_DECISION", JDG_DEC_007: "HIGH_STAKES_DECISION", JDG_DEC_008: "HIGH_STAKES_DECISION", JDG_DEC_009: "HIGH_STAKES_DECISION", JDG_DEC_010: "HIGH_STAKES_DECISION", JDG_DEC_LB1: "HIGH_STAKES_DECISION", JDG_DEC_LB2: "HIGH_STAKES_DECISION", JDG_DEC_LB3: "HIGH_STAKES_DECISION",
  UNI_DEC_001: "HIGH_STAKES_DECISION", UNI_DEC_IN1: "HIGH_STAKES_DECISION",
  DOE_FIN_001: "TRADING_DIRECT", OPT_TRD_001: "TRADING_DIRECT", OPT_TRD_002: "TRADING_DIRECT", OPT_TRD_003: "TRADING_DIRECT", OPT_TRD_004: "TRADING_DIRECT",
  JDG_FRD_001: "FRAUD_DIRECT", UNI_FRD_001: "FRAUD_DIRECT", UNI_FRD_002: "FRAUD_DIRECT", UNI_FRD_LB1: "FRAUD_DIRECT",
  DOE_HAL_001: "OUTPUT_CONTROL", DOE_HAL_002: "OUTPUT_CONTROL", UNI_HAL_001: "OUTPUT_CONTROL", UNI_HAL_002: "OUTPUT_CONTROL", UNI_HAL_003: "OUTPUT_CONTROL", UNI_HAL_004: "OUTPUT_CONTROL",
  CMP_HRM_001: "HIGH_STAKES_DECISION", CMP_HRM_002: "HIGH_STAKES_DECISION", CMP_HRM_003: "HIGH_STAKES_DECISION", CMP_HRM_004: "HIGH_STAKES_DECISION", CMP_HRM_005: "HIGH_STAKES_DECISION", CMP_HRM_006: "HIGH_STAKES_DECISION", CMP_HRM_007: "HIGH_STAKES_DECISION", JDG_HRM_001: "HIGH_STAKES_DECISION", JDG_HRM_002: "HIGH_STAKES_DECISION",
  CRT_INF_001: "CONTENT_RIGHTS_DIRECT", CRT_INF_002: "CONTENT_RIGHTS_DIRECT", CRT_INF_003: "CONTENT_RIGHTS_DIRECT", CRT_INF_004: "CONTENT_RIGHTS_DIRECT", CRT_INF_005: "CONTENT_RIGHTS_DIRECT", CRT_INF_LB1: "CONTENT_RIGHTS_DIRECT", RDR_INF_001: "CONTENT_RIGHTS_DIRECT", RDR_INF_002: "CONTENT_RIGHTS_DIRECT", RDR_INF_003: "CONTENT_RIGHTS_DIRECT",
  UNI_INF_001: "SECURITY_GAP", UNI_INF_002: "SECURITY_GAP", UNI_INF_003: "SECURITY_GAP", UNI_INF_004: "SECURITY_GAP", UNI_INF_IN1: "SECURITY_GAP",
  DOE_LIA_002: "OUTPUT_CONTROL", DOE_LIA_003: "OUTPUT_CONTROL", DOE_LIA_007: "OUTPUT_CONTROL", MOV_LIA_001: "PHYSICAL_AI", MOV_LIA_002: "PHYSICAL_AI", ORC_LIA_001: "AGENTIC_CONTROL", SHD_LIA_001: "AGENTIC_CONTROL", SHD_LIA_002: "AGENTIC_CONTROL", SHD_LIA_003: "AGENTIC_CONTROL", SHD_LIA_004: "AGENTIC_CONTROL", SHD_LIA_LB1: "AGENTIC_CONTROL",
  UNI_LIA_001: "OUTPUT_CONTROL", UNI_LIA_002: "OUTPUT_CONTROL", UNI_LIA_004: "OUTPUT_CONTROL", UNI_LIA_005: "OUTPUT_CONTROL", UNI_LIA_006: "OUTPUT_CONTROL", UNI_LIA_LB1: "GOVERNANCE_GAP",
  DOE_PRV_001: "PERSONAL_DATA_CONTROL", ORC_PRV_001: "PERSONAL_DATA_CONTROL", ORC_PRV_002: "GOVERNANCE_GAP", ORC_PRV_003: "PERSONAL_DATA_CONTROL", RDR_PRV_001: "PERSONAL_DATA_CONTROL", RDR_PRV_002: "PERSONAL_DATA_CONTROL", RDR_PRV_LB1: "PERSONAL_DATA_CONTROL", UNI_PRV_001: "PERSONAL_DATA_CONTROL", UNI_PRV_002: "PERSONAL_DATA_CONTROL", UNI_PRV_003: "PERSONAL_DATA_CONTROL", UNI_PRV_IN1: "PERSONAL_DATA_CONTROL", UNI_PRV_IN2: "PERSONAL_DATA_CONTROL", UNI_PRV_IN3: "PERSONAL_DATA_CONTROL", UNI_PRV_IN4: "GOVERNANCE_GAP", UNI_PRV_IN5: "PERSONAL_DATA_CONTROL"
});

export function evaluateThreatTriggerStandard({ threatId, evidenceText, absenceOnly = false, speculative = false }) {
  const profileName = STANDARD_BY_THREAT_ID[threatId] || profileFromThreatId(threatId);
  const profile = PROFILES[profileName] || PROFILES.OUTPUT_CONTROL;
  const text = String(evidenceText || "").toLowerCase();
  const reasons = [];

  for (const groupName of profile.groups) {
    const markers = GROUPS[groupName] || [];
    if (!markers.some((marker) => text.includes(marker))) reasons.push(`TRIGGER_STANDARD_MISSING_${groupName}`);
  }

  if (absenceOnly && !profile.absenceAllowed) reasons.push("TRIGGER_STANDARD_REJECTS_ABSENCE_ONLY");
  if (speculative && profile.speculationSensitive) reasons.push("TRIGGER_STANDARD_REJECTS_SPECULATION");

  return { profile: profileName, pass: reasons.length === 0, reasons };
}

export function countThreatStandards() {
  return Object.keys(STANDARD_BY_THREAT_ID).length;
}

function profileFromThreatId(threatId) {
  if (/^[A-Z]{3}_BIO_/.test(threatId)) return "BIOMETRIC_STRICT";
  if (/^[A-Z]{3}_CNS_/.test(threatId)) return "CONSENT_UI_DIRECT";
  if (/^[A-Z]{3}_DEC_/.test(threatId) || /^[A-Z]{3}_HRM_/.test(threatId)) return "HIGH_STAKES_DECISION";
  if (/^[A-Z]{3}_TRD_/.test(threatId) || /^[A-Z]{3}_FIN_/.test(threatId)) return "TRADING_DIRECT";
  if (/^[A-Z]{3}_INF_/.test(threatId)) return "CONTENT_RIGHTS_DIRECT";
  if (/^[A-Z]{3}_PRV_/.test(threatId)) return "PERSONAL_DATA_CONTROL";
  if (/^[A-Z]{3}_LIA_/.test(threatId)) return "OUTPUT_CONTROL";
  return "OUTPUT_CONTROL";
}
