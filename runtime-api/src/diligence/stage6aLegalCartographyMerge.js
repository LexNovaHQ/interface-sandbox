import { buildStage6ALegalCartographySkeleton } from "./stage6aLegalCartographyBuilder.js";
import { buildStage6AControlFamilyIndex, buildStage6ADocumentControlSignalMap } from "./stage6aLegalControlSignalBuilder.js";

export function buildStage6ACartography(input = {}) {
  const output = buildStage6ALegalCartographySkeleton(input);
  const sections = output.legal_document_cartography.legal_document_index || [];
  const signals = buildStage6ADocumentControlSignalMap(sections);
  output.legal_document_cartography.document_control_signal_map = signals;
  output.stage7_navigation_index.control_family_index = buildStage6AControlFamilyIndex(signals);
  return output;
}
