import { Readable } from "node:stream";
import { config } from "./config.js";
import { getDriveClient } from "./google.js";

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
    drive_id: created.data.driveId || ""
  };
}

export async function saveJsonArtifactToDrive({ run_id, artifact_name, version, drive_folder_id, artifact }) {
  const drive = getDriveClient();
  const filename = `${artifact_name}_v${version}.json`;
  const payload = {
    run_id,
    artifact_name,
    version,
    artifact
  };
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
    fields: "id,name,webViewLink,size,driveId"
  });

  return {
    drive_file_id: created.data.id,
    drive_filename: created.data.name,
    drive_web_view_link: created.data.webViewLink,
    drive_id: created.data.driveId || "",
    file_size_bytes: body.length
  };
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
