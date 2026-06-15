#!/usr/bin/env node

import "express";
import "helmet";
import "cors";
import "@google/genai";
import "ajv";
import "../src/routes/liveDiligenceRoutes.js";
import "../src/live/canonicalLiveDiligenceRunOrchestrator.js";
import "../src/live/liveStage6To8Pipeline.js";
import "../src/diligence/stageRunnerLocked.js";
import "../src/diligence/stage5/stage5.runtime.js";
import "../src/diligence/stage6aLegalSourceAdmission.js";
import "../src/diligence/stage6bDataProvenanceRunner.js";
import "../src/diligence/adapters/registryLedgerInputAdapter.js";
import "../src/diligence/adapters/registryLedgerInputAdapterV2.js";
import "../src/diligence/stage7EvidenceSafetyPacket.js";
import "../src/diligence/stage7ExposureProfileBuilder.js";
import "../src/diligence/stage9CanonicalProfileInputAdapter.js";
import "../src/diligence/stage9ProfileInputAdapter.js";
import "../src/diligence/stage9ReportAssembler.js";
import "../src/diligence/stage9ReportValidator.js";
import "../src/handoff/stage10CanonicalSourcePacketBuilder.js";
import "../src/handoff/stage10SourcePacketBuilder.js";
import "../src/handoff/vaultPrefillFromStage10Canonical.js";
import "../src/handoff/vaultQuestionsFromStage10Canonical.js";
import "../src/handoff/stage9ToVaultHandoffAdapter.js";
import "../src/handoff/reviewReadyHandoffValidatorCanonical.js";
import "../src/handoff/reviewReadyHandoffValidator.js";

console.log("canonical runtime import graph ok");
