import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

OUTPUT = Path(__file__).resolve().parent.parent / "audits" / "CO_FINAL_BRANCH_LIVE_PREFLIGHT.json"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

report = {
    "artifact_type": "co_final_branch_live_preflight_receipt",
    "event_name": os.environ.get("GITHUB_EVENT_NAME"),
    "git_ref": os.environ.get("GITHUB_REF"),
    "required_presence": {},
    "optional_presence": {},
}

required = [
    "GCP_PROJECT_ID",
    "GCP_REGION",
    "GCP_ARTIFACT_CLOUD_RUN_SERVICE",
    "GCP_ARTIFACT_RUNTIME_SERVICE_ACCOUNT",
    "GCP_DEPLOY_SERVICE_ACCOUNT",
    "GCP_WORKLOAD_IDENTITY_PROVIDER",
    "GPT_ACTION_API_KEY",
    "GEMINI_API_KEYS",
    "DRIVE_PARENT_FOLDER_ID",
    "SHEETS_SPREADSHEET_ID",
    "CLOUD_TASKS_QUEUE",
]
optional = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]
report["required_presence"] = {key: bool(os.environ.get(key, "").strip()) for key in required}
report["optional_presence"] = {key: bool(os.environ.get(key, "").strip()) for key in optional}
report["required_complete"] = all(report["required_presence"].values())


def save() -> None:
    OUTPUT.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def request_json(url: str, *, token: str | None = None, data: bytes | None = None, content_type: str | None = None) -> dict:
    headers: dict[str, str] = {}
    if token:
        headers["Authorization"] = "Bearer " + token
    if content_type:
        headers["Content-Type"] = content_type
    request = urllib.request.Request(url, data=data, headers=headers, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)


try:
    if not report["required_complete"]:
        raise RuntimeError("required_live_configuration_missing")

    provider = os.environ["GCP_WORKLOAD_IDENTITY_PROVIDER"].strip()
    for prefix in ("https://iam.googleapis.com/", "//iam.googleapis.com/"):
        if provider.startswith(prefix):
            provider = provider[len(prefix) :]

    oidc_audience = "https://iam.googleapis.com/" + provider
    oidc_url = os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"]
    oidc_url += ("&" if "?" in oidc_url else "?") + "audience=" + urllib.parse.quote(oidc_audience, safe="")
    oidc_request = urllib.request.Request(
        oidc_url,
        headers={"Authorization": "Bearer " + os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]},
    )
    with urllib.request.urlopen(oidc_request, timeout=30) as response:
        oidc_token = json.load(response)["value"]

    payload = oidc_token.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    claims = json.loads(base64.urlsafe_b64decode(payload.encode("ascii")))
    report["github_oidc_token_issued"] = True
    report["github_oidc_claims"] = {
        key: claims.get(key)
        for key in ("repository", "ref", "event_name", "sub", "workflow")
    }

    sts_data = urllib.parse.urlencode(
        {
            "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
            "audience": "//iam.googleapis.com/" + provider,
            "scope": "https://www.googleapis.com/auth/cloud-platform",
            "requested_token_type": "urn:ietf:params:oauth:token-type:access_token",
            "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
            "subject_token": oidc_token,
        }
    ).encode("utf-8")
    sts = request_json(
        "https://sts.googleapis.com/v1/token",
        data=sts_data,
        content_type="application/x-www-form-urlencoded",
    )
    federated_token = sts["access_token"]
    report["google_sts_exchange_succeeded"] = True

    service_account = urllib.parse.quote(os.environ["GCP_DEPLOY_SERVICE_ACCOUNT"].strip(), safe="")
    iam_data = json.dumps(
        {
            "scope": ["https://www.googleapis.com/auth/cloud-platform"],
            "lifetime": "1800s",
        }
    ).encode("utf-8")
    impersonation = request_json(
        f"https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/{service_account}:generateAccessToken",
        token=federated_token,
        data=iam_data,
        content_type="application/json",
    )
    access_token = impersonation["accessToken"]
    report["service_account_impersonation_succeeded"] = True

    project = urllib.parse.quote(os.environ["GCP_PROJECT_ID"], safe="")
    region = urllib.parse.quote(os.environ["GCP_REGION"], safe="")
    service_name = urllib.parse.quote(os.environ["GCP_ARTIFACT_CLOUD_RUN_SERVICE"], safe="")
    queue_name = urllib.parse.quote(os.environ["CLOUD_TASKS_QUEUE"], safe="")
    service = request_json(
        f"https://run.googleapis.com/v2/projects/{project}/locations/{region}/services/{service_name}",
        token=access_token,
    )
    queue = request_json(
        f"https://cloudtasks.googleapis.com/v2/projects/{project}/locations/{region}/queues/{queue_name}",
        token=access_token,
    )

    containers = service.get("template", {}).get("containers", [])
    env_names = sorted(
        {
            entry.get("name")
            for container in containers
            for entry in container.get("env", [])
            if entry.get("name")
        }
    )
    required_env = {
        "GCP_PROJECT_ID",
        "GCP_REGION",
        "DRIVE_PARENT_FOLDER_ID",
        "SHEETS_SPREADSHEET_ID",
        "GPT_ACTION_API_KEY",
        "GEMINI_API_KEYS",
        "CLOUD_TASKS_QUEUE",
        "CLOUD_TASKS_LOCATION",
    }
    report["cloud_run_service_ready"] = bool(service.get("uri"))
    report["cloud_run_latest_ready_revision"] = service.get("latestReadyRevision", "")
    report["cloud_run_runtime_env_names_missing"] = sorted(required_env.difference(env_names))
    report["cloud_tasks_queue_state"] = queue.get("state", "UNKNOWN")
    report["cloud_tasks_queue_name_present"] = bool(queue.get("name"))

    health_url = service.get("uri", "").rstrip("/") + "/health"
    health = request_json(health_url)
    report["health_http_200"] = True
    report["health_ok"] = health.get("ok") is True
    report["health_status"] = health.get("status", "")
    report["preflight_succeeded"] = bool(
        report["cloud_run_service_ready"]
        and not report["cloud_run_runtime_env_names_missing"]
        and report["cloud_tasks_queue_name_present"]
        and report["health_ok"]
    )
    if not report["preflight_succeeded"]:
        raise RuntimeError("deployed_runtime_contract_incomplete")
except urllib.error.HTTPError as error:
    body = error.read().decode("utf-8", errors="replace")
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        parsed = {"message": body[:1000]}
    report["preflight_succeeded"] = False
    report["failure_stage"] = "http_exchange"
    report["failure_http_status"] = error.code
    report["failure_error"] = parsed.get("error", parsed)
except Exception as error:
    report["preflight_succeeded"] = False
    report["failure_stage"] = "local_or_contract_validation"
    report["failure_error"] = {"type": type(error).__name__, "message": str(error)}
finally:
    save()

sys.exit(0 if report.get("preflight_succeeded") else 1)
