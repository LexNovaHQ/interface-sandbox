import DiligenceLiveConsole from "../diligence-live/DiligenceLiveConsole.jsx";

export default function Diligence({ onNavigate }) {
  return (
    <div className="page-stack">
      <DiligenceLiveConsole onNavigate={onNavigate} />
    </div>
  );
}
