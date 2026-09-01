import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";

import { createApiServer } from "../../src/api/server.js";
import { initializeDatabase } from "../../src/persistence/database.js";
import db from "../../src/persistence/database.js";
import {
  createReconciliationRun,
  insertExceptionCase,
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

describe("POST /api/v1/exceptions/:caseId/resolve", () => {
  beforeEach(async () => {
    await initializeDatabase();
    await clearDatabase();

    await createReconciliationRun({
      runId: "resolution-api-run-001",
      policyVersion: "2.0.0",
      inputHash: "resolution-api-hash",
      startedAt: "2026-08-31T10:00:00.000Z",
      status: "COMPLETED",
    });

    await insertExceptionCase({
      caseId: "case-api-resolution-001",
      runId: "resolution-api-run-001",
      assetId: "cam-001",
      eventId: "e-api-resolution-001",
      severity: "ERROR",
      reasonCode: "ILLEGAL_TRANSITION",
      status: "OPEN",
      recommendedAction: "Review the transition.",
    });
  });

  test("resolves an exception and returns the audit information", async () => {
    const app = createApiServer();

    const response = await request(app)
      .post("/api/v1/exceptions/case-api-resolution-001/resolve")
      .send({
        resolvedBy: "admin-001",
        actorRole: "admin",
        resolution: "Reviewed and approved correction.",
      });
    expect(response.status).toBe(200);

    expect(response.body.status).toBe("resolved");

    expect(response.body.exception).toEqual(
      expect.objectContaining({
        case_id: "case-api-resolution-001",
        status: "RESOLVED",
        resolved_by: "admin-001",
        resolution: "Reviewed and approved correction.",
      }),
    );

    expect(response.body.exception.resolved_at).toBeDefined();
  });

  test("returns 400 when resolution information is missing", async () => {
    const app = createApiServer();

    const response = await request(app)
      .post("/api/v1/exceptions/case-api-resolution-001/resolve")

      .send({
        resolvedBy: "admin-001",
        actorRole: "admin",
      });
    expect(response.status).toBe(400);
  });

  test("returns 404 when the exception does not exist", async () => {
    const app = createApiServer();

    const response = await request(app)
      .post("/api/v1/exceptions/unknown-case/resolve")
      .send({
        resolvedBy: "admin-001",
        actorRole: "admin",
        resolution: "Reviewed.",
      });

    expect(response.status).toBe(404);
  });
});
