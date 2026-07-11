// Compatibility bridge only. The central runtime owns reference loading.
// Retain this re-export until the retired root reviewer stack is archived.
export { loadReferencePacket, REFERENCE_SERVICE_STATUS } from "./runtime/services/reference.service.js";
