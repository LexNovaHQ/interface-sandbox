const LEGAL_FAMILY_PREFIX = "lossless_family__L";

export function collectLegalSignalSourceRows({ artifacts = {} } = {}) {
  const rows = [];
  for (const [artifact_name, artifact] of Object.entries(artifacts || {})) {
    if (!isLegalSignalArtifactReadable(artifact_name)) continue;
    collectRowsFromValue({ rows, artifact_name, value: unwrapArtifact(artifact), path: artifact_name, depth: 0 });
  }
  return dedupeRows(rows);
}

export function collectRowsFromValue({ rows, artifact_name, value, path, depth }) {
  if (depth > 8 || value == null) return;
  if (typeof value === "string") {
    const clean = cleanText(value);
    if (clean) rows.push(makeTextRow({ artifact_name, path, text: clean }));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectRowsFromValue({ rows, artifact_name, value: item, path: `${path}[${index}]`, depth: depth + 1 }));
    return;
  }
  if (typeof value !== "object") return;

  const objectText = directTextFromObject(value);
  if (objectText) rows.push(makeTextRow({ artifact_name, path, text: objectText, source: value }));

  for (const [key, child] of Object.entries(value)) {
    if (key === "question_id" || key === "reviewer_question" || key === "question_rows" || key === "question_index") continue;
    collectRowsFromValue({ rows, artifact_name, value: child, path: `${path}.${key}`, depth: depth + 1 });
  }
}

export function directTextFromObject(value = {}) {
  const parts = [];
  const preferredKeys = [
    "text",
    "clean_text",
    "raw_text",
    "body",
    "content",
    "excerpt",
    "snippet",
    "heading",
    "title",
    "section_title",
    "unit_title",
    "unit_heading",
    "path",
    "heading_path",
    "label",
    "name",
    "url",
    "source_url",
    "status",
    "limitation",
    "source_corpus_status"
  ];
  for (const key of preferredKeys) {
    if (typeof value[key] === "string" && value[key].trim()) parts.push(value[key]);
    if (Array.isArray(value[key])) parts.push(value[key].filter((item) => typeof item === "string").join(" > "));
  }
  return cleanText(parts.join("\n"));
}

export function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001f]+/g, " ")
    .trim();
}

export function shortExcerpt(text, terms = []) {
  const clean = cleanText(text);
  if (!clean) return "";
  const lower = clean.toLowerCase();
  const matchTerm = terms.map((term) => String(term || "").toLowerCase()).find((term) => term && lower.includes(term));
  const index = matchTerm ? Math.max(0, lower.indexOf(matchTerm) - 90) : 0;
  return clean.slice(index, index + 260).trim();
}

export function filterRowsByTerms(rows = [], terms = []) {
  const normalized = terms.map((term) => String(term || "").toLowerCase()).filter(Boolean);
  if (!normalized.length) return rows;
  return rows.filter((row) => normalized.some((term) => `${row.path} ${row.text}`.toLowerCase().includes(term)));
}

export function unwrapArtifact(artifact) {
  if (!artifact || typeof artifact !== "object") return artifact;
  if (artifact.artifact && typeof artifact.artifact === "object") return artifact.artifact;
  if (artifact.data && typeof artifact.data === "object") return artifact.data;
  if (artifact.payload && typeof artifact.payload === "object") return artifact.payload;
  return artifact;
}

function isLegalSignalArtifactReadable(artifactName) {
  return artifactName === "legal_cartography_deterministic_map" ||
    artifactName === "legal_cartography_semantic_profile" ||
    artifactName === "legal_cartography_index" ||
    artifactName.startsWith(LEGAL_FAMILY_PREFIX);
}

function makeTextRow({ artifact_name, path, text, source = {} }) {
  return {
    artifact_name,
    path,
    text,
    source_url: source.source_url || source.url || source.href || "",
    document_name: source.document_name || source.document_title || source.title || source.name || "",
    unit_id: source.unit_id || source.section_id || source.id || "",
    source_status: source.source_corpus_status || source.status || ""
  };
}

function dedupeRows(rows = []) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = `${row.artifact_name}|${row.path}|${row.text.slice(0, 300)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}
