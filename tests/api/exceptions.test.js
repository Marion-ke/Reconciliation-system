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

describe("GET /api/v1/exceptions", () => {
  beforeEach(async () => {
    await initializeDatabase();
    await clearDatabase();

    await createReconciliationRun({
      runId: "exception-api-run-001",
      policyVersion: "2.0.0",
      inputHash: "exception-api-test-hash",
      startedAt: "2026-08-30T10:00:00.000Z",
      status: "COMPLETED",
    });

    await insertExceptionCase({
      caseId: "case-001",
      runId: "exception-api-run-001",
      assetId: "cam-001",
      eventId: "e-api-001",
      severity: "ERROR",
      reasonCode: "ILLEGAL_TRANSITION",
      status: "OPEN",
      recommendedAction: "Review the asset transition.",
    });
  });

  test("returns persisted exception cases", async () => {
    const app = createApiServer();

    const response = await request(app).get("/api/v1/exceptions");

    expect(response.status).toBe(200);

    expect(response.body.exceptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          case_id: "case-001",
          run_id: "exception-api-run-001",
          asset_id: "cam-001",
          event_id: "e-api-001",
          severity: "ERROR",
          reason_code: "ILLEGAL_TRANSITION",
          status: "OPEN",
        }),
      ]),
    );
  });

  test("returns an empty array when no exceptions exist", async () => {
    await clearDatabase();

    const app = createApiServer();

    const response = await request(app).get("/api/v1/exceptions");

    expect(response.status).toBe(200);
    expect(response.body.exceptions).toEqual([]);
  });
});
