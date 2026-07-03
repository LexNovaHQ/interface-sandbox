import { safeObject } from "./report-safe-language.js";

export const M10_CONTACT_CONSENT_SECTION_VERSION = "m10_contact_consent_section_v1";

const REVIEW_NOTE = "These are M10 material derivation values for qualified review. Confirm any private or account-only flows before QR reliance.";

export function buildM10ContactConsentSubsection(dataProvenanceProfile = {}) {
  const profile = safeObject(dataProvenanceProfile);
  const contactRoutes = firstNested(profile.privacy_governance_contact_accountability_signals, "contact_routes") || notEmitted("contact_routes");
  const consentManager = firstNested(profile.consent_withdrawal_controls, "consent_manager_readiness") || notEmitted("consent_manager_readiness");
  const readiness = readinessRow(profile.law_regulatory_readiness_matrix, "consent_manager_readiness");

  return {
    subsection_id: "privacy_contact_consent_manager_readiness",
    subsection_title: "Privacy Contact & Consent Manager Readiness",
    fields: [
      {
        field_id: "contact_routes",
        label: "Privacy contact routes",
        value: contactRoutes,
        source_artifact: "data_provenance_profile",
        source_path: "privacy_governance_contact_accountability_signals[].contact_routes",
        limitation: "Public-footprint contact-route values require qualified review before QR reliance.",
        qualified_review_note: REVIEW_NOTE,
        technical_refs: { qr_row: "QR-005", registry_fields: ["DAP.CONTACT.001", "DAP.CONTACT.002", "DAP.CONTACT.003", "DAP.CONTACT.004", "DAP.CONTACT.005"] }
      },
      {
        field_id: "consent_manager_readiness",
        label: "Consent Manager readiness",
        value: consentManager,
        source_artifact: "data_provenance_profile",
        source_path: "consent_withdrawal_controls[].consent_manager_readiness",
        limitation: "Consent Manager readiness is a review signal only; it is not a legal applicability or compliance conclusion.",
        qualified_review_note: REVIEW_NOTE,
        technical_refs: { qr_row: "QR-057", registry_fields: ["DAP.CM.001", "DAP.CM.002", "DAP.CM.003", "DAP.CM.004", "DAP.CM.005", "DAP.CM.006", "DAP.CM.007"] }
      },
      {
        field_id: "consent_manager_readiness_row",
        label: "Consent Manager readiness matrix row",
        value: readiness,
        source_artifact: "data_provenance_profile",
        source_path: "law_regulatory_readiness_matrix[]",
        limitation: "Readiness matrix row is for qualified review only and must not be treated as a legal conclusion.",
        qualified_review_note: REVIEW_NOTE,
        technical_refs: { qr_row: "QR-057", registry_fields: ["DAP.CM.*", "DAP.READY.*"] }
      }
    ]
  };
}

function firstNested(rows, key) {
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row && typeof row === "object" && row[key] && typeof row[key] === "object") return row[key];
  }
  return null;
}

function readinessRow(rows, area) {
  return (Array.isArray(rows) ? rows : []).find((row) => String(row?.readiness_area || "").toLowerCase() === area) || {
    readiness_area: area,
    public_evidence_status: "Not emitted by current M10 profile.",
    counsel_review_note: "Confirm during qualified review.",
    downstream_use_limit: "Readiness only; no legal conclusion."
  };
}

function notEmitted(name) {
  return {
    material_object: name,
    status: "Not emitted by current M10 profile.",
    limitation: "Run M10 with the contact/consent-manager addendum active, then confirm during qualified review."
  };
}
