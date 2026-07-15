# Phase 13 Domain Activation and Field Resolution Contract v1

**Contract ID:** `PHASE13_DOMAIN_ACTIVATION_FIELD_RESOLUTION_CONTRACT_v1`  
**Status:** LOCKED  
**Scope:** CO-P13-03 through CO-P13-05

## 1. Deterministic activation

Phase 13 resolves registry and subpackage applicability from the active QR catalog. Runtime code may evaluate catalog conditions but may not contain domain names, lane IDs, QR field IDs, document IDs, or package-specific routing logic.

Registry activation order is Universal, primary domain, capability overlay, regulatory overlay, then domain subpackage. Each registry or subpackage resolves to `ACTIVE`, `INACTIVE`, or `UNRESOLVED`.

An unresolved subpackage exposes only existing catalog-declared activation-probe fields. It does not expose the full subpackage and it does not create a new QR question. The operator never chooses a domain or lane.

## 2. Current AI data contract

The AI registry is activated by catalog conditions over `active_run_package_manifest`. Lane A and Lane B rules live only in the catalog. Both may activate. An explicit upstream `active_lanes` set may suppress the omitted lane. In the absence of an explicit negative signal, missing public evidence leaves the lane unresolved.

Lane A uses A01 as the existing activation probe. A01 must be marked not applicable to suppress Lane A when no upstream external/product signal exists. Lane B uses B01 as the existing boolean activation probe. A reviewer-confirmed false value suppresses Lane B.

## 3. Phase 12 value authority

Phase 13 reads only Phase 12 report-facing artifacts. It resolves:

- exact findings by `field_id`;
- field families by owned `field_id` prefix;
- structured Phase 12 presentation registers through catalog/registry selectors and filters.

It does not read Phase 3–11 profile artifacts, source evidence, cartography indexes, or forensic artifacts.

Atomic value precedence is:

1. reviewer edit;
2. Phase 12 material value;
3. `{MARKET BASED}` suggestion;
4. unresolved.

Market-based values are never diligence evidence. In production they remain proposed values until section attestation. In demo mode they render as populated demo values but remain editable.

## 4. Active field ledger

`qr_active_field_ledger` contains only active fields plus activation probes for unresolved subpackages. Inactive fields are suppressed from the UI, submission, final-value ledger, and document assembly.

Locked field capacities are:

- Universal only: 19;
- Universal + Lane A: 47;
- Universal + Lane B: 37;
- Universal + both lanes: 65.

Every active section requires one section attestation. Per-question confirmation is forbidden. Editing after attestation will be handled by the later QR persistence layer and must reset that section's attestation.

## 5. Artifacts

CO-P13-03 through CO-P13-05 emit:

- `qr_registry_resolution_manifest`;
- `qr_phase12_value_resolution`;
- `qr_active_field_ledger`;
- `phase13_domain_field_resolution_summary`.

These artifacts are deterministic and do not yet wire Phase 13 into the central runtime or UI.
