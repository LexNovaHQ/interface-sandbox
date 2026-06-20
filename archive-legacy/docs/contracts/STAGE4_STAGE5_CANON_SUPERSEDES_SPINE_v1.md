# Stage 4 / Stage 5 Canon Supremacy Addendum v1

## Status

This addendum is binding for Stage 4 and Stage 5 across the Diligence Engine.

It supersedes older references in the Contract Spine, Node 5B contract, runtime GPT notes, prompt index, archive docs, generated examples, and old report fixtures where those references treat `target_profile`, `primary_product`, or `product_feature_map[]` as canonical.

The active Stage 4/5 truth is the locked conversation canon and `docs/contracts/STAGE4_STAGE5_CANON_FIELD_DICTIONARY_v1.md`.

---

## Stage 4 Canon

Runtime output key may remain:

```text
company_profile
```

Canonical object is:

```text
target_profile_v2
```

Stage 4 owns:

```text
identity
jurisdiction
business_model
market_context
product_baseline
data_touchpoint_map
vault_baseline_candidates
pipeline_assumptions
evidence
limitations
```

Stage 4 may read all admitted docs, but only for identity, profile, contact, and baseline extraction.

Stage 4 must not own:

```text
feature archetype classification
final regulated exposure
legal-stack adequacy
registry threat evaluation
Vault handoff
```

---

## Stage 5 Canon

Runtime output key may remain:

```text
target_feature_profile
```

Canonical object is:

```text
feature_profile_v2
```

Canonical feature array is:

```text
feature_inventory[]
```

Legacy compatibility only:

```text
product_feature_map[]
primary_product
target_profile inside Stage 5
```

Stage 5 owns:

```text
feature_inventory[]
feature_inventory[].data_provenance[]
data_provenance_map[]
feature_inventory[].archetype_codes[]
feature_inventory[].archetype_provenance[]
feature_inventory[].surface_tokens[]
feature_inventory[].surface_provenance[]
regulated_surface_map[]
architecture_hints[]
commercial_scan
vault_feature_candidates
evidence
limitations
```

Stage 5 must not rewrite Stage 4 identity, jurisdiction, legal name, entity type, address, legal email, privacy email, or legal-stack facts.

Stage 5 may use registry-key vocabulary for archetype/surface meanings. Stage 7 alone evaluates Hunter Trigger and threat row status.

---

## Runtime Validation Rule

Schemas and guardrails must normalize to this canon, not the other way round.

Only these Stage 5 conditions may block runtime:

```text
1. Output is not a JSON object.
2. No usable feature_inventory can be reconstructed.
3. Third-party / invented / malformed / non-package / non-first-party source contamination.
4. Output is too structurally corrupt to canonicalize.
```

Everything else must be `REPAIRABLE` or `WARNING`.

---

## Downstream Mapping Rule

Stage 9, Node 5B, Vault handoff, report renderer, and generated bundles must consume:

```text
target_profile_v2
feature_profile_v2.feature_inventory[]
```

They must not treat old `target_profile`, `primary_product`, or `product_feature_map[]` as canonical truth.

*End of addendum.*
