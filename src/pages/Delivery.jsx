import { useEffect, useState } from "react";
import JsonDebugPanel from "../components/JsonDebugPanel.jsx";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { runDelivery } from "../lib/apiClient.js";
import { saveDeliveryState } from "../lib/localState.js";

export default function Delivery() {
  const [deliveryState, setDeliveryState] = useState(null);

  useEffect(() => {
    async function loadDeliveryState() {
      const payload = await runDelivery({});
      setDeliveryState(payload.data);
      saveDeliveryState(payload.data);
    }

    loadDeliveryState();
  }, []);

  const documents = deliveryState?.documents || [];
  const activityLog = deliveryState?.activity_log || [];

  return (
    <div className="page-stack">
      <PlaceholderPanel
        title="Synthetic Delivery / CRM"
        description="This layer will later coordinate review-ready bundles through a delivery workspace."
        input="Mock assembly output and synthetic matter metadata."
        output="Synthetic CRM state, delivery status, document list, and activity log."
      />

      <section className="tool-surface">
        <div className="status-grid">
          <StatusRow label="Matter ID" value={deliveryState?.matter_id} />
          <StatusRow label="Company" value={deliveryState?.company_name} />
          <StatusRow label="Diligence Report status" value={deliveryState?.diligence_report_status} />
          <StatusRow label="Vault status" value={deliveryState?.vault_status} />
          <StatusRow label="Draft Bundle status" value={deliveryState?.draft_bundle_status} />
          <StatusRow
            label="Counsel Review Required"
            value={deliveryState?.counsel_review_required ? "true" : "pending"}
          />
          <StatusRow label="Client Delivery Status" value={deliveryState?.client_delivery_status} />
        </div>
      </section>

      <section className="output-grid">
        <article className="output-panel">
          <h3>Documents</h3>
          <ul>
            {documents.map((document) => (
              <li key={document.id}>{document.title} - {document.status}</li>
            ))}
          </ul>
        </article>
        <article className="output-panel">
          <h3>Activity Log</h3>
          <ul>
            {activityLog.map((entry) => (
              <li key={entry.timestamp}>{entry.timestamp}: {entry.message}</li>
            ))}
          </ul>
        </article>
      </section>

      <JsonDebugPanel title="Synthetic delivery state" data={deliveryState} />
    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong>{value || "loading"}</strong>
    </div>
  );
}
