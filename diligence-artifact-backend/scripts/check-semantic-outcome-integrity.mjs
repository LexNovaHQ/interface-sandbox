import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EXECUTION_OUTCOMES, shouldBlockRun } from "../src/runtime/contracts/execution-outcome.contract.js";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set(["node_modules", ".git"]);
const binaryExtensions = new Set([".docx", ".zip", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".woff", ".woff2", ".ttf", ".ico"]);
const retiredStatus = ["REPAIR", "REQUIRED"].join("_");
const forbiddenAliases = new Set([
  ["REINVESTIGATE", "REQUIRED"].join("_"),
  ["SOURCE", "REINVESTIGATION", "REQUIRED"].join("_")
]);
const canonicalOutcomes = Object.freeze([
  "SUCCESS",
  "LIMITATION",
  "REINVESTIGATION_REQUIRED",
  "TECHNICAL_RETRY_REQUIRED",
  "CRITICAL_FAILURE"
]);
const semanticStatusTokens = new Set([
  ...canonicalOutcomes,
  "LOCKED",
  "LOCKED_WITH_LIMITATIONS",
  "CONTROLLED_FAILURE",
  "PASS",
  "PASS_WITH_LIMITATION",
  "PASS_WITH_LIMITATIONS",
  "PASS_WITH_WARNING",
  "PASS_WITH_WARNINGS",
  "REINVESTIGATION_COMPLETED_WITH_LIMITATION",
  "REVIEW_REQUIRED"
]);
const violations = [];

assertCanonicalExecutionContract();
walk(backendRoot);

if (violations.length) {
  console.error(JSON.stringify({
    check: "CO_FINAL_SEMANTIC_OUTCOME_INTEGRITY",
    status: "FAIL",
    violation_count: violations.length,
    violations
  }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    check: "CO_FINAL_SEMANTIC_OUTCOME_INTEGRITY",
    status: "PASS",
    canonical_execution_outcomes: canonicalOutcomes,
    only_critical_failure_blocks: true,
    retired_status_absent: true,
    forbidden_status_aliases_absent: true,
    duplicate_status_branches_absent: true,
    direct_run_block_literals_absent_from_runtime_source: true
  }, null, 2));
}

function assertCanonicalExecutionContract() {
  const actual = Object.values(EXECUTION_OUTCOMES);
  if (JSON.stringify(actual) !== JSON.stringify(canonicalOutcomes)) {
    violations.push({
      path: "src/runtime/contracts/execution-outcome.contract.js",
      line: null,
      code: "NON_CANONICAL_EXECUTION_OUTCOME_SET",
      actual,
      expected: canonicalOutcomes
    });
  }

  for (const outcome of canonicalOutcomes) {
    const expected = outcome === "CRITICAL_FAILURE";
    const actualBlock = shouldBlockRun(outcome);
    if (actualBlock !== expected) {
      violations.push({
        path: "src/runtime/contracts/execution-outcome.contract.js",
        line: null,
        code: "NON_CRITICAL_BLOCKING_POLICY",
        outcome,
        expected,
        actual: actualBlock
      });
    }
  }
}

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const absolute = join(directory, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!stat.isFile() || binaryExtensions.has(extname(entry).toLowerCase())) continue;

    let text;
    try {
      text = readFileSync(absolute, "utf8");
    } catch {
      continue;
    }

    inspectFile(relative(backendRoot, absolute), text);
  }
}

function inspectFile(path, text) {
  const lines = text.split(/\r?\n/);
  let previousListStatus = null;
  let previousListLine = null;

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index];

    if (line.includes(retiredStatus)) {
      violations.push({ path, line: lineNumber, code: "RETIRED_STATUS_TOKEN_PRESENT" });
    }

    for (const alias of forbiddenAliases) {
      if (line.includes(alias)) {
        violations.push({ path, line: lineNumber, code: "FORBIDDEN_STATUS_ALIAS_PRESENT", alias });
      }
    }

    const listMatch = line.match(/^\s*-\s+`?([A-Z][A-Z0-9_]+)`?(?:\s+.*)?$/);
    const listStatus = listMatch && semanticStatusTokens.has(listMatch[1]) ? listMatch[1] : null;
    if (listStatus) {
      if (listStatus === previousListStatus) {
        violations.push({
          path,
          line: lineNumber,
          code: "DUPLICATE_ADJACENT_STATUS_BRANCH",
          status: listStatus,
          previous_line: previousListLine
        });
      }
      previousListStatus = listStatus;
      previousListLine = lineNumber;
    } else if (line.trim() && !line.trim().startsWith("#")) {
      previousListStatus = null;
      previousListLine = null;
    }

    const duplicateConjunction = line.match(/`([A-Z][A-Z0-9_]+)`\s+and\s+`\1`/);
    if (duplicateConjunction && semanticStatusTokens.has(duplicateConjunction[1])) {
      violations.push({
        path,
        line: lineNumber,
        code: "DUPLICATE_STATUS_CONJUNCTION",
        status: duplicateConjunction[1]
      });
    }

    const pipeTokens = line
      .split("|")
      .map((value) => value.replace(/[\s`"']/g, ""))
      .filter((value) => semanticStatusTokens.has(value));
    if (pipeTokens.length > new Set(pipeTokens).size) {
      violations.push({
        path,
        line: lineNumber,
        code: "DUPLICATE_STATUS_ALTERNATIVE",
        statuses: pipeTokens
      });
    }

    if (path.startsWith("src/") && /\brun_blocked\s*:\s*true\b/.test(line)) {
      violations.push({
        path,
        line: lineNumber,
        code: "DIRECT_RUN_BLOCK_LITERAL_IN_RUNTIME_SOURCE",
        requirement: "derive run_blocked through shouldBlockRun(execution_outcome)"
      });
    }

    if (path !== "scripts/check-semantic-outcome-integrity.mjs" && /may not advance.*until.*CONTROLLED_FAILURE/i.test(line)) {
      violations.push({
        path,
        line: lineNumber,
        code: "CONTROLLED_FAILURE_LISTED_AS_ADVANCE_GATE"
      });
    }
  }
}
