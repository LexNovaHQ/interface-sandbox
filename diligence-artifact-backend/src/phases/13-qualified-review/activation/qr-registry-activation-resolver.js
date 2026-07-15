import {
  QR_TRI_STATE,
  asArray,
  freezeDeep,
  hasMaterialValue,
  normalizeText,
  resolvePathValues,
  serializeSearchText
} from "../runtime/phase13-value-utils.js";

export const QR_REGISTRY_ACTIVATION_RESOLVER_VERSION = "phase13_qr_registry_activation_resolver.v1";

export function resolveQrRegistryActivation({
  authority,
  domain_derivation_profile = {},
  active_run_package_manifest = {},
  phase12_report_artifacts = {},
  reviewer_values = {},
  phase12_field_resolutions = {}
} = {}) {
  if (!authority?.catalog || !Array.isArray(authority?.registries)) {
    throw new Error("QR_ACTIVATION_AUTHORITY_INVALID");
  }

  const configurationValidation = validateQrActivationConfiguration(authority);
  const context = {
    domain_derivation_profile,
    active_run_package_manifest,
    phase12_report_artifacts,
    reviewer_values,
    phase12_field_resolutions
  };

  const registryResolutions = authority.registries.map((loaded) => {
    const evaluation = evaluateRule(loaded.entry.activation || {}, context);
    const state = stateFromEvaluation(evaluation, loaded.entry.activation || {});
    const subpackages = resolveSubpackages({ loaded, registryState: state, context });
    return freezeDeep({
      registry_id: loaded.registry.registry_id,
      registry_class: loaded.entry.registry_class,
      state,
      activation_evaluation: evaluation,
      subpackages
    });
  });

  const activeRegistryIds = registryResolutions.filter((row) => row.state === QR_TRI_STATE.ACTIVE).map((row) => row.registry_id);
  const inactiveRegistryIds = registryResolutions.filter((row) => row.state === QR_TRI_STATE.INACTIVE).map((row) => row.registry_id);
  const unresolvedRegistryIds = registryResolutions.filter((row) => row.state === QR_TRI_STATE.UNRESOLVED).map((row) => row.registry_id);

  const renderFieldIds = [];
  const suppressedFieldIds = [];
  const unresolvedActivationProbeFieldIds = [];

  for (const loaded of authority.registries) {
    const resolution = registryResolutions.find((row) => row.registry_id === loaded.registry.registry_id);
    const fields = asArray(loaded.registry.fields);
    if (resolution.state === QR_TRI_STATE.INACTIVE) {
      suppressedFieldIds.push(...fields.map((field) => field.qr_field_id));
      continue;
    }
    if (resolution.state === QR_TRI_STATE.UNRESOLVED) {
      suppressedFieldIds.push(...fields.map((field) => field.qr_field_id));
      continue;
    }
    if (!resolution.subpackages.length) {
      renderFieldIds.push(...fields.map((field) => field.qr_field_id));
      continue;
    }
    const covered = new Set();
    for (const subpackage of resolution.subpackages) {
      const scopedFields = fields.filter((field) => fieldMatchesSelector(field, subpackage.field_selector));
      scopedFields.forEach((field) => covered.add(field.qr_field_id));
      if (subpackage.state === QR_TRI_STATE.ACTIVE) {
        renderFieldIds.push(...scopedFields.map((field) => field.qr_field_id));
      } else if (subpackage.state === QR_TRI_STATE.UNRESOLVED) {
        const probes = asArray(subpackage.activation_probe_field_ids);
        renderFieldIds.push(...probes);
        unresolvedActivationProbeFieldIds.push(...probes);
        suppressedFieldIds.push(...scopedFields.map((field) => field.qr_field_id).filter((id) => !probes.includes(id)));
      } else {
        suppressedFieldIds.push(...scopedFields.map((field) => field.qr_field_id));
      }
    }
    renderFieldIds.push(...fields.filter((field) => !covered.has(field.qr_field_id)).map((field) => field.qr_field_id));
  }

  const uniqueRender = unique(renderFieldIds);
  const uniqueSuppressed = unique(suppressedFieldIds).filter((id) => !uniqueRender.includes(id));
  const uniqueProbes = unique(unresolvedActivationProbeFieldIds).filter((id) => uniqueRender.includes(id));

  return freezeDeep({
    artifact_type: "qr_registry_resolution_manifest",
    artifact_version: "phase13_qr_registry_resolution_manifest.v1",
    resolver_version: QR_REGISTRY_ACTIVATION_RESOLVER_VERSION,
    status: unresolvedRegistryIds.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED",
    deterministic_only: true,
    activation_configuration_validation: configurationValidation,
    operator_domain_selection_forbidden: true,
    operator_lane_selection_forbidden: true,
    activation_order: asArray(authority.catalog.activation_order),
    registry_resolutions: registryResolutions,
    active_registry_ids: activeRegistryIds,
    inactive_registry_ids: inactiveRegistryIds,
    unresolved_registry_ids: unresolvedRegistryIds,
    render_field_ids: uniqueRender,
    suppressed_field_ids: uniqueSuppressed,
    unresolved_activation_probe_field_ids: uniqueProbes,
    counts: {
      active_registry_count: activeRegistryIds.length,
      inactive_registry_count: inactiveRegistryIds.length,
      unresolved_registry_count: unresolvedRegistryIds.length,
      render_field_count: uniqueRender.length,
      suppressed_field_count: uniqueSuppressed.length,
      unresolved_activation_probe_count: uniqueProbes.length
    }
  });
}

export function validateQrActivationConfiguration(authority) {
  if (!authority?.registries) throw new Error("QR_ACTIVATION_AUTHORITY_INVALID");
  const errors = [];
  const subpackageIds = new Set();
  const allowedRoots = new Set([
    "active_run_package_manifest",
    "domain_derivation_profile",
    "phase12_report_artifacts",
    "reviewer_values",
    "phase12_field_resolutions"
  ]);
  const allowedOperators = new Set([
    "EQUALS", "NOT_EQUALS", "IN", "CONTAINS", "NOT_CONTAINS", "EXCLUDES",
    "CONTAINS_ANY", "TEXT_CONTAINS_ANY", "EXISTS", "TRUTHY", "BOOLEAN_TRUE",
    "BOOLEAN_FALSE", "HAS_MATERIAL_VALUE"
  ]);

  for (const loaded of authority.registries) {
    const fields = asArray(loaded.registry.fields);
    const fieldIds = new Set(fields.map((field) => field.qr_field_id));
    for (const subpackage of asArray(loaded.entry.subpackages)) {
      const id = String(subpackage.subpackage_id || "").trim();
      if (!id) errors.push(`SUBPACKAGE_ID_MISSING:${loaded.registry.registry_id}`);
      else if (subpackageIds.has(id)) errors.push(`SUBPACKAGE_ID_DUPLICATE:${id}`);
      else subpackageIds.add(id);
      const scoped = fields.filter((field) => fieldMatchesSelector(field, subpackage.field_selector || {}));
      if (!scoped.length) errors.push(`SUBPACKAGE_SELECTOR_MATCHES_NO_FIELDS:${id || "missing"}`);
      const scopedIds = new Set(scoped.map((field) => field.qr_field_id));
      for (const probeId of asArray(subpackage.activation_probe?.field_ids)) {
        if (!fieldIds.has(probeId)) errors.push(`ACTIVATION_PROBE_FIELD_UNKNOWN:${id}:${probeId}`);
        else if (!scopedIds.has(probeId)) errors.push(`ACTIVATION_PROBE_OUTSIDE_SUBPACKAGE:${id}:${probeId}`);
      }
      const falseState = String(subpackage.activation?.false_state || "INACTIVE").toUpperCase();
      if (![QR_TRI_STATE.INACTIVE, QR_TRI_STATE.UNRESOLVED].includes(falseState)) errors.push(`SUBPACKAGE_FALSE_STATE_INVALID:${id}:${falseState}`);
      for (const rule of [subpackage.activation, subpackage.inactive_when, subpackage.activation_probe?.active_when, subpackage.activation_probe?.inactive_when]) {
        validateRuleTree(rule, { id, errors, allowedRoots, allowedOperators });
      }
    }
    validateRuleTree(loaded.entry.activation, { id: loaded.registry.registry_id, errors, allowedRoots, allowedOperators });
  }
  if (errors.length) throw new Error(`QR_ACTIVATION_CONFIGURATION_INVALID:${errors.join("|")}`);
  return freezeDeep({ status: "PASS", subpackage_count: subpackageIds.size, errors: [] });
}

function validateRuleTree(rule, { id, errors, allowedRoots, allowedOperators }) {
  if (!rule || typeof rule !== "object") return;
  if (rule.mode === "ALWAYS") return;
  for (const child of [...asArray(rule.all), ...asArray(rule.any)]) validateRuleTree(child, { id, errors, allowedRoots, allowedOperators });
  if (rule.not) validateRuleTree(rule.not, { id, errors, allowedRoots, allowedOperators });
  if (!rule.source && !rule.operator) return;
  const source = String(rule.source || "");
  const root = source.split(".")[0];
  const operator = String(rule.operator || "").toUpperCase();
  if (!allowedRoots.has(root)) errors.push(`ACTIVATION_SOURCE_ROOT_FORBIDDEN:${id}:${root || "missing"}`);
  if (!allowedOperators.has(operator)) errors.push(`ACTIVATION_OPERATOR_UNSUPPORTED:${id}:${operator || "missing"}`);
}

export function evaluateRule(rule = {}, context = {}) {
  if (rule?.mode === "ALWAYS") return result(true, "ALWAYS");
  if (Array.isArray(rule?.all)) return combine("ALL", rule.all.map((child) => evaluateRule(child, context)));
  if (Array.isArray(rule?.any)) return combine("ANY", rule.any.map((child) => evaluateRule(child, context)));
  if (rule?.not) {
    const nested = evaluateRule(rule.not, context);
    return nested.resolved ? result(!nested.matched, "NOT", [nested]) : result(null, "NOT", [nested]);
  }
  return evaluateCondition(rule, context);
}

function resolveSubpackages({ loaded, registryState, context }) {
  return asArray(loaded.entry.subpackages).map((subpackage) => {
    if (registryState === QR_TRI_STATE.INACTIVE) {
      return packageResult(subpackage, QR_TRI_STATE.INACTIVE, result(false, "PARENT_REGISTRY_INACTIVE"));
    }
    if (registryState === QR_TRI_STATE.UNRESOLVED) {
      return packageResult(subpackage, QR_TRI_STATE.UNRESOLVED, result(null, "PARENT_REGISTRY_UNRESOLVED"));
    }

    const inactiveEvaluation = subpackage.inactive_when ? evaluateRule(subpackage.inactive_when, context) : result(null, "NO_INACTIVE_RULE");
    if (inactiveEvaluation.resolved && inactiveEvaluation.matched) {
      return packageResult(subpackage, QR_TRI_STATE.INACTIVE, inactiveEvaluation);
    }

    const activeEvaluation = evaluateRule(subpackage.activation || {}, context);
    if (activeEvaluation.resolved && activeEvaluation.matched) {
      return packageResult(subpackage, QR_TRI_STATE.ACTIVE, activeEvaluation);
    }

    const probe = subpackage.activation_probe || {};
    const probeInactive = probe.inactive_when ? evaluateRule(probe.inactive_when, context) : result(null, "NO_PROBE_INACTIVE_RULE");
    if (probeInactive.resolved && probeInactive.matched) {
      return packageResult(subpackage, QR_TRI_STATE.INACTIVE, probeInactive);
    }
    const probeActive = probe.active_when ? evaluateRule(probe.active_when, context) : result(null, "NO_PROBE_ACTIVE_RULE");
    if (probeActive.resolved && probeActive.matched) {
      return packageResult(subpackage, QR_TRI_STATE.ACTIVE, probeActive);
    }

    const falseState = String(subpackage.activation?.false_state || "INACTIVE").toUpperCase();
    const state = activeEvaluation.resolved && !activeEvaluation.matched && falseState === QR_TRI_STATE.INACTIVE
      ? QR_TRI_STATE.INACTIVE
      : QR_TRI_STATE.UNRESOLVED;
    return packageResult(subpackage, state, activeEvaluation);
  });
}

function packageResult(subpackage, state, evaluation) {
  return freezeDeep({
    subpackage_id: subpackage.subpackage_id,
    registry_scope: subpackage.registry_scope,
    field_selector: subpackage.field_selector || {},
    state,
    activation_evaluation: evaluation,
    activation_probe_field_ids: asArray(subpackage.activation_probe?.field_ids)
  });
}

function evaluateCondition(condition = {}, context = {}) {
  const source = String(condition.source || "").trim();
  const operator = String(condition.operator || "").trim().toUpperCase();
  if (!source || !operator) return result(null, "CONDITION_INCOMPLETE");
  const resolved = resolvePathValues(context, source);
  const values = resolved.values;
  if (!resolved.found) return result(null, `${operator}:SOURCE_UNRESOLVED`, [], { source });

  const target = condition.value;
  const targets = condition.values ?? (target === undefined ? [] : [target]);
  let matched;
  switch (operator) {
    case "EQUALS":
      matched = values.some((value) => equal(value, target));
      break;
    case "NOT_EQUALS":
      matched = values.every((value) => !equal(value, target));
      break;
    case "IN":
      matched = values.some((value) => asArray(targets).some((candidate) => equal(value, candidate)));
      break;
    case "CONTAINS":
      matched = values.some((value) => contains(value, target));
      break;
    case "NOT_CONTAINS":
    case "EXCLUDES":
      matched = values.every((value) => !contains(value, target));
      break;
    case "CONTAINS_ANY":
    case "TEXT_CONTAINS_ANY":
      matched = values.some((value) => asArray(targets).some((candidate) => contains(value, candidate)));
      break;
    case "EXISTS":
      matched = true;
      break;
    case "TRUTHY":
    case "BOOLEAN_TRUE":
      matched = values.some((value) => value === true || normalizeText(value) === "true" || normalizeText(value) === "yes");
      break;
    case "BOOLEAN_FALSE":
      matched = values.some((value) => value === false || normalizeText(value) === "false" || normalizeText(value) === "no");
      break;
    case "HAS_MATERIAL_VALUE":
      matched = values.some(hasMaterialValue);
      break;
    default:
      throw new Error(`QR_ACTIVATION_OPERATOR_UNSUPPORTED:${operator}`);
  }
  return result(Boolean(matched), operator, [], { source, values, targets: asArray(targets) });
}

function combine(mode, evaluations) {
  if (!evaluations.length) return result(null, `${mode}:EMPTY`, evaluations);
  if (mode === "ALL") {
    if (evaluations.some((row) => row.resolved && !row.matched)) return result(false, mode, evaluations);
    if (evaluations.every((row) => row.resolved && row.matched)) return result(true, mode, evaluations);
    return result(null, mode, evaluations);
  }
  if (evaluations.some((row) => row.resolved && row.matched)) return result(true, mode, evaluations);
  if (evaluations.every((row) => row.resolved && !row.matched)) return result(false, mode, evaluations);
  return result(null, mode, evaluations);
}

function result(matched, basis, children = [], details = {}) {
  return freezeDeep({ resolved: matched !== null, matched: matched === null ? null : Boolean(matched), basis, children, ...details });
}

function stateFromEvaluation(evaluation, activation) {
  if (activation?.mode === "ALWAYS") return QR_TRI_STATE.ACTIVE;
  if (!evaluation.resolved) return QR_TRI_STATE.UNRESOLVED;
  return evaluation.matched ? QR_TRI_STATE.ACTIVE : QR_TRI_STATE.INACTIVE;
}

function equal(left, right) {
  if (typeof left === "boolean" || typeof right === "boolean") return Boolean(left) === Boolean(right);
  return normalizeText(left) === normalizeText(right);
}

function contains(value, target) {
  if (Array.isArray(value)) return value.some((item) => contains(item, target));
  if (value && typeof value === "object") return normalizeText(serializeSearchText(value)).includes(normalizeText(target));
  return normalizeText(value).includes(normalizeText(target));
}

function fieldMatchesSelector(field, selector = {}) {
  return Object.entries(selector).every(([key, expected]) => {
    const actual = field?.[key];
    return Array.isArray(expected) ? expected.some((value) => equal(actual, value)) : equal(actual, expected);
  });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
