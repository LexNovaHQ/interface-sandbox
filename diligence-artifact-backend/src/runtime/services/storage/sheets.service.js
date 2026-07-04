import { config } from "../../config.js";
import { getSheetsClient } from "./google.service.js";

const HEADER = Object.freeze([
  "run_id",
  "target",
  "root_url",
  "current_phase",
  "central_phase",
  "status",
  "final_report_url",
  "created_at",
  "updated_at"
]);

function quoteSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

function parseUpdatedRowNumber(updatedRange = "") {
  const match = updatedRange.match(/![A-Z]+(\d+):/);
  return match ? Number(match[1]) : null;
}

export async function ensureRunsSheet() {
  const sheets = getSheetsClient();
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: config.sheetsSpreadsheetId });
  const existing = spreadsheet.data.sheets?.find((sheet) => sheet.properties?.title === config.runsSheetName);

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.sheetsSpreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: config.runsSheetName } } }] }
    });
  }

  const headerRange = `${quoteSheetName(config.runsSheetName)}!A1:I1`;
  const currentHeader = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheetsSpreadsheetId,
    range: headerRange
  }).catch(() => ({ data: { values: [] } }));

  if (!currentHeader.data.values?.[0]?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.sheetsSpreadsheetId,
      range: headerRange,
      valueInputOption: "RAW",
      requestBody: { values: [HEADER] }
    });
  }
}

export async function appendRunDashboardRow(run) {
  await ensureRunsSheet();
  const sheets = getSheetsClient();
  const range = `${quoteSheetName(config.runsSheetName)}!A:I`;
  const values = [[
    run.run_id,
    run.target || "",
    run.root_url || "",
    run.current_phase || "",
    run.central_phase || "",
    run.status || "",
    run.final_report_url || "",
    run.created_at || "",
    run.updated_at || ""
  ]];

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: config.sheetsSpreadsheetId,
    range,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values }
  });
  return parseUpdatedRowNumber(response.data.updates?.updatedRange || "");
}

export async function updateRunDashboardRow(run) {
  if (!run.sheet_row_number) return null;
  await ensureRunsSheet();
  const sheets = getSheetsClient();
  const row = Number(run.sheet_row_number);
  const range = `${quoteSheetName(config.runsSheetName)}!A${row}:I${row}`;
  const values = [[
    run.run_id,
    run.target || "",
    run.root_url || "",
    run.current_phase || "",
    run.central_phase || "",
    run.status || "",
    run.final_report_url || "",
    run.created_at || "",
    run.updated_at || ""
  ]];

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.sheetsSpreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values }
  });
  return row;
}

export const SHEETS_DASHBOARD_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "storage/sheets.service",
  sheet: "runs",
  central_phase_column: true
});
