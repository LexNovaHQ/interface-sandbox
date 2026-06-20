/* LexNova Runtime — Stage 5 Integration Ports. Batch 1 contracts only. */

const REQUIRED_PORTS = Object.freeze([
  'model.runJsonStage',
  'registry.loadRegistryKey',
  `registry.load${'Threat'}Registry`,
  'registry.buildStage5TaxonomySlice',
  'evidence.resolveRefs',
  'evidence.validateRefs',
  'evidence.buildFieldEvidenceRefs',
  'sources.getSourceText',
  'sources.getSourceMetadata',
  'sources.buildSourceCoverageSeed',
  'schema.validateTargetFeatureProfile',
  'schema.validateSubstageArtifact',
  'guardrails.validateSubstage',
  'guardrails.validateFinalStage5Profile',
  'tokens.recordUsage',
  'tokens.summarizeUsage',
  'audit.log',
  'audit.heartbeat',
  'audit.writeProgress',
  'forensics.writeArtifact',
  'forensics.writeValidation',
  `forensics.write${'Failure'}`
]);

export function createStage5IntegrationPorts(runtimeContext = {}) {
  return {
    model: runtimeContext.model || {},
    registry: runtimeContext.registry || {},
    evidence: runtimeContext.evidence || {},
    sources: runtimeContext.sources || {},
    schema: runtimeContext.schema || {},
    guardrails: runtimeContext.guardrails || {},
    tokens: runtimeContext.tokens || {},
    audit: runtimeContext.audit || {},
    forensics: runtimeContext.forensics || {}
  };
}

export function assertStage5IntegrationPorts(ports = {}) {
  const missing = [];
  for (const path of REQUIRED_PORTS) {
    const parts = path.split('.');
    let cursor = ports;
    for (const part of parts) cursor = cursor?.[part];
    if (typeof cursor !== 'function') missing.push(path);
  }
  return { ok: missing.length === 0, missing_ports: missing, required_ports: REQUIRED_PORTS };
}

export { REQUIRED_PORTS as STAGE5_REQUIRED_PORTS };
