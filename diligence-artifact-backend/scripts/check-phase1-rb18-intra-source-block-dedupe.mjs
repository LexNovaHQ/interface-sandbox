import assert from "node:assert/strict";
import {
  createBlockDedupeState,
  dedupeExtractedSource,
  serialiseBlockDedupeState,
  assertBlockDedupeState
} from "../src/phases/01-source-discovery/services/post-extraction-block-dedupe.service.js";

const repeatedBlock = "This material evidence block explains the same operational capability, customer workflow, technical availability and commercial scope in sufficient detail for analysis.";
const distinctBlock = "This second material block provides a distinct limitation, governance control, supported boundary and implementation condition for the same product surface.";
const state = createBlockDedupeState();
const result = dedupeExtractedSource({
  root: "homepage_landing",
  state,
  source: {
    source_id: "homepage_landing.SRC.001",
    canonical_url: "https://example.test/",
    lossless_text: `${repeatedBlock}\n\n${repeatedBlock}\n\n${distinctBlock}`
  }
});

assert.equal(result.action, "RETAIN");
assert.equal(result.source.block_dedupe_forensics.original_block_count, 3);
assert.equal(result.source.block_dedupe_forensics.retained_block_count, 2);
assert.equal(result.source.block_dedupe_forensics.duplicate_block_count, 1);
assert.equal(result.source.block_dedupe_forensics.repeated_inside_source_blocks_removed, 1);
assert.equal(result.source.block_dedupe_forensics.retained_block_hashes.length, new Set(result.source.block_dedupe_forensics.retained_block_hashes).size);
assert.equal(result.source.lossless_text.split(repeatedBlock).length - 1, 1);

const serialised = serialiseBlockDedupeState(state);
assertBlockDedupeState(serialised);
assert.equal(serialised.totals.duplicate_blocks_removed, 1);
assert.equal(serialised.totals.unique_blocks_retained, 2);

console.log(JSON.stringify({
  check: "phase1 RB18 intra-source block dedupe",
  status: "PASS",
  original_blocks: 3,
  retained_blocks: 2,
  repeated_inside_source_removed: 1
}, null, 2));
