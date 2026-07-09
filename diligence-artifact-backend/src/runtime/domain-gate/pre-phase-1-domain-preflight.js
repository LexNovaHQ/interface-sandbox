import { buildActiveRunPackageManifestV0 } from "./active-run-package-manifest.schema.js";
import { buildDomainSelectionProfileSchemaDefaults } from "./domain-selection-profile.schema.js";
import { loadDomainPackageKeyV0, loadPackageCatalogV0 } from "./package-catalog.loader.js";
import { validatePrePhase1DomainPreflight } from "./domain-preflight.validator.js";

const DOMAIN_ALIASES = Object.freeze({
  ai: "ai-governance",
  "ai governance": "ai-governance",
  "ai-governance": "ai-governance",
  artificialintelligence: "ai-governance",
  saas: "saas",
  software: "saas",
  fintech: "fintech",
  finance: "fintech",
  lending: "fintech",
  underwriting: "fintech",
  payments: "fintech",
  health: "healthtech",
  healthcare: "healthtech",
  healthtech: "healthtech",
  hr: "hrtech",
  hiring: "hrtech",
  recruitment: "hrtech",
  hrtech: "hrtech",
  legal: "legaltech",
  legaltech: "legaltech",
  edtech: "edtech",
  education: "edtech",
  marketplace: "marketplace",
  ecommerce: "ecommerce",
  "e-commerce": "ecommerce",
  cyber: "cybersecurity",
  cybersecurity: "cybersecurity",
  devtools: "developer-tools",
  "developer tools": "developer-tools",
  data: "data-infrastructure",
  "data infrastructure": "data-infrastructure",
  enterprise: "enterprise-software",
  consumer: "consumer-app",
  other: "other-technology",
  unknown: "unknown"
});

const PRIMARY_KEYWORDS = Object.freeze([
  ["fintech", ["lending", "loan", "credit", "underwriting", "banking", "payment", "wallet", "insurance", "brokerage"]],
  ["healthtech", ["health", "medical", "clinic", "patient", "diagnosis", "triage", "therapy", "hospital"]],
  ["hrtech", ["hiring", "recruit", "candidate", "employee", "workforce", "talent", "hr "]],
  ["legaltech", ["contract", "legal", "lawyer", "clause", "e-discovery", "ediscovery", "compliance scanner"]],
  ["edtech", ["education", "student", "learning", "school", "course", "tutor"]],
  ["marketplace", ["marketplace", "buyers", "sellers", "vendors", "matching"]],
  ["ecommerce", ["commerce", "shop", "storefront", "checkout", "retail"]],
  ["cybersecurity", ["security", "threat", "vulnerability", "soc", "malware", "zero trust"]],
  ["developer-tools", ["developer", "api", "sdk", "devtool", "git", "repository"]],
  ["data-infrastructure", ["data warehouse", "etl", "pipeline", "database", "lakehouse", "analytics infrastructure"]],
  ["enterprise-software", ["enterprise software", "workflow", "crm", "erp", "operations platform"]],
  ["consumer-app", ["consumer app", "mobile app", "social app", "personal assistant"]],
  ["ai-governance", ["ai governance", "model risk", "ai compliance", "ai safety", "model evaluation", "llm evaluation", "ai audit", "ai agent", "model deployment"]]
]);

const AI_CAPABILITY_TERMS = Object.freeze([" ai ", "artificial intelligence", "llm", "model", "agent", "prediction", "classification", "ranking", "generation", "summarization", "embedding", "automated scoring", "computer vision", "speech recognition"]);
const REGULATORY_TERMS = Object.freeze([
  ["privacy", ["privacy", "personal data", "data protection", "user data"]],
  ["gdpr", ["gdpr", "europe", "eu users"]],
  ["india-dpdp", ["dpdp", "india data protection"]],
  ["india-it-act", ["it act", "intermediary"]],
  ["eu-ai-act", ["eu ai act", "high-risk ai", "ai act"]],
  ["hipaa", ["hipaa", "phi", "health information"]],
  ["financial-services", ["banking", "lending", "credit", "payment", "financial"]],
  ["employment", ["employee", "candidate", "hiring", "workforce"]],
  ["consumer-protection", ["consumer", "customer", "subscription", "refund"]]
]);

export async function runPrePhase1DomainPreflight({ run = {} } = {}) {
  await loadDomainPackageKeyV0();
  const catalog = await loadPackageCatalogV0();
  const now = new Date().toISOString();
  const profile = buildDomainSelectionProfileSchemaDefaults({ run, catalog, now });
  const manifest = buildActiveRunPackageManifestV0({ run, catalog, now });
  applyTargetInput(profile, run);
  applyUserIntake(profile, run);
  profile.provisional_primary_domain_candidates = buildPrimaryCandidates({ profile, catalog });
  profile.provisional_capability_overlay_candidates = buildCapabilityCandidates({ profile, catalog });
  profile.provisional_regulatory_overlay_candidates = buildRegulatoryCandidates({ profile, catalog });
  profile.discovery_hints = buildDiscoveryHints(profile);
  validatePrePhase1DomainPreflight({ domain_selection_profile: profile, active_run_package_manifest: manifest, catalog });
  return {
    ok: true,
    hook_name: "pre_phase_1_domain_preflight",
    output: {
      domain_selection_profile: profile,
      active_run_package_manifest: manifest
    },
    validation: profile.validation
  };
}

function applyTargetInput(profile, run) {
  const raw = String(run.root_url || run.target || run.target_url || "").trim();
  profile.target_input.raw_target_url = raw || null;
  if (!raw) {
    profile.target_input.input_validation_status = "WARN";
    profile.target_input.input_warnings.push("missing target URL at preflight");
    return;
  }
  try {
    const normalized = normalizeRootUrl(raw);
    const host = new URL(normalized).hostname.replace(/^www\./, "");
    profile.target_input.normalized_target_url = normalized;
    profile.target_input.target_host = host;
    profile.target_input.input_validation_status = "PASS";
  } catch (error) {
    profile.target_input.input_validation_status = "WARN";
    profile.target_input.input_warnings.push(`target URL normalization warning: ${error.message}`);
  }
}

function applyUserIntake(profile, run) {
  const rawDomain = firstNonEmpty(run.user_declared_primary_domain, run.user_declared_domain, run.primary_domain, run.domain, run.domain_hint, run.intake_domain);
  const description = firstNonEmpty(run.product_or_company_description, run.product_description, run.company_description, run.description, run.target_description);
  const jurisdiction = firstNonEmpty(run.jurisdiction_hint, run.jurisdiction, run.region_hint);
  const customer = firstNonEmpty(run.customer_segment_hint, run.customer_segment, run.customer_hint);
  const regulated = firstNonEmpty(run.regulated_activity_hint, run.regulatory_hint, run.regulated_activity);
  profile.user_intake.declared_primary_domain_raw = rawDomain || null;
  profile.user_intake.declared_primary_domain_normalized = normalizeDeclaredDomain(rawDomain);
  profile.user_intake.product_or_company_description = description || null;
  profile.user_intake.jurisdiction_hint = jurisdiction || null;
  profile.user_intake.customer_segment_hint = customer || null;
  profile.user_intake.regulated_activity_hint = regulated || null;
  const filled = [rawDomain, description, jurisdiction, customer, regulated].filter(Boolean).length;
  profile.user_intake.intake_completeness = filled === 0 ? "NONE" : filled >= 2 ? "SUFFICIENT" : "PARTIAL";
}

function buildPrimaryCandidates({ profile, catalog }) {
  const candidates = new Map();
  const normalized = profile.user_intake.declared_primary_domain_normalized;
  if (normalized && catalog.primary_domain_packages.includes(normalized)) addCandidate(candidates, normalized, "primary_domain_package", "declared primary domain normalized from intake", [profile.user_intake.declared_primary_domain_raw].filter(Boolean));
  const haystack = intakeHaystack(profile);
  for (const [packageId, terms] of PRIMARY_KEYWORDS) {
    const matched = terms.filter((term) => haystack.includes(term));
    if (matched.length && catalog.primary_domain_packages.includes(packageId)) addCandidate(candidates, packageId, "primary_domain_package", "intake term match only; source evidence required after Phase 1", matched);
  }
  if (!candidates.size && catalog.primary_domain_packages.includes("unknown")) addCandidate(candidates, "unknown", "primary_domain_package", "no supported intake domain signal; source discovery must remain agnostic", []);
  return [...candidates.values()].sort(sortCandidates);
}

function buildCapabilityCandidates({ profile, catalog }) {
  const candidates = new Map();
  const haystack = ` ${intakeHaystack(profile)} `;
  const aiMatches = AI_CAPABILITY_TERMS.filter((term) => haystack.includes(term));
  if (aiMatches.length && catalog.capability_overlays.includes("ai-native")) addCandidate(candidates, "ai-native", "capability_overlay", "intake AI/mechanism term only; activity-level evidence required after Phase 5", aiMatches);
  for (const [packageId, terms] of [
    ["payments", ["payment", "wallet", "checkout"]],
    ["biometrics", ["biometric", "face", "fingerprint", "voiceprint"]],
    ["identity-verification", ["identity verification", "kyc", "id verification"]],
    ["location-tracking", ["location", "geofence", "gps"]],
    ["children-minors", ["children", "minor", "student", "kids"]],
    ["marketplace-matching", ["matching", "marketplace"]],
    ["cross-border-data-transfer", ["cross-border", "international transfer", "global users"]]
  ]) {
    const matched = terms.filter((term) => haystack.includes(term));
    if (matched.length && catalog.capability_overlays.includes(packageId)) addCandidate(candidates, packageId, "capability_overlay", "intake capability term only; source/activity evidence required later", matched);
  }
  return [...candidates.values()].sort(sortCandidates);
}

function buildRegulatoryCandidates({ profile, catalog }) {
  const candidates = new Map();
  const haystack = intakeHaystack(profile);
  for (const [packageId, terms] of REGULATORY_TERMS) {
    const matched = terms.filter((term) => haystack.includes(term));
    if (matched.length && catalog.regulatory_overlays.includes(packageId)) addCandidate(candidates, packageId, "regulatory_overlay", "intake regulatory hint only; applicability evidence required before Phase 7", matched);
  }
  if ((profile.user_intake.jurisdiction_hint || profile.user_intake.regulated_activity_hint) && catalog.regulatory_overlays.includes("privacy")) addCandidate(candidates, "privacy", "regulatory_overlay", "jurisdiction or regulated-activity hint present; source evidence required", []);
  return [...candidates.values()].sort(sortCandidates);
}

function buildDiscoveryHints(profile) {
  const hints = [];
  if (profile.provisional_capability_overlay_candidates.some((candidate) => candidate.package_id === "ai-native")) hints.push(doNotMissHint("do_not_miss_ai_mechanics", "Check whether official product pages describe AI, model, agent, scoring, automation, generation, ranking, classification, moderation, speech, vision, embedding, or governance functionality."));
  if (profile.provisional_primary_domain_candidates.some((candidate) => ["fintech", "healthtech", "hrtech", "legaltech"].includes(candidate.package_id)) || profile.provisional_regulatory_overlay_candidates.length) hints.push(doNotMissHint("do_not_miss_regulated_activity", "Check whether official pages indicate financial, health, employment, legal, consumer, privacy, or cross-border data activity."));
  hints.push(doNotMissHint("preserve_agnostic_source_discovery", "Run Source Discovery broadly across homepage, product, docs, pricing, legal, privacy, security, trust, app/workflow, and public profile signals. Do not narrow or exclude sources from provisional candidates."));
  return hints;
}

function doNotMissHint(hintId, suggestedFocus) {
  return {
    hint_id: hintId,
    hint_type: "DO_NOT_MISS",
    suggested_focus: suggestedFocus,
    source_basis: "user_intake_declaration",
    may_expand_discovery: true,
    may_narrow_discovery: false,
    may_exclude_sources: false
  };
}

function addCandidate(map, packageId, packageType, reason, matchedTerms) {
  if (!map.has(packageId)) {
    map.set(packageId, {
      package_id: packageId,
      package_type: packageType,
      status: "PROVISIONAL",
      basis: "user_intake_declaration",
      matched_terms: [...new Set((matchedTerms || []).filter(Boolean))],
      negative_terms_checked: [],
      forbidden_sole_signals_checked: [],
      lock_allowed: false,
      reason
    });
    return;
  }
  const existing = map.get(packageId);
  existing.matched_terms = [...new Set([...existing.matched_terms, ...(matchedTerms || []).filter(Boolean)])];
}

function normalizeDeclaredDomain(value) {
  const raw = normalizeText(value);
  if (!raw) return null;
  const compact = raw.replace(/[^a-z0-9]/g, "");
  return DOMAIN_ALIASES[raw] || DOMAIN_ALIASES[compact] || raw.replaceAll("_", "-").replaceAll(" ", "-");
}

function intakeHaystack(profile) {
  return normalizeText([
    profile.user_intake.declared_primary_domain_raw,
    profile.user_intake.product_or_company_description,
    profile.user_intake.jurisdiction_hint,
    profile.user_intake.customer_segment_hint,
    profile.user_intake.regulated_activity_hint
  ].filter(Boolean).join(" "));
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[\n\r\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeRootUrl(input) {
  const value = String(input || "").trim();
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);
  url.hash = "";
  if (url.pathname === "") url.pathname = "/";
  return url.toString();
}

function firstNonEmpty(...values) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function sortCandidates(a, b) {
  if (a.package_id === "unknown") return 1;
  if (b.package_id === "unknown") return -1;
  return a.package_id.localeCompare(b.package_id);
}
