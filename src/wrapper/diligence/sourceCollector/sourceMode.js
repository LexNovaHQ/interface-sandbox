export const SOURCE_MODES = Object.freeze({
  URL: "url",
  TEXT: "text",
  URL_PLUS_TEXT: "url_plus_text"
});

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizePastedText(value) {
  const text = cleanString(value);
  return text ? text.replace(/\r\n/g, "\n") : "";
}

export function normalizeHttpUrl(value) {
  const raw = cleanString(value);
  if (!raw) return "";

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url;
  try {
    url = new URL(candidate);
  } catch (error) {
    throw new Error(`Invalid URL: ${raw}`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`URL must use http or https: ${raw}`);
  }

  url.hash = "";
  return url.toString();
}

export function normalizeManualUrls(value) {
  const urls = Array.isArray(value) ? value : [];
  const normalized = urls.map(normalizeHttpUrl).filter(Boolean);
  return [...new Set(normalized)];
}

function getPrimaryUrlInput(input = {}) {
  return input.primary_url || input.url || input.target_url || input.website || "";
}

export function normalizeSourceInput(input = {}) {
  const primary_url = normalizeHttpUrl(getPrimaryUrlInput(input));
  const manual_urls = normalizeManualUrls(input.manual_urls || input.urls || []);
  const pasted_text = normalizePastedText(input.pasted_text || input.text || input.pasted_public_material || "");

  const urlInputs = [...new Set([primary_url, ...manual_urls].filter(Boolean))];
  const hasUrlInput = urlInputs.length > 0;
  const hasTextInput = pasted_text.length > 0;

  if (!hasUrlInput && !hasTextInput) {
    throw new Error("Source Collector requires at least one URL or pasted public text.");
  }

  const source_mode = hasUrlInput && hasTextInput
    ? SOURCE_MODES.URL_PLUS_TEXT
    : hasUrlInput
      ? SOURCE_MODES.URL
      : SOURCE_MODES.TEXT;

  return {
    source_mode,
    target_input: {
      primary_url: primary_url || undefined,
      manual_urls,
      company_name: cleanString(input.company_name || input.companyName) || undefined,
      product_context: cleanString(input.product_context || input.productDesc) || undefined,
      pasted_text_present: hasTextInput,
      submitted_at: input.submitted_at || new Date().toISOString()
    },
    pasted_text,
    url_inputs: urlInputs
  };
}
