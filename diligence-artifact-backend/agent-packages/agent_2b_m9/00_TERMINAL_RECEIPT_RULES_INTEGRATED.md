# Legal Cartography and Index — Terminal Receipt Rules

The Legal Cartography and Index phase must return strict JSON for backend execution.

No markdown. No prose. No report. No final handoff. No renderer payload.

The phase saves these artifacts in order:

1. `legal_cartography_deterministic_map`
2. `legal_cartography_semantic_profile`
3. `legal_cartography_index`
4. `legal_signal_derivation_profile`

The downstream-required Legal Cartography and Index artifacts are:

```text
legal_cartography_index
legal_signal_derivation_profile
```

The deterministic and semantic index artifacts remain internal support artifacts for this phase.

`legal_signal_derivation_profile` is deterministic and field-registry keyed.

After successful Legal Cartography and Index lock, the backend advances to Target Profile Review.
