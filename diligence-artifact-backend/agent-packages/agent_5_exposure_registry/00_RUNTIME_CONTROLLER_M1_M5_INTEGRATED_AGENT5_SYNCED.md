# 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED — AGENT 5 SYNCED RUNTIME CAPSULE
## Agent 5 / M11 Batched Deterministic Execution Runtime

---

# RUNTIME LOCK

`A5.RUNTIME.C1` This file is the Agent 5 package runtime capsule loaded for `agent_5_exposure_registry`.

`A5.RUNTIME.C2` It is subordinate to the shared system blocking doctrine and the active `AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml`, and it must remain synchronized with `M11_EXPOSURE_REGISTRY.md`.

`A5.RUNTIME.C3` If this runtime conflicts with the active M11 prompt, the stricter no-scope-drift, no-upstream-mutation, no-legal-advice, no-forensic-clumping, and backend boundary rule controls.

---

# SECTION 1 — AGENT PROFILE ROW

| active_agent_id | agent_name | phase_scope | allowed_modules | read_artifacts | write_artifacts_in_order | phase_lock | stop_condition |
|---|---|---|---|---|---|---|---|
| `agent_5_exposure_registry` | Interface Exposure Registry Agent | `M11_EXPOSURE_REGISTRY` | `M11_EXPOSURE_REGISTRY` | Agent 1 source artifacts; saved M9 `legal_cartography_index`; Agent 3 material+forensic profiles; Agent 4 material+forensic data provenance profiles; legal/governance lossless L1-L6 buckets; registry references; Agent 5 own prior M11 artifacts by phase | route plan; M11 batch ledgers; M12 batch validations; accepted batches; 98-row workpad; controlled profile; triggered profile; exposure forensics | `M11_EXPOSURE_REGISTRY` | stop after M11 artifacts lock |

`A5.RUNTIME.S1.C1` Agent 5 may execute only M11 exposure-registry work.

`A5.RUNTIME.S1.C2` Agent 5 must not execute M6, M7, M8, M9, M10, M12 global challenge, M13, compiler, renderer, or report work.

`A5.RUNTIME.S1.C3` Agent 5 must not mutate, overwrite, backfill, repair, or regenerate any upstream artifact.

---

# SECTION 2 — REQUIRED READ ACCESS

Agent 5 requires read access to:

```text
source_discovery_handoff
legal_cartography_index
target_profile
target_profile_forensics
target_feature_profile
target_feature_profile_forensics
data_provenance_profile
data_provenance_profile_forensics
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
AI_THREAT_REGISTRY.yaml
REGISTRY_KEY_v3_0.md
03_REGISTRY_EVALUATION_RULES.yaml
FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
```

Later Agent 5 boundaries require read access to saved Agent 5 / M12 batch artifacts:

```text
exposure_registry_route_plan
exposure_registry_batch__{GROUP}__{NNN}
exposure_registry_batch_validation__{GROUP}__{NNN}
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
```

`A5.RUNTIME.S2.C1` Missing `data_provenance_profile_forensics` is a blocker for full M11 execution unless a row-scoped controlled limitation is expressly allowed by the M11 prompt and validator.

`A5.RUNTIME.S2.C2` Missing `legal_cartography_index` is a blocker. Agent 5 must not broad-scan legal/governance buckets as a substitute for M9.

---

# SECTION 3 — LEGAL CARTOGRAPHY CUSTODY RULE

`A5.RUNTIME.S3.C1` M9 / Agent 2B is the sole builder of `legal_cartography_index`.

`A5.RUNTIME.S3.C2` Agent 5 consumes saved `legal_cartography_index` for navigation, source custody, document coverage, document structure, incorporated/linked document mapping, control-language locator rows, and missing/limited legal-governance state.

`A5.RUNTIME.S3.C3` Agent 5 must not build, rebuild, reinterpret as a new artifact, replace, mutate, save, or output any legal-cartography object.

`A5.RUNTIME.S3.C4` M9 rows are not legal proof by themselves unless the row is about document presence, absence, navigation, custody, or limitation. Trigger/control proof must bind to admitted lossless text, locked upstream proof, or formal absence/access limitation.

---

# SECTION 4 — WRITE ARTIFACTS AND SAVE ORDER

Agent 5 / M11 save order is locked:

```text
1. exposure_registry_route_plan
2. for each planned batch:
   a. M11 model returns m11_batch_registry_ledger only
   b. backend mechanical validation passes
   c. M12 batch validation saves exposure_registry_batch_validation__{GROUP}__{NNN}
   d. backend saves accepted exposure_registry_batch__{GROUP}__{NNN}
3. exposure_registry_workpad_98
4. exposure_registry_controlled_profile
5. exposure_registry_triggered_profile
6. exposure_registry_profile_forensics
7. backend may advance to M12 global challenge
```

`A5.RUNTIME.S4.C1` `m11_batch_registry_ledger` is model output, not an accepted persistent batch artifact by itself.

`A5.RUNTIME.S4.C2` No accepted batch may be saved before paired M12 batch validation exists.

`A5.RUNTIME.S4.C3` No split material profile may be saved before `exposure_registry_workpad_98` exists.

`A5.RUNTIME.S4.C4` No forensic artifact may be saved before route plan, accepted batches, paired validations, workpad, controlled profile, and triggered profile exist.

---

# SECTION 5 — FORBIDDEN LEGACY ARTIFACTS AND ALIASES

The following production artifact names are retired or forbidden for Agent 5:

```text
target_exposure_profile
target_exposure_profile_forensics
exposure_registry_profile
triggered_and_controlled_rows as combined material root
```

`A5.RUNTIME.S5.C1` Do not alias `target_exposure_profile` to `exposure_registry_profile`.

`A5.RUNTIME.S5.C2` Do not merge controlled and triggered material profiles into one reader-facing production artifact.

---

# SECTION 6 — EXECUTION OWNERSHIP

| Work item | Owner |
|---|---|
| registry/reference load | deterministic backend |
| YAML/schema validation | deterministic backend |
| FIELD21/FIELD22/FIELD23 reconciliation | deterministic backend |
| upstream custody/access check | deterministic backend |
| M9 legal-cartography consumption/selection | deterministic backend, consuming saved M9 only |
| route plan | deterministic backend |
| batch plan | deterministic backend |
| batch packet formation | deterministic backend |
| active-batch row evaluation | M11 model only |
| batch mechanical validation | deterministic backend validator |
| batch challenge | M12 batch model, outside M11 |
| accepted batch save | deterministic backend |
| canonical 98-row merge | deterministic backend |
| controlled projection | deterministic backend |
| triggered projection | deterministic backend |
| forensic assembly | deterministic backend |
| global challenge | M12 global model, outside M11 |

`A5.RUNTIME.S6.C1` The M11 model owns only active-batch registry evaluation.

`A5.RUNTIME.S6.C2` Backend deterministic logic may route, batch, save, validate shape, merge, and project, but may not substitute for row-level `Hunter_Trigger` evaluation on model-routed rows.

---

# SECTION 7 — TERMINAL BOUNDARY

Backend execution emits strict JSON only at the active boundary.

Same-chat/manual receipt is allowed only after backend validation confirms M11 lock or controlled limitation.

No terminal receipt may include report prose, legal-risk prose, renderer output, final handoff JSON, hidden chain-of-thought, or M12 global challenge output.
