import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUTPUT = Path(__file__).resolve().parent.parent / "audits" / "CO_FINAL_PUBLIC_TRANSPORT_SMOKE.json"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
BASE_URL = os.environ.get("CO_FINAL_PUBLIC_BASE_URL", "https://sandbox.lexnovahq.com").rstrip("/")

receipt = {
    "artifact_type": "co_final_public_transport_smoke_receipt",
    "started_at": datetime.now(timezone.utc).isoformat(),
    "public_base_url": BASE_URL,
    "target_url": "https://example.com",
    "live_transport_succeeded": False,
    "poll_snapshots": [],
}


def save() -> None:
    receipt["finished_at"] = datetime.now(timezone.utc).isoformat()
    OUTPUT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def request_json(path: str, *, method: str = "GET", body: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(BASE_URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            payload = json.load(response)
            return response.status, payload
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"message": raw[:2000]}
        raise RuntimeError(f"HTTP_{error.code}:{path}:{json.dumps(payload, sort_keys=True)}") from error


try:
    health_status, health = request_json("/health")
    receipt["health"] = {
        "http_status": health_status,
        "ok": health.get("ok") is True,
        "status": health.get("status", ""),
    }
    if health_status != 200 or health.get("ok") is not True:
        raise RuntimeError("public_health_not_ready")

    create_status, created = request_json(
        "/public/diligence-system/jobs",
        method="POST",
        body={
            "target": "CO-FINAL Public Transport Smoke",
            "target_url": receipt["target_url"],
            "notes": "Synthetic transport/custody smoke. No client data. Auto-continuation disabled.",
        },
    )
    run_id = created.get("run_id") or created.get("run", {}).get("run_id")
    if create_status != 201 or not run_id:
        raise RuntimeError("public_run_creation_failed")
    receipt["run_id"] = run_id
    receipt["create"] = {
        "http_status": create_status,
        "status": created.get("status", ""),
        "current_phase": created.get("current_phase", ""),
        "runner_mode": created.get("runner_mode", ""),
        "runner_state": created.get("runner_state", ""),
    }

    advance_status, advanced = request_json(
        f"/public/diligence-system/jobs/{urllib.parse.quote(run_id, safe='')}/advance",
        method="POST",
        body={"auto_continue": False, "max_steps": 1},
    )
    receipt["advance"] = {
        "http_status": advance_status,
        "queued": advanced.get("queued") is True,
        "already_running": advanced.get("already_running") is True,
        "terminal": advanced.get("terminal") is True,
        "runner_state": advanced.get("runner_state", ""),
        "status": advanced.get("status", ""),
        "current_phase": advanced.get("current_phase", ""),
    }
    if advance_status not in (200, 202) or not (advanced.get("queued") or advanced.get("already_running") or advanced.get("terminal")):
        raise RuntimeError("cloud_tasks_advance_not_accepted")

    final_payload = None
    for attempt in range(1, 41):
        poll_status, payload = request_json(f"/public/diligence-system/jobs/{urllib.parse.quote(run_id, safe='')}")
        run = payload.get("run", payload)
        artifacts = payload.get("artifacts", [])
        snapshot = {
            "attempt": attempt,
            "http_status": poll_status,
            "status": run.get("status", ""),
            "current_phase": run.get("current_phase", ""),
            "central_phase": run.get("central_phase", ""),
            "runner_state": run.get("runner_state", ""),
            "runner_task_name_present": bool(run.get("runner_task_name")),
            "runner_last_error": run.get("runner_last_error", ""),
            "artifact_count": len(artifacts),
        }
        receipt["poll_snapshots"].append(snapshot)
        final_payload = payload
        if run.get("runner_state") in {"IDLE", "COMPLETE", "FAILED", "RETRY_SCHEDULED"} and attempt > 1:
            break
        time.sleep(15)

    if not final_payload:
        raise RuntimeError("poll_never_returned")
    run = final_payload.get("run", final_payload)
    artifacts = final_payload.get("artifacts", [])
    receipt["final_run"] = {
        "status": run.get("status", ""),
        "current_phase": run.get("current_phase", ""),
        "central_phase": run.get("central_phase", ""),
        "runner_mode": run.get("runner_mode", ""),
        "runner_state": run.get("runner_state", ""),
        "runner_task_name_present": bool(run.get("runner_task_name")),
        "runner_last_error": run.get("runner_last_error", ""),
        "artifact_count": len(artifacts),
    }
    receipt["artifacts"] = [
        {
            "artifact_name": item.get("artifact_name", ""),
            "phase": item.get("phase", ""),
            "lock_status": item.get("lock_status", ""),
            "latest_version": item.get("latest_version", item.get("version")),
        }
        for item in artifacts
    ]

    annex_status, annex = request_json(f"/public/diligence-system/technical-annexure/{urllib.parse.quote(run_id, safe='')}")
    receipt["technical_annexure"] = {
        "http_status": annex_status,
        "ok": annex.get("ok") is True,
        "artifact_count": annex.get("artifact_count", 0),
        "manifest_only": annex.get("manifest_only") is True,
    }

    receipt["live_transport_succeeded"] = bool(
        receipt["health"]["ok"]
        and receipt["advance"]["queued"]
        and receipt["final_run"]["runner_task_name_present"]
        and receipt["final_run"]["runner_state"] in {"IDLE", "COMPLETE", "RETRY_SCHEDULED"}
        and receipt["technical_annexure"]["ok"]
    )
    if not receipt["live_transport_succeeded"]:
        raise RuntimeError("public_transport_or_custody_evidence_incomplete")
except Exception as error:
    receipt["failure"] = {"type": type(error).__name__, "message": str(error)[:3000]}
finally:
    save()

sys.exit(0 if receipt.get("live_transport_succeeded") else 1)
