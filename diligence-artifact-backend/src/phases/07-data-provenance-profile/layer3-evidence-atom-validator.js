const FORBIDDEN_ATOM_KEYS = Object.freeze(["excerpt", "excerpts", "raw_text", "clean_text", "content", "body", "html", "markdown", "text"]);

export function validatePhase7EvidenceAtomInventory(atomInventory) {
  const errors = [];
  if (!atomInventory || atomInventory.artifact_type !== "dap_evidence_atom_inventory") errors.push("wrong_atom_inventory_type");
  const atoms = atomInventory?.evidence_atoms || [];
  const plan = atomInventory?.access_plan;
  if (!Array.isArray(atoms)) errors.push("atoms_not_array");
  if (!plan || plan.artifact_type !== "dap_pinpoint_family_access_plan") errors.push("missing_access_plan");
  if (plan?.access_policy?.full_d_family_access_allowed_for_navigation !== true) errors.push("d_family_access_not_allowed_for_navigation");
  if (plan?.access_policy?.full_l_family_access_allowed_for_navigation !== true) errors.push("l_family_access_not_allowed_for_navigation");
  if (plan?.access_policy?.whole_family_output_allowed !== false) errors.push("whole_family_output_not_disabled_in_plan");
  if (plan?.access_policy?.full_document_output_allowed !== false) errors.push("full_document_output_not_disabled_in_plan");
  if (plan?.access_policy?.excerpts_allowed !== false) errors.push("excerpt_output_not_disabled_in_plan");
  for (const atom of atoms) validateAtom(atom, errors);
  return Object.freeze({
    status: errors.length ? "REPAIR_REQUIRED" : "PASS",
    checked_atoms: atoms.length,
    full_family_access_preserved_for_navigation: plan?.access_policy?.full_d_family_access_allowed_for_navigation === true && plan?.access_policy?.full_l_family_access_allowed_for_navigation === true,
    output_is_atomized: !errors.some((error) => error.includes("output_not_disabled") || error.includes("forbidden_atom_key")),
    errors
  });
}

function validateAtom(atom, errors) {
  if (!atom || typeof atom !== "object") { errors.push("atom_not_object"); return; }
  for (const key of FORBIDDEN_ATOM_KEYS) if (Object.prototype.hasOwnProperty.call(atom, key)) errors.push(`forbidden_atom_key:${atom.atom_id || "NO_ID"}:${key}`);
  for (const key of ["atom_id", "atom_type", "source_route_id", "source_artifact", "document_type", "pinpoint_locator", "anti_unknown_status"]) if (!atom[key]) errors.push(`missing_${key}:${atom.atom_id || "NO_ID"}`);
  if (atom.whole_family_access_was_allowed_for_navigation !== true) errors.push(`family_access_not_preserved:${atom.atom_id}`);
  if (atom.whole_family_output_allowed !== false) errors.push(`whole_family_output_not_disabled:${atom.atom_id}`);
  if (atom.full_document_output_allowed !== false) errors.push(`full_document_output_not_disabled:${atom.atom_id}`);
  if (atom.excerpt_output_allowed !== false) errors.push(`excerpt_output_not_disabled:${atom.atom_id}`);
}
