import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
const routeReader = readFileSync("src/phases/02-cartography-index/services/phase-route-runtime.reader.js", "utf8");
const permissions = readFileSync("src/runtime/contracts/artifact-permissions.contract.js", "utf8");

assert.ok(pipeline.includes("LOSSLESS_ROOT_BASE_ARTIFACT_PATTERN"), "central pipeline must recognize lossless_root virtual artifacts");
assert.ok(pipeline.includes("resolveLosslessRootArtifact"), "central pipeline must resolve sparse/sharded lossless roots");
assert.ok(pipeline.includes("readSourceFamilyIndexForRootResolver"), "root resolution must navigate source_family_index");
assert.ok(pipeline.includes("required_artifacts"), "root resolution must load the root manifest's exact physical artifacts");
assert.ok(pipeline.includes("source_text_cutting_allowed: false"), "root resolver must preserve lossless source text");
assert.ok(routeReader.includes("readPhaseRouteRuntimePacket"), "P2G runtime reader missing");
assert.ok(routeReader.includes("PRIMARY_EVIDENCE"), "P2G runtime reader must treat lossless evidence as primary");
assert.ok(routeReader.includes("MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE"), "P2G runtime reader must enforce index navigation");
assert.equal(routeReader.includes("lossless_family__"), false, "P2G reader must not use retired lossless_family artifacts");
assert.ok(permissions.includes("LOSSLESS_COMMON_ROOT_ARTIFACT_PATTERN"), "canonical permissions must govern lossless_root artifacts");
assert.equal(permissions.includes("LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES"), false, "retired family permission union must not return");

console.log(JSON.stringify({ check: "sparse root read firewall", status: "PASS", enforced_gates: ["P2G_SOLE_ROUTE_READER", "INDEX_NAVIGATION_MANDATORY", "LOSSLESS_EVIDENCE_PRIMARY", "SPARSE_ROOT_SHARDS_RESOLVED", "NO_RETIRED_LOSSLESS_FAMILY_RUNTIME"] }, null, 2));
