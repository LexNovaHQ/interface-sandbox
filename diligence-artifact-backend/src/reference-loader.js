import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE_ROOT = path.resolve(__dirname, "../references/registry");

const SAFE_REFERENCE_FILE = /^[A-Z0-9_\-.]+\.(yaml|yml|md|json)$/i;

export async function loadReferencePacket(referenceFiles = []) {
  const files = Array.isArray(referenceFiles) ? referenceFiles : [];
  if (!files.length) {
    return { reference_root: "registry", files: {} };
  }

  const packet = {
    reference_root: "registry",
    files: {}
  };

  for (const fileName of files) {
    assertSafeReferenceFile(fileName);
    const content = await readFile(path.join(REFERENCE_ROOT, fileName), "utf8");
    packet.files[fileName] = {
      file_name: fileName,
      content
    };
  }

  return packet;
}

function assertSafeReferenceFile(fileName) {
  if (!SAFE_REFERENCE_FILE.test(fileName || "")) {
    throw new Error(`INVALID_REFERENCE_FILE:${fileName || "missing"}`);
  }
  if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
    throw new Error(`UNSAFE_REFERENCE_FILE:${fileName}`);
  }
}
