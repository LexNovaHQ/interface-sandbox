async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || `Request failed: ${path}`);
  }

  return payload;
}

export function getHealth() {
  return request("/api/health");
}

export function runUrlDiligence(url) {
  return request("/api/diligence-url", {
    method: "POST",
    body: JSON.stringify({ url })
  });
}

export function runTextDiligence(text) {
  return request("/api/diligence-text", {
    method: "POST",
    body: JSON.stringify({ text })
  });
}

export function runAssembly(input) {
  return request("/api/assembly", {
    method: "POST",
    body: JSON.stringify(input || {})
  });
}

export function runDelivery(input) {
  return request("/api/delivery", {
    method: "POST",
    body: JSON.stringify(input || {})
  });
}

export function runMaintenance(input) {
  return request("/api/maintenance", {
    method: "POST",
    body: JSON.stringify(input || {})
  });
}
