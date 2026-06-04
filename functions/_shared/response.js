export function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

export function methodNotAllowed(methods) {
  return jsonResponse(
    {
      ok: false,
      phase: "wrapper-batch-1",
      message: `Method not allowed. Use ${methods.join(", ")}.`
    },
    { status: 405, headers: { allow: methods.join(", ") } }
  );
}
