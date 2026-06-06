import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { AssemblyIntakePanel } from "../wrapper/assembly/index.js";

export default function Assembly() {
  return (
    <div className="page-stack">
      <PlaceholderPanel
        kicker="ASSEMBLY"
        title="Assembly Layer"
        description="Operational function: validated Diligence handoff -> Vault prefill review -> Vault confirmation answers -> canonical Vault payload -> document assembly."
      >
        <AssemblyIntakePanel handoffEnvelope={null} assemblyHandoff={null} />
      </PlaceholderPanel>
    </div>
  );
}
