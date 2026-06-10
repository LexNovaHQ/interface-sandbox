function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function unique(values = []) {
  return [...new Set(values.map((value) => asText(value)).filter(Boolean))];
}

const FAMILY_MAP = {
  BIO: {
    order: 10,
    title: "Voice / Biometric Processing Exposure",
    category: "Voice, biometric and sensitive-data controls",
    description:
      "Exposure items in this family relate to voice, audio, biometric, consent, retention, deletion, or identity-related controls identified in the reviewed evidence."
  },
  CNS: {
    order: 20,
    title: "Consent, Consumer Rights & User Notice Exposure",
    category: "Consent, notice and consumer-rights controls",
    description:
      "Exposure items in this family relate to consent, notice, user rights, deletion, opt-out, or public-facing control disclosures."
  },
  DEC: {
    order: 30,
    title: "Decision-Support / Automated Review Exposure",
    category: "Decision-support and review controls",
    description:
      "Exposure items in this family relate to decision-support, automated review, human oversight, appeals, or outcome-reliance controls."
  },
  FRD: {
    order: 40,
    title: "AI Misrepresentation / Fraud Reliance Exposure",
    category: "Misrepresentation and reliance controls",
    description:
      "Exposure items in this family relate to public claims, user reliance, misrepresentation, impersonation, or fraud-adjacent AI uses."
  },
  HAL: {
    order: 50,
    title: "AI Output Reliability & Reliance Exposure",
    category: "Output reliability and reliance controls",
    description:
      "Exposure items in this family relate to hallucination, output reliance, human review, accuracy disclaimers, or downstream action based on AI outputs."
  },
  HRM: {
    order: 60,
    title: "Human Review / Employment-Adjacent Exposure",
    category: "Human review and employment-adjacent controls",
    description:
      "Exposure items in this family relate to human review, employment-adjacent workflows, employee monitoring, or workplace AI-use controls."
  },
  INF: {
    order: 70,
    title: "IP, Content & Training-Data Exposure",
    category: "IP, content and training-data controls",
    description:
      "Exposure items in this family relate to content, copyright, training data, output ownership, third-party materials, or IP allocation controls."
  },
  LIA: {
    order: 80,
    title: "Liability Allocation & Customer Reliance Exposure",
    category: "Liability allocation and customer-reliance controls",
    description:
      "Exposure items in this family relate to contractual responsibility, warranties, disclaimers, user reliance, damages allocation, or customer-facing commitments."
  },
  PRV: {
    order: 90,
    title: "Privacy, Processing & Downstream Provider Exposure",
    category: "Privacy, processing and downstream-provider controls",
    description:
      "Exposure items in this family relate to personal data, processors, subprocessors, model providers, data transfers, deletion, training use, or processing transparency."
  },
  TRD: {
    order: 100,
    title: "Transparency / Disclosure Exposure",
    category: "Transparency and disclosure controls",
    description:
      "Exposure items in this family relate to public disclosure, transparency, customer notice, provenance, or traceability controls."
  }
};

const DEFAULT_FAMILY = {
  order: 999,
  title: "General Legal Exposure Items",
  category: "General exposure controls",
  description:
    "Exposure items in this family are grouped because they were identified by the Legal Exposure Registry but do not fall into a more specific visible issue family."
};

function familyCodeFromReference(reference = "") {
  const parts = asText(reference).split("_").filter(Boolean);
  if (parts.length >= 2) return parts[1].toUpperCase();
  return "GEN";
}

function severitySortKey(item) {
  const tier = asText(item?.severity?.tier);
  const tierRank = { T1: 1, T2: 2, T3: 3, T4: 4, T5: 5 }[tier] || 99;
  const urgency = asText(item?.timing_urgency?.raw);
  const urgencyRank = { ACTIVE_NOW: 1, THIS_YEAR: 2, INCOMING: 3, WATCH: 4 }[urgency] || 99;
  return tierRank * 100 + urgencyRank;
}

function highestPriority(items = []) {
  return [...items].sort((a, b) => severitySortKey(a) - severitySortKey(b))[0] || null;
}

function mergedAuthorities(items = []) {
  const keys = ["IN", "EU", "US"];
  const out = {};
  for (const key of keys) {
    out[key] = unique(items.map((item) => item?.jurisdictional_references?.[key]).filter(Boolean));
  }
  return out;
}

function buildGroupSummary({ family, items }) {
  const surfaces = unique(items.flatMap((item) => item.legal_risk_surfaces || []));
  const profiles = unique(items.map((item) => item.functional_profile?.label));
  const severity = highestPriority(items)?.severity?.label || "Severity not specified";
  return `${family.description} The group includes ${items.length} supporting registry exposure item(s), with highest recorded severity of ${severity}. Active surface(s): ${surfaces.slice(0, 4).join(", ") || "not specified"}. Functional profile(s): ${profiles.slice(0, 4).join(", ") || "not specified"}.`;
}

function buildGroupImpact({ items }) {
  const categories = unique(items.map((item) => item.severity?.category));
  const priorityDocs = unique(items.flatMap((item) => {
    const text = asText(item.suggested_remediation_path);
    const matches = [];
    for (const label of [
      "Terms of Service",
      "Privacy Policy",
      "Data Processing Addendum",
      "Acceptable Use Policy",
      "Service Level Agreement",
      "AI / Agent Governance Terms",
      "IP / Output Ownership Terms",
      "Internal Governance SOP",
      "Human Review / Handover Protocol",
      "Data Protection Impact Assessment"
    ]) {
      if (text.includes(label)) matches.push(label);
    }
    return matches;
  }));
  return `This family should be reviewed for ${categories.slice(0, 3).join(", ") || "legal exposure"}. Suggested remediation review should focus on ${priorityDocs.slice(0, 5).join(", ") || "the relevant policy, contract, governance, and customer-facing control documents"}.`;
}

export function groupIdentifiedExposures(items = []) {
  const groups = new Map();
  for (const item of asArray(items)) {
    const familyCode = familyCodeFromReference(item.registry_reference);
    const family = FAMILY_MAP[familyCode] || DEFAULT_FAMILY;
    if (!groups.has(familyCode)) {
      groups.set(familyCode, { familyCode, family, items: [] });
    }
    groups.get(familyCode).items.push(item);
  }

  return [...groups.values()]
    .map((group) => {
      const items = [...group.items].sort((a, b) => severitySortKey(a) - severitySortKey(b));
      const lead = highestPriority(items);
      const highestSeverity = lead?.severity || null;
      const highestTimingUrgency = lead?.timing_urgency || null;
      const surfaces = unique(items.flatMap((item) => item.legal_risk_surfaces || []));
      const profiles = unique(items.map((item) => item.functional_profile?.label));
      const refs = unique(items.map((item) => item.registry_reference));
      return {
        consolidated_finding_id: `CF-${String(group.family.order).padStart(3, "0")}`,
        exposure_family_code: group.familyCode,
        exposure_title: group.family.title,
        exposure_category: group.family.category,
        assessment_outcome: "Identified Exposure Family",
        supporting_registry_item_count: items.length,
        supporting_registry_references: refs,
        highest_severity: highestSeverity,
        highest_timing_urgency: highestTimingUrgency,
        severity: highestSeverity,
        timing_urgency: highestTimingUrgency,
        legal_risk_surfaces: surfaces,
        functional_profiles: profiles,
        jurisdictional_references: mergedAuthorities(items),
        consolidated_summary: buildGroupSummary({ family: group.family, items }),
        commercial_deal_impact: buildGroupImpact({ items }),
        suggested_remediation_path: buildGroupImpact({ items }),
        representative_items: items.slice(0, 5).map((item) => ({
          registry_reference: item.registry_reference,
          exposure_title: item.exposure_title,
          severity: item.severity?.label,
          timing_urgency: item.timing_urgency?.label,
          control_position: item.control_position
        })),
        supporting_registry_rows: items.map((item) => ({
          registry_reference: item.registry_reference,
          exposure_title: item.exposure_title,
          severity: item.severity?.label,
          timing_urgency: item.timing_urgency?.label,
          legal_risk_surfaces: item.legal_risk_surfaces,
          control_position: item.control_position,
          suggested_remediation_path: item.suggested_remediation_path
        }))
      };
    })
    .sort((a, b) => {
      const aKey = (a.highest_severity?.tier ? severitySortKey({ severity: a.highest_severity, timing_urgency: a.highest_timing_urgency }) : 9999);
      const bKey = (b.highest_severity?.tier ? severitySortKey({ severity: b.highest_severity, timing_urgency: b.highest_timing_urgency }) : 9999);
      if (aKey !== bKey) return aKey - bKey;
      return a.exposure_title.localeCompare(b.exposure_title);
    })
    .map((group, index) => ({
      ...group,
      consolidated_finding_id: `CF-${String(index + 1).padStart(3, "0")}`
    }));
}
