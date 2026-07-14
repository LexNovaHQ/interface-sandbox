import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { config } from "../runtime-config.service.js";
import { getDriveClient } from "./google.service.js";

const FOLDER_MIME = "application/vnd.google-apps.folder";

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

export async function saveJsonArtifactToDrive({ run_id, artifact_name, version, drive_folder_id, artifact }) {
  const drive = getDriveClient();
  const filename = `${artifact_name}_v${version}.json`;
  const payload = { run_id, artifact_name, version, artifact };
  const json = `${JSON.stringify(payload, null, 2)}\n`;

  const created = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: filename,
      mimeType: "application/json",
      parents: [drive_folder_id]
    },
    media: {
      mimeType: "application/json",
      body: Readable.from([json])
    },
    fields: "id,name,webViewLink,size,driveId"
  });

  return {
    drive_file_id: created.data.id,
    drive_filename: created.data.name,
    drive_web_view_link: created.data.webViewLink,
    drive_id: created.data.driveId || "",
    artifact_size_bytes: Buffer.byteLength(json, "utf8")
  };
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

function escapeDriveQuery(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

export const DRIVE_STORAGE_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "storage/drive.service",
  storage_model: "one_folder_per_run",
  idempotent_binary_assembly_custody: true,
  deterministic_subfolder_reuse: true
});
