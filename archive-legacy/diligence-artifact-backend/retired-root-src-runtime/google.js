import { google } from "googleapis";

let cachedAuth = null;
let cachedDrive = null;
let cachedSheets = null;

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets"
];

export function getGoogleAuth() {
  if (!cachedAuth) {
    cachedAuth = new google.auth.GoogleAuth({ scopes: SCOPES });
  }
  return cachedAuth;
}

export function getDriveClient() {
  if (!cachedDrive) {
    cachedDrive = google.drive({ version: "v3", auth: getGoogleAuth() });
  }
  return cachedDrive;
}

export function getSheetsClient() {
  if (!cachedSheets) {
    cachedSheets = google.sheets({ version: "v4", auth: getGoogleAuth() });
  }
  return cachedSheets;
}
