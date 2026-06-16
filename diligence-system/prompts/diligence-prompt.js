export const DILIGENCE_SYSTEM_PROMPT = `
INTERFACE DILIGENCE SYSTEM — PHASE 0 PLACEHOLDER

This placeholder exists only to prove the execution shell.
The real diligence prompt and reference documents are intentionally not wired in Phase 0.

Required final output for live mode will be valid JSON with:
- html_report
- machine_json
- technical_audit_log
- operator_challenge_gate
- vault_assembly_handoff
`;

export function buildDiligenceRuntimePayload(input) {
  return {
    run_id: input.run_id,
    source_mode: input.source_mode || "url",
    target_url: input.target_url || "N/A",
    pasted_public_material: input.pasted_public_material || "",
    company_name: input.company_name || "N/A",
    submitted_at: new Date().toISOString()
  };
}

export function buildDiligenceUserPrompt({ runtimePayload }) {
  return `
RUNTIME_INPUT:
${JSON.stringify(runtimePayload, null, 2)}

PHASE 0 EXECUTION COMMAND:
Return a minimal valid JSON response matching the diligence system shell contract.
`;
}
