const fs = require("fs");

const filePath = "diligence-system/phase-runner.js";
let text = fs.readFileSync(filePath, "utf8");

const normalPattern = /  \} catch \(err\) \{\r?\n\s+return singleNodeFailure\(\{\r?\n\s+nodeId,\r?\n\s+status: `\$\{nodeId\}_MODEL_CALL_FAILED`,\r?\n\s+error: err\?\.message \|\| String\(err\),\r?\n\s+reference_bundle: summarizeReferenceBundles\(referenceBundles\),\r?\n\s+mechanical_validations: mechanicalValidations\r?\n\s+\}\);\r?\n  \}/m;

const normalReplacement = [
'  } catch (err) {',
'    const failureModelMeta = compactModelMeta(err || {}, phase);',
'    failureModelMeta.model_call_failed = true;',
'    failureModelMeta.error = err?.message || String(err);',
'    failureModelMeta.model_attempts = err?.model_attempts || err?.attempts || failureModelMeta.model_attempts || [];',
'    failureModelMeta.attempts = failureModelMeta.model_attempts;',
'    failureModelMeta.bucket_name = err?.bucket_name || err?.bucketName || failureModelMeta.bucket_name || null;',
'    failureModelMeta.pool_name = err?.pool_name || phase.pool || failureModelMeta.pool_name || null;',
'    failureModelMeta.phase_id = err?.phase_id || nodeId;',
'    failureModelMeta.fallback_used = Boolean(',
'      err?.fallback_used ||',
'      failureModelMeta.fallback_used ||',
'      failureModelMeta.model_attempts.some((attempt) => attempt?.fallback || attempt?.fallback_bucket || attempt?.decision === "FALLBACK_BUCKET")',
'    );',
'',
'    modelMetaByPhase[nodeId] = failureModelMeta;',
'',
'    return singleNodeFailure({',
'      nodeId,',
'      status: `${nodeId}_MODEL_CALL_FAILED`,',
'      error: err?.message || String(err),',
'      model_meta: failureModelMeta,',
'      model_attempts: failureModelMeta.model_attempts,',
'      reference_bundle: summarizeReferenceBundles(referenceBundles),',
'      mechanical_validations: mechanicalValidations',
'    });',
'  }'
].join("\n");

const normalMatches = [...text.matchAll(normalPattern)].length;
if (normalMatches !== 1) {
  throw new Error(`NORMAL_MODEL_FAILURE_BLOCK_MATCH_COUNT:${normalMatches}`);
}

text = text.replace(normalPattern, normalReplacement);

const p6Pattern = /  \} catch \(err\) \{\r?\n\s+traceEvent\(runtimeTrace, \{ type: "p6_batch", node_id: batch\.batch_id, status: "FAILED", summary: "P6 batch model call failed", duration_ms: durationSince\(batchStartedAt\), errors: \[err\?\.message \|\| String\(err\)\] \}\);\r?\n\s+return \{\r?\n\s+ok: false,\r?\n\s+status: "P6_BATCH_MODEL_CALL_FAILED",\r?\n\s+error: `\$\{batch\.batch_id\}_MODEL_CALL_FAILED:\$\{err\?\.message \|\| String\(err\)\}`,\r?\n\s+lastModelMeta\r?\n\s+\};\r?\n  \}/m;

const p6Replacement = [
'  } catch (err) {',
'    lastModelMeta = compactModelMeta(err || {}, { node_id: batch.batch_id, pool: phase.pool });',
'    lastModelMeta.model_call_failed = true;',
'    lastModelMeta.error = err?.message || String(err);',
'    lastModelMeta.model_attempts = err?.model_attempts || err?.attempts || lastModelMeta.model_attempts || [];',
'    lastModelMeta.attempts = lastModelMeta.model_attempts;',
'    lastModelMeta.bucket_name = err?.bucket_name || err?.bucketName || lastModelMeta.bucket_name || null;',
'    lastModelMeta.pool_name = err?.pool_name || phase.pool || lastModelMeta.pool_name || null;',
'    lastModelMeta.phase_id = err?.phase_id || batch.batch_id;',
'    lastModelMeta.fallback_used = Boolean(',
'      err?.fallback_used ||',
'      lastModelMeta.fallback_used ||',
'      lastModelMeta.model_attempts.some((attempt) => attempt?.fallback || attempt?.fallback_bucket || attempt?.decision === "FALLBACK_BUCKET")',
'    );',
'',
'    modelMetaByPhase[batch.batch_id] = lastModelMeta;',
'',
'    traceEvent(runtimeTrace, {',
'      type: "p6_batch",',
'      node_id: batch.batch_id,',
'      status: "FAILED",',
'      summary: "P6 batch model call failed",',
'      duration_ms: durationSince(batchStartedAt),',
'      errors: [err?.message || String(err)],',
'      model_meta: lastModelMeta,',
'      model_attempts: lastModelMeta.model_attempts',
'    });',
'',
'    return {',
'      ok: false,',
'      status: "P6_BATCH_MODEL_CALL_FAILED",',
'      error: `${batch.batch_id}_MODEL_CALL_FAILED:${err?.message || String(err)}`,',
'      lastModelMeta,',
'      model_meta: lastModelMeta,',
'      model_attempts: lastModelMeta.model_attempts',
'    };',
'  }'
].join("\n");

const p6Matches = [...text.matchAll(p6Pattern)].length;
if (p6Matches !== 1) {
  throw new Error(`P6_MODEL_FAILURE_BLOCK_MATCH_COUNT:${p6Matches}`);
}

text = text.replace(p6Pattern, p6Replacement);

fs.writeFileSync(filePath, text, "utf8");

console.log("phase-runner model-attempt failure propagation patched");
