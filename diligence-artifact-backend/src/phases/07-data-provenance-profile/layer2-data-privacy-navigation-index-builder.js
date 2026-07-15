import { buildDataPrivacyDeterministicMap, buildDataPrivacySemanticProfile } from "../02-cartography-index/services/data-privacy-deterministic-map.builder.js";
import { compileDataPrivacyNavigationIndex } from "../02-cartography-index/services/data-privacy-navigation-index.compiler.js";

export function buildPhase7DataPrivacyNavigationIndex({ dapRegistryManifest, strategicDerivationMatrix, artifacts = {} } = {}) {
  if (!dapRegistryManifest || dapRegistryManifest.artifact_type !== "dap_registry_manifest") throw new Error("PHASE7_LAYER2_REQUIRES_DAP_REGISTRY_MANIFEST");
  const deterministicMap = buildDataPrivacyDeterministicMap({ artifacts });
  const semanticProfile = buildDataPrivacySemanticProfile({ deterministicMap, strategicDerivationMatrix });
  const compiled = compileDataPrivacyNavigationIndex({ deterministicMap, semanticProfile });
  return compiled.data_privacy_navigation_index;
}

export const PHASE7_LAYER2_DPNI_COMPATIBILITY_STATUS = Object.freeze({
  artifact_identity_preserved: "data_privacy_navigation_index",
  implementation_owner: "P2D_DATA_PRIVACY_NAVIGATION_INDEX",
  phase7_compatibility_export_preserved: true,
  old_d_family_inputs_removed: true,
  phase1_v5_input_contract_active: true,
  layer3_legacy_route_keys_preserved: true
});
