import { existsSync } from "node:fs";
import { extname, resolve } from "node:path";
import { loadQrRegistryAuthority } from "./qr-registry-loader.js";

export const QR_REGISTRY_STRUCTURAL_VALIDATOR_VERSION = "phase13_qr_registry_structural_validator.v1";

export function loadAndValidateQrRegistryAuthority(options = {}) {
  const authority = loadQrRegistryAuthority(options);
  const validation = validateQrRegistryAuthority(authority);
  if (validation.status !== "PASS") {
    throw new Error(`PHASE13_QR_AUTHORITY_INVALID:${validation.errors.map((item) => item.code).join("|")}`);
  }
  return Object.freeze({ authority, validation });
}

export function validateQrRegistryAuthority(authority = {}) {
  const errors = [];
  const warnings = [];
  const addError = (code, detail = {}) => errors.push(Object.freeze({ code, ...detail }));
  const addWarning = (code, detail = {}) => warnings.push(Object.freeze({ code, ...detail }));

  const catalog = authority.catalog || {};
  const schema = authority.schema || {};
  const registryRecords = asArray(authority.registries);
  const manifest = authority.template_manifest || {};
  const injectionMap = authority.injection_map || {};
  const ownershipMatrix = authority.ownership_matrix || {};
  const backendRoot = authority.backend_root || "";

  validatePointerAndCatalog({ authority, catalog, registryRecords, addError });
  validateReferenceReports({ authority, addError });

  const schemaRequiredKeys = new Set(asArray(schema.required_field_keys));
  const fillabilityEnum = new Set(asArray(schema.fillability_enum));
  const allowedBindingTypes = new Set(asArray(schema.phase12_binding_types));
  const allowedDocumentActions = new Set(asArray(schema.document_actions));

  const ownedRows = asArray(ownershipMatrix.rows).filter((row) => row?.owner_status === "OWNED");
  const ownedById = new Map(ownedRows.map((row) => [row.field_id, row]));

  const manifestDocuments = asArray(manifest.documents);
  const manifestById = uniqueMap(manifestDocuments, "document_id", "TEMPLATE_MANIFEST_DUPLICATE_DOCUMENT_ID", addError);
  const injectionDocuments = asArray(injectionMap.documents);
  const injectionById = uniqueMap(injectionDocuments, "document_id", "INJECTION_MAP_DUPLICATE_DOCUMENT_ID", addError);

  validateTemplateManifest({
    manifest,
    manifestDocuments,
    manifestById,
    backendRoot,
    addError
  });
  validateInjectionHeader({ injectionMap, injectionDocuments, addError });

  const globalFieldIds = new Map();
  const globalCanonicalKeys = new Map();
  const placeholderAuthority = new Map();
  const registryBindings = new Map();

  let actualFieldCount = 0;
  let actualAtomicValueCount = 0;
  let actualDocumentBindingCount = 0;
  let actualLinkedFieldCount = 0;
  let actualOperatorOnlyFieldCount = 0;
  let actualSectionCount = 0;
  let actualMarketFieldCount = 0;
  let actualMarketAtomicCount = 0;

  for (const loaded of registryRecords) {
    const entry = loaded.entry || {};
    const registry = loaded.registry || {};
    const registryId = registry.registry_id || entry.registry_id || "UNKNOWN_REGISTRY";
    const fields = asArray(registry.fields);
    const sections = asArray(registry.sections);
    actualSectionCount += sections.length;

    if (registry.registry_id !== entry.registry_id) {
      addError("REGISTRY_ID_CATALOG_MISMATCH", { registry_id: registryId, catalog_registry_id: entry.registry_id });
    }
    if (Number(registry.record_count) !== fields.length) {
      addError("REGISTRY_RECORD_COUNT_MISMATCH", { registry_id: registryId, declared: registry.record_count, actual: fields.length });
    }
    if (Number(entry.expected_record_count) !== fields.length) {
      addError("CATALOG_REGISTRY_RECORD_COUNT_MISMATCH", { registry_id: registryId, expected: entry.expected_record_count, actual: fields.length });
    }

    const registryAtomicCount = fields.reduce((sum, field) => sum + asArray(field.atomic_fields).length, 0);
    if (Number(registry.atomic_value_count) !== registryAtomicCount) {
      addError("REGISTRY_ATOMIC_COUNT_MISMATCH", { registry_id: registryId, declared: registry.atomic_value_count, actual: registryAtomicCount });
    }
    if (Number(entry.expected_atomic_value_count) !== registryAtomicCount) {
      addError("CATALOG_REGISTRY_ATOMIC_COUNT_MISMATCH", { registry_id: registryId, expected: entry.expected_atomic_value_count, actual: registryAtomicCount });
    }

    const localFieldIds = new Set(fields.map((field) => field.qr_field_id).filter(Boolean));
    validateSections({ registryId, sections, fields, localFieldIds, addError });

    for (const field of fields) {
      actualFieldCount += 1;
      const fieldId = field.qr_field_id || "MISSING_FIELD_ID";
      const canonicalKey = field.canonical_key || "";
      const atomicFields = asArray(field.atomic_fields);
      const phase12Bridge = field.phase12_bridge || {};
      const phase12Bindings = asArray(phase12Bridge.bindings);
      const documentBindings = asArray(field.document_bindings);
      const demoFallback = field.demo_fallback || {};

      for (const requiredKey of schemaRequiredKeys) {
        if (!Object.prototype.hasOwnProperty.call(field, requiredKey)) {
          addError("REGISTRY_FIELD_REQUIRED_KEY_MISSING", { registry_id: registryId, field_id: fieldId, key: requiredKey });
        }
      }

      if (globalFieldIds.has(fieldId)) {
        addError("DUPLICATE_QR_FIELD_ID", { field_id: fieldId, first_registry: globalFieldIds.get(fieldId), second_registry: registryId });
      } else {
        globalFieldIds.set(fieldId, registryId);
      }

      if (!canonicalKey) {
        addError("CANONICAL_KEY_MISSING", { registry_id: registryId, field_id: fieldId });
      } else if (globalCanonicalKeys.has(canonicalKey)) {
        addError("DUPLICATE_CANONICAL_KEY", { canonical_key: canonicalKey, first_field_id: globalCanonicalKeys.get(canonicalKey), second_field_id: fieldId });
      } else {
        globalCanonicalKeys.set(canonicalKey, fieldId);
      }

      if (!fillabilityEnum.has(field.fillability)) {
        addError("FIELD_FILLABILITY_INVALID", { field_id: fieldId, fillability: field.fillability });
      }
      if (Number(field.atomic_value_count) !== atomicFields.length) {
        addError("FIELD_ATOMIC_COUNT_MISMATCH", { field_id: fieldId, declared: field.atomic_value_count, actual: atomicFields.length });
      }
      actualAtomicValueCount += atomicFields.length;

      const isLinked = field.fillability === "FULL" || field.fillability === "PARTIAL";
      if (isLinked) {
        actualLinkedFieldCount += 1;
        if (phase12Bridge.linked !== true || !phase12Bindings.length) {
          addError("PHASE12_LINKED_FIELD_BINDING_MISSING", { field_id: fieldId, fillability: field.fillability });
        }
      } else {
        actualOperatorOnlyFieldCount += 1;
        if (phase12Bridge.linked !== false || phase12Bindings.length) {
          addError("OPERATOR_ONLY_FIELD_HAS_PHASE12_BINDING", { field_id: fieldId, fillability: field.fillability });
        }
      }

      validatePhase12Bindings({
        field,
        fieldId,
        atomicFields,
        phase12Bindings,
        allowedBindingTypes,
        ownedRows,
        ownedById,
        reportArtifactPrefix: catalog.phase12_authority?.report_artifact_prefix || "report_section__",
        exactRoutePrefix: catalog.phase12_authority?.exact_route_prefix || "P12.ROUTE.",
        addError,
        addWarning
      });

      const demoAtomicValues = demoFallback.atomic_values || {};
      if (demoFallback.visible_label !== "{MARKET BASED}") {
        addError("MARKET_BASED_LABEL_INVALID", { field_id: fieldId, label: demoFallback.visible_label });
      }
      if (demoFallback.not_diligence_evidence !== true) {
        addError("MARKET_BASED_EVIDENCE_BOUNDARY_MISSING", { field_id: fieldId });
      }
      actualMarketFieldCount += 1;
      for (const atomicField of atomicFields) {
        if (!hasMaterialValue(demoAtomicValues[atomicField])) {
          addError("MARKET_BASED_ATOMIC_VALUE_MISSING", { field_id: fieldId, atomic_field: atomicField });
        } else {
          actualMarketAtomicCount += 1;
        }
      }

      if (!documentBindings.length || field.document_consequence_required !== true) {
        addError("FIELD_DOCUMENT_CONSEQUENCE_MISSING", { field_id: fieldId });
      }
      if (Number(field.document_binding_count) !== documentBindings.length) {
        addError("FIELD_DOCUMENT_BINDING_COUNT_MISMATCH", { field_id: fieldId, declared: field.document_binding_count, actual: documentBindings.length });
      }
      actualDocumentBindingCount += documentBindings.length;

      for (const binding of documentBindings) {
        validateDocumentBinding({
          fieldId,
          binding,
          allowedDocumentActions,
          manifestById,
          injectionById,
          placeholderAuthority,
          registryBindings,
          addError
        });
      }
    }
  }

  validateInjectionReconciliation({
    injectionDocuments,
    registryBindings,
    manifestById,
    addError
  });

  validateLockedCounts({
    catalog,
    injectionMap,
    manifest,
    actual: {
      registry_count: registryRecords.length,
      canonical_field_count: actualFieldCount,
      atomic_value_count: actualAtomicValueCount,
      phase12_linked_field_count: actualLinkedFieldCount,
      operator_or_default_only_field_count: actualOperatorOnlyFieldCount,
      document_count: manifestDocuments.length,
      document_binding_count: actualDocumentBindingCount,
      section_count: actualSectionCount,
      market_based_demo_field_count: actualMarketFieldCount,
      market_based_demo_atomic_count: actualMarketAtomicCount
    },
    addError
  });

  const status = errors.length ? "FAIL" : "PASS";
  return Object.freeze({
    validator_version: QR_REGISTRY_STRUCTURAL_VALIDATOR_VERSION,
    status,
    authority_id: authority.active_pointer?.authority_id || "",
    catalog_id: catalog.catalog_id || "",
    catalog_version: String(catalog.version || ""),
    counts: Object.freeze({
      registries: registryRecords.length,
      canonical_fields: actualFieldCount,
      atomic_values: actualAtomicValueCount,
      phase12_linked_fields: actualLinkedFieldCount,
      operator_or_default_only_fields: actualOperatorOnlyFieldCount,
      sections: actualSectionCount,
      documents: manifestDocuments.length,
      document_bindings: actualDocumentBindingCount,
      market_based_demo_fields: actualMarketFieldCount,
      market_based_demo_atomic_values: actualMarketAtomicCount
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings)
  });
}

function validatePointerAndCatalog({ authority, catalog, registryRecords, addError }) {
  const pointer = authority.active_pointer || {};
  if (pointer.status !== "ACTIVE") addError("ACTIVE_POINTER_STATUS_INVALID", { status: pointer.status });
  if (!String(authority.catalog_path || "").startsWith("references/registry/qr/v2_1/")) {
    addError("ACTIVE_CATALOG_OUTSIDE_V2_1", { path: authority.catalog_path });
  }
  if (catalog.status !== "ACTIVE_PHASE13_AUTHORITY") {
    addError("ACTIVE_CATALOG_STATUS_INVALID", { status: catalog.status });
  }
  if (catalog.authority_boundary?.confirmation_unit !== "SECTION") {
    addError("SECTION_ATTESTATION_AUTHORITY_NOT_LOCKED");
  }
  if (catalog.authority_boundary?.per_question_confirmation_forbidden !== true) {
    addError("PER_QUESTION_CONFIRMATION_NOT_FORBIDDEN");
  }
  if (!registryRecords.length) addError("NO_ACTIVE_QR_REGISTRIES");
  for (const loaded of registryRecords) {
    if (!String(loaded.relative_path || "").startsWith("references/registry/qr/v2_1/")) {
      addError("ACTIVE_REGISTRY_OUTSIDE_V2_1", { registry_id: loaded.registry?.registry_id, path: loaded.relative_path });
    }
  }
}

function validateReferenceReports({ authority, addError }) {
  const reports = asArray(authority.validation_reports);
  if (reports.length < 2) addError("QR_VALIDATION_REPORT_REFERENCES_INCOMPLETE", { actual: reports.length });
  for (const report of reports) {
    if (!existsSync(report.absolute_path)) addError("QR_VALIDATION_REPORT_MISSING", { path: report.relative_path });
  }
}

function validateSections({ registryId, sections, fields, localFieldIds, addError }) {
  const sectionIds = new Set();
  const fieldById = new Map(fields.map((field) => [field.qr_field_id, field]));
  for (const section of sections) {
    const sectionId = section.section_id;
    if (!sectionId) {
      addError("SECTION_ID_MISSING", { registry_id: registryId });
      continue;
    }
    if (sectionIds.has(sectionId)) addError("DUPLICATE_SECTION_ID", { registry_id: registryId, section_id: sectionId });
    sectionIds.add(sectionId);
    for (const fieldId of asArray(section.field_ids)) {
      if (!localFieldIds.has(fieldId)) {
        addError("SECTION_REFERENCES_UNKNOWN_FIELD", { registry_id: registryId, section_id: sectionId, field_id: fieldId });
      } else if (fieldById.get(fieldId)?.section_id !== sectionId) {
        addError("FIELD_SECTION_MISMATCH", { registry_id: registryId, field_id: fieldId, section_id: sectionId, field_section_id: fieldById.get(fieldId)?.section_id });
      }
    }
  }
  for (const field of fields) {
    if (!sectionIds.has(field.section_id)) {
      addError("FIELD_REFERENCES_UNKNOWN_SECTION", { registry_id: registryId, field_id: field.qr_field_id, section_id: field.section_id });
    }
  }
}

function validatePhase12Bindings({
  field,
  fieldId,
  atomicFields,
  phase12Bindings,
  allowedBindingTypes,
  ownedRows,
  ownedById,
  reportArtifactPrefix,
  exactRoutePrefix,
  addError,
  addWarning
}) {
  for (const binding of phase12Bindings) {
    const type = binding.binding_type;
    if (!allowedBindingTypes.has(type)) {
      addError("PHASE12_BINDING_TYPE_INVALID", { field_id: fieldId, binding_type: type });
      continue;
    }
    if (!String(binding.report_artifact || "").startsWith(reportArtifactPrefix)) {
      addError("PHASE12_BINDING_REPORT_ARTIFACT_INVALID", { field_id: fieldId, report_artifact: binding.report_artifact });
    }
    const fills = asArray(binding.fills);
    if (!fills.length) addError("PHASE12_BINDING_FILLS_MISSING", { field_id: fieldId, binding_type: type });
    for (const atomicField of fills) {
      if (!atomicFields.includes(atomicField)) {
        addError("PHASE12_BINDING_UNKNOWN_ATOMIC_FIELD", { field_id: fieldId, atomic_field: atomicField, binding_type: type });
      }
    }

    if (type === "PHASE12_FIELD_ID") {
      const phase12FieldId = binding.field_id;
      const row = ownedById.get(phase12FieldId);
      if (!phase12FieldId) {
        addError("PHASE12_EXACT_FIELD_ID_MISSING", { field_id: fieldId });
      } else if (!row) {
        addError("PHASE12_EXACT_FIELD_NOT_OWNED", { field_id: fieldId, phase12_field_id: phase12FieldId });
      }
      if (binding.route_id !== `${exactRoutePrefix}${phase12FieldId}`) {
        addError("PHASE12_EXACT_ROUTE_ID_INVALID", { field_id: fieldId, phase12_field_id: phase12FieldId, route_id: binding.route_id });
      }
      if (binding.value_selector !== `findings[field_id="${phase12FieldId}"].value`) {
        addError("PHASE12_EXACT_VALUE_SELECTOR_INVALID", { field_id: fieldId, phase12_field_id: phase12FieldId, value_selector: binding.value_selector });
      }
    } else if (type === "PHASE12_FIELD_FAMILY") {
      const prefix = binding.field_id_prefix;
      if (!prefix) {
        addError("PHASE12_FAMILY_PREFIX_MISSING", { field_id: fieldId });
      } else if (!ownedRows.some((row) => String(row.field_id || "").startsWith(prefix))) {
        addError("PHASE12_FAMILY_PREFIX_HAS_NO_OWNED_FIELDS", { field_id: fieldId, field_id_prefix: prefix });
      }
      if (binding.runtime_must_resolve_concrete_field_ids !== true) {
        addError("PHASE12_FAMILY_CONCRETE_RESOLUTION_NOT_REQUIRED", { field_id: fieldId, field_id_prefix: prefix });
      }
      if (!String(binding.value_selector || "").includes("startsWith")) {
        addError("PHASE12_FAMILY_SELECTOR_INVALID", { field_id: fieldId, value_selector: binding.value_selector });
      }
    } else if (type === "PHASE12_STRUCTURED_FIELD") {
      if (!String(binding.value_selector || "").trim()) {
        addError("PHASE12_STRUCTURED_SELECTOR_MISSING", { field_id: fieldId });
      }
      if (!binding.transform) {
        addError("PHASE12_STRUCTURED_TRANSFORM_MISSING", { field_id: fieldId });
      }
      if (!binding.filters && !binding.canonical_label_query) {
        addWarning("PHASE12_STRUCTURED_BINDING_HAS_NO_FILTERS", { field_id: fieldId, value_selector: binding.value_selector });
      }
    }
  }

  if ((field.fillability === "FULL" || field.fillability === "PARTIAL") && !phase12Bindings.length) {
    addError("PHASE12_LINKED_FIELD_HAS_NO_BINDINGS", { field_id: fieldId });
  }
}

function validateTemplateManifest({ manifest, manifestDocuments, manifestById, backendRoot, addError }) {
  if (Number(manifest.counts?.total_templates) !== manifestDocuments.length) {
    addError("TEMPLATE_MANIFEST_COUNT_MISMATCH", { declared: manifest.counts?.total_templates, actual: manifestDocuments.length });
  }
  for (const document of manifestDocuments) {
    const documentId = document.document_id || "MISSING_DOCUMENT_ID";
    if (!document.template_path) {
      addError("TEMPLATE_PATH_MISSING", { document_id: documentId });
      continue;
    }
    if (extname(document.template_path).toLowerCase() !== ".docx") {
      addError("TEMPLATE_EXTENSION_INVALID", { document_id: documentId, template_path: document.template_path });
    }
    const templateRoot = manifest.template_root || "";
    const absolutePath = resolve(backendRoot, templateRoot, document.template_path);
    if (!existsSync(absolutePath)) {
      addError("TEMPLATE_FILE_MISSING", { document_id: documentId, template_path: document.template_path });
    }
  }
  if (manifestById.size !== manifestDocuments.length) {
    addError("TEMPLATE_MANIFEST_DOCUMENT_ID_UNIQUENESS_FAILED");
  }
}

function validateInjectionHeader({ injectionMap, injectionDocuments, addError }) {
  if (Number(injectionMap.document_count) !== injectionDocuments.length) {
    addError("INJECTION_MAP_DOCUMENT_COUNT_MISMATCH", { declared: injectionMap.document_count, actual: injectionDocuments.length });
  }
}

function validateDocumentBinding({
  fieldId,
  binding,
  allowedDocumentActions,
  manifestById,
  injectionById,
  placeholderAuthority,
  registryBindings,
  addError
}) {
  const documentId = binding.document_id;
  if (!documentId) {
    addError("DOCUMENT_BINDING_DOCUMENT_ID_MISSING", { field_id: fieldId });
    return;
  }
  if (!manifestById.has(documentId)) {
    addError("DOCUMENT_BINDING_UNKNOWN_TEMPLATE_DOCUMENT", { field_id: fieldId, document_id: documentId });
  }
  if (!injectionById.has(documentId)) {
    addError("DOCUMENT_BINDING_UNKNOWN_INJECTION_DOCUMENT", { field_id: fieldId, document_id: documentId });
  }

  const actions = asArray(binding.actions);
  if (!actions.length) addError("DOCUMENT_BINDING_ACTION_MISSING", { field_id: fieldId, document_id: documentId });
  for (const action of actions) {
    if (!allowedDocumentActions.has(action)) {
      addError("DOCUMENT_BINDING_ACTION_INVALID", { field_id: fieldId, document_id: documentId, action });
    }
  }

  if (!String(binding.document_target || "").trim()) {
    addError("DOCUMENT_BINDING_TARGET_MISSING", { field_id: fieldId, document_id: documentId });
  }

  const placeholders = binding.value_placeholders || {};
  const placeholderTokens = Object.values(placeholders).filter((value) => typeof value === "string" && value.trim());
  const hasActionToken = typeof binding.action_token === "string" && binding.action_token.trim();
  if (!placeholderTokens.length && !hasActionToken) {
    addError("DOCUMENT_BINDING_PLACEHOLDER_OR_ACTION_TOKEN_MISSING", { field_id: fieldId, document_id: documentId });
  }

  for (const token of placeholderTokens) {
    const owner = placeholderAuthority.get(token);
    if (owner && owner !== fieldId) {
      addError("DUPLICATE_PLACEHOLDER_AUTHORITY", { placeholder: token, first_field_id: owner, second_field_id: fieldId });
    } else {
      placeholderAuthority.set(token, fieldId);
    }
  }

  const key = `${documentId}::${fieldId}`;
  if (registryBindings.has(key)) {
    addError("DUPLICATE_REGISTRY_DOCUMENT_BINDING", { field_id: fieldId, document_id: documentId });
  } else {
    registryBindings.set(key, {
      field_id: fieldId,
      document_id: documentId,
      actions,
      placeholders,
      action_token: binding.action_token || null
    });
  }

  const injectionDocument = injectionById.get(documentId);
  const injectionBinding = asArray(injectionDocument?.bindings).find((item) => item.field_id === fieldId);
  if (!injectionBinding) {
    addError("REGISTRY_BINDING_MISSING_FROM_INJECTION_MAP", { field_id: fieldId, document_id: documentId });
    return;
  }
  if (!sameStringSet(actions, asArray(injectionBinding.actions))) {
    addError("REGISTRY_INJECTION_ACTION_MISMATCH", { field_id: fieldId, document_id: documentId });
  }
  if (!deepEqualNormalized(placeholders, injectionBinding.placeholders || {})) {
    addError("REGISTRY_INJECTION_PLACEHOLDER_MISMATCH", { field_id: fieldId, document_id: documentId });
  }
}

function validateInjectionReconciliation({ injectionDocuments, registryBindings, manifestById, addError }) {
  for (const document of injectionDocuments) {
    const documentId = document.document_id || "MISSING_DOCUMENT_ID";
    if (!manifestById.has(documentId)) addError("INJECTION_DOCUMENT_NOT_IN_TEMPLATE_MANIFEST", { document_id: documentId });
    for (const binding of asArray(document.bindings)) {
      const key = `${documentId}::${binding.field_id}`;
      if (!registryBindings.has(key)) {
        addError("INJECTION_BINDING_ORPHANED_FROM_REGISTRY", { document_id: documentId, field_id: binding.field_id });
      }
    }
  }
}

function validateLockedCounts({ catalog, injectionMap, manifest, actual, addError }) {
  const locked = catalog.locked_counts || {};
  for (const [key, actualValue] of Object.entries(actual)) {
    if (Number(locked[key]) !== Number(actualValue)) {
      addError("CATALOG_LOCKED_COUNT_MISMATCH", { count: key, expected: locked[key], actual: actualValue });
    }
  }
  if (Number(injectionMap.registry_field_count) !== Number(actual.canonical_field_count)) {
    addError("INJECTION_MAP_FIELD_COUNT_MISMATCH", { declared: injectionMap.registry_field_count, actual: actual.canonical_field_count });
  }
  if (Number(injectionMap.atomic_value_count) !== Number(actual.atomic_value_count)) {
    addError("INJECTION_MAP_ATOMIC_COUNT_MISMATCH", { declared: injectionMap.atomic_value_count, actual: actual.atomic_value_count });
  }
  if (Number(manifest.counts?.total_templates) !== Number(actual.document_count)) {
    addError("TEMPLATE_MANIFEST_LOCKED_DOCUMENT_COUNT_MISMATCH", { declared: manifest.counts?.total_templates, actual: actual.document_count });
  }
}

function uniqueMap(rows, key, duplicateCode, addError) {
  const map = new Map();
  for (const row of rows) {
    const value = row?.[key];
    if (!value) {
      addError(`${duplicateCode}_MISSING_KEY`, { key });
      continue;
    }
    if (map.has(value)) addError(duplicateCode, { value });
    else map.set(value, row);
  }
  return map;
}

function hasMaterialValue(value) {
  if (value === false || value === 0) return true;
  if (Array.isArray(value)) return value.length > 0 && value.every(hasMaterialValue);
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return String(value ?? "").trim().length > 0;
}

function sameStringSet(left, right) {
  return JSON.stringify([...new Set(left.map(String))].sort()) === JSON.stringify([...new Set(right.map(String))].sort());
}

function deepEqualNormalized(left, right) {
  return JSON.stringify(sortObject(left)) === JSON.stringify(sortObject(right));
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}
