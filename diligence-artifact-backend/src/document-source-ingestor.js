// Retired compatibility tombstone. The previous uploader emitted lossless_family artifacts.
// Uploaded-document intake must be rebuilt against the active 17-root Source Discovery contract.
const ERROR = "DOCUMENT_UPLOAD_17_ROOT_CUTOVER_REQUIRED";
function blocked() { throw new Error(ERROR); }
export const parseMultipartDiligenceJob = blocked;
export const ingestUploadedSourceDocuments = blocked;
export const mergeUploadedDocumentSourcesIntoArtifact = async ({ artifact }) => artifact;
export const LEGACY_DOCUMENT_SOURCE_INGESTOR_STATUS = Object.freeze({ retired: true, replacement_required: "17_ROOT_SOURCE_DISCOVERY_DOCUMENT_INTAKE", old_lossless_family_output_forbidden: true });
