import assert from "node:assert/strict";
import { assertPhase11TargetedPacket } from "../src/phases/11-operator-challenge/operator-challenge-targeted-packet.js";
import { dispatchFor, packetFor, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const dispatch = dispatchFor();
const packet = packetFor(dispatch);
assert.equal(assertPhase11TargetedPacket({ packet, dispatch }), true);
assert.equal(packet.targeted_reinvestigation_only, true);
assert.equal(packet.full_phase_rerun_forbidden, true);
assert.equal(packet.return_to_phase11_after_completion, true);
assert.throws(() => assertPhase11TargetedPacket({ packet: { ...packet, dispatch_id: "wrong" }, dispatch }), /DISPATCH_MISMATCH|FINGERPRINT/);

printReceipt("phase11 targeted packet runtime", ["CO14-05"], 5);
