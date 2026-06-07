export const SMOKE_PROMPTS = {
  search: `Return only valid JSON. Use public web grounding if available.
{
  "smoke": "search",
  "answer": "ok",
  "public_fact_checked": true,
  "notes": "one short sentence"
}`,
  json: `Return only valid JSON exactly matching this shape:
{
  "smoke": "json",
  "answer": "ok",
  "numbers": [1, 2, 3]
}`,
  registry: `Return only valid JSON exactly matching this shape:
{
  "smoke": "registry",
  "answer": "ok",
  "evaluated_rows": 3,
  "coverage_pass": true
}`,
  reasoning: `Return only valid JSON. Do not rename any field. Do not change any expected value.
The field "smoke" must be exactly the string "reasoning".
The field "decision" must be exactly the string "pass".
Return exactly this JSON object and nothing else:
{
  "smoke": "reasoning",
  "answer": "ok",
  "decision": "pass",
  "reason": "short"
}`
};

