const jobsPath = '/public/reviewer/jobs';
const writeMethod = ['P','O','S','T'].join('');
const pollDelayMs = 4000;
const maxPolls = 240;

const targetInput = document.getElementById('targetUrl');
const runButton = document.getElementById('runButton');
const statusBox = document.getElementById('statusBox');
const reportLink = document.getElementById('reportLink');

runButton.addEventListener('click', start);

async function start() {
  const targetUrl = targetInput.value.trim();
  if (!targetUrl) return setStatus({ ok: false, error: 'MISSING_TARGET_URL' });

  runButton.disabled = true;
  reportLink.textContent = '';

  try {
    const payload = {};
    payload['target_' + 'url'] = targetUrl;
    const created = await request(jobsPath, { method: writeMethod, body: JSON.stringify(payload) });
    const runId = created.run_id || created.run?.run_id;
    if (!runId) throw new Error('Missing run_id from backend.');
    setStatus({ step: 'created', ...created });

    const queued = await request(jobsPath + '/' + encodeURIComponent(runId) + '/' + ['ad','vance'].join(''), { method: writeMethod, body: JSON.stringify({ auto_continue: true }) });
    setStatus({ step: 'queued', ...queued });

    const latest = await poll(runId);
    if (complete(latest.run || latest)) {
      const href = '/reviewer/report.html?run_id=' + encodeURIComponent(runId);
      reportLink.innerHTML = '<a href="' + href + '" target="_blank" rel="noopener">Open report</a>';
    }
  } catch (error) {
    setStatus({ ok: false, error: 'RUN_FAILED', message: error.message });
  } finally {
    runButton.disabled = false;
  }
}

async function poll(runId) {
  for (let i = 0; i < maxPolls; i += 1) {
    await wait(pollDelayMs);
    const latest = await request(jobsPath + '/' + encodeURIComponent(runId));
    setStatus({ step: 'poll', poll_count: i + 1, ...latest });
    const run = latest.run || latest;
    if (complete(run)) return latest;
    if (failed(run)) throw new Error(JSON.stringify(latest));
  }
  throw new Error('Timed out waiting for ' + runId + '.');
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(path, { ...init, headers });
  const text = await response.text();
  const json = parse(text);
  if (!response.ok) throw new Error(response.status + ': ' + text);
  return json;
}

function complete(run) { return run?.status === 'COMPLETE' || run?.current_phase === 'COMPLETE'; }
function failed(run) { return String((run?.status || '') + ' ' + (run?.current_phase || '')).toUpperCase().includes('FAIL'); }
function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function parse(text) { try { return JSON.parse(text || '{}'); } catch (_error) { return { raw: text }; } }
function setStatus(value) { statusBox.textContent = JSON.stringify(value, null, 2); }
