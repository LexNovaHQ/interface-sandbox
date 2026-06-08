import { runGeminiPool } from "../gemini/geminiPool.js";

function compact(value, max = 600) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function validIds(workItem = {}) {
  return new Set((workItem.candidate_sources || []).map((source) => source.evidence_source_id).filter(Boolean));
}

function sanitize(raw = {}, workItem = {}) {
  const allowed = validIds(workItem);
  const fallbackPrimary = workItem.candidate_source_ids?.[0] || workItem.candidate_sources?.[0]?.evidence_source_id || null;
  const primary = allowed.has(raw.primary_source_id) ? raw.primary_source_id : fallbackPrimary;
  const supporting = Array.isArray(raw.supporting_source_ids) ? raw.supporting_source_ids.filter((id) => allowed.has(id) && id !== primary) : [];
  const noise = Array.isArray(raw.noise_source_ids) ? raw.noise_source_ids.filter((id) => allowed.has(id) && id !== primary && !supporting.includes(id)) : [];
  const assigned = new Set([primary, ...supporting, ...noise].filter(Boolean));
  const remainder = [...allowed].filter((id) => !assigned.has(id));
  return {
    dedupe_group_id: workItem.dedupe_group_id,
    primary_source_id: primary,
    supporting_source_ids: [...supporting, ...remainder],
    noise_source_ids: noise,
    downstream_tags: Array.isArray(raw.downstream_tags) && raw.downstream_tags.length ? raw.downstream_tags : ["target_feature_profile", "registry_matching", "final_report_compiler"],
    reason: compact(raw.reason || "Gemini adjudication returned no usable reason.")
  };
}

function promptFor(workItem = {}) {
  return [
    "You are adjudicating one repeated evidence group for Lex Nova HQ Stage 3.",
    "Return JSON only with: dedupe_group_id, primary_source_id, supporting_source_ids, noise_source_ids, downstream_tags, reason.",
    "Use only candidate source IDs provided. Do not summarize documents. Do not rewrite source text. Do not delete archive evidence.",
    "Pick the most specific source as primary; broad repeated mentions are supporting or noise for routing only.",
    "INPUT:",
    JSON.stringify(workItem, null, 2)
  ].join("\n");
}

export async function adjudicateEvidenceJunctionWorkItem(workItem, { env = process.env, pool = null } = {}) {
  const selectedPool = pool || env.STAGE3_GEMINI_POOL || "search";
  const maxAttempts = positiveInt(env.STAGE3_GEMINI_MAX_ATTEMPTS, 8);
  const result = await runGeminiPool({
    poolName: selectedPool,
    prompt: promptFor(workItem),
    env,
    options: { responseMimeType: "application/json", temperature: 0, maxOutputTokens: 800, timeoutMs: 20000, maxAttempts, enableSearchGrounding: false }
  });
  if (!result.ok) return { ok: false, fallback: true, error_type: result.error_type, error: result.error, attempts: result.attempts || [] };
  return { ok: true, adjudication: sanitize(result.json || {}, workItem), model_metadata: result.model_meta || null };
}
