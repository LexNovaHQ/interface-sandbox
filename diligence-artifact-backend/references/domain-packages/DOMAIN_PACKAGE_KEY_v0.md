# DOMAIN_PACKAGE_KEY_v0

Version: 0.1
Runtime mode: passive manifest/control layer

## Purpose

The Domain Package Key defines the common package contract for domain portability across the diligence runtime.

It governs:

- Primary Domain Packages
- Capability Overlays
- Regulatory Overlays
- Review Overlays

In v0 it may classify, validate, log, and expose package state through runtime artifacts. It may not dynamically rewrite prompts, QR matrices, report templates, field registries, or assembly templates.

## Package Types

Allowed package types:

- `primary_domain_package`
- `capability_overlay`
- `regulatory_overlay`
- `review_overlay`

Each run may have only one locked Primary Domain Package. Each run may have multiple capability and regulatory overlays. The review overlay defaults to `qualified-review`.

## Closed Status Enum

Allowed selection statuses:

- `NOT_EVALUATED`
- `PROVISIONAL`
- `CANDIDATE`
- `LOCKED`
- `LIMITED`
- `REVIEW_REQUIRED`
- `REJECTED`
- `SUPERSEDED`

Pre-Phase 1 may use only:

- `NOT_EVALUATED`
- `PROVISIONAL`
- `REJECTED`

Pre-Phase 1 may not produce `LOCKED`.

## Evidence Classes

Accepted evidence classes:

- `official_homepage_positioning`
- `official_product_page`
- `official_pricing_or_plan_page`
- `official_docs_or_api_reference`
- `official_terms_privacy_security_page`
- `official_app_or_workflow_description`
- `official_case_study`
- `public_regulatory_or_license_signal`
- `credible_third_party_profile`
- `user_intake_declaration`

Forbidden as sole auto-lock basis:

- `generic_marketing_adjective`
- `blog_only_signal`
- `news_only_signal`
- `customer_logo_only`
- `job_posting_only`
- `investor_deck_language_only`
- `model_guess_without_source`
- `industry_assumption`

No domain or overlay may be locked from model reasoning alone.

## Pre-Phase 1 Boundary

Pre-Phase 1 is a central runtime hook named `pre_phase_1_domain_preflight`.

It may:

- validate target input;
- capture user-declared domain and description;
- load this key and the package catalog;
- map intake into provisional package candidates;
- create non-narrowing discovery hints;
- emit `domain_selection_profile`;
- emit `active_run_package_manifest`.

It may not:

- lock a Primary Domain Package;
- lock a capability overlay;
- lock a regulatory overlay;
- narrow Source Discovery;
- exclude sources;
- enable dynamic routing;
- compile field registries;
- route QR matrices;
- make legal, compliance, threat, or domain findings.

## v0 Runtime Flags

In v0 the following flags must remain false:

- `dynamic_routing_enabled`
- `dynamic_prompt_routing_enabled`
- `field_registry_compile_enabled`
- `qr_matrix_routing_enabled`
- `report_template_routing_enabled`
- `assembly_template_routing_enabled`

## Doctrine

Model suggests. Rules decide. Evidence locks. Conflicts block auto-lock. Reviewer or user override is logged.
