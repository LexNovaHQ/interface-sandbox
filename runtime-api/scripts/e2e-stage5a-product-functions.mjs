#!/usr/bin/env node
/* Standalone Stage 5A deterministic setup check. No live wiring. */

import fs from 'node:fs';
import path from 'node:path';
import {
  buildStage5AProductFamilyInput,
  buildStage5ALosslessSourceIndex,
  buildStage5ADeterministicCandidatePool,
  buildStage5AInstructionPacket,
  buildStage5APrompt
} from '../src/diligence/stage5/5a/stage5aIndex.js';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const inputPath = process.env.STAGE5A_INPUT_JSON;
if (!inputPath) {
  console.error('Set STAGE5A_INPUT_JSON to a Stage 5 input JSON file.');
  process.exit(2);
}

const outDir = process.env.STAGE5A_OUT_DIR || path.join(process.cwd(), 'stage5a-audit-output');
const context = readJson(inputPath);
const stage5aInput = buildStage5AProductFamilyInput(context);
const losslessSourceIndex = buildStage5ALosslessSourceIndex(stage5aInput);
const candidatePool = buildStage5ADeterministicCandidatePool(stage5aInput, losslessSourceIndex);
const instructionPacket = buildStage5AInstructionPacket({ ...context, stage5aInput, losslessSourceIndex, candidatePool });
const promptPreview = buildStage5APrompt({ stage5aInput, losslessSourceIndex, candidatePool, instructionPacket });

writeJson(path.join(outDir, 'stage5-5a-input.json'), stage5aInput);
writeJson(path.join(outDir, 'stage5-5a-lossless-source-index.json'), losslessSourceIndex);
writeJson(path.join(outDir, 'stage5-5a-candidate-pool.json'), candidatePool);
writeJson(path.join(outDir, 'stage5-5a-instruction-packet.json'), instructionPacket);
writeJson(path.join(outDir, 'stage5-5a-prompt-preview.json'), promptPreview);

console.log(JSON.stringify({
  ok: true,
  phase: 'stage5a_deterministic_setup',
  out_dir: outDir,
  source_count: stage5aInput.product_family_source_lossless.length,
  source_index_count: losslessSourceIndex.lossless_source_index.length,
  candidate_count: candidatePool.deterministic_candidate_pool.length
}, null, 2));
