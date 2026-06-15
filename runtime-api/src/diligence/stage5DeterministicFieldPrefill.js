const ARCHETYPE_LABELS = Object.freeze({
  UNI: "Universal/general-purpose AI",
  DOE: "Delegated operation/execution",
  JDG: "Judgment/decisioning",
  CMP: "Comparison/ranking/scoring",
  CRT: "Content creation/transformation",
  RDR: "Reader/extraction over supplied material",
  ORC: "Orchestration across tools/models/systems",
  TRN: "Transcription/translation/voice-signal processing",
  SHD: "Safety/health/physical-world domain",
  OPT: "Optimization/recommendation",
  MOV: "Movement/robotics/physical actuation"
});

const SURFACE_LABELS = Object.freeze({
  "Consumer-Public": "Public/consumer-facing availability",
  "Enterprise-Private": "Enterprise/private customer deployment",
  PII: "Personal information or customer/user data",
  Employment: "Employment, hiring, HR, workplace context",
  "Sensitive/Biometric": "Sensitive data, voice, biometric or special-category proxy",
  Financial: "Financial, payment, lending, banking or insurance context",
  "Content&IP": "Customer/provided/generated content and IP surface",
  "Safety&Physical": "Safety, health or physical-world consequences",
  Infrastructure: "API, platform, integration, hosting or technical infrastructure",
  Minors: "Children/minors context"
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).trim() || fallback;
}

function lower(value) {
  return asString(value).toLowerCase();
}

function joinedText({ familyName = "", sources = [], candidates = [] } = {}) {
  const sourceText = asArray(sources).map((source) => [
    source.source_url,
    source.final_url,
    source.title,
    source.source_family,
    source.clean_text_lossless
  ].filter(Boolean).join("\n")).join("\n---SOURCE---\n");
  const candidateText = asArray(candidates).map((candidate) => [
    candidate.candidate_bucket,
    candidate.candidate_key,
    candidate.candidate_name,
    candidate.normalized_label,
    candidate.raw_signal,
    candidate.product_area_hint,
    candidate.source_url
  ].filter(Boolean).join(" ")).join("\n");
  return lower([familyName, sourceText, candidateText].filter(Boolean).join("\n"));
}

function tri(condition) {
  return condition ? "true" : "unknown";
}

function uniq(values = []) {
  return [...new Set(asArray(values).map((value) => asString(value)).filter(Boolean))];
}

export function inferDeliveryChannels(context = {}) {
  const text = joinedText(context);
  return {
    api: tri(/\bapi\b|endpoint|sdk|developer|reference|docs?|webhook/.test(text)),
    web: tri(/web|website|browser|portal|console|dashboard|studio|platform|product page/.test(text)),
    app: tri(/app|mobile|dashboard|console|studio|portal|workspace/.test(text))
  };
}

export function inferInputDataCandidates(context = {}) {
  const text = joinedText(context);
  const out = [];
  if (/audio|voice|speech|call|recording|transcri/.test(text)) out.push("audio");
  if (/text|prompt|message|chat|language/.test(text)) out.push("text");
  if (/document|pdf|file|ocr|invoice|contract|form|record/.test(text)) out.push("document", "uploaded_file");
  if (/image|scan|photo/.test(text)) out.push("image");
  if (/video|dubbing|subtitle/.test(text)) out.push("video");
  if (/code|repository|developer/.test(text)) out.push("code");
  if (/api payload|request body|json|endpoint|webhook/.test(text)) out.push("api_payload");
  if (/payment|bank|loan|lending|insurance|transaction|financial/.test(text)) out.push("payment");
  if (/usage log|analytics|telemetry|log/.test(text)) out.push("usage_log");
  return uniq(out.length ? out : ["unknown"]);
}

export function inferOutputCandidates(context = {}) {
  const text = joinedText(context);
  const out = [];
  if (/text[- ]?to[- ]?speech|tts|speech synthesis|voice generation|generate speech/.test(text)) out.push("spoken audio / synthesized voice");
  if (/speech[- ]?to[- ]?text|stt|asr|transcri|speech recognition/.test(text)) out.push("transcript / text output");
  if (/translation|translate|dubbing|subtitle/.test(text)) out.push("translated content / localized media");
  if (/ocr|document extraction|document parsing|document digit/.test(text)) out.push("extracted document text or structured data");
  if (/agent|workflow|integration|crm|core banking|payment|push outcome|action/.test(text)) out.push("workflow result / downstream system update");
  if (/embedding|vector|semantic search/.test(text)) out.push("vector representation / search result");
  if (/language model|llm|chat|completion|text generation|generative/.test(text)) out.push("generated text or model response");
  return uniq(out.length ? out : ["unknown"]);
}

export function inferPossibleArchetypes(context = {}) {
  const text = joinedText(context);
  const out = [];
  if (/speech[- ]?to[- ]?text|text[- ]?to[- ]?speech|tts|stt|asr|voice|audio|transcri|translation|dubbing/.test(text)) out.push("TRN");
  if (/generate|synthesis|synthesize|text generation|content generation|dubbing|translation|voice generation|spoken audio|generative/.test(text)) out.push("CRT");
  if (/document|file|upload|ocr|extract|parse|transcri|reader|summari[sz]e|contract review|record review/.test(text)) out.push("RDR");
  if (/agent|assistant|workflow|execute|action|pull customer data|push outcome|book|schedule|send|update|trigger/.test(text)) out.push("DOE");
  if (/orchestrat|route|multi-agent|tool|integration|connector|crm|core banking|payment system|subprocessor|model choice/.test(text)) out.push("ORC");
  if (/decision|eligibility|risk|compliance review|loan processing|recruit|screen|approve|score|ranking|triage/.test(text)) out.push("JDG");
  if (/compare|rank|score|benchmark|evaluate|match/.test(text)) out.push("CMP");
  if (/recommend|optimi[sz]e|best|improve|route/.test(text)) out.push("OPT");
  if (/health|patient|medical|safety/.test(text)) out.push("SHD");
  if (/robot|vehicle|physical movement|actuat/.test(text)) out.push("MOV");
  if (/general purpose|assistant|chatbot|copilot|foundation model|language model/.test(text)) out.push("UNI");
  return uniq(out);
}

export function inferPossibleSurfaces(context = {}) {
  const text = joinedText(context);
  const out = [];
  if (/enterprise|business|customer|b2b|private|on-prem|air-gapped|deployment/.test(text)) out.push("Enterprise-Private");
  if (/consumer|public|individual|end user|citizen/.test(text)) out.push("Consumer-Public");
  if (/personal data|pii|customer data|user data|contact|account|identity|phone|email/.test(text)) out.push("PII");
  if (/employee|employment|hr|recruit|candidate|hiring|workplace/.test(text)) out.push("Employment");
  if (/voice|audio|biometric|speaker|sensitive|patient|health|child/.test(text)) out.push("Sensitive/Biometric");
  if (/payment|bank|loan|lending|insurance|transaction|financial|core banking/.test(text)) out.push("Financial");
  if (/content|copyright|ip|document|file|contract|media|text|audio|video|image|translation|dubbing/.test(text)) out.push("Content&IP");
  if (/api|sdk|developer|integration|connector|cloud|hosting|model|infrastructure|endpoint|database|vector/.test(text)) out.push("Infrastructure");
  if (/health|patient|safety|medical|physical/.test(text)) out.push("Safety&Physical");
  if (/minor|child|children|student/.test(text)) out.push("Minors");
  return uniq(out.length ? out : ["Infrastructure"]);
}

export function inferArchitectureHintCandidates(context = {}) {
  const text = joinedText(context);
  const out = [];
  const add = (hint_type, hint_value, disposition = "confirmation_only") => out.push({ hint_type, hint_value, disposition });
  if (/memory|context|state/.test(text)) add("memory", "memory/context/state signal");
  if (/openai|anthropic|gemini|google|mistral|cohere|llama|deepseek|azure openai|bedrock|model choice|foundation model/.test(text)) add("model_provider", "model/provider/model-choice signal");
  if (/cloud|hosting|on-prem|air-gapped|india cloud|data residency/.test(text)) add("cloud_host", "deployment/hosting signal");
  if (/vector|embedding|semantic search/.test(text)) add("vector_db", "embedding/vector signal");
  if (/subprocessor|third[- ]party provider/.test(text)) add("subprocessor", "subprocessor/provider signal");
  if (/integration|connector|crm|core banking|payment system|webhook|api/.test(text)) add("integration", "integration/API/downstream system signal");
  return out;
}

export function inferDataProvenanceCandidates(context = {}) {
  const categories = inferInputDataCandidates(context);
  const text = joinedText(context);
  return categories.map((category) => ({
    data_origin: /customer|client|enterprise/.test(text) ? "customer_provided" : (/user|end user|consumer/.test(text) ? "user_provided" : "unknown"),
    data_subject: /employee|candidate|recruit/.test(text) ? "employee" : (/consumer|citizen/.test(text) ? "consumer" : (/developer/.test(text) ? "developer" : "unknown")),
    data_category: category === "uploaded_file" ? "uploaded_file" : category,
    storage_or_retention_signal: "not_visible_in_product_sources",
    training_or_finetuning_signal: "not_visible_in_product_sources"
  }));
}

export function buildDeterministicFieldPrefill(context = {}) {
  const possibleArchetypes = inferPossibleArchetypes(context);
  const possibleSurfaces = inferPossibleSurfaces(context);
  return {
    prefill_version: "stage5_deterministic_field_prefill_v1",
    deterministic_ownership_policy: "Runtime pre-populates obvious source/citation/channel/data/architecture candidates; model confirms decomposition and controlled classification.",
    possible_delivery_channels: inferDeliveryChannels(context),
    possible_input_data: inferInputDataCandidates(context),
    possible_output_or_result: inferOutputCandidates(context),
    possible_archetypes: possibleArchetypes,
    possible_archetype_labels: possibleArchetypes.map((code) => ({ code, label: ARCHETYPE_LABELS[code] || code })),
    possible_surfaces: possibleSurfaces,
    possible_surface_labels: possibleSurfaces.map((token) => ({ token, label: SURFACE_LABELS[token] || token })),
    possible_data_provenance: inferDataProvenanceCandidates(context),
    possible_architecture_hints: inferArchitectureHintCandidates(context)
  };
}
