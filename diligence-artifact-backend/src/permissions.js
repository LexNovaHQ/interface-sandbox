import {
  assertKnownAgent,
  assertKnownArtifactName,
  artifactMatchesPermission,
  READ_PERMISSIONS,
  WRITE_PERMISSIONS
} from "./constants.js";

export function assertCanReadArtifact(agentId, artifactName) {
  assertKnownAgent(agentId);
  assertKnownArtifactName(artifactName);

  const allowed = READ_PERMISSIONS[agentId] || [];
  if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) {
    throw new Error(`READ_FORBIDDEN:${agentId}:${artifactName}`);
  }
}

export function assertCanWriteArtifact(agentId, artifactName) {
  assertKnownAgent(agentId);
  assertKnownArtifactName(artifactName);

  const allowed = WRITE_PERMISSIONS[agentId] || [];
  if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) {
    throw new Error(`WRITE_FORBIDDEN:${agentId}:${artifactName}`);
  }
}

export function publicPermissionMatrix() {
  return {
    read: READ_PERMISSIONS,
    write: WRITE_PERMISSIONS
  };
}
