import { describe, test, expect } from "@jest/globals";

import { initializeDatabase } from "../../src/persistence/database.js";

import {
  createReconciliationRun,
  insertCanonicalEvent,
  getCanonicalEventByIdempotencyKey,
} from "../../src/persistence/repository.js";

describe("API idempotency lookup", () => {
  test("finds an existing canonical event by idempotency key", async () => {
    await initializeDatabase();

    const runId = "idempotency-lookup-run-001";

    await createReconciliationRun({
      runId,
      policyVersion: "2.0.0",
      inputHash: "idempotency-test-hash",
      startedAt: "2026-08-30T10:00:00.000Z",
    });

    await insertCanonicalEvent({
      eventId: "e-api-001",
      runId,
      eventType: "CHECKOUT",
      assetId: "cam-001",
      actorId: "s201",
      occurredAt: "2026-08-30T09:00:00.000Z",
      sourceRef: "api",
      idempotencyKey: "api-key-001",
    });

    const result = await getCanonicalEventByIdempotencyKey("api-key-001");

    expect(result).toBeDefined();
    expect(result.event_id).toBe("e-api-001");
    expect(result.run_id).toBe(runId);
    expect(result.idempotency_key).toBe("api-key-001");
  });

  test("returns undefined for an unused idempotency key", async () => {
    await initializeDatabase();

    const result = await getCanonicalEventByIdempotencyKey("does-not-exist");

    expect(result).toBeUndefined();
  });
});
