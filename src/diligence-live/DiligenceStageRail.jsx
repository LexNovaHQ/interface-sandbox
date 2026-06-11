const STAGE_LABELS = [
  ["live_run", "Live Run"],
  ["source_discovery", "Source Discovery"],
  ["source_capture", "Source Capture"],
  ["reviewer_document_source", "Document Source"],
  ["company_profile", "Company Profile"],
  ["target_feature_profile", "Product Profile"],
  ["legal_stack_review", "Legal Stack"],
  ["registry_ledger_evaluation", "Registry Review"],
  ["operator_challenge", "Operator Challenge"],
  ["stage9_report", "DD Report"],
  ["html_report", "HTML Report"],
  ["stage10_handoff", "Vault Handoff"]
];

function statusFor(stage, entries) {
  const matches = entries.filter((entry) => entry.stage === stage);
  if (!matches.length) return "pending";
  return matches[matches.length - 1].status || "pending";
}

export default function DiligenceStageRail({ entries = [], running = false }) {
  return (
    <div className="live-stage-rail" aria-label="Live diligence stage status">
      {STAGE_LABELS.map(([stage, label]) => {
        const status = statusFor(stage, entries);
        return (
          <div key={stage} className={`live-stage-pill live-stage-pill--${status}`}>
            <span className="live-stage-dot" />
            <span>{label}</span>
          </div>
        );
      })}
      {running && <div className="live-stage-note">Run in progress. Keep this tab open.</div>}
    </div>
  );
}
