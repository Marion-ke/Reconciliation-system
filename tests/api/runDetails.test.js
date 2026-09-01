import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";

import { createApiServer } from "../../src/api/server.js";
import { initializeDatabase } from "../../src/persistence/database.js";
import db from "../../src/persistence/database.js";

import {
  createReconciliationRun,
  insertRawRecord,
  insertCanonicalEvent,
  insertEventDecision,
  insertAssetState,
  insertExceptionCase,
  insertReportArtifact,
} from "../../src/persistence/repository.js";

function clearDatabase() {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM reconciliation_runs", (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

describe("GET /api/v1/runs/:runId", () => {
  beforeEach(async () => {
    await initializeDatabase();
    await clearDatabase();

    await createReconciliationRun({
      runId: "run-details-001",
      policyVersion: "2.0.0",
      inputHash: "run-details-hash",
      startedAt: "2026-08-31T10:00:00.000Z",
      status: "COMPLETED",
    });

    await insertRawRecord({
      rawRecordId: "raw-001",
      runId: "run-details-001",
      sourceName: "events.csv",
      sourceRowId: "1",
      payload: {
        event_id: "e001",
        event_type: "CHECKOUT",
        asset_id: "cam-001",
      },
      schemaStatus: "VALID",
      createdAt: "2026-08-31T10:00:00.000Z",
    });

    await insertCanonicalEvent({
      eventId: "e001",
      canonicalEventId: "ce-0001",
      runId: "run-details-001",
      eventType: "CHECKOUT",
      assetId: "cam-001",
      actorId: "s201",
      occurredAt: "2026-08-31T09:00:00.000Z",
      sourceRef: "events.csv-1",
      idempotencyKey: "run-details-key-001",
    });

    await insertEventDecision({
      decisionId: "decision-001",
      runId: "run-details-001",
      eventId: "e001",
      decisionType: "ACCEPTED",
      reasonCode: "VALID_TRANSITION",
      stateBefore: "AVAILABLE",
      stateAfter: "CHECKED_OUT",
      message: "Checkout accepted.",
    });

    await insertAssetState({
      runId: "run-details-001",
      assetId: "cam-001",
      status: "CHECKED_OUT",
      condition: "good",
      holderId: "s201",
      locationId: "media-lab",
      dueAt: "",
      lastEventId: "e001",
    });

    await insertExceptionCase({
      caseId: "case-001",
      runId: "run-details-001",
      assetId: "cam-002",
      eventId: "e002",
      severity: "ERROR",
      reasonCode: "ILLEGAL_TRANSITION",
      status: "OPEN",
      recommendedAction: "Review transition.",
    });

    await insertReportArtifact({
      runId: "run-details-001",
      reportName: "event_decisions",
      path: "outputs/latest/event_decisions.csv",
      format: "csv",
      createdAt: "2026-08-31T10:01:00.000Z",
    });
  });

  test("returns the run and all persisted evidence", async () => {
    const app = createApiServer();

    const response = await request(app).get("/api/v1/runs/run-details-001");

    expect(response.status).toBe(200);

    expect(response.body.run.run_id).toBe("run-details-001");
    expect(response.body.run.policy_version).toBe("2.0.0");

    expect(response.body.evidence.rawRecords).toHaveLength(1);
    expect(response.body.evidence.canonicalEvents).toHaveLength(1);
    expect(response.body.evidence.decisions).toHaveLength(1);
    expect(response.body.evidence.assetStates).toHaveLength(1);
    expect(response.body.evidence.exceptions).toHaveLength(1);
    expect(response.body.evidence.reportArtifacts).toHaveLength(1);
  });

  test("returns 404 for an unknown run", async () => {
    const app = createApiServer();

    const response = await request(app).get("/api/v1/runs/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Reconciliation run not found.");
  });
});
