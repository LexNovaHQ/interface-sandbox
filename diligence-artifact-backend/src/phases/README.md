# Central Phases Tree

This directory is the destination for the product-phase implementation layer.

The phase tree uses central product language, not legacy micro-phase labels. Existing micro-phase IDs may appear only as compatibility job IDs inside contracts during migration.

## Phase order

```txt
01-source-discovery
02-legal-cartography-index
03-target-profile-review
04-target-profile-forensics
05-activity-profile-review
06-activity-profile-forensics
07-data-provenance-profile
08-data-provenance-forensics
09-exposure-profile
10-operator-challenge
11-compiler
12-qualified-review
13-diligence-qa-complete
14-qualified-review-submission
15-assembly-engine
```

## Migration rule

These files are additive and dormant until production wiring is explicitly switched.

The runtime layer owns orchestration. This phase layer owns specialist product logic.

## Boundaries

- Compiler and Qualified Review remain separate phases.
- Qualified Review reads normalized compiler artifacts but is not part of the compiler.
- Diligence-QA Complete is the terminal diligence QA lock after report renderer and Qualified Review artifacts are present.
- Qualified Review Submission is a reviewer/user save action, not an automatic model phase.
- Assembly Engine is the next active product layer after Qualified Review Submission, not archive/legacy.
