# Terminal Receipt Rules — P2D Data Privacy Navigation Index

A P2D run is acceptable only if:

1. `data_privacy_deterministic_map` is saved.
2. `data_privacy_semantic_profile` is saved.
3. `data_privacy_navigation_index` is saved.
4. `data_privacy_navigation_index` is the preserved final artifact name.
5. The final artifact has five data source routes and two legal index routes.
6. The final artifact has 17 DAP semantic batch pointers.
7. Each batch pointer includes both new route keys and Phase 7 compatibility route keys.
8. No retired D-family artifact names appear in the final artifact.
9. No retired Phase 1 root names appear in the final artifact.
10. No `data_provenance_source_index` artifact is emitted or referenced as an output.
11. `P2_INDEX_COMPILER_VALIDATION` reads the final artifact but does not write it.
12. `DATA_PROVENANCE_PROFILE_LAYER4` reads the final artifact and does not rebuild it.

Failure in any of these rules means the package is not synchronized.
