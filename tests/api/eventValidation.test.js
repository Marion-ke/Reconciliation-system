import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";

import { createApiServer } from "../../src/api/server.js";
import { initializeDatabase } from "../../src/persistence/database.js";
import db from "../../src/persistence/database.js";
import { mockPolicy } from "../fixtures/mockPolicy.js";

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

const inventoryRawRecords = [
  {
    rawRecordId: "inventory-validation-001",
    sourceFile: "inventory.csv",
    sourceRow: 1,
    payload: {
      asset_id: "cam-001",
      asset_type: "camera",
      status: "AVAILABLE",
      holder_id: "",
      location_id: "media-lab",
      condition: "good",
      due_at: "",
    },
  },
];

function validEvent() {
  return {
    event_id: `validation-${Date.now()}`,
    occurred_at: "2026-08-30T09:00:00Z",
    received_at: "2026-08-30T09:01:00Z",
    actor_id: "s201",
    actor_role: "student",
    event_type: "CHECKOUT",
    asset_id: "cam-001",
    location_id: "media-lab",
    condition_report: "good",
    source_system: "makerspace_app",
  };
}

describe("POST /api/v1/events validation", () => {
  beforeEach(async () => {
    await initializeDatabase();
    await clearDatabase();
  });

  test("processes a valid event", async () => {
    const app = createApiServer({
      inventoryRawRecords,
      policy: mockPolicy,
    });

    const response = await request(app)
      .post("/api/v1/events")
      .set("Idempotency-Key", `validation-valid-${Date.now()}`)
      .send(validEvent());

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("processed");
    expect(response.body.validation.errors).toBe(0);
    expect(response.body.canonicalEventIds).toHaveLength(1);
  });

  test("rejects an event with an unknown asset", async () => {
    const app = createApiServer({
      inventoryRawRecords,
      policy: mockPolicy,
    });

    const event = validEvent();

    event.event_id = "validation-unknown-asset";
    event.asset_id = "unknown-999";

    const response = await request(app)
      .post("/api/v1/events")
      .set("Idempotency-Key", "validation-unknown-asset-key")
      .send(event);

    expect(response.status).toBe(200);

    expect(response.body.validation.errors).toBeGreaterThan(0);

    expect(response.body.canonicalEventIds).toHaveLength(0);

    expect(response.body.decisions).toHaveLength(0);
  });

  test("rejects an unknown event type", async () => {
    const app = createApiServer({
      inventoryRawRecords,
      policy: mockPolicy,
    });

    const event = validEvent();

    event.event_id = "validation-unknown-type";
    event.event_type = "NOT_A_REAL_EVENT";

    const response = await request(app)
      .post("/api/v1/events")
      .set("Idempotency-Key", "validation-unknown-type-key")
      .send(event);

    expect(response.status).toBe(200);

    expect(response.body.validation.errors).toBeGreaterThan(0);

    expect(response.body.canonicalEventIds).toHaveLength(0);
  });

  test("rejects an invalid timestamp", async () => {
    const app = createApiServer({
      inventoryRawRecords,
      policy: mockPolicy,
    });

    const event = validEvent();

    event.event_id = "validation-invalid-timestamp";
    event.occurred_at = "not-a-timestamp";

    const response = await request(app)
      .post("/api/v1/events")
      .set("Idempotency-Key", "validation-invalid-timestamp-key")
      .send(event);

    expect(response.status).toBe(200);

    expect(response.body.validation.errors).toBeGreaterThan(0);

    expect(response.body.canonicalEventIds).toHaveLength(0);
  });

  test("rejects an event with a missing required field", async () => {
    const app = createApiServer({
      inventoryRawRecords,
      policy: mockPolicy,
    });

    const event = validEvent();

    event.event_id = "validation-missing-field";
    delete event.actor_id;

    const response = await request(app)
      .post("/api/v1/events")
      .set("Idempotency-Key", "validation-missing-field-key")
      .send(event);

    expect(response.status).toBe(200);

    expect(response.body.validation.errors).toBeGreaterThan(0);

    expect(response.body.canonicalEventIds).toHaveLength(0);
  });
});
