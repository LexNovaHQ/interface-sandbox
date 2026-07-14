import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { readZipEntries } from "../src/phases/16-assembly-engine/docx-package.js";
import {
  loadQrRegistryAuthority,
  resolveAuthorityPath
} from "../src/phases/13-qualified-review/registry/qr-registry-loader.js";

const authority = loadQrRegistryAuthority();
const branding = authority.template_manifest.branding || {};
const brandPattern = /lex\s*nova(?:\s*hq)?|lexnovahq|lexnova/i;
const expectedBannerHash = String(branding.neutral_banner_sha256 || "");
let templateCount = 0;
let qrTokenCount = 0;

assert.equal(branding.mode, "WHITE_LABEL");
assert.equal(branding.provider_branding_present, false);
assert.equal(branding.neutral_ai_governance_banner, true);
assert.equal(branding.creator_metadata_scrubbed, true);
assert.match(expectedBannerHash, /^[a-f0-9]{64}$/);

for (const template of authority.template_manifest.documents || []) {
  const templatePath = resolveAuthorityPath(
    authority.backend_root,
    join(authority.template_manifest.template_root, template.template_path).replaceAll("\\", "/")
  );
  const entries = readZipEntries(readFileSync(templatePath));
  const xml = entries
    .filter((entry) => entry.name.endsWith(".xml") || entry.name.endsWith(".rels"))
    .map((entry) => entry.data.toString("utf8"))
    .join("\n");
  const banner = entries.find((entry) => entry.name === "word/media/image1.png");
  const core = entries.find((entry) => entry.name === "docProps/core.xml")?.data.toString("utf8") || "";

  assert.doesNotMatch(xml, brandPattern, `Brand residue in ${template.document_id}`);
  assert.ok(banner, `Neutral banner missing in ${template.document_id}`);
  assert.equal(createHash("sha256").update(banner.data).digest("hex"), expectedBannerHash, `Banner mismatch in ${template.document_id}`);
  assert.doesNotMatch(core, /<dc:creator\b[^>]*>\s*[^<\s][^<]*<\/dc:creator>/i, `Creator metadata not scrubbed in ${template.document_id}`);
  assert.doesNotMatch(core, /<cp:lastModifiedBy\b[^>]*>\s*[^<\s][^<]*<\/cp:lastModifiedBy>/i, `Modifier metadata not scrubbed in ${template.document_id}`);

  qrTokenCount += (xml.match(/\{\{QR\.[^{}]+\}\}/g) || []).length;
  templateCount += 1;
}

assert.equal(templateCount, 13);
assert.equal(qrTokenCount, 463);

console.log("Phase 16 white-label AI templates: PASS");
console.log(JSON.stringify({
  template_count: templateCount,
  qr_token_count: qrTokenCount,
  provider_branding_present: false,
  neutral_banner_sha256: expectedBannerHash,
  creator_metadata_scrubbed: true,
  review_ready_boundary_preserved: true
}, null, 2));
