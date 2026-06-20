import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

async function probe(name, importer) {
  try {
    const module = await importer();
    return {
      name,
      ok: true,
      exports: Object.keys(module || {}).sort()
    };
  } catch (error) {
    return {
      name,
      ok: false,
      error_name: error?.name || "Error",
      error_message: error?.message || String(error),
      stack_preview: String(error?.stack || "").split("\n").slice(0, 6)
    };
  }
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const probes = [];

  probes.push(await probe("prompt_bundle", () => import("../_generated/diligencePromptBundle.js")));
  probes.push(await probe("schema_bundle", () => import("../_generated/diligenceSchemaBundle.js")));
  probes.push(await probe("json_schema_validator", () => import("../_shared/jsonSchemaValidator.js")));
  probes.push(await probe("prompt_loader", () => import("../_shared/diligencePromptLoader.js")));
  probes.push(await probe("gemini_json_runner", () => import("../_shared/geminiJsonRunner.js")));
  probes.push(await probe("stage_handler", () => import("../_shared/diligenceStageHandler.js")));

  const failed = probes.filter((item) => !item.ok);

  return jsonResponse({
    ok: failed.length === 0,
    service: "diligence-runtime-debug",
    failed_count: failed.length,
    probes
  }, { status: failed.length ? 500 : 200 });
}
