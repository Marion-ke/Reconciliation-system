import { describe, test, expect } from "@jest/globals";
import { initializeDatabase } from "../../src/persistence/database.js";

import {
  createReconciliationRun,
  insertCanonicalEvent,
  insertEventDecision,
  insertAssetState,
  getEventDecisions,
  getAssetStates,
} from "../../src/persistence/repository.js";

describe("Database Run Isolation", () => {
  test("keeps data isolated between reconciliation runs", async () => {
    await initializeDatabase();

    const runA = "isolation-run-A";
    const runB = "isolation-run-B";

    await createReconciliationRun({
      runId: runA,
      policyVersion: "2.0.0",
      inputHash: "hash-A",
      startedAt: "2026-08-03T11:00:00.000Z",
    });

    await createReconciliationRun({
      runId: runB,
      policyVersion: "2.0.0",
      inputHash: "hash-B",
      startedAt: "2026-08-03T12:00:00.000Z",
    });

    await insertCanonicalEvent({
      eventId: `${runA}-e001`,
      runId: runA,
      eventType: "CHECKOUT",
      assetId: "lap-001",
      actorId: "s001",
      occurredAt: "2026-08-03T10:00:00.000Z",
      sourceRef: "events.csv-1",
      idempotencyKey: `${runA}-e001`,
    });

    await insertEventDecision({
      decisionId: `${runA}-decision-001`,
      runId: runA,
      eventId: `${runA}-e001`,
      decisionType: "ACCEPTED",
      reasonCode: null,
      stateBefore: "available",
      stateAfter: "checked_out",
      message: "Accepted.",
    });

    await insertAssetState({
      runId: runA,
      assetId: "lap-001",
      status: "checked_out",
      condition: "good",
      holderId: "s001",
      locationId: "equipment-store",
      dueAt: null,
      lastEventId: "e001",
    });

    await insertCanonicalEvent({
      eventId: `${runB}-e002`,
      runId: runB,
      eventType: "RETURN",
      assetId: "lap-002",
      actorId: "s002",
      occurredAt: "2026-08-03T11:00:00.000Z",
      sourceRef: "events.csv-2",
      idempotencyKey: `${runB}-e002`,
    });

    await insertEventDecision({
      decisionId: `${runB}-decision-002`,
      runId: runB,
      eventId: `${runB}-e002`,
      decisionType: "ACCEPTED",
      reasonCode: null,
      stateBefore: "checked_out",
      stateAfter: "available",
      message: "Accepted.",
    });

    await insertAssetState({
      runId: runB,
      assetId: "lap-002",
      status: "available",
      condition: "good",
      holderId: null,
      locationId: "equipment-store",
      dueAt: null,
      lastEventId: "e002",
    });

    const decisionsA = await getEventDecisions(runA);
    const decisionsB = await getEventDecisions(runB);

    const statesA = await getAssetStates(runA);
    const statesB = await getAssetStates(runB);

    expect(decisionsA).toHaveLength(1);
    expect(decisionsA[0].event_id).toBe(`${runA}-e001`);

    expect(decisionsB).toHaveLength(1);
    expect(decisionsB[0].event_id).toBe(`${runB}-e002`);

    expect(statesA).toHaveLength(1);
    expect(statesA[0].asset_id).toBe("lap-001");

    expect(statesB).toHaveLength(1);
    expect(statesB[0].asset_id).toBe("lap-002");
  });
});
