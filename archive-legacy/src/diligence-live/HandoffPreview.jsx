function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function countPrefillGroups(prefill = {}) {
  return Object.fromEntries(Object.entries(prefill || {}).map(([group, fields]) => [group, Object.keys(fields || {}).length]));
}

export default function HandoffPreview({ handoff = null }) {
  if (!handoff) {
    return (
      <div className="live-empty-panel">
        The Review-Ready Remediation Handoff will appear here after the live run completes.
      </div>
    );
  }

  const assembly = handoff.assembly_handoff || {};
  const route = assembly.assembly_route_recommendation || {};
  const prefillCounts = countPrefillGroups(assembly.vault_prefill_suggestions || {});

  return (
    <div className="handoff-preview-grid">
      <div className="handoff-card">
        <span className="handoff-label">Target</span>
        <strong>{assembly.target_profile?.company_name || "Review target"}</strong>
        <small>{assembly.target_profile?.primary_url || "Document-led review"}</small>
      </div>
      <div className="handoff-card">
        <span className="handoff-label">Features</span>
        <strong>{asArray(assembly.feature_map).length}</strong>
        <small>feature map items</small>
      </div>
      <div className="handoff-card">
        <span className="handoff-label">Findings</span>
        <strong>{asArray(assembly.threat_findings).length}</strong>
        <small>handoff findings</small>
      </div>
      <div className="handoff-card">
        <span className="handoff-label">Questions</span>
        <strong>{asArray(assembly.vault_confirmation_questions).length}</strong>
        <small>Vault confirmation questions</small>
      </div>
      <div className="handoff-card handoff-card--wide">
        <span className="handoff-label">Vault Prefill Suggestions</span>
        <div className="prefill-counts">
          {Object.entries(prefillCounts).map(([group, count]) => (
            <span key={group}>{group}: {count}</span>
          ))}
        </div>
      </div>
      <div className="handoff-card handoff-card--wide">
        <span className="handoff-label">Remediation Route</span>
        <div className="prefill-counts">
          <span>Roadmap: {asArray(route.remediation_roadmap).length}</span>
          <span>Document routes: {asArray(route.document_routes).length}</span>
          <span>Control routes: {asArray(route.control_routes).length}</span>
        </div>
      </div>
    </div>
  );
}
