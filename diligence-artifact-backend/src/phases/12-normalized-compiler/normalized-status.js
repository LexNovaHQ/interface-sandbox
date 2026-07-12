export function toMachineStatus(value, fallback = "LOCKED_WITH_LIMITATIONS") {
  const raw = String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (raw === "LOCKED" || raw === "PASS") return "LOCKED";
  if (raw === "LOCKED_WITH_LIMITATIONS" || raw === "PASS_WITH_LIMITATION" || raw === "COMPLETED_WITH_LIMITATIONS") return "LOCKED_WITH_LIMITATIONS";
  if (raw === "REPAIR_REQUIRED") return "REPAIR_REQUIRED";
  return fallback;
}
