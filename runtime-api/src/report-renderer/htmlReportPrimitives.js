export const NAV = [["overview","Overview"],["executive-summary","Executive Summary"],["evidence-profile","Evidence & Profile"],["legal-stack","Legal Stack"],["findings","Findings"],["remediation","Remediation Path"],["appendix","Appendix"]];

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function text(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function asList(items) {
  const rows = safeArray(items).filter(Boolean);
  if (!rows.length) return `<p class="muted">No items recorded.</p>`;
  return `<ul>${rows.map((item) => `<li>${escapeHtml(typeof item === "string" ? item : text(item))}</li>`).join("")}</ul>`;
}

export function table(headers, rows) {
  const tableRows = safeArray(rows);
  if (!tableRows.length) return `<p class="muted">No rows recorded.</p>`;
  return `<div class="table-wrap"><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header.label)}</th>`).join("")}</tr></thead><tbody>${tableRows.map((row) => `<tr>${headers.map((header) => `<td>${header.render ? header.render(row) : escapeHtml(text(row[header.key]))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

export function metricCard(label, value, note = "") {
  return `<article class="metric"><div>${escapeHtml(label)}</div><strong>${escapeHtml(text(value, "0"))}</strong>${note ? `<small>${escapeHtml(note)}</small>` : ""}</article>`;
}

export function keyValue(rows = []) {
  return `<dl class="kv">${safeArray(rows).map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text(value))}</dd></div>`).join("")}</dl>`;
}

export function card(title, body, note = "") {
  return `<article class="card"><h3>${escapeHtml(title)}</h3>${note ? `<p class="muted">${escapeHtml(note)}</p>` : ""}${body}</article>`;
}

export function section(id, number, title, body) {
  return `<section id="${escapeHtml(id)}" class="report-section"><div class="section-title"><span>${escapeHtml(number)}</span><h2>${escapeHtml(title)}</h2></div>${body}</section>`;
}

export function navBar() {
  return `<nav class="top"><b>LEX NOVA</b><div>${NAV.map(([id, label]) => `<a href="#${id}">${escapeHtml(label)}</a>`).join("")}</div></nav>`;
}

export function rail() {
  return `<aside class="rail"><h4>Review Map</h4>${NAV.map(([id, label], index) => `<a href="#${id}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(label)}</a>`).join("")}</aside>`;
}

export function pageStyles() {
  return `:root{--bg:#050505;--card:#111;--line:rgba(197,160,89,.3);--gold:#C5A059;--text:#e8e2d4;--muted:#aaa;--paper:#f4ead4;--ink:#161616}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 10% 0,rgba(197,160,89,.18),transparent 30%),#050505;color:var(--text);font-family:Inter,system-ui,sans-serif;line-height:1.55}a{color:#e1c178}.top{position:sticky;top:0;z-index:5;background:rgba(5,5,5,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;padding:14px 28px}.top b{font-family:Georgia,serif;color:var(--gold);letter-spacing:.18em}.top div{display:flex;gap:16px;flex-wrap:wrap}.top a{color:var(--text);font-size:13px;text-decoration:none}.layout{max-width:1500px;margin:auto;display:grid;grid-template-columns:240px 1fr;gap:28px;padding:34px 28px 80px}.rail{position:sticky;top:76px;align-self:start;border:1px solid var(--line);background:rgba(17,17,17,.78);border-radius:22px;padding:18px}.rail h4{color:var(--gold);letter-spacing:.1em;text-transform:uppercase}.rail a{display:flex;gap:10px;padding:10px;color:var(--text);text-decoration:none}.rail span{color:var(--gold)}.report-section{margin-bottom:34px;scroll-margin-top:88px}.section-title span,.kicker{color:var(--gold);letter-spacing:.18em;text-transform:uppercase;font-size:12px}.section-title h2,h1,h3,h4{font-family:Georgia,serif;color:#fff8e6}h1{font-size:clamp(42px,7vw,84px);margin:.1em 0}.lead{font-size:19px;color:#d7d0c0}.small{font-size:16px}.hero,.summary{display:grid;grid-template-columns:1fr 330px;gap:20px}.doc,.card,.metric,.posture{border:1px solid var(--line);background:linear-gradient(180deg,#151515,#0b0b0b);border-radius:22px;padding:22px;box-shadow:0 20px 70px rgba(0,0,0,.25)}.card{margin:16px 0}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.metric div{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.metric strong{display:block;font:30px Georgia,serif;color:#fff8e6}.metric small,.muted{color:var(--muted)}.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.kv dt{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.kv dd{margin:3px 0 0;color:#fff8e6;word-break:break-word}.notice{border:1px solid var(--line);background:rgba(197,160,89,.08);border-radius:16px;padding:16px;margin:16px 0}.table-wrap{overflow:auto;border:1px solid rgba(197,160,89,.18);border-radius:16px;margin:10px 0}table{border-collapse:collapse;width:100%;min-width:760px}th,td{padding:10px 12px;border-bottom:1px solid rgba(197,160,89,.12);vertical-align:top;font-size:13px}th{text-align:left;color:#f2dfb3;background:rgba(197,160,89,.08);text-transform:uppercase;font-size:11px;letter-spacing:.08em}details{border:1px solid rgba(197,160,89,.22);border-radius:16px;padding:12px 14px;margin:12px 0;background:rgba(255,255,255,.02)}summary{cursor:pointer;color:#fff8e6;font-weight:650}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.grid>div{border:1px solid rgba(197,160,89,.14);border-radius:14px;padding:14px;background:rgba(255,255,255,.03)}.light{background:var(--paper);color:var(--ink);border-radius:18px;padding:18px}.light h4{color:#6b4d18}.dark{color:#2b2418}@media(max-width:1000px){.layout,.hero,.summary,.grid{display:block}.rail{display:none}.metrics{grid-template-columns:1fr}}@media print{.top,.rail{display:none}.layout{display:block;padding:0}.card,.doc,.metric,.posture{box-shadow:none;break-inside:avoid}}`;
}
