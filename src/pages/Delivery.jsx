import PlaceholderPanel from "../components/PlaceholderPanel.jsx";

export default function Delivery() {
  return (
    <div className="page-stack">
      <PlaceholderPanel
        kicker="DELIVERY"
        title="Delivery Portal"
        description="Future responsibility: delivered draft packages, human review state, client package trail, and maintenance status."
      >
        <section className="panel-grid">
          <article className="quiet-panel">
            <span className="eyebrow">Future portal surfaces</span>
            <h3>Delivery Trail</h3>
            <p>
              Delivered packages, review state, client-facing package history, and internal
              status controls will live here once runtime implementation begins.
            </p>
          </article>
          <article className="quiet-panel">
            <span className="eyebrow">Internal bridge</span>
            <h3>Maintenance Monitor</h3>
            <p>
              Receives Horizon Scanner updates, compares new developments against delivered
              packages, and creates maintenance alerts.
            </p>
            <strong className="pending-line">
              Maintenance Monitor — fed by Horizon Scanner. Pending implementation.
            </strong>
          </article>
        </section>
      </PlaceholderPanel>
    </div>
  );
}
