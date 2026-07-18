import assert from "node:assert/strict";
import { saveJsonArtifactToDrive, semanticJsonArtifactHash } from "../src/runtime/services/storage/drive.service.js";
import { resolveNextArtifactVersion, isSourceDiscoveryPersistenceContext } from "../src/runtime/services/storage/firestore.service.js";

const runId = "LN-20260716-120000-RB16-000001";
const artifactName = "lossless_root__product_service";
const baseArtifact = {
  artifact_name: artifactName,
  common_root: "product_service",
  generated_at: "2026-07-16T12:00:00.000Z",
  sources: [{ source_id: "product_service.SRC.001", lossless_text: "Canonical evidence", updated_at: "2026-07-16T12:00:00.000Z" }]
};
const timestampOnlyChange = {
  ...baseArtifact,
  generated_at: "2026-07-16T12:05:00.000Z",
  sources: [{ ...baseArtifact.sources[0], updated_at: "2026-07-16T12:05:00.000Z" }]
};
const materialChange = {
  ...timestampOnlyChange,
  sources: [{ ...timestampOnlyChange.sources[0], lossless_text: "Canonical evidence with a material delta" }]
};

assert.equal(
  semanticJsonArtifactHash({ run_id: runId, artifact_name: artifactName, artifact: baseArtifact }),
  semanticJsonArtifactHash({ run_id: runId, artifact_name: artifactName, artifact: timestampOnlyChange }),
  "volatile runtime timestamps changed the semantic artifact hash"
);
assert.notEqual(
  semanticJsonArtifactHash({ run_id: runId, artifact_name: artifactName, artifact: baseArtifact }),
  semanticJsonArtifactHash({ run_id: runId, artifact_name: artifactName, artifact: materialChange }),
  "material artifact change did not change the semantic artifact hash"
);

const fake = fakeDriveClient();
const first = await saveJsonArtifactToDrive({ run_id: runId, artifact_name: artifactName, version: 1, drive_folder_id: "FOLDER", artifact: baseArtifact, drive_client: fake.client });
const second = await saveJsonArtifactToDrive({ run_id: runId, artifact_name: artifactName, version: 1, drive_folder_id: "FOLDER", artifact: timestampOnlyChange, drive_client: fake.client });
const third = await saveJsonArtifactToDrive({ run_id: runId, artifact_name: artifactName, version: 1, drive_folder_id: "FOLDER", artifact: materialChange, drive_client: fake.client });

assert.equal(first.persistence_action, "CREATED");
assert.equal(second.persistence_action, "REUSED");
assert.equal(third.persistence_action, "UPDATED");
assert.equal(first.drive_file_id, second.drive_file_id);
assert.equal(second.drive_file_id, third.drive_file_id);
assert.equal(first.drive_filename, `${artifactName}_v1.json`);
assert.equal(fake.stats.create_calls, 1, "idempotent retry created a duplicate Drive file");
assert.equal(fake.stats.update_calls, 1, "material retry did not update the existing Drive file exactly once");
assert.equal(fake.files.size, 1, "more than one physical Drive file exists for one Phase 1 artifact identity/version");

assert.equal(isSourceDiscoveryPersistenceContext({ central_phase: "SOURCE_DISCOVERY" }), true);
assert.equal(isSourceDiscoveryPersistenceContext({ active_internal_job: "AGENT_1B_EXTRACT" }), true);
assert.equal(isSourceDiscoveryPersistenceContext({ central_phase: "CARTOGRAPHY_INDEX", active_internal_job: "M9" }), false);
assert.equal(resolveNextArtifactVersion({ artifact_metadata: null, run_record: { central_phase: "SOURCE_DISCOVERY" } }), 1);
assert.equal(resolveNextArtifactVersion({ artifact_metadata: { latest_version: 3 }, run_record: { central_phase: "SOURCE_DISCOVERY" } }), 3, "Phase 1 retry incremented the artifact version");
assert.equal(resolveNextArtifactVersion({ artifact_metadata: { latest_version: 3 }, run_record: { central_phase: "CARTOGRAPHY_INDEX" } }), 4, "downstream version increment was weakened");

console.log(JSON.stringify({
  check: "phase1 RB16 idempotent persistence",
  status: "PASS",
  physical_files_after_three_writes: fake.files.size,
  create_calls: fake.stats.create_calls,
  update_calls: fake.stats.update_calls,
  actions: [first.persistence_action, second.persistence_action, third.persistence_action],
  phase1_version_reused: 3,
  downstream_next_version: 4
}, null, 2));

function fakeDriveClient() {
  const files = new Map();
  const stats = { create_calls: 0, update_calls: 0, list_calls: 0 };
  const client = {
    files: {
      list: async ({ q }) => {
        stats.list_calls += 1;
        const name = q.match(/name = '([^']+)'/)?.[1]?.replaceAll("\\'", "'") || "";
        return { data: { files: [...files.values()].filter((file) => file.name === name) } };
      },
      create: async ({ requestBody }) => {
        stats.create_calls += 1;
        const id = `FILE-${stats.create_calls}`;
        const file = {
          id,
          name: requestBody.name,
          webViewLink: `https://drive.test/${id}`,
          driveId: "DRIVE",
          size: "100",
          mimeType: requestBody.mimeType,
          appProperties: requestBody.appProperties || {}
        };
        files.set(id, file);
        return { data: file };
      },
      update: async ({ fileId, requestBody }) => {
        stats.update_calls += 1;
        const previous = files.get(fileId);
        assert.ok(previous, `fake Drive update target missing: ${fileId}`);
        const file = { ...previous, name: requestBody.name, mimeType: requestBody.mimeType, appProperties: requestBody.appProperties || {} };
        files.set(fileId, file);
        return { data: file };
      }
    }
  };
  return { client, files, stats };
}
