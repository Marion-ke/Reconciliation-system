import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";

import { createApiServer } from "../../src/api/server.js";
import { initializeDatabase } from "../../src/persistence/database.js";
import { createReconciliationRun } from "../../src/persistence/repository.js";
import db from "../../src/persistence/database.js";
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
describe("GET /api/v1/runs", () => {
  beforeEach(async () => {
    await initializeDatabase();
    await clearDatabase();
  });

  test("returns persisted reconciliation runs", async () => {
    await createReconciliationRun({
      runId: "api-run-test-001",
      policyVersion: "2.0.0",
      inputHash: "test-hash-001",
      startedAt: "2026-08-30T10:00:00.000Z",
      status: "COMPLETED",
    });

    const app = createApiServer();

    const response = await request(app).get("/api/v1/runs");

    expect(response.status).toBe(200);

    expect(response.body.runs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          run_id: "api-run-test-001",
          policy_version: "2.0.0",
          input_hash: "test-hash-001",
          status: "COMPLETED",
        }),
      ]),
    );
  });

  test("returns an empty array when no runs exist", async () => {
    const app = createApiServer();

    const response = await request(app).get("/api/v1/runs");

    expect(response.status).toBe(200);
    expect(response.body.runs).toEqual([]);
  });
});
