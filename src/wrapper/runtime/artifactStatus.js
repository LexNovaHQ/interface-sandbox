import registryRuntime from "../../../data/runtime/registry.runtime.json";
import registryKeyRuntime from "../../../data/runtime/registry_key.runtime.json";
import runtimeArtifactsManifest from "../../../data/runtime/runtime_artifacts_manifest.json";

export const EXPECTED_RUNTIME_ARTIFACTS = Object.freeze([
  {
    id: "registry_runtime",
    label: "Registry Runtime",
    path: "data/runtime/registry.runtime.json",
    type: "json",
    required: true
  },
  {
    id: "registry_key_runtime",
    label: "Registry Key Runtime",
    path: "data/runtime/registry_key.runtime.json",
    type: "json",
    required: true
  },
  {
    id: "runtime_artifacts_manifest",
    label: "Runtime Artifacts Manifest",
    path: "data/runtime/runtime_artifacts_manifest.json",
    type: "json",
    required: true
  },
  {
    id: "vault_reference",
    label: "Vault Reference",
    path: "docs/reference/vault.js",
    type: "reference",
    required: true,
    note: "Reference-only canonical Vault payload"
  },
  {
    id: "diligence_groq_sandbox_runtime",
    label: "Legacy Groq Sandbox Runtime Reference",
    path: "docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md",
    type: "markdown",
    required: false,
    note: "Legacy doctrine retained for migration history only; not an active Diligence v2 runtime dependency"
  }
]);

const INSTALLED_ARTIFACTS = Object.freeze({
  registry_runtime: { status: "installed", payload: registryRuntime },
  registry_key_runtime: { status: "installed", payload: registryKeyRuntime },
  runtime_artifacts_manifest: { status: "installed", payload: runtimeArtifactsManifest },
  vault_reference: { status: "installed" },
  diligence_groq_sandbox_runtime: { status: "reference_only" }
});

function firstValue(source, keys) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  return null;
}

function firstNestedValue(source, paths) {
  for (const path of paths) {
    const value = path.reduce((current, key) => current?.[key], source);
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return null;
}

function getArrayCount(source, keys) {
  for (const key of keys) {
    if (Array.isArray(source?.[key])) return source[key].length;
  }

  return null;
}

function getManifestArtifact(artifactId) {
  return runtimeArtifactsManifest?.artifacts?.find((artifact) => artifact.id === artifactId) ?? null;
}

function getInstalledPayload(artifactId) {
  return INSTALLED_ARTIFACTS[artifactId]?.payload ?? null;
}

function getStatusLabel(status) {
  if (status === "reference_only") return "Reference only";
  if (status === "installed") return "Installed";
  if (status === "missing") return "Missing";
  return status || "Unknown";
}

function getRegistryMetadata() {
  const source = getInstalledPayload("registry_runtime") ?? registryRuntime;

  return [
    {
      label: "Registry version",
      value: firstValue(source, ["version", "registry_version"])
    },
    {
      label: "Registry row count",
      value:
        getArrayCount(source, ["registry", "rows", "threats", "items"]) ??
        firstValue(source, ["registry_count", "row_count", "count"]) ??
        firstNestedValue(source, [["metadata", "row_count"]])
    },
    {
      label: "Generated/exported",
      value: firstValue(source, [
        "generated_at",
        "generatedAt",
        "exported_at",
        "exportedAt"
      ])
    }
  ].filter((item) => item.value !== null);
}

function getRegistryKeyMetadata() {
  const source = getInstalledPayload("registry_key_runtime") ?? registryKeyRuntime;

  return [
    {
      label: "Key version",
      value:
        firstValue(source, ["version", "key_version"]) ??
        firstNestedValue(source, [
          ["key", "version"],
          ["metadata", "version"],
          ["key", "title"],
          ["source"]
        ])
    },
    {
      label: "Threat ID regex",
      value:
        firstValue(source, ["threat_id_regex", "threatIdRegex"]) ??
        firstNestedValue(source, [
          ["threat_id_schema", "regex"],
          ["key", "threat_id_regex"]
        ])
    },
    {
      label: "Final registry count",
      value:
        firstNestedValue(source, [["key", "final_registry", "registry_rows"]]) ??
        firstValue(source, [
          "final_registry_count",
          "finalRegistryCount",
          "registry_count"
        ]) ??
        firstNestedValue(source, [["distribution", "total"]])
    },
    {
      label: "Archetype count",
      value: firstNestedValue(source, [["key", "final_registry", "archetype_count"]])
    },
    {
      label: "Subcat count",
      value: firstNestedValue(source, [["key", "final_registry", "subcat_count"]])
    },
    {
      label: "Column count",
      value: firstNestedValue(source, [["key", "final_registry", "column_count"]])
    }
  ].filter((item) => item.value !== null);
}

function getReferenceMetadata(artifactId) {
  const manifestArtifact = getManifestArtifact(artifactId);
  const metadata = [];

  if (manifestArtifact?.note) {
    metadata.push({ label: "Note", value: manifestArtifact.note });
  }

  if (artifactId === "vault_reference") {
    metadata.push({ label: "Mode", value: "reference-only" });
  }

  if (artifactId === "diligence_groq_sandbox_runtime") {
    metadata.push({ label: "Mode", value: "legacy reference-only" });
    metadata.push({ label: "Path", value: "docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md" });
  }

  return metadata;
}

function getArtifactMetadata(artifactId) {
  if (artifactId === "registry_runtime") return getRegistryMetadata();
  if (artifactId === "registry_key_runtime") return getRegistryKeyMetadata();
  return getReferenceMetadata(artifactId);
}

export function getRuntimeArtifactStatuses() {
  return EXPECTED_RUNTIME_ARTIFACTS.map((artifact) => {
    const installedArtifact = INSTALLED_ARTIFACTS[artifact.id];
    const manifestArtifact = getManifestArtifact(artifact.id);
    const installed = Boolean(installedArtifact);
    const status = installedArtifact?.status ?? manifestArtifact?.status ?? (installed ? "installed" : "missing");

    return {
      ...artifact,
      required: manifestArtifact?.required ?? artifact.required,
      status: installed ? status : "missing",
      statusLabel: installed ? getStatusLabel(status) : "Missing",
      metadata: installed ? getArtifactMetadata(artifact.id) : []
    };
  });
}
