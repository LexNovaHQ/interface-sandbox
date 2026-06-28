// s0-prompt-renderer.js
// S0 model prompt renderer.
// This file does not fetch, classify deterministically, dedupe, mutate state,
// assemble output, or create findings. It only renders compact prompts for
// the model-assisted S0 checkpoints.

import {
  S0_SOURCE_CONTRACT_VERSION,
  S0_RUNTIME_PARENT,
  S0_NODE_ID,
  S0_ROLE_BOUNDARY,
  S0_EVIDENCE_FIREWALL,
  S0_SOURCE_FAMILY_ORDER,
  S0_SOURCE_TAXONOMY,
  S0_MODEL_AUTHORITY,
  S0_MODEL_PROHIBITIONS,
  S0_NEAR_DUPLICATE_REVIEW_DECISIONS,
  S0_SUBFAMILY_SATISFACTION_STATUSES,
  S0_SUBFAMILY_SATISFACTION_ACTIONS,
  S0_ROUTE_SOURCES,
  S0_SCOPE_CLASSES
} from "./s0-source-contract.js";

export const S0_MODEL_TASKS = Object.freeze([
  "S0_SEARCH_SCOUT",
  "S0_AMBIGUOUS_CLASSIFICATION_REVIEW",
  "S0_NEAR_DUPLICATE_REVIEW",
  "S0_SUBFAMILY_SATISFACTION_REVIEW",
  "S0_COVERAGE_CHALLENGE"
]);

export function isS0ModelTask(task) {
  return S0_MODEL_TASKS.includes(task);
}

export function renderS0Prompt({ task, input = {} } = {}) {
  if (!isS0ModelTask(task)) {
    throw new Error(`UNKNOWN_S0_MODEL_TASK: ${task}`);
  }

  switch (task) {
    case "S0_SEARCH_SCOUT":
      return renderS0SearchScoutPrompt(input);

    case "S0_AMBIGUOUS_CLASSIFICATION_REVIEW":
      return renderS0AmbiguousClassificationPrompt(input);

    case "S0_NEAR_DUPLICATE_REVIEW":
      return renderS0NearDuplicatePrompt(input);

    case "S0_SUBFAMILY_SATISFACTION_REVIEW":
      return renderS0SubfamilySatisfactionPrompt(input);

    case "S0_COVERAGE_CHALLENGE":
      return renderS0CoverageChallengePrompt(input);

    default:
      throw new Error(`UNHANDLED_S0_MODEL_TASK: ${task}`);
  }
}

export function buildS0ModelCall({ task, input = {} } = {}) {
  const prompt = renderS0Prompt({ task, input });
  const expected_schema = getS0ExpectedModelOutputSchema(task);

  return {
    task,
    node_id: S0_NODE_ID,
    contract_version: S0_SOURCE_CONTRACT_VERSION,
    runtime_parent: S0_RUNTIME_PARENT,
    prompt,
    expected_schema,
    input
  };
}

export function getS0ExpectedModelOutputSchema(task) {
  switch (task) {
    case "S0_SEARCH_SCOUT":
      return {
        candidates: [
          {
            url: "",
            source_family: "",
            source_subfamily: "",
            route_basis: ""
          }
        ]
      };

    case "S0_AMBIGUOUS_CLASSIFICATION_REVIEW":
      return {
        classifications: [
          {
            candidate_source_id: "",
            source_family: "",
            source_subfamily: "",
            basis: ""
          }
        ]
      };

    case "S0_NEAR_DUPLICATE_REVIEW":
      return {
        dedupe_review: [
          {
            candidate_source_id: "",
            decision: "",
            canonical_candidate_source_id: "",
            reason: ""
          }
        ]
      };

    case "S0_SUBFAMILY_SATISFACTION_REVIEW":
      return {
        subfamily_satisfaction_review: [
          {
            source_family: "",
            source_subfamily: "",
            accepted_source_ids: [],
            status: "",
            basis: "",
            recommended_action: ""
          }
        ]
      };

    case "S0_COVERAGE_CHALLENGE":
      return {
        candidates: [
          {
            url: "",
            source_family: "",
            source_subfamily: "",
            route_basis: ""
          }
        ]
      };

    default:
      throw new Error(`UNKNOWN_S0_MODEL_TASK_SCHEMA: ${task}`);
  }
}

export function renderS0SearchScoutPrompt(input = {}) {
  return joinPrompt([
    renderHeader("S0_SEARCH_SCOUT"),

    renderBoundaryBlock(),

    renderEvidenceFirewallBlock(),

    renderModelAuthorityBlock(),

    renderClosedTaxonomyBlock(),

    renderAllowedScopeBlock(),

    `
TASK:
You are performing S0_SEARCH_SCOUT.

Your job is to return candidate public URLs only for missing S0 coverage.
Search results, snippets, titles, and descriptions are candidate leads only.
They are not evidence and must not be treated as accepted source material.

You may suggest URLs only when they plausibly fit:
- the target domain,
- a company-controlled subdomain,
- a qualifying hosted governance artifact,
- pasted public first-party material, or
- synthetic demo material where explicitly supplied.

You must not:
- summarize the target,
- infer product features,
- assess legal risk,
- evaluate registry issues,
- write findings,
- certify absence,
- invent product slugs,
- crawl broadly,
- return third-party commentary as evidence.

TARGET:
${jsonBlock(safePick(input, ["target"]))}

MISSING FAMILY/SUBFAMILY COVERAGE:
${jsonBlock(input.missing_family_slots || [])}

ACCEPTED SOURCE COUNT SO FAR:
${jsonBlock(input.accepted_source_count ?? 0)}

RETURN JSON ONLY:
${jsonBlock(getS0ExpectedModelOutputSchema("S0_SEARCH_SCOUT"))}

OUTPUT RULES:
- Return at most 8 candidates.
- Return absolute URLs only.
- Do not include snippets.
- Do not include commentary.
- source_family and source_subfamily must come from the closed taxonomy.
- If no safe candidate exists, return {"candidates":[]}.
`
  ]);
}

export function renderS0AmbiguousClassificationPrompt(input = {}) {
  return joinPrompt([
    renderHeader("S0_AMBIGUOUS_CLASSIFICATION_REVIEW"),

    renderBoundaryBlock(),

    renderModelAuthorityBlock(),

    renderClosedTaxonomyBlock(),

    renderRouteSourceBlock(),

    `
TASK:
You are performing S0_AMBIGUOUS_CLASSIFICATION_REVIEW.

Your job is to classify ambiguous candidate sources into the closed S0 family/subfamily taxonomy.

Use only:
- candidate_source_id,
- candidate_url,
- route_source,
- route_basis.

You must not:
- fetch the URL,
- summarize the source,
- infer product features,
- assess legal risk,
- write findings,
- invent taxonomy labels.

CANDIDATES:
${jsonBlock(input.candidates || [])}

RETURN JSON ONLY:
${jsonBlock(getS0ExpectedModelOutputSchema("S0_AMBIGUOUS_CLASSIFICATION_REVIEW"))}

OUTPUT RULES:
- Every returned source_family must be one of the closed families.
- Every returned source_subfamily must belong to that source_family.
- If a candidate cannot be safely classified, omit it.
- basis must be short and based only on URL/path/route_basis.
`
  ]);
}

export function renderS0NearDuplicatePrompt(input = {}) {
  return joinPrompt([
    renderHeader("S0_NEAR_DUPLICATE_REVIEW"),

    renderBoundaryBlock(),

    renderModelAuthorityBlock(),

    `
TASK:
You are performing S0_NEAR_DUPLICATE_REVIEW.

Your job is to decide whether candidates in a same-family/same-subfamily cluster are unique enough to keep or should be deferred as duplicate/repetitive/low incremental value.

You may review only compact metadata:
- candidate_source_id,
- source_url,
- source_family,
- source_subfamily,
- normalized_text_hash,
- short leading text excerpt where supplied.

You must not:
- summarize accepted content,
- create findings,
- profile the target,
- assess legal risk,
- infer data provenance,
- evaluate registry issues.

ALLOWED DECISIONS:
${jsonBlock(S0_NEAR_DUPLICATE_REVIEW_DECISIONS)}

CLUSTER:
${jsonBlock(input.cluster || {})}

RETURN JSON ONLY:
${jsonBlock(getS0ExpectedModelOutputSchema("S0_NEAR_DUPLICATE_REVIEW"))}

OUTPUT RULES:
- Use only allowed decisions.
- If keeping a canonical source, identify canonical_candidate_source_id.
- If uncertain, prefer KEEP_UNIQUE over suppressing a possibly useful source.
- Do not suppress all items in a cluster.
- reason must be short.
`
  ]);
}

export function renderS0SubfamilySatisfactionPrompt(input = {}) {
  return joinPrompt([
    renderHeader("S0_SUBFAMILY_SATISFACTION_REVIEW"),

    renderBoundaryBlock(),

    renderModelAuthorityBlock(),

    renderClosedTaxonomyBlock(),

    `
TASK:
You are performing S0_SUBFAMILY_SATISFACTION_REVIEW.

Your job is to check whether accepted sources actually satisfy their assigned S0 family/subfamily slots.

Important rule:
Quota full is not coverage satisfied. A slot is satisfied only if the accepted source materially fits the assigned subfamily.

You may decide only:
- whether a slot is satisfied,
- thin,
- misfilled,
- duplicative,
- unavailable after search,
- or needs targeted coverage challenge.

You must not:
- summarize accepted content,
- write findings,
- make legal conclusions,
- certify compliance or noncompliance,
- infer data provenance,
- evaluate registry rows.

ALLOWED STATUSES:
${jsonBlock(S0_SUBFAMILY_SATISFACTION_STATUSES)}

ALLOWED ACTIONS:
${jsonBlock(S0_SUBFAMILY_SATISFACTION_ACTIONS)}

INPUT SLOTS:
${jsonBlock(input.slots || [])}

COLLECTION SUMMARY:
${jsonBlock(input.collection_summary || {})}

RETURN JSON ONLY:
${jsonBlock(getS0ExpectedModelOutputSchema("S0_SUBFAMILY_SATISFACTION_REVIEW"))}

OUTPUT RULES:
- source_family/source_subfamily must come from the closed taxonomy.
- status must be one of the allowed statuses.
- recommended_action must be one of the allowed actions.
- If a slot is thin but usable, mark THIN.
- If a source belongs elsewhere, mark MISFILLED_SLOT.
- If a challenge is justified and caps remain, mark NEEDS_COVERAGE_CHALLENGE.
- basis must be short.
`
  ]);
}

export function renderS0CoverageChallengePrompt(input = {}) {
  return joinPrompt([
    renderHeader("S0_COVERAGE_CHALLENGE"),

    renderBoundaryBlock(),

    renderEvidenceFirewallBlock(),

    renderModelAuthorityBlock(),

    renderClosedTaxonomyBlock(),

    renderAllowedScopeBlock(),

    `
TASK:
You are performing S0_COVERAGE_CHALLENGE.

Your job is to return targeted candidate URLs only for unresolved S0 family/subfamily slots.

This is not a broad crawl.
This is not a report.
This is not source acceptance.
This is not evidence extraction.

You may return only candidate URLs that plausibly resolve the unresolved slots.

TARGET:
${jsonBlock(safePick(input, ["target"]))}

UNRESOLVED SLOTS:
${jsonBlock(input.unresolved_slots || [])}

REMAINING CAPS:
${jsonBlock(input.remaining_caps || {})}

RETURN JSON ONLY:
${jsonBlock(getS0ExpectedModelOutputSchema("S0_COVERAGE_CHALLENGE"))}

OUTPUT RULES:
- Return at most 6 candidates.
- Return absolute URLs only.
- source_family/source_subfamily must match one unresolved slot where possible.
- Do not include snippets.
- Do not include commentary.
- If no safe targeted candidate exists, return {"candidates":[]}.
`
  ]);
}

function renderHeader(task) {
  return `
CONTRACT ANCHOR:
- runtime_parent: ${S0_RUNTIME_PARENT}
- node_id: ${S0_NODE_ID}
- contract_version: ${S0_SOURCE_CONTRACT_VERSION}
- model_task: ${task}

ROLE:
You are an S0 model-assist component for The Interface Diligence Engine.

You are not the full diligence engine.
You are not the source adapter.
You are not a legal reviewer.
You are not a report writer.
`;
}

function renderBoundaryBlock() {
  return `
S0 ROLE BOUNDARY:
S0 may:
${bulletList(S0_ROLE_BOUNDARY.may)}

S0 must not:
${bulletList(S0_ROLE_BOUNDARY.must_not)}

Allowed cautionary language:
${bulletList(S0_ROLE_BOUNDARY.allowed_language)}

Forbidden conclusion language:
${bulletList(S0_ROLE_BOUNDARY.forbidden_language)}

Exception:
Forbidden conclusion language may appear only when quoted verbatim from an accepted public source. You are not being asked to quote accepted public sources in this task.
`;
}

function renderEvidenceFirewallBlock() {
  return `
EVIDENCE FIREWALL:
Admissible source classes:
${bulletList(S0_EVIDENCE_FIREWALL.admissible_source_classes)}

Search snippet rule:
- Search snippets are candidate leads only.
- Search snippets cannot enter lossless_text_artifacts[].
- Search snippets are not accepted evidence.

Kill list:
${bulletList(S0_EVIDENCE_FIREWALL.kill_list)}
`;
}

function renderModelAuthorityBlock() {
  return `
MODEL AUTHORITY:
The model may assist only with:
${bulletList(S0_MODEL_AUTHORITY)}

The model must not:
${bulletList(S0_MODEL_PROHIBITIONS)}
`;
}

function renderClosedTaxonomyBlock() {
  return `
CLOSED S0 TAXONOMY:
Family order:
${jsonBlock(S0_SOURCE_FAMILY_ORDER)}

Families and subfamilies:
${jsonBlock(S0_SOURCE_TAXONOMY)}

Taxonomy rule:
- Do not invent families.
- Do not invent subfamilies.
- source_subfamily must belong to the selected source_family.
`;
}

function renderRouteSourceBlock() {
  return `
CANONICAL ROUTE SOURCES:
${jsonBlock(S0_ROUTE_SOURCES)}
`;
}

function renderAllowedScopeBlock() {
  return `
CANONICAL SCOPE CLASSES:
${jsonBlock(S0_SCOPE_CLASSES)}

Scope rule:
Return only candidates that can plausibly fit an allowed first-party or qualifying hosted-governance route. Do not return third-party commentary, directories, forums, review sites, press blurbs, or investor summaries as evidence.
`;
}

function jsonBlock(value) {
  return `\`\`\`json\n${safeJson(value)}\n\`\`\``;
}

function safeJson(value) {
  return JSON.stringify(value ?? null, null, 2);
}

function bulletList(values) {
  return (values || []).map((value) => `- ${value}`).join("\n");
}

function joinPrompt(blocks) {
  return blocks
    .filter(Boolean)
    .map((block) => String(block).trim())
    .join("\n\n---\n\n")
    .trim();
}

function safePick(input, keys) {
  const out = {};

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      out[key] = input[key];
    }
  }

  return out;
}