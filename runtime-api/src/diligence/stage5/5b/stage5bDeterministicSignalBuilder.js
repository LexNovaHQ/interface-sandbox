/* LexNova Runtime — Stage 5B Deterministic Signal Builder. High-recall hints only. */

import { asArray, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';

export function buildStage5BDeterministicSignals({ investigationPacket, taxonomySlice } = {}) {
  const features = asArray(investigationPacket?.feature_investigations);
  return {
    stage5b_signal_seed_version: 'stage5b_signal_seed_v1',
    target_profile_ref: investigationPacket?.target_profile_ref || null,
    feature_signal_seeds: features.map((feature) => buildSignalsForFeature(feature, taxonomySlice)),
    signal_policy: {
      deterministic_signals_are_hints_only: true,
      model_must_adjudicate_final_tags: true
    }
  };
}

function buildSignalsForFeature(feature, taxonomySlice = {}) {
  const text = [
    feature.core_product_name,
    feature.function_name,
    feature.function_type,
    feature.commercial_function,
    feature.mechanics?.actor_or_user,
    feature.mechanics?.input_signal,
    feature.mechanics?.system_action,
    feature.mechanics?.output_or_result,
    feature.model_admission_notes?.why_admitted,
    feature.model_admission_notes?.why_not_product_only
  ].map(asText).join(' ').toLowerCase();

  const archetypeHints = [];
  const surfaceHints = [];
  const autonomy = [];
  const humanReview = [];
  const externalAction = [];

  addIf(archetypeHints, taxonomySlice, 'TRN', /(voice|audio|speech|transcri|diari|face|biometric)/.test(text));
  addIf(archetypeHints, taxonomySlice, 'CRT', /(generate|create|draft|write|image|video|code|synthetic|dubbing|translation|text-to-speech)/.test(text));
  addIf(archetypeHints, taxonomySlice, 'RDR', /(document|file|upload|read|ingest|rag|knowledge|ocr|digitisation|digitization)/.test(text));
  addIf(archetypeHints, taxonomySlice, 'DOE', /(agent|tool call|api call|send|book|purchase|execute|workflow|action)/.test(text));
  addIf(archetypeHints, taxonomySlice, 'ORC', /(route|orchestrat|multi-model|gateway|subprocessor|agent framework)/.test(text));
  addIf(archetypeHints, taxonomySlice, 'JDG', /(score|rank|approve|reject|eligibility|hiring|credit|admission|decision)/.test(text));
  addIf(archetypeHints, taxonomySlice, 'SHD', /(security|threat|monitor|defend|incident|soc|abuse)/.test(text));
  addIf(archetypeHints, taxonomySlice, 'OPT', /(optimi|pricing|trading|allocation|scheduling|money movement)/.test(text));
  addIf(archetypeHints, taxonomySlice, 'MOV', /(robot|drone|vehicle|physical|iot|device control)/.test(text));

  addSurface(surfaceHints, taxonomySlice, 'Sensitive/Biometric', /(voice|audio|speech|face|biometric)/.test(text));
  addSurface(surfaceHints, taxonomySlice, 'Content&IP', /(generate|content|image|video|text|code|translation|dubbing|copyright)/.test(text));
  addSurface(surfaceHints, taxonomySlice, 'PII', /(personal|user|customer|profile|identity|email|phone)/.test(text));
  addSurface(surfaceHints, taxonomySlice, 'Enterprise-Private', /(enterprise|api|developer|b2b|organization|workspace)/.test(text));
  addSurface(surfaceHints, taxonomySlice, 'Consumer-Public', /(consumer|public|end user|mobile app|website)/.test(text));
  addSurface(surfaceHints, taxonomySlice, 'Employment', /(hiring|hr|employee|workforce|resume)/.test(text));
  addSurface(surfaceHints, taxonomySlice, 'Financial', /(payment|finance|credit|loan|trading|money)/.test(text));
  addSurface(surfaceHints, taxonomySlice, 'Safety&Physical', /(physical|robot|vehicle|medical|safety|harm)/.test(text));
  addSurface(surfaceHints, taxonomySlice, 'Infrastructure', /(infrastructure|critical|cloud|network|platform)/.test(text));
  addSurface(surfaceHints, taxonomySlice, 'Minors', /(minor|child|student|school|under 18)/.test(text));

  if (/(agent|autonomous|workflow|execute|tool call|api call)/.test(text)) autonomy.push('AUTONOMY_POSSIBLE');
  if (/(review|approve|human|manual|moderator)/.test(text)) humanReview.push('HUMAN_REVIEW_MENTIONED');
  if (/(send|book|purchase|execute|call api|tool call|external)/.test(text)) externalAction.push('EXTERNAL_ACTION_POSSIBLE');

  return {
    function_id: feature.function_id,
    possible_archetype_codes: uniqueStrings(archetypeHints),
    possible_surface_tokens: uniqueStrings(surfaceHints),
    autonomy_signal_candidates: uniqueStrings(autonomy),
    human_review_signal_candidates: uniqueStrings(humanReview),
    external_action_signal_candidates: uniqueStrings(externalAction),
    evidence_refs: uniqueStrings(feature.evidence_refs),
    source_refs: uniqueStrings(feature.source_refs),
    lossless_source_index_refs: uniqueStrings(feature.lossless_source_index_refs),
    signal_confidence: archetypeHints.length || surfaceHints.length ? 'MEDIUM' : 'LOW'
  };
}

function addIf(out, taxonomySlice, code, yes) {
  if (yes && asArray(taxonomySlice?.archetype_codes).includes(code)) out.push(code);
}

function addSurface(out, taxonomySlice, token, yes) {
  if (yes && asArray(taxonomySlice?.surface_tokens).includes(token)) out.push(token);
}
