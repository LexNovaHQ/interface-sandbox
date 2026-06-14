# Functional Assembly Intake Vault v1

## Status

This contract locks the post-Stage-9 / pre-Assembly intake structure.

It supersedes `VAULT_JS_CANONICAL_MAP_v1.md` only for the user-facing intake form, functional question sections, expanded technical architecture, and Assembly instruction layer.

`VAULT_JS_CANONICAL_MAP_v1.md` remains authoritative for the nested `vault_payload` derivation discipline, prefill honesty line, and the rule that the model never invents Vault field names.

## Build order lock

```text
1. Update current Vault schema into the full Functional Assembly Intake Vault.
2. Map each functional Vault/intake field to canonical Diligence Engine outputs.
3. Build Stage 10 source packet and deterministic handoff against the updated schema.
```

Stage 10 must not scrape broad Stage 9 report prose. It must consume canonical upstream artifacts and populate this schema deterministically.

## Canonical schema

```text
data/schemas/vault.schema.json
```

Canonical schema version:

```text
functional_assembly_intake_vault_v1
```

## Top-level object

```text
vault_schema_version
intake_mode
functional_sections
vault_payload
vault_prefill_suggestions
vault_confirmation_questions
assembly_handoff_intake
source_trace
status
submittedAt
```

## Functional sections

The visible form is organized into the following sections:

```text
company_jurisdiction_contacts
product_delivery_commercial_model
ai_functionality_autonomy_user_reliance
data_users_regulated_surfaces
technical_architecture_ai_supply_chain_integrations
contracting_output_customer_commitments
operational_controls_human_review_incident_handling
document_assembly_instructions
counsel_review_localisation
```

Each question must carry:

```text
section_key
question_key
question
answer_type
vault_match
vault_paths
assembly_paths
priority
required_for
prefill_status
```

`vault_match` must be one of:

```text
perfect
partial
none
```

This allows the UI to ask TMT-grade functional questions while the backend preserves exact field mapping.

## Nested strict Vault payload

The final strict payload remains nested under:

```text
vault_payload
```

It contains:

```text
baseline
architecture
archetypes
compliance
status
submittedAt
```

This preserves the old four-group Vault discipline while allowing a richer intake form and Assembly bridge.

## Expanded technical architecture lock

The old shallow provider-checkbox intake is retired as the user-facing structure.

The canonical functional technical section is:

```text
technical_architecture_ai_supply_chain_integrations
```

It covers:

```text
AI provider stack
model architecture and memory
upstream providers and subprocessors
downstream integrations and external actions
hosting, infrastructure and environments
API, developer and customer-side configuration
```

The visible form should ask for an AI provider stack as a multi-select, then map known providers to exact Vault paths.

Canonical provider options include:

```text
openai
anthropic
google_gemini
cohere
mistral
meta_llama
deepseek
xai
azure_openai
aws_bedrock
self_hosted_oss
other
unknown
```

Known providers may also be mirrored into compatibility flags under:

```text
architecture.sub_processors.*
```

but the user-facing question is the provider stack, not one checkbox per provider.

## Assembly layer lock

Because this is the only form between Diligence and Final Assembly, the schema includes:

```text
assembly_handoff_intake
```

It contains:

```text
package_selection
document_routes
drafting_preferences
output_options
localisation
local_counsel_review
operational_controls
source_materials
unresolved_gap_policy
assembly_warnings
```

These fields are not forced into `vault_payload` unless a matching Vault path exists. They feed the Assembly Engine, document routing, counsel review queue, and output controls.

## Review-Ready boundary

Every Assembly path remains subject to the Lex Nova Review-Ready boundary:

```text
Review-Ready Drafts only.
Local counsel review required.
No legal advice.
No law-firm positioning.
```

## Retired assumptions

The following assumptions are retired:

```text
Vault form equals strict four-group payload only.
Technical architecture equals model-provider checkbox list.
Assembly instructions are outside the Vault/intake contract.
Human review is a Vault payload field.
meta is a Vault payload group.
Stage 10 can scrape the human Stage 9 report body.
```

## Implementation boundary

This contract updates the Vault schema and intake structure only.

The next implementation layer must map every field to canonical Diligence Engine outputs before Stage 10 is rebuilt.
