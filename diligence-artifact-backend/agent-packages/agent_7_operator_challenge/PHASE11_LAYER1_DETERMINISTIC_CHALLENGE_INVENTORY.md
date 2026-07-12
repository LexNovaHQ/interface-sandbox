# PHASE 11 — LAYER 1 DETERMINISTIC CHALLENGE INVENTORY

## CONTRACT VERSION

`PHASE11_LAYER1_DETERMINISTIC_CROSS_PHASE_INVENTORY_v1`

## PURPOSE

Layer 1 constructs a deterministic cross-phase challenge inventory from accepted derived artifacts. It does not adjudicate a challenge, call a model, initiate reinvestigation, rewrite an upstream artifact, or decide whether the run may proceed.

## INPUT BOUNDARY

Layer 1 consumes derived-only outputs from:

- Phase 3 target and domain profiles;
- Phase 5 activity profile;
- Phase 7 data-provenance material outputs;
- Phase 8 domain-control-obligation profile;
- Phase 10 manifest, route plan, workpad and split material profiles;
- paired Phase 10 batch-validation custody supplied through Phase 2G.

Forensic profiles are forbidden inputs.

## DETERMINISTIC CROSS-LINKS

Layer 1 projects:

- activity to exposure;
- data-practice field to exposure;
- obligation to exposure;
- exposure to remediation and review route;
- package and stream custody;
- compound identity custody.

Token overlap is used only to create a challenge candidate. Token overlap is not substantive proof and cannot establish a contradiction by itself.

## CANDIDATE CLASSES

### `CRITICAL_SUBSTRATE_CANDIDATE`

Reserved for missing or unusable required substrate, prohibited forensic delivery, compound-identity corruption, or mutually exclusive profile custody. Layer 1 does not make the final critical-failure decision.

### `MATERIAL_FIELD_CANDIDATE`

A material field, row or cross-phase relationship may need semantic challenge and targeted reinvestigation. This candidate class is non-blocking at Layer 1.

### `ADVISORY_CANDIDATE`

A limitation cluster or low-confidence coherence concern should be reviewed but does not itself require reinvestigation.

## REQUIRED CANDIDATE CUSTODY

Every candidate records:

- deterministic candidate ID;
- candidate class;
- challenge type;
- affected artifacts;
- exact field paths;
- affected compound exposure keys, activity IDs, data-field IDs or obligation IDs;
- deterministic basis;
- proposed smallest owner;
- proposed reinvestigation scope;
- statement that Layer 1 is not a final conclusion.

## OUTPUT

The canonical Layer 1 object is:

`operator_challenge_inventory`

During the staged Phase 11 build, it is persisted inside the existing `challenge_gate` storage envelope because the final Layer 3 gate has not yet been built. The envelope must state:

- Layer 1 complete;
- Layer 2 pending;
- Layer 3 pending;
- compiler handoff forbidden;
- phase status `CREATED`.

The object becomes an independently persisted artifact when the full Phase 11 artifact contract is cut over with Layers 2 and 3.

## BLOCKING DOCTRINE

Layer 1 never blocks a run and never emits `REPAIR_REQUIRED`.

Only Layer 3 may classify a validated challenge as a critical failure. Material-field candidates must follow the maximum-two-attempt reinvestigation doctrine before an unresolved warning is carried forward.
