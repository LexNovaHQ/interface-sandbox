import assert from "node:assert/strict";
import { toMachineStatus } from "../src/phases/11-normalized-compiler/normalized-status.js";

assert.equal(toMachineStatus("LOCKED"), "LOCKED");
assert.equal(toMachineStatus("PASS"), "LOCKED");
assert.equal(toMachineStatus("Completed with limitations"), "LOCKED_WITH_LIMITATIONS");
assert.equal(toMachineStatus("PASS_WITH_LIMITATION"), "LOCKED_WITH_LIMITATIONS");
assert.equal(toMachineStatus("REPAIR_REQUIRED"), "REPAIR_REQUIRED");
assert.equal(toMachineStatus("anything else"), "LOCKED_WITH_LIMITATIONS");
console.log("normalized status helper: PASS");