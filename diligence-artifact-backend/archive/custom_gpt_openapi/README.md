# Archived Custom GPT OpenAPI Schemas

Custom GPT action schemas are retired from the live reviewer backend.

The backend should run reviewer jobs through `/v1/reviewer/jobs` and `/v1/reviewer/jobs/{run_id}/advance` only. Agent-specific custom GPT action schemas must not control orchestration, prompt structure, or artifact sequencing.
