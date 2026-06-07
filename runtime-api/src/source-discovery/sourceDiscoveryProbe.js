function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeProbeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString();
  } catch {
    return null;
  }
}

function isAdmissibleStatus(status) {
  return status >= 200 && status < 400;
}

function isHardRejectStatus(status) {
  return status === 404 || status === 410;
}

async function fetchWithTimeout(url, { method, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "LexNovaHQ-SourceDiscovery/0.3B",
        "accept": "text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5"
      }
    });

    return {
      ok: true,
      status: response.status,
      final_url: normalizeProbeUrl(response.url) || url,
      content_type: response.headers.get("content-type") || ""
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      final_url: url,
      content_type: "",
      error: error?.name || error?.message || "FETCH_FAILED"
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeOneUrl(url, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 5000);
  const normalized = normalizeProbeUrl(url);

  if (!normalized) {
    return { url: String(url || ""), admitted: false, reason: "invalid_url" };
  }

  const head = await fetchWithTimeout(normalized, { method: "HEAD", timeoutMs });

  if (head.ok && isAdmissibleStatus(head.status)) {
    return {
      url: head.final_url || normalized,
      admitted: true,
      probe_method: "HEAD",
      status: head.status,
      content_type: head.content_type
    };
  }

  if (head.ok && isHardRejectStatus(head.status)) {
    return {
      url: normalized,
      admitted: false,
      probe_method: "HEAD",
      status: head.status,
      reason: "hard_reject_status"
    };
  }

  const get = await fetchWithTimeout(normalized, { method: "GET", timeoutMs });

  if (get.ok && isAdmissibleStatus(get.status)) {
    return {
      url: get.final_url || normalized,
      admitted: true,
      probe_method: "GET",
      status: get.status,
      content_type: get.content_type
    };
  }

  return {
    url: normalized,
    admitted: false,
    probe_method: "GET",
    status: get.status || head.status || null,
    reason: get.error || head.error || "not_admitted"
  };
}

export async function probeDeterministicSources(urls, options = {}) {
  const concurrency = Number(options.concurrency || 6);
  const delayMs = Number(options.delayMs || 50);
  const uniqueUrls = [...new Set((urls || []).map(normalizeProbeUrl).filter(Boolean))];
  const admitted = [];
  const rejected = [];
  let index = 0;

  async function worker() {
    while (index < uniqueUrls.length) {
      const currentIndex = index;
      index += 1;

      const result = await probeOneUrl(uniqueUrls[currentIndex], options);

      if (result.admitted) {
        admitted.push(result);
      } else {
        rejected.push(result);
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  const workerCount = Math.min(concurrency, uniqueUrls.length || 1);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return {
    admitted,
    rejected,
    counts: {
      input_urls: uniqueUrls.length,
      admitted: admitted.length,
      rejected: rejected.length
    }
  };
}

