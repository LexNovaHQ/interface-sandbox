import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const tokens = [
  'normalized_section__',
  'normalized-profiler-m9-section6-v4',
  'compiler-m9-section6-v3',
  'runCompilerPhase2G',
  'COMPILER_PHASE2G',
  'normalized_report_manifest',
  'review_ready_section_handoff',
  'NORMALIZED_SECTION_ARTIFACT_NAMES',
  'NORMALIZED_COMPILER_ARTIFACT_NAMES',
  'normalized_section_artifacts_only'
];
const excluded = new Set(['node_modules', '.git']);
const extensions = new Set(['.js', '.mjs', '.json', '.md', '.yml', '.yaml', '.html']);
const rows = [];
walk(root);
fs.writeFileSync('co-p12-05-legacy-audit.json', JSON.stringify({ tokens, rows }, null, 2) + '\n');
console.log(JSON.stringify({ match_count: rows.length, files: [...new Set(rows.map(r => r.file))].length }, null, 2));

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) scan(full);
  }
}
function scan(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const token of tokens) if (lines[i].includes(token)) rows.push({ file: path.relative(root, file).replaceAll('\\', '/'), line: i + 1, token, text: lines[i].trim().slice(0, 500) });
  }
}
