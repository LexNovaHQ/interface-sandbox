/* LexNova Runtime — Stage 5E Batch 6 Pipeline Connector. */

import { buildStage5RoutingPlan, summarizeStage5RoutingPlan } from './shared/stage5SharedIndex.js';
import { runStage5E } from './5e/stage5eIndex.js';

export async function runStage5EBatch6Pipeline({ adapterResult = {}, companyProfile = {}, logs, logStage, runId = null } = {}) {
  const stage5a = adapterResult.stage5a_batch2 || adapterResult.target_feature_profile_input?.stage5a_batch2 || null;
  const stage5b = adapterResult.stage5b_batch3 || adapterResult.target_feature_profile_input?.stage5b_batch3 || null;
  const stage5c = adapterResult.stage5c_batch4 || adapterResult.target_feature_profile_input?.stage5c_batch4 || null;
  const stage5d = adapterResult.stage5d_batch5 || adapterResult.target_feature_profile_input?.stage5d_batch5 || null;
  const featureCount = stage5c?.stage5c_feature_inventory_package?.feature_inventory?.length || 0;
  if (!stage5a || !stage5b || !stage5c || !stage5d || !featureCount) {
    const error = new Error('Stage 5E Batch 6 requires Stage 5A, 5B, 5C, and 5D packages with feature inventory.');
    error.status = 500;
    error.stage5a_available = Boolean(stage5a);
    error.stage5b_available = Boolean(stage5b);
    error.stage5c_available = Boolean(stage5c);
    error.stage5d_available = Boolean(stage5d);
    error.feature_inventory_count = featureCount;
    throw error;
  }
  const context = { run_id: `${runId || 'runtime'}_stage5e_batch6`, run_mode: 'LIVE_STAGE5E_BATCH6', feature_inventory_count: featureCount };
  const routingPlan = buildStage5RoutingPlan(context);
  logStage?.(logs, 'stage5e_target_feature_profile', 'running', { feature_inventory_count: featureCount, routing: summarizeStage5RoutingPlan(routingPlan) });
  const result = await runStage5E({ adapterResult, companyProfile, runId: context.run_id });
  logStage?.(logs, 'stage5e_target_feature_profile', 'complete', {
    feature_count: result.target_feature_profile?.feature_inventory?.length || 0,
    data_provenance_map_count: result.target_feature_profile?.data_provenance_map?.length || 0,
    regulated_surface_map_count: result.target_feature_profile?.regulated_surface_map?.length || 0,
    validation_ok: result.stage5e_validation?.ok === true,
    validation_severity: result.stage5e_validation?.severity || null
  });
  return { ok: result.stage5e_validation?.ok !== false, routing_plan: routingPlan, ...result };
}
