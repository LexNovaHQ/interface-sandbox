# Legacy Stage 5B Parking Notice

Canonical Stage 5B is now owned by exactly three files:

```text
runtime-api/src/diligence/stage5/5b/5b.runtime.js
runtime-api/src/diligence/stage5/5b/5b.prompt.js
runtime-api/src/diligence/stage5/5b/5b.dictionary.js
```

Legacy Stage 5B files are parked because they belong to the retired connector/adapter/investigation-packet chain and can reintroduce the forbidden pattern:

```text
5A refs/index/package -> investigation packet -> tagger -> normalizer -> package builder
```

The canonical rule is now:

```text
5B consumes 5A admitted functions + 5A verbatim feature evidence windows + full product-family lossless source custody.
5B may create supplemental verbatim tag-context windows.
5B may not tag from metadata, URL/title, source index refs, or registry labels alone.
Every tag must cite inherited 5A windows and 5B supplemental windows.
```

Parked legacy components include:

```text
runtime-api/src/diligence/stage5/stage5bPipelineConnector.js
runtime-api/src/diligence/stage5/5b/stage5bRegistryTaxonomyBuilder.js
runtime-api/src/diligence/stage5/5b/stage5bFeatureInvestigationPacketBuilder.js
runtime-api/src/diligence/stage5/5b/stage5bDeterministicSignalBuilder.js
runtime-api/src/diligence/stage5/5b/stage5bInstructionBuilder.js
runtime-api/src/diligence/stage5/5b/stage5bPromptBuilder.js
runtime-api/src/diligence/stage5/5b/stage5bArchetypeSurfaceTagger.js
runtime-api/src/diligence/stage5/5b/stage5bOutputNormalizer.js
runtime-api/src/diligence/stage5/5b/stage5bValidator.js
runtime-api/src/diligence/stage5/5b/stage5bTagPackageBuilder.js
runtime-api/src/diligence/stage5/5b/stage5bForensicBuilder.js
runtime-api/src/diligence/stage5/5b/stage5bIndex.js
runtime-api/scripts/e2e-stage5b-archetype-surface.mjs
docs/contracts/STAGE5B_ARCHETYPE_SURFACE_TAGGING_ARCHITECTURE_v1.md
```

Reuse is allowed only by deliberately moving safe constants or controlled vocabulary into `5b.dictionary.js`. No legacy evidence-flow file may be imported by canonical Stage 5.
