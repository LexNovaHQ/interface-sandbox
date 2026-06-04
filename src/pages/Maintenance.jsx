import { useEffect, useState } from "react";
import JsonDebugPanel from "../components/JsonDebugPanel.jsx";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { runMaintenance } from "../lib/apiClient.js";
import { saveMaintenanceRun } from "../lib/localState.js";

export default function Maintenance() {
  const [maintenanceRun, setMaintenanceRun] = useState(null);

  useEffect(() => {
    async function loadMaintenanceRun() {
      const payload = await runMaintenance({});
      setMaintenanceRun(payload.data);
      saveMaintenanceRun(payload.data);
    }

    loadMaintenanceRun();
  }, []);

  const coverage = maintenanceRun?.coverage || { covered: [], upcoming: [], exposed: [] };

  return (
    <div className="page-stack">
      <PlaceholderPanel
        title="Maintenance Radar"
        description="This engine will later compare new AI governance threats against active document coverage."
        input="Active document stack and new public regulatory or threat signal."
        output="Coverage comparison, recommended update route, and synthetic notification state."
      />

      <section className="tool-surface">
        <div className="section-title-row">
          <h2>Sample New Threat</h2>
          <span>{maintenanceRun?.new_threat?.severity || "loading"}</span>
        </div>
        <p>{maintenanceRun?.new_threat?.summary || "Loading mock maintenance run..."}</p>
      </section>

      <section className="output-grid">
        <article className="output-panel">
          <h3>Active Document Stack</h3>
          <p>Terms of Service route, Data Processing Addendum route, Acceptable Use Policy route.</p>
        </article>
        <article className="output-panel">
          <h3>Coverage Comparison</h3>
          <p>Covered: {coverage.covered.join(", ") || "none"}</p>
          <p>Upcoming: {coverage.upcoming.join(", ") || "none"}</p>
          <p>Exposed: {coverage.exposed.join(", ") || "none"}</p>
        </article>
        <article className="output-panel">
          <h3>Recommended Update Route</h3>
          <ul>
            {(maintenanceRun?.recommended_update_route || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="output-panel">
          <h3>Notification Status</h3>
          <p>{maintenanceRun?.notification_status || "Synthetic client/admin notifications pending."}</p>
        </article>
      </section>

      <JsonDebugPanel title="Mock maintenance output" data={maintenanceRun} />
    </div>
  );
}
