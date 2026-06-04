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
    required: true
  },
  {
    id: "diligence_groq_sandbox_runtime",
    label: "Diligence Groq Sandbox Runtime",
    path: "docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md",
    type: "markdown",
    required: true,
    note: "Sandbox/Groq runtime doctrine only"
  }
]);

const INSTALLED_ARTIFACTS = Object.freeze({
  registry_runtime: registryRuntime,
  registry_key_runtime: registryKeyRuntime,
  runtime_artifacts_manifest: runtimeArtifactsManifest,
  vault_reference: { status: "installed" },
  diligence_groq_sandbox_runtime: { status: "installed" }
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

function getRegistryMetadata() {
  return [
    {
      label: "Registry version",
      value: firstValue(registryRuntime, ["version", "registry_version"])
    },
    {
      label: "Registry row count",
      value:
        getArrayCount(registryRuntime, ["registry", "rows", "threats", "items"]) ??
        firstValue(registryRuntime, ["registry_count", "row_count", "count"]) ??
        firstNestedValue(registryRuntime, [["metadata", "row_count"]])
    },
    {
      label: "Generated/exported",
      value: firstValue(registryRuntime, [
        "generated_at",
        "generatedAt",
        "exported_at",
        "exportedAt"
      ])
    }
  ].filter((item) => item.value !== null);
}

function getRegistryKeyMetadata() {
  return [
    {
      label: "Key version",
      value:
        firstValue(registryKeyRuntime, ["version", "key_version"]) ??
        firstNestedValue(registryKeyRuntime, [
          ["key", "version"],
          ["metadata", "version"],
          ["key", "title"],
          ["source"]
        ])
    },
    {
      label: "Threat ID regex",
      value:
        firstValue(registryKeyRuntime, ["threat_id_regex", "threatIdRegex"]) ??
        firstNestedValue(registryKeyRuntime, [
          ["threat_id_schema", "regex"],
          ["key", "threat_id_regex"]
        ])
    },
    {
      label: "Final registry count",
      value:
        firstNestedValue(registryKeyRuntime, [["key", "final_registry", "registry_rows"]]) ??
        firstValue(registryKeyRuntime, [
          "final_registry_count",
          "finalRegistryCount",
          "registry_count"
        ]) ??
        firstNestedValue(registryKeyRuntime, [["distribution", "total"]])
    },
    {
      label: "Archetype count",
      value: firstNestedValue(registryKeyRuntime, [["key", "final_registry", "archetype_count"]])
    },
    {
      label: "Subcat count",
      value: firstNestedValue(registryKeyRuntime, [["key", "final_registry", "subcat_count"]])
    },
    {
      label: "Column count",
      value: firstNestedValue(registryKeyRuntime, [["key", "final_registry", "column_count"]])
    }
  ].filter((item) => item.value !== null);
}

function getReferenceMetadata(artifactId) {
  if (artifactId === "vault_reference") {
    return [{ label: "Note", value: "reference-only" }];
  }

  if (artifactId === "diligence_groq_sandbox_runtime") {
    return [{ label: "Path", value: "docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md" }];
  }

  return [];
}

function getArtifactMetadata(artifactId) {
  if (artifactId === "registry_runtime") return getRegistryMetadata();
  if (artifactId === "registry_key_runtime") return getRegistryKeyMetadata();
  return getReferenceMetadata(artifactId);
}

export function getRuntimeArtifactStatuses() {
  return EXPECTED_RUNTIME_ARTIFACTS.map((artifact) => {
    const installed = Boolean(INSTALLED_ARTIFACTS[artifact.id]);

    return {
      ...artifact,
      status: installed ? "installed" : "missing",
      statusLabel: installed ? "Installed" : "Missing",
      metadata: installed ? getArtifactMetadata(artifact.id) : []
    };
  });
}
