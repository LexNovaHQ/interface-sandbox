import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { config } from "../runtime-config.service.js";
import { getDriveClient } from "./google.service.js";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const JSON_MIME = "application/json";
const JSON_PERSISTENCE_SCHEMA = "IDEMPOTENT_JSON_ARTIFACT_v1";
const VOLATILE_HASH_FIELDS = new Set([
  "generated_at",
  "created_at",
  "updated_at",
  "persisted_at",
  "saved_at",
  "fetched_at",
  "fingerprinted_at",
  "checked_at",
  "started_at",
  "completed_at"
]);

async function streamToString(stream) {
  let out = "";
  for await (const chunk of stream) {
    out += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
  }
  return out;
}

export async function createRunFolder({ run_id }) {
  const drive = getDriveClient();
  const created = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: run_id,
      mimeType: FOLDER_MIME,
      parents: [config.driveParentFolderId]
    },
    fields: "id,name,webViewLink,driveId"
  });

  return {
    drive_folder_id: created.data.id,
    drive_folder_name: created.data.name,
    drive_folder_link: created.data.webViewLink,
    drive_web_view_link: created.data.webViewLink,
    drive_id: created.data.driveId || ""
  };
}

export async function ensureDriveFolder({ parent_folder_id, name }) {
  const drive = getDriveClient();
  const folderName = String(name || "").trim();
  if (!parent_folder_id) throw new Error("DRIVE_PARENT_FOLDER_ID_MISSING");
  if (!folderName) throw new Error("DRIVE_FOLDER_NAME_MISSING");
  const existing = await drive.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: `'${escapeDriveQuery(parent_folder_id)}' in parents and name = '${escapeDriveQuery(folderName)}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
    fields: "files(id,name,webViewLink,driveId)",
    pageSize: 10
  });
  const matches = existing.data.files || [];
  if (matches.length > 1) throw new Error(`DRIVE_FOLDER_DUPLICATE:${parent_folder_id}:${folderName}`);
  if (matches.length === 1) {
    return {
      drive_folder_id: matches[0].id,
      drive_folder_name: matches[0].name,
      drive_web_view_link: matches[0].webViewLink,
      drive_id: matches[0].driveId || "",
      reused: true
    };
  }
  const created = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: folderName,
      mimeType: FOLDER_MIME,
      parents: [parent_folder_id]
    },
    fields: "id,name,webViewLink,driveId"
  });
  return {
    drive_folder_id: created.data.id,
    drive_folder_name: created.data.name,
    drive_web_view_link: created.data.webViewLink,
    drive_id: created.data.driveId || "",
    reused: false
  };
}

export async function saveJsonArtifactToDrive({ run_id, artifact_name, version, drive_folder_id, artifact, drive_client = null }) {
  const drive = drive_client || getDriveClient();
  const filename = `${artifact_name}_v${version}.json`;
  const semanticHash = semanticJsonArtifactHash({ run_id, artifact_name, artifact });
  const payload = { run_id, artifact_name, version, semantic_hash: semanticHash, artifact };
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  const matches = await findJsonArtifactFiles({ drive, drive_folder_id, filename });

  if (matches.length > 1) throw new Error(`DRIVE_JSON_ARTIFACT_DUPLICATE:${drive_folder_id}:${filename}`);
  if (matches.length === 1) {
    const existing = matches[0];
    if (existing.appProperties?.semantic_hash === semanticHash) {
      return driveJsonResult(existing, json, semanticHash, "REUSED");
    }
    const updated = await drive.files.update({
      fileId: existing.id,
      supportsAllDrives: true,
      requestBody: {
        name: filename,
        mimeType: JSON_MIME,
        appProperties: jsonArtifactAppProperties({ run_id, artifact_name, semanticHash })
      },
      media: {
        mimeType: JSON_MIME,
        body: Readable.from([json])
      },
      fields: "id,name,webViewLink,size,driveId,appProperties"
    });
    return driveJsonResult(updated.data, json, semanticHash, "UPDATED");
  }

  const created = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: filename,
      mimeType: JSON_MIME,
      parents: [drive_folder_id],
      appProperties: jsonArtifactAppProperties({ run_id, artifact_name, semanticHash })
    },
    media: {
      mimeType: JSON_MIME,
      body: Readable.from([json])
    },
    fields: "id,name,webViewLink,size,driveId,appProperties"
  });
  return driveJsonResult(created.data, json, semanticHash, "CREATED");
}

export function semanticJsonArtifactHash({ run_id, artifact_name, artifact }) {
  const canonical = canonicaliseForSemanticHash({ run_id, artifact_name, artifact });
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function canonicaliseForSemanticHash(value) {
  if (Array.isArray(value)) return value.map((item) => canonicaliseForSemanticHash(item));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value)
    .filter((key) => !VOLATILE_HASH_FIELDS.has(key))
    .sort()
    .map((key) => [key, canonicaliseForSemanticHash(value[key])]));
}

export async function saveBinaryFileToDrive({ drive_folder_id, filename, mime_type, buffer }) {
  const drive = getDriveClient();
  const body = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || "");
  const created = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: filename,
      mimeType: mime_type || "application/octet-stream",
      parents: [drive_folder_id]
    },
    media: {
      mimeType: mime_type || "application/octet-stream",
      body: Readable.from([body])
    },
    fields: "id,name,webViewLink,size,driveId,md5Checksum"
  });

  return {
    drive_file_id: created.data.id,
    drive_filename: created.data.name,
    drive_web_view_link: created.data.webViewLink,
    drive_id: created.data.driveId || "",
    file_size_bytes: body.length,
    md5_checksum: created.data.md5Checksum || "",
    reused: false
  };
}

export async function saveBinaryFileToDriveIdempotent({ drive_folder_id, filename, mime_type, buffer }) {
  const drive = getDriveClient();
  const body = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || "");
  const expectedMd5 = createHash("md5").update(body).digest("hex");
  const existing = await drive.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: `'${escapeDriveQuery(drive_folder_id)}' in parents and name = '${escapeDriveQuery(filename)}' and trashed = false`,
    fields: "files(id,name,webViewLink,size,driveId,md5Checksum,mimeType)",
    pageSize: 10
  });
  const matches = existing.data.files || [];
  if (matches.length > 1) throw new Error(`DRIVE_FILE_DUPLICATE:${drive_folder_id}:${filename}`);
  if (matches.length === 1) {
    const file = matches[0];
    if (file.md5Checksum && file.md5Checksum !== expectedMd5) {
      throw new Error(`DRIVE_IMMUTABLE_BINARY_CONFLICT:${filename}`);
    }
    if (Number(file.size || 0) !== body.length) {
      throw new Error(`DRIVE_IMMUTABLE_BINARY_SIZE_CONFLICT:${filename}`);
    }
    return {
      drive_file_id: file.id,
      drive_filename: file.name,
      drive_web_view_link: file.webViewLink,
      drive_id: file.driveId || "",
      file_size_bytes: body.length,
      md5_checksum: file.md5Checksum || expectedMd5,
      reused: true
    };
  }
  return saveBinaryFileToDrive({ drive_folder_id, filename, mime_type, buffer: body });
}

export async function readJsonArtifactFromDrive(fileId) {
  const drive = getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" }
  );
  const raw = await streamToString(response.data);
  const parsed = JSON.parse(raw);
  return parsed.artifact ?? parsed;
}

async function findJsonArtifactFiles({ drive, drive_folder_id, filename }) {
  const existing = await drive.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: `'${escapeDriveQuery(drive_folder_id)}' in parents and name = '${escapeDriveQuery(filename)}' and mimeType = '${JSON_MIME}' and trashed = false`,
    fields: "files(id,name,webViewLink,size,driveId,appProperties,mimeType)",
    pageSize: 10
  });
  return existing.data.files || [];
}

function jsonArtifactAppProperties({ run_id, artifact_name, semanticHash }) {
  return {
    persistence_schema: JSON_PERSISTENCE_SCHEMA,
    run_id: String(run_id || ""),
    artifact_name: String(artifact_name || ""),
    semantic_hash: semanticHash
  };
}

function driveJsonResult(file, json, semanticHash, persistenceAction) {
  return {
    drive_file_id: file.id,
    drive_filename: file.name,
    drive_web_view_link: file.webViewLink,
    drive_id: file.driveId || "",
    artifact_size_bytes: Buffer.byteLength(json, "utf8"),
    semantic_hash: semanticHash,
    persistence_action: persistenceAction,
    reused: persistenceAction === "REUSED",
    updated_in_place: persistenceAction === "UPDATED"
  };
}

function escapeDriveQuery(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

export const DRIVE_STORAGE_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "storage/drive.service",
  storage_model: "one_folder_per_run",
  idempotent_json_artifact_persistence: true,
  semantic_hash_ignores_runtime_timestamps: true,
  duplicate_same_name_json_files_fail_loud: true,
  idempotent_binary_assembly_custody: true,
  deterministic_subfolder_reuse: true
});
