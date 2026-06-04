export default function StatusPill({ tone = "ready", children }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}
