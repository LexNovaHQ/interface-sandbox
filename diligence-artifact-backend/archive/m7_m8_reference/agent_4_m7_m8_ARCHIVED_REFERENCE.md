# ARCHIVED REFERENCE — RETIRED MERGED M7_M8 PROMPT

This file is archived for reference only. It must not be loaded by any live backend phase, route, validator, OpenAPI schema, or runtime packet.

Live execution must use separate phases:

1. `M7_TARGET_PROFILE`
2. `M8_TARGET_FEATURE_PROFILE`

Original live path retired from: `diligence-artifact-backend/prompts/agent_4_m7_m8.md`

Original blob SHA: `e5fc22a6e3b2edb9bbb61bcc9c63fe6a1754a04b`

Reason for retirement: the merged prompt writes four artifacts in one model phase and conflicts with the locked M7 profile-save-before-forensics-before-M8 doctrine.
