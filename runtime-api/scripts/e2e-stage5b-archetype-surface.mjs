#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  buildStage5BTaxonomySlice,
  buildStage5BFeatureInvestigationPacket,
  buildStage5BDeterministicSignals,
  buildStage5BInstructionPacket,
  buildStage5BPrompt,
  runStage5B
} from '../src/diligence/stage5/5b/stage5bIndex.js';

const repoRoot = path.resolve(process.cwd(), '..');
const registryPath = path.join(repoRoot, 'data', 'runtime', 'registry_key.runtime.json');
const registryKey = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const stage5aFeaturePackage = {
  stage5a_feature_package_version: 'stage5a_feature_package_v1',
  target_profile_ref: { company_name: 'Fixture AI' },
  features_for_5b: [
    {
      function_id: 'PF001',
      core_product_id: 'CP001',
      core_product_name: 'Fixture API',
      function_name: 'Speech-to-Text',
      function_type: 'API_CAPABILITY',
      primary_or_secondary: 'PRIMARY',
      commercial_function: 'Converts speech audio into text transcripts.',
      mechanics: {
        actor_or_user: 'developer application',
        input_signal: 'audio',
        system_action: 'transcribes speech',
        output_or_result: 'text transcript'
      },
      investigation_package: {
        source_refs: ['SRC001'],
        lossless_source_index_refs: ['SRC001#chunk:CH001'],
        evidence_refs: ['EV001'],
        candidate_ids_used: ['CAND001'],
        related_candidate_ids: ['CAND001'],
        nearby_source_context_refs: ['CH001']
      },
      model_admission_notes: {
        why_admitted: 'Presented as a discrete API capability.',
        why_not_product_only: 'It is an operation inside the API product.',
        admission_confidence: 'HIGH'
      }
    }
  ],
  lossless_source_index: [
    {
      source_id: 'SRC001',
      source_family: 'product',
      source_url: 'https://example.test/api',
      chunk_refs: ['CH001'],
      section_markers: []
    }
  ],
  candidate_pool_refs: [
    {
      candidate_id: 'CAND001',
      candidate_text: 'Speech-to-Text',
      candidate_kind: 'FUNCTION_TERM',
      source_refs: ['SRC001'],
      lossless_index_refs: ['SRC001#chunk:CH001']
    }
  ]
};

const mockPorts = {
  model: {
    async runJsonStage() {
      return {
        json: {
          stage5b_version: 'stage5b_archetype_surface_tagging_v1',
          target_profile_ref: stage5aFeaturePackage.target_profile_ref,
          feature_tags: [
            {
              function_id: 'PF001',
              core_product_name: 'Fixture API',
              function_name: 'Speech-to-Text',
              tagging_status: 'TAGGED',
              primary_archetype_code: 'TRN',
              secondary_archetype_codes: ['CRT'],
              archetype_codes: ['TRN', 'CRT'],
              archetype_provenance: [{ basis: 'Audio input is transformed into text output.', evidence_refs: ['EV001'] }],
              surface_tokens: ['Sensitive/Biometric', 'Enterprise-Private', 'Content&IP'],
              surface_provenance: [{ basis: 'Audio API sold to developers.', evidence_refs: ['EV001'] }],
              triggering_status: 'TRIGGERED',
              triggering_reason: 'Processes audio/speech as a product function.',
              autonomy_level: 'ASSISTIVE',
              human_review_signal: 'UNKNOWN_NOT_EVIDENCED',
              external_action_signal: 'FALSE',
              tagging_confidence: 'HIGH',
              tagging_gaps: [],
              evidence_refs: ['EV001'],
              lossless_source_index_refs: ['SRC001#chunk:CH001']
            }
          ],
          tagging_failures: [],
          limitations: []
        },
        model_metadata: { model: 'mock', total_tokens: 0 }
      };
    }
  }
};

const taxonomySlice = await buildStage5BTaxonomySlice({ registryKey });
const investigationPacket = buildStage5BFeatureInvestigationPacket({ stage5aFeaturePackage });
const signalSeed = buildStage5BDeterministicSignals({ investigationPacket, taxonomySlice });
const instructionPacket = buildStage5BInstructionPacket({ taxonomySlice, investigationPacket });
const promptPreview = buildStage5BPrompt({ taxonomySlice, investigationPacket, signalSeed, instructionPacket });
const result = await runStage5B({ stage5aFeaturePackage, registryKey, ports: mockPorts, runId: 'stage5b_fixture' });

const ok = Boolean(result.stage5b_validation?.ok) && result.stage5b_tag_package?.feature_tags_for_5c?.length === 1;
const summary = {
  ok,
  phase: 'stage5b_archetype_surface_e2e',
  taxonomy_archetype_count: taxonomySlice.archetype_codes.length,
  taxonomy_surface_count: taxonomySlice.surface_tokens.length,
  feature_investigation_count: investigationPacket.feature_investigations.length,
  deterministic_signal_count: signalSeed.feature_signal_seeds.length,
  prompt_chars: promptPreview.length,
  validation: result.stage5b_validation,
  tag_package_count: result.stage5b_tag_package.feature_tags_for_5c.length
};

console.log(JSON.stringify(summary, null, 2));
if (!ok) process.exit(1);
