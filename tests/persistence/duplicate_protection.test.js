import { describe, test, expect } from "@jest/globals";
import { initializeDatabase } from "../../src/persistence/database.js";
import {
  createReconciliationRun,
  insertCanonicalEvent,
} from "../../src/persistence/repository.js";

describe("Database Duplicate Protection", () => {
  test("prevents duplicate canonical events within the same run", async () => {
    await initializeDatabase();

    const runId = "duplicate-test-run-001";

    await createReconciliationRun({
      runId,
      policyVersion: "2.0.0",
      inputHash: "duplicate-test-hash",
      startedAt: "2026-08-03T14:00:00.000Z",
    });

    const event = {
      eventId: "e001",
      runId,
      eventType: "CHECKOUT",
      assetId: "lap-001",
      actorId: "s001",
      occurredAt: "2026-08-03T13:00:00.000Z",
      sourceRef: "events.csv-1",
      idempotencyKey: "events.csv-1-e001",
    };

    await insertCanonicalEvent(event);

    await expect(insertCanonicalEvent(event)).rejects.toThrow();
  });
});
