export default function JsonDebugPanel({ title = "Mock payload", data }) {
  if (!data) return null;

  return (
    <section className="json-panel">
      <div className="section-title-row">
        <h3>{title}</h3>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
