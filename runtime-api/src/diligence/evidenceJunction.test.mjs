import { buildEvidenceJunction } from "./evidenceJunction.js";

const out = buildEvidenceJunction({ sourceBundle: { raw_footprint: { source_records: [] } }, runId: "test" });
if (out.evidence_junction_version !== "evidence_junction_v1") throw new Error("junction version mismatch");
if (out.processing_manifest.gemini_called !== false) throw new Error("junction must not call Gemini");
console.log("evidenceJunction.test PASS");
