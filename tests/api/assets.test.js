import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";

import { createApiServer } from "../../src/api/server.js";
import { initializeDatabase } from "../../src/persistence/database.js";
import db from "../../src/persistence/database.js";
import {
  createReconciliationRun,
  insertAssetState,
  insertCanonicalEvent,
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

describe("GET /api/v1/assets/:assetId", () => {
  beforeEach(async () => {
    await initializeDatabase();
    await clearDatabase();

    await createReconciliationRun({
      runId: "asset-api-run-001",
      policyVersion: "2.0.0",
      inputHash: "asset-api-test-hash",
      startedAt: "2026-08-30T10:00:00.000Z",
      status: "COMPLETED",
    });

    await insertAssetState({
      runId: "asset-api-run-001",
      assetId: "cam-001",
      status: "CHECKED_OUT",
      condition: "good",
      holderId: "s201",
      locationId: "media-lab",
      dueAt: "2026-08-31T17:00:00.000Z",
      lastEventId: "e-api-001",
    });

    await insertCanonicalEvent({
      eventId: "e-api-001",
      canonicalEventId: "ce-0001",
      runId: "asset-api-run-001",
      eventType: "CHECKOUT",
      assetId: "cam-001",
      actorId: "s201",
      occurredAt: "2026-08-30T09:00:00.000Z",
      sourceRef: "api-1",
      idempotencyKey: "asset-api-key-001",
    });
  });

  test("returns the current authoritative asset state", async () => {
    const app = createApiServer();

    const response = await request(app).get("/api/v1/assets/cam-001");

    expect(response.status).toBe(200);

    expect(response.body.asset).toEqual(
      expect.objectContaining({
        asset_id: "cam-001",
        status: "CHECKED_OUT",
        condition: "good",
        holder_id: "s201",
        location_id: "media-lab",
      }),
    );
  });

  test("returns recent event history for the asset", async () => {
    const app = createApiServer();

    const response = await request(app).get("/api/v1/assets/cam-001");

    expect(response.status).toBe(200);

    expect(response.body.history).toHaveLength(1);

    expect(response.body.history[0]).toEqual(
      expect.objectContaining({
        event_id: "e-api-001",
        canonical_event_id: "ce-0001",
        event_type: "CHECKOUT",
        asset_id: "cam-001",
      }),
    );
  });

  test("returns 404 when the asset does not exist", async () => {
    const app = createApiServer();

    const response = await request(app).get("/api/v1/assets/unknown-999");

    expect(response.status).toBe(404);

    expect(response.body.error).toBe("Asset not found.");
  });
});
