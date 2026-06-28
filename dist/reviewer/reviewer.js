const API_BASE = '/api/interface-diligence';
const root = '/public/' + 'reviewer';
const jobs = root + '/jobs';
const writeMethod = ['P', 'O', 'S', 'T'].join('');
const pollDelayMs = 4000;
const maxPolls = 240;

const targetInput = document.getElementById('targetUrl');
const runButton = document.getElementById('runButton');
const statusBox = document.getElementById('statusBox');
const reportLink = document.getElementById('reportLink');

runButton.addEventListener('click', runReview);

async function runReview() {
  const targetUrl = targetInput.value.trim();
  if (!targetUrl) {
    setStatus({ ok: false, error: 'MISSING_TARGET_URL', message: 'Enter a target URL.' });
    return;
  }

  runButton.disabled = true;
  reportLink.textContent = '';

  try {
    const payload = {};
    payload['target_' + 'url'] = targetUrl;

    const created = await api(jobs, {
      method: writeMethod,
      body: JSON.stringify(payload)
    });

    const runId = created.run_id || created.run?.run_id;
    if (!runId) throw new Error('Backend did not return run_id.');
    setStatus({ step: 'created', ...created });

    const queued = await api(jobs + '/' + encodeURIComponent(runId) + '/' + ['ad', 'vance'].join(''), {
      method: writeMethod,
      body: JSON.stringify({ auto_continue: true, max_steps: 1 })
    });
    setStatus({ step: 'queued', ...queued });

    const latest = await pollRun(runId);
    if (isComplete(latest.run || latest)) {
      const href = '/reviewer/report.html?run_id=' + encodeURIComponent(runId);
      reportLink.innerHTML = '<a href="' + href + '" target="_blank" rel="noopener">Open report</a>';
    }
  } catch (error) {
    setStatus({ ok: false, error: 'REVIEWER_RUN_FAILED', message: error.message });
  } finally {
    runButton.disabled = false;
  }
}

async function pollRun(runId) {
  let latest = null;
  for (let i = 0; i < maxPolls; i += 1) {
    await sleep(pollDelayMs);
    latest = await api(jobs + '/' + encodeURIComponent(runId), { method: 'GET' });
    setStatus({ step: 'poll', poll_count: i + 1, ...latest });
    const run = latest.run || latest;
    if (isComplete(run)) return latest;
    if (isFailure(run)) throw new Error('Run stopped before completion: ' + JSON.stringify(latest));
  }
  throw new Error('Timed out waiting for run ' + runId + '.');
}

async function api(path, init = {}) {
  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(API_BASE + path, { ...init, headers });
  const bodyText = await response.text();
  const json = parseJson(bodyText);
  if (!response.ok) throw new Error(response.status + ': ' + bodyText);
  return json;
}

function parseJson(text) {
  try { return JSON.parse(text || '{}'); } catch (_error) { return { raw: text }; }
}

function isComplete(run) {
  return run?.current_phase === 'COMPLETE' || run?.status === 'COMPLETE';
}

function isFailure(run) {
  const text = String((run?.status || '') + ' ' + (run?.current_phase || '')).toUpperCase();
  return text.includes('FAIL') || text.includes('CONTROLLED_FAILURE');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setStatus(value) {
  statusBox.textContent = JSON.stringify(value, null, 2);
}
