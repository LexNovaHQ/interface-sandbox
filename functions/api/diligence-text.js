import { getMockPayload } from "../_shared/mockData.js";
import { methodNotAllowed, mockResponse } from "../_shared/response.js";
import { assertSkeletonOnly } from "../_shared/safety.js";

export async function onRequestPost() {
  assertSkeletonOnly();
  return mockResponse(getMockPayload("diligence-text"));
}

export async function onRequestGet() {
  return methodNotAllowed(["POST"]);
}
