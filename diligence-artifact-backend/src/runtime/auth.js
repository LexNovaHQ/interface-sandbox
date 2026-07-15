import { config } from "./config.js";

export function requireApiKey(req, res, next) {
  const supplied = req.get("x-ln-api-key") || req.get("authorization")?.replace(/^Bearer\s+/i, "") || "";

  if (!config.apiKey) {
    return res.status(500).json({
      ok: false,
      error: "API_KEY_NOT_CONFIGURED",
      message: "GPT_ACTION_API_KEY is not configured on the central runtime."
    });
  }

  if (supplied !== config.apiKey) {
    return res.status(401).json({
      ok: false,
      error: "UNAUTHORIZED",
      message: "Missing or invalid central runtime API key."
    });
  }

  return next();
}

export function resolveAgentId(req) {
  return req.body?.agent_id || req.query?.agent_id || req.get("x-agent-id") || "";
}
