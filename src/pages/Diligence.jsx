import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { DiligenceReportRenderer } from "../wrapper/diligence/report/index.js";

export default function Diligence() {
  return (
    <div className="page-stack">
      <PlaceholderPanel
        kicker="DILIGENCE"
        title="Diligence Layer"
        description="Operational function: public source input -> source collection -> feature classification -> registry evaluation -> validated diligence report -> Node 5B handoff."
      >
        <DiligenceReportRenderer compilerOutput={null} />
      </PlaceholderPanel>
    </div>
  );
}
