import PlaceholderPanel from "../components/PlaceholderPanel.jsx";

const taxonomyExamples = [
  "new rule",
  "draft consultation",
  "enforcement",
  "advisory",
  "case law"
];

export default function Horizon() {
  return (
    <div className="page-stack">
      <PlaceholderPanel
        kicker="HORIZON"
        title="Horizon Scanner"
        description="Future responsibility: fixed TMT/regulatory source list -> scrape/extract/classify legal developments -> write to sheet/database -> feed Maintenance."
      >
        <section className="document-shell">
          <div className="section-title-row">
            <h3>Taxonomy Examples</h3>
            <span>Runtime pending</span>
          </div>
          <div className="taxonomy-list">
            {taxonomyExamples.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      </PlaceholderPanel>
    </div>
  );
}
