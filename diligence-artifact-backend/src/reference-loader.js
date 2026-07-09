import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCES_ROOT = path.resolve(__dirname, "../references");
const REGISTRY_ROOT = path.join(REFERENCES_ROOT, "registry");
const DOMAIN_PACKAGES_ROOT = path.join(REFERENCES_ROOT, "domain-packages");

const SAFE_REFERENCE_BASENAME = /^[A-Z0-9_\-.]+\.(yaml|yml|md|json)$/i;
const SAFE_REFERENCE_PATH = /^(?:references\/(?:registry|domain-packages)\/)?[A-Z0-9_\-.]+\.(yaml|yml|md|json)$/i;

export async function loadReferencePacket(referenceFiles = []) {
  const files = Array.isArray(referenceFiles) ? referenceFiles : [];
  if (!files.length) {
    return { reference_root: "references", files: {} };
  }

  const packet = {
    reference_root: "references",
    files: {}
  };

  for (const fileName of files) {
    const resolved = resolveSafeReferenceFile(fileName);
    const content = await readFile(resolved.absolute_path, "utf8");
    packet.files[fileName] = {
      file_name: fileName,
      reference_root: resolved.reference_root,
      content
    };
  }

  return packet;
}

function resolveSafeReferenceFile(fileName) {
  const normalized = String(fileName || "").replace(/\\/g, "/");
  assertSafeReferenceFile(normalized);

  if (normalized.startsWith("references/registry/")) {
    const basename = normalized.slice("references/registry/".length);
    return safeJoinReferenceRoot(REGISTRY_ROOT, basename, "registry");
  }

  if (normalized.startsWith("references/domain-packages/")) {
    const basename = normalized.slice("references/domain-packages/".length);
    return safeJoinReferenceRoot(DOMAIN_PACKAGES_ROOT, basename, "domain-packages");
  }

  return safeJoinReferenceRoot(REGISTRY_ROOT, normalized, "registry");
}

function safeJoinReferenceRoot(root, basename, referenceRootLabel) {
  if (!SAFE_REFERENCE_BASENAME.test(basename || "")) {
    throw new Error(`INVALID_REFERENCE_FILE:${basename || "missing"}`);
  }
  const absolute = path.resolve(root, basename);
  if (!absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error(`UNSAFE_REFERENCE_FILE:${basename}`);
  }
  return { absolute_path: absolute, reference_root: referenceRootLabel };
}

function assertSafeReferenceFile(fileName) {
  if (!SAFE_REFERENCE_PATH.test(fileName || "")) {
    throw new Error(`INVALID_REFERENCE_FILE:${fileName || "missing"}`);
  }
  if (fileName.includes("..")) {
    throw new Error(`UNSAFE_REFERENCE_FILE:${fileName}`);
  }
}
