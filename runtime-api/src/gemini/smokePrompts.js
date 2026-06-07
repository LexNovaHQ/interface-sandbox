export const SMOKE_PROMPTS = {
  search: `Return only valid JSON. Use public web grounding if available.\n{\n  "smoke": "search",\n  "answer": "ok",\n  "public_fact_checked": true,\n  "notes": "one short sentence"\n}`,
  json: `Return only valid JSON exactly matching this shape:\n{\n  "smoke": "json",\n  "answer": "ok",\n  "numbers": [1, 2, 3]\n}`,
  registry: `Return only valid JSON exactly matching this shape:\n{\n  "smoke": "registry",\n  "answer": "ok",\n  "evaluated_rows": 3,\n  "coverage_pass": true\n}`,
  reasoning: `Return only valid JSON exactly matching this shape:\n{\n  "smoke": "reasoning",\n  "answer": "ok",\n  "decision": "pass",\n  "reason": "short"\n}`
};
