// Compatibility bridge only. Permission checks are owned by the central runtime contract.
import { assertCanReadArtifact, assertCanWriteArtifact, READ_PERMISSIONS, WRITE_PERMISSIONS } from "./runtime/contracts/artifact-permissions.contract.js";

export { assertCanReadArtifact, assertCanWriteArtifact };
export function publicPermissionMatrix() { return { reads: READ_PERMISSIONS, writes: WRITE_PERMISSIONS }; }
