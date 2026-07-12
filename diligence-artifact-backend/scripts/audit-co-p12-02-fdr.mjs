import fs from "node:fs";
import yaml from "js-yaml";

const source = "references/registry/Diligence_Field_Derivation_Registry.yml";
const parsed = yaml.load(fs.readFileSync(source, "utf8")) || {};
const fields = Array.isArray(parsed.fields) ? parsed.fields : [];
const countBy = (pick) => Object.fromEntries([...fields.reduce((map, row) => {
  const key = String(pick(row) ?? "").trim() || "<empty>";
  map.set(key, (map.get(key) || 0) + 1);
  return map;
}, new Map()).entries()].sort(([a], [b]) => a.localeCompare(b)));
const families = {};
for (const row of fields) {
  const section = String(row.profile_section || "<empty>");
  if (!families[section]) families[section] = {};
  const family = String(row.field_family || "<empty>");
  families[section][family] = (families[section][family] || 0) + 1;
}
for (const section of Object.keys(families)) families[section] = Object.fromEntries(Object.entries(families[section]).sort(([a], [b]) => a.localeCompare(b)));
const output = {
  registry: parsed.registry || {},
  parsed_row_count: fields.length,
  profile_sections: countBy((row) => row.profile_section),
  modes: countBy((row) => row.mode),
  lock_statuses: countBy((row) => row.lock_status),
  prefixes: countBy((row) => String(row.field_id || "").split(".")[0]),
  field_families_by_section: Object.fromEntries(Object.entries(families).sort(([a], [b]) => a.localeCompare(b))),
  rows: fields.map((row) => ({
    field_id: row.field_id,
    profile_section: row.profile_section,
    field_family: row.field_family,
    output_field: row.output_field,
    mode: row.mode,
    lock_status: row.lock_status
  }))
};
fs.writeFileSync("co-p12-02-fdr-audit.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ parsed_row_count: fields.length, profile_sections: output.profile_sections, prefixes: output.prefixes }, null, 2));
