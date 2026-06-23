import fs from "node:fs";

const file = "server.js";
let s = fs.readFileSync(file, "utf8");

// PATCH 1 — use parse-or-repair instead of hard parse.
s = s.replace(
  '    const terminalJson = extractTerminalJson(modelResult.text, FINAL_ROOT_KEY);',
  '    const terminalJson = await extractTerminalJsonWithRepair({ text: modelResult.text, rootKey: FINAL_ROOT_KEY, modelResult });'
);

// PATCH 2 — strengthen Hunter wrapper terminal discipline.
s = s.replace(
`    "Keep terminal output compact. Do not duplicate full source text across display/report branches.",
    "Return exactly one machine-valid JSON object rooted at {\\"final_output_handoff\\":{...}}. No markdown. No commentary. No extra root.",`,
`    "Keep terminal output compact. Do not duplicate full source text across display/report branches.",
    "TERMINAL JSON COMPACTNESS RULE: Do not emit full source-discovery bulk in terminal output. Do not dump full clean_text, full lossless_evidence_payload bodies, full page text, full source archive, raw extracted pages, or repeated evidence payloads.",
    "TERMINAL JSON SOURCE RULE: Emit compact evidence refs, source URLs, source families, and short exact excerpts only where needed for auditability. Use limitations for omitted source text. Source custody may be summarized in terminal output; do not attempt archival preservation in the response body.",
    "TERMINAL JSON REGISTRY RULE: The exposure/registry ledger must remain complete. Do not replace registry rows with promises, examples, placeholders, or summaries. Every evaluated registry row must carry a final status.",
    "TERMINAL JSON SHAPE RULE: Return one JSON object only. Do not emit markdown fences. Do not emit \`\`\`json. Do not restart the JSON. Do not emit a second final_output_handoff root. Do not add commentary before or after the JSON.",
    "Return exactly one machine-valid JSON object rooted at {\\"final_output_handoff\\":{...}}. No markdown. No commentary. No extra root.",`
);

// PATCH 3 — strengthen user prompt.
s = s.replace(
`    "Emit exactly one JSON object rooted at final_output_handoff and nothing else.",`,
`    "Emit exactly one JSON object rooted at final_output_handoff and nothing else.",
    "Do not use markdown fences. Do not restart JSON. Do not emit duplicate roots.",
    "Keep terminal JSON compact: no full raw source text, no full clean_text archive, no repeated evidence payload dumps.",
    "Preserve full registry/exposure ledger status coverage; compact source custody only.",`
);

// PATCH 4 — insert JSON repair fallback before extractTerminalJson().
const marker = "function extractTerminalJson(text, rootKey) {";
const repairFn = `
async function extractTerminalJsonWithRepair({ text, rootKey, modelResult }) {
  try {
    return extractTerminalJson(text, rootKey);
  } catch (err) {
    const code = err?.publicCode || err?.code || "TERMINAL_JSON_PARSE_ERROR";
    const repairable = new Set([
      "JSON_OBJECT_NOT_BALANCED",
      "TERMINAL_JSON_PARSE_FAILED",
      "JSON_OBJECT_START_NOT_FOUND",
      "TERMINAL_ROOT_NOT_FOUND"
    ]);

    if (!repairable.has(code)) throw err;

    const repairResult = await callGeminiWithSimpleRotation({
      systemPrompt: buildJsonRepairSystemPrompt(rootKey),
      userPrompt: buildJsonRepairUserPrompt({ rawText: text, rootKey, originalError: code }),
      allowGrounding: false,
      terminalRootKey: rootKey
    });

    modelResult.repair_used = true;
    modelResult.repair_model_used = repairResult.model_used;
    modelResult.repair_key_index_used = repairResult.key_index_used;
    modelResult.repair_key_fingerprint_used = repairResult.key_fingerprint_used;

    modelResult.providerWarnings = [
      ...(modelResult.providerWarnings || []),
      ...(repairResult.providerWarnings || []),
      {
        code: "TERMINAL_JSON_REPAIR_USED",
        message: \`Initial terminal JSON parse failed with \${code}; repaired via \${repairResult.model_used} key \${repairResult.key_index_used}.\`,
        original_error: code,
        original_raw_excerpt: preview(text)
      }
    ];

    modelResult.attempts = [
      ...(modelResult.attempts || []),
      ...(repairResult.attempts || []).map((attempt) => ({
        ...attempt,
        attempt_phase: "JSON_REPAIR"
      }))
    ];

    modelResult.text = repairResult.text;
    modelResult.finishReason = modelResult.finishReason || repairResult.finishReason;
    modelResult.usageMetadata = modelResult.usageMetadata || repairResult.usageMetadata;

    return extractTerminalJson(repairResult.text, rootKey);
  }
}

function buildJsonRepairSystemPrompt(rootKey) {
  return [
    "You are a terminal JSON repair compiler.",
    "Your only job is to convert malformed, duplicated, fenced, restarted, or truncated model output into one valid JSON object.",
    \`The required root is {\\"\${rootKey}\\":{...}}.\`,
    "Output JSON only. No markdown. No fenced code block. No commentary. No explanation.",
    "Do not invent new diligence facts. Preserve only information visible in the raw text.",
    "If a branch is incomplete, create a compact limitation/warning inside the output rather than fabricating missing substance.",
    "Keep source custody compact. Do not emit full clean_text, full page text, or repeated evidence payload dumps.",
    "Preserve registry/exposure statuses that are visible in the raw text. If the raw text does not contain the full registry ledger, state that limitation instead of inventing rows."
  ].join("\\\\n");
}

function buildJsonRepairUserPrompt({ rawText, rootKey, originalError }) {
  return [
    "Repair the raw model output into valid terminal JSON.",
    \`Original parser error: \${originalError}\`,
    \`Required root: \${rootKey}\`,
    "Rules:",
    "1. Return exactly one JSON object.",
    "2. Remove markdown fences and duplicate/restarted JSON roots.",
    "3. Do not add facts not present in the raw output.",
    "4. Compact incomplete source evidence instead of dumping raw text.",
    "5. If content is incomplete, include limitations/final_quality_control warnings.",
    "",
    "----- RAW OUTPUT START -----",
    truncateForRepair(rawText),
    "----- RAW OUTPUT END -----"
  ].join("\\\\n");
}

function truncateForRepair(value) {
  const text = String(value || "");
  const max = Number(process.env.JSON_REPAIR_INPUT_CHARS || 180000);
  if (text.length <= max) return text;
  return text.slice(0, max) + "\\\\n\\\\n[TRUNCATED_FOR_JSON_REPAIR_AFTER_" + max + "_CHARS]";
}

`;

if (!s.includes("async function extractTerminalJsonWithRepair")) {
  s = s.replace(marker, repairFn + marker);
}

fs.writeFileSync(file, s);
console.log("PATCHED server.js with terminal compact + JSON repair fallback");
