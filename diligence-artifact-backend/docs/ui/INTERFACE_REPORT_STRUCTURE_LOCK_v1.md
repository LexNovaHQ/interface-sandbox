# Interface Report Structure Lock v1

## Status

Locked for the Interface Sandbox Phase 12 public report UI.

## Governing doctrine

The public report is a senior-partner legal diligence document inside the dark Interface application shell. It is not a dashboard and it is not a stack of nested cards.

The browser presentation is:

```text
Dark Interface shell
└── Continuous warm-paper report
    ├── Formal cover and matter caption
    ├── Ten canonical Phase 12 sections
    ├── Bounded tables
    ├── Bounded detail decks
    └── Full print/PDF output
```

Phase 12 remains governed by: `Upstream phases decide. Phase 12 arranges.` The frontend presents the clean Phase 12 report profiles and must not create or reinterpret legal conclusions, applicability, priority, remediation, questions, limitations, or review routes.

## Identity lock

- Product: Interface Sandbox / Interface Diligence Engine.
- Wordmark and curated Interface header remain unchanged.
- Public UI must not be rebranded as Lex Nova.
- Public terminology uses `Sector`, not `Domain`.

## Canonical section order

1. Matter Overview & Review Boundary
2. Executive Legal Risk Overview
3. Target, Entity & Sector Profile
4. Product & Activity Architecture
5. Data Provenance & Privacy Architecture
6. Sector-Specific Control Obligations
7. Legal & Governance Architecture
8. Exposure Register
9. Open Review Items & Handoff Plan
10. Methodology, Limitations & Technical Annexure Index

The frontend may create visual parts inside a section but may not merge, remove, reorder, or semantically reinterpret the ten canonical sections or their clean child profiles.

## Page structure

The report page contains:

1. locked Interface header;
2. slim report utility toolbar;
3. left contents rail on desktop and compact section selector on mobile;
4. one continuous warm-paper report canvas;
5. formal report cover;
6. matter caption;
7. restrained status strip;
8. ten editorial report sections;
9. final report actions and Interface footer.

The report metadata and controls must not be rendered as separate dashboard cards.

## Container rule

Default maximum visual depth:

```text
Report paper
└── Editorial section
    └── Optional exceptional callout, register, table, or detail deck
```

Rounded cards are exceptional and are reserved for material warnings, material limitations, critical exposures, and required actions. Definition rows, prose, tables, schedules, matrices, and registers are the normal report grammar.

## Pagination contract

### Browser

- Tables, registers, schedules, and matrices: maximum 10 visible rows per page.
- Detail decks: maximum 5 visible cards per page.
- Each component owns independent pagination state.
- Controls: First, Previous, Page X of Y, Next, Last.
- `Show All` is forbidden for large report components.
- Pagination controls visibility only; no Phase 12 row may be truncated, dropped, or replaced with a top-N projection.

### Print/PDF

- Every row and card is printed.
- Browser pagination controls are hidden.
- Table headers repeat where supported.
- Report sections use controlled page breaks.
- The rail, application toolbar, and interactive controls are hidden.

## Section 04 activity classification lock

The activity register must preserve the exact Phase 5 classification separation:

```text
primary_classification.behavior_class_codes
primary_classification.surface_context_tokens
overlay_classifications[].behavior_class_codes
overlay_classifications[].surface_context_tokens
```

The report must display these as separate columns:

1. Primary Behaviour Class
2. Primary Surface
3. Overlay Behaviour Class
4. Overlay Surface

Primary and overlay classifications must never be collapsed into a generic Behaviour Class or Surface field.

## Section 05 profile lock

All eleven clean Section 05 child profiles remain separate Phase 12 report artifacts. The UI may group them into three visual parts only:

- Actors, Data and Authority
- Supply Chain and Lifecycle
- Risk and Readiness

The UI may not merge child profiles semantically.

## Section 08 exposure lock

Primary Sector and Capability Overlay exposure streams remain separate. Each stream retains the four Phase 12 material-status profiles:

- Triggered
- Controlled by Visible Control
- Controlled by Exclusion
- Not Confirmed on Public Footprint

Within each profile, browser presentation order is deterministic:

1. upstream Pain Tier / Pain Category severity order;
2. Pain Category grouping;
3. Subcategory grouping;
4. upstream Pain Depth;
5. upstream Velocity;
6. Threat ID as stable fallback.

The frontend must not alphabetise Pain Categories or invent severity. Deterministic rank metadata may be added by the Phase 12 renderer only from already-preserved upstream values.

## Report actions

The report retains:

- Download PDF
- Open Public Technical Annexure
- Proceed to Qualified Review
- New Run / Return to Live Run

Public Download JSON is forbidden.

## Review boundary

The cover and final section must state that the output is a Review-Ready Draft based on public and approved source materials, is not legal advice or a compliance certification, and requires qualified/local counsel review before reliance.
