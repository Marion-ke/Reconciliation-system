import { describe, test, expect } from "@jest/globals";
import request from "supertest";

import { createApiServer } from "../../src/api/server.js";
import { mockPolicy } from "../fixtures/mockPolicy.js";
import { initializeDatabase } from "../../src/persistence/database.js";
describe("POST /api/v1/events", () => {
  beforeEach(async () => {
    await initializeDatabase();
  });
  const inventoryRawRecords = [
    {
      rawRecordId: "inventory-1",
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

  test("accepts a single event and returns a canonical ID", async () => {
    const app = createApiServer({
      inventoryRawRecords,
      policy: mockPolicy,
    });

    const response = await request(app)
      .post("/api/v1/events")
      .set("Idempotency-Key", "api-test-single-key-001")
      .send({
        event_id: "e-api-001",
        occurred_at: "2026-08-30T09:00:00Z",
        received_at: "2026-08-30T09:01:00Z",
        actor_id: "s201",
        actor_role: "student",
        event_type: "CHECKOUT",
        asset_id: "cam-001",
        location_id: "media-lab",
        condition_report: "good",
        source_system: "makerspace_app",
        note: "API test event",
      });

    expect(response.status).toBe(200);

    expect(response.body.status).toBe("processed");

    expect(response.body.canonicalEventIds).toEqual(["ce-0001"]);

    expect(response.body.validation.errors).toBe(0);

    expect(response.body.decisions).toHaveLength(1);

    expect(response.body.decisions[0].eventId).toBe("e-api-001");
  });

  test("accepts a batch of events", async () => {
    const app = createApiServer({
      inventoryRawRecords,
      policy: mockPolicy,
    });

    const response = await request(app)
      .post("/api/v1/events")
      .set("Idempotency-Key", "api-test-key-001")
      .send({
        events: [
          {
            event_id: "e-api-002",
            occurred_at: "2026-08-30T09:00:00Z",
            received_at: "2026-08-30T09:01:00Z",
            actor_id: "s201",
            actor_role: "student",
            event_type: "CHECKOUT",
            asset_id: "cam-001",
            location_id: "media-lab",
            condition_report: "good",
            source_system: "makerspace_app",
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("processed");
    expect(response.body.canonicalEventIds).toHaveLength(1);
  });

  test("rejects an empty batch", async () => {
    const app = createApiServer({
      inventoryRawRecords,
      policy: mockPolicy,
    });

    const response = await request(app).post("/api/v1/events").send({
      events: [],
    });

    expect(response.status).toBe(400);
  });
  test("does not process the same event twice with the same Idempotency-Key", async () => {
    const app = createApiServer({
      inventoryRawRecords,
      policy: mockPolicy,
    });

    const event = {
      event_id: "e-api-idempotent-001",
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

    const firstResponse = await request(app)
      .post("/api/v1/events")
      .set("Idempotency-Key", "duplicate-api-key-001")
      .send(event);

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.status).toBe("processed");

    const secondResponse = await request(app)
      .post("/api/v1/events")
      .set("Idempotency-Key", "duplicate-api-key-001")
      .send(event);

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.status).toBe("duplicate");
    expect(secondResponse.body.idempotent).toBe(true);

    expect(secondResponse.body.canonicalEventIds).toEqual(
      firstResponse.body.canonicalEventIds,
    );
  });
});
