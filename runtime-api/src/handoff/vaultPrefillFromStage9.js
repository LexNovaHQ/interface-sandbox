import {
  createEmptyVaultPrefill,
  createVaultSuggestion,
  setVaultPrefill
} from "./vaultCanonicalMap.js";

const ARCHETYPE_TO_PREFILL = Object.freeze({
  UNI: ["archetypes.is_generalist"],
  DOE: ["archetypes.is_doer"],
  ORC: ["archetypes.is_orchestrator"],
  CRT: ["archetypes.is_creator"],
  RDR: ["archetypes.is_reader"],
  CMP: ["archetypes.conversational_ui"],
  TRN: ["archetypes.sens_bio"],
  JDG: ["archetypes.is_judge", "archetypes.is_judge_hr", "archetypes.is_judge_legal"],
  OPT: ["archetypes.is_optimizer", "archetypes.sens_fin"],
  SHD: ["archetypes.is_shield"],
  MOV: ["archetypes.is_mover"]
});

const SURFACE_PREFILL_RULES = Object.freeze([
  { pattern: /personal data|privacy|data processing|data protection|subprocessor|PII/i, path: "compliance.processes_pii", value: "yes" },
  { pattern: /EU|GDPR|European/i, path: "compliance.eu_users", value: true },
  { pattern: /California|CCPA|CPRA/i, path: "compliance.ca_users", value: true },
  { pattern: /health|medical|patient/i, path: "compliance.sens_health", value: true },
  { pattern: /financial|finance|payment|credit|transaction/i, path: "compliance.sens_fin", value: true },
  { pattern: /employment|HR|hiring|employee/i, path: "compliance.sens_employment", value: true },
  { pattern: /minor|child|children|student/i, path: "compliance.minors", value: true },
  { pattern: /distress|crisis|vulnerable/i, path: "compliance.distress", value: true }
]);

const INTEGRATION_PREFILL_RULES = Object.freeze([
  { pattern: /slack/i, path: "baseline.integrations.slack" },
  { pattern: /salesforce|hubspot|crm/i, path: "baseline.integrations.crm" },
  { pattern: /stripe|payment/i, path: "baseline.integrations.stripe" },
  { pattern: /github/i, path: "baseline.integrations.github" },
  { pattern: /webhook|api event|callback/i, path: "baseline.integrations.webhooks" }
]);

const PROVIDER_PREFILL_RULES = Object.freeze([
  { pattern: /openai|gpt/i, path: "architecture.sub_processors.openai" },
  { pattern: /anthropic|claude/i, path: "architecture.sub_processors.anthropic" },
  { pattern: /google|gemini|vertex/i, path: "architecture.sub_processors.google" },
  { pattern: /cohere/i, path: "architecture.sub_processors.cohere" },
  { pattern: /mistral/i, path: "architecture.sub_processors.mistral" }
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getStage9ReportData(stage9ReportData) {
  return stage9ReportData?.report?.report_data
    || stage9ReportData?.report_data
    || stage9ReportData;
}

function text(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function joinSignalText(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  const parts = [];
  const add = (value) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach(add);
    else if (typeof value === "object") parts.push(text(value));
    else parts.push(String(value));
  };

  add(reportData?.matter_overview);
  add(reportData?.product_activity_profile);
  add(reportData?.legal_risk_surface_map);
  add(reportData?.legal_stack_control_review);
  add(reportData?.platform_legal_diligence);
  add(reportData?.exposure_findings?.consolidated_findings);
  add(reportData?.exposure_findings?.supporting_registry_rows);
  add(reportData?.forensic_ledger_appendix?.full_registry_ledger);

  return parts.join("\n");
}

function getRunRefs(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  const rows = asArray(reportData?.exposure_findings?.supporting_registry_rows);
  return rows.map((row) => row.registry_reference || row.threat_id || row.id).filter(Boolean).map(String);
}

function collectArchetypeCodes(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  const codes = new Set();
  const push = (value) => {
    const code = String(value || "").trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(code)) codes.add(code);
  };

  asArray(reportData?.product_activity_profile?.active_functional_profiles).forEach((item) => {
    push(item.code || item.profile || item.functional_profile || item);
  });

  asArray(reportData?.product_activity_profile?.product_feature_map).forEach((feature) => {
    String(feature.functional_profile || "").split(/[,/|;]/).forEach(push);
  });

  asArray(reportData?.exposure_findings?.supporting_registry_rows).forEach((row) => {
    push(row.functional_profile);
    push(String(row.registry_reference || row.threat_id || "").split("_")[0]);
  });

  asArray(reportData?.forensic_ledger_appendix?.full_registry_ledger).forEach((row) => {
    push(row.functional_profile);
    push(String(row.registry_reference || row.threat_id || "").split("_")[0]);
  });

  return [...codes];
}

function setIfPresent(prefill, fieldPath, value, basis, confidence, refs, warnings) {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return setVaultPrefill(prefill, fieldPath, createVaultSuggestion(value, basis, confidence, refs), warnings);
}

function deriveBaseline(stage9ReportData, prefill, warnings) {
  const reportData = getStage9ReportData(stage9ReportData);
  const refs = ["matter_overview", "product_activity_profile"];
  const matter = reportData?.matter_overview || {};
  const reportIdentity = matter.report_identity || {};
  const product = reportData?.product_activity_profile || {};
  const profile = product.product_profile || product.target_profile || product;

  const company = reportIdentity.target_or_client
    || matter.target_or_client
    || matter.target
    || profile.company_name
    || profile.company
    || reportData?.target_profile?.company_name;
  setIfPresent(prefill, "baseline.company", company, "Derived from Stage 9 matter overview / target profile.", "high", refs, warnings);

  const productName = reportIdentity.product_or_matter
    || matter.product_or_matter
    || matter.product
    || profile.product_name
    || profile.name
    || product.primary_product
    || product.product_name;
  if (productName) {
    setIfPresent(prefill, "baseline.products", [productName], "Derived from Stage 9 product activity profile.", "high", refs, warnings);
  }

  const jurisdiction = reportIdentity.jurisdictions || matter.jurisdictions || matter.jurisdiction || profile.jurisdiction || profile.hq_jurisdiction || {};
  if (typeof jurisdiction === "string") {
    setIfPresent(prefill, "baseline.jurisdiction.country", jurisdiction, "Derived from Stage 9 matter jurisdiction signal; founder should confirm exact legal jurisdiction.", "medium", refs, warnings);
  } else if (jurisdiction && typeof jurisdiction === "object") {
    setIfPresent(prefill, "baseline.jurisdiction.country", jurisdiction.country, "Derived from Stage 9 jurisdiction.country signal.", "medium", refs, warnings);
    setIfPresent(prefill, "baseline.jurisdiction.state", jurisdiction.state, "Derived from Stage 9 jurisdiction.state signal.", "medium", refs, warnings);
  }

  const market = profile.market || matter.market || product.market;
  setIfPresent(prefill, "baseline.market", market, "Derived from Stage 9 product / market profile.", "medium", refs, warnings);

  const signals = joinSignalText(reportData);
  if (/app|dashboard|interface|browser|web app|platform/i.test(signals)) {
    setIfPresent(prefill, "baseline.delivery.app", true, "Derived from public product activity indicating application/platform delivery.", "medium", refs, warnings);
  }
  if (/\bapi\b|developer docs|webhook|sdk|integration/i.test(signals)) {
    setIfPresent(prefill, "baseline.delivery.api", true, "Derived from public product activity indicating API/developer/integration surface.", "medium", refs, warnings);
  }
  if (/beta|early access|preview|waitlist|alpha|experimental/i.test(signals)) {
    setIfPresent(prefill, "baseline.has_beta", true, "Derived from public beta / preview / early-access signal.", "medium", refs, warnings);
  }

  INTEGRATION_PREFILL_RULES.forEach((rule) => {
    if (rule.pattern.test(signals)) {
      setIfPresent(prefill, rule.path, true, `Derived from Stage 9 public integration signal matching ${rule.pattern}.`, "medium", getRunRefs(reportData), warnings);
    }
  });
}

function deriveArchitecture(stage9ReportData, prefill, warnings) {
  const reportData = getStage9ReportData(stage9ReportData);
  const signals = joinSignalText(reportData);
  const refs = getRunRefs(reportData);

  PROVIDER_PREFILL_RULES.forEach((rule) => {
    if (rule.pattern.test(signals)) {
      setIfPresent(prefill, rule.path, true, `Derived from Stage 9 provider / subprocessor signal matching ${rule.pattern}.`, "medium", refs, warnings);
    }
  });

  if (/RAG|retrieval augmented generation|vector/i.test(signals)) {
    setIfPresent(prefill, "architecture.memory", "RAG", "Derived from retrieval / vector-memory signal in Stage 9 evidence.", "medium", refs, warnings);
  } else if (/stateless/i.test(signals)) {
    setIfPresent(prefill, "architecture.memory", "stateless", "Derived from stateless architecture signal in Stage 9 evidence.", "medium", refs, warnings);
  } else if (/fine[- ]?tuning/i.test(signals)) {
    setIfPresent(prefill, "architecture.memory", "fine-tuning", "Derived from fine-tuning architecture signal in Stage 9 evidence.", "medium", refs, warnings);
  }

  if (/self[- ]?hosted model/i.test(signals)) {
    setIfPresent(prefill, "architecture.models", "self-hosted", "Derived from self-hosted model signal in Stage 9 evidence.", "medium", refs, warnings);
  } else if (/third[- ]party model|model provider|subprocessor/i.test(signals)) {
    setIfPresent(prefill, "architecture.models", "third-party", "Derived from third-party model/provider signal in Stage 9 evidence.", "medium", refs, warnings);
  }
}

function deriveArchetypes(stage9ReportData, prefill, warnings) {
  collectArchetypeCodes(stage9ReportData).forEach((code) => {
    const paths = ARCHETYPE_TO_PREFILL[code] || [];
    paths.forEach((path) => {
      setIfPresent(prefill, path, true, `Derived from Stage 9 functional profile / registry reference ${code}.`, "high", getRunRefs(stage9ReportData), warnings);
    });
  });
}

function deriveCompliance(stage9ReportData, prefill, warnings) {
  const reportData = getStage9ReportData(stage9ReportData);
  const signals = joinSignalText(reportData);
  const refs = getRunRefs(reportData);

  SURFACE_PREFILL_RULES.forEach((rule) => {
    if (rule.pattern.test(signals)) {
      setIfPresent(prefill, rule.path, rule.value, `Derived from Stage 9 legal surface signal matching ${rule.pattern}.`, "medium", refs, warnings);
    }
  });

  if (!prefill.compliance.standard_adults && !/minor|child|children|student|health|medical|employment|financial|distress|crisis/i.test(signals)) {
    setIfPresent(prefill, "compliance.standard_adults", true, "No sensitive-user category signal was identified from Stage 9 public evidence; founder should confirm.", "low", ["platform_legal_diligence"], warnings);
  }
}

export function deriveVaultPrefillFromStage9(stage9ReportData, warnings = []) {
  const prefill = createEmptyVaultPrefill();
  const reportData = getStage9ReportData(stage9ReportData);

  deriveBaseline(reportData, prefill, warnings);
  deriveArchitecture(reportData, prefill, warnings);
  deriveArchetypes(reportData, prefill, warnings);
  deriveCompliance(reportData, prefill, warnings);

  return prefill;
}
