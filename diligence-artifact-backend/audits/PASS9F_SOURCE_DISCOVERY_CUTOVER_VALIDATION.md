# Pass 9F Source Discovery Cutover Validation

Branch: runtime-central-tree-pass1

## Scope

This validation confirms that Source Discovery has been cut off from the old helper files in the new central runtime path.

Old helper files cut off from new runtime:

- src/agent-1-scout-extractor.js
- src/m6-bucket-router.js

## Validation Performed

The following checks passed locally:

1. Full backend syntax check across JS/MJS/CJS files excluding node_modules, .git, dist, build, and coverage.
2. Targeted ESM import checks for:
   - src/phases/01-source-discovery/index.js
   - src/phases/01-source-discovery/source-discovery.runner.js
   - src/phases/01-source-discovery/services/url-manifest.service.js
   - src/phases/01-source-discovery/services/source-extraction.service.js
   - src/phases/01-source-discovery/services/source-family-handoff.service.js
   - src/runtime/services/pipeline.service.js
   - src/runtime/contracts/pipeline.contract.js
   - src/runtime/contracts/artifact-permissions.contract.js
   - src/runtime/services/artifacts.service.js
3. Old-helper cutoff grep over:
   - src/runtime/**/*.js
   - src/phases/01-source-discovery/**/*.js
4. Project check:
   - npm run check

## Result

PASS.

## Notes

Production entrypoint has not been switched.

Old production helper files remain in the repository for compatibility with the existing production path, but the new runtime path no longer imports or depends on them.
