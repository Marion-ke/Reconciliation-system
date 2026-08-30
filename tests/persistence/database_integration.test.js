import { describe, test, expect } from "@jest/globals";
import { initializeDatabase } from "../../src/persistence/database.js";

import {
  createReconciliationRun,
  completeReconciliationRun,
  getReconciliationRun,
  insertRawRecord,
  insertCanonicalEvent,
  insertEventDecision,
  insertAssetState,
  insertExceptionCase,
  insertReportArtifact,
  getRawRecords,
  getCanonicalEvents,
  getEventDecisions,
  getAssetStates,
  getExceptionCases,
  getReportArtifacts,
} from "../../src/persistence/repository.js";

describe("Database Persistence Integration", () => {
  const runId = `test-run-db-${Date.now()}`;

  test("persists and retrieves a complete reconciliation run", async () => {
    await initializeDatabase();

    await createReconciliationRun({
      runId,
      policyVersion: "2.0.0",
      inputHash: "test-input-hash",
      startedAt: "2026-08-03T10:00:00.000Z",
      status: "RUNNING",
      notes: "Database integration test",
    });

    await insertRawRecord({
      rawRecordId: `${runId}-raw-001`,
      runId,
      sourceName: "events.csv",
      sourceRowId: "events.csv-1",
      payload: {
        event_id: "e001",
        event_type: "CHECKOUT",
        asset_id: "lap-001",
      },
      schemaStatus: "VALID",
      createdAt: "2026-08-03T10:00:00.000Z",
    });

    await insertCanonicalEvent({
      eventId: `${runId}-e001`,
      runId,
      eventType: "CHECKOUT",
      assetId: "lap-001",
      actorId: "s001",
      occurredAt: "2026-08-03T09:00:00.000Z",
      sourceRef: "events.csv-1",
      idempotencyKey: "events.csv-1-e001",
    });

    await insertEventDecision({
      decisionId: `${runId}-decision-001`,
      runId,
      eventId: `${runId}-e001`,
      decisionType: "ACCEPTED",
      reasonCode: null,
      stateBefore: "available",
      stateAfter: "checked_out",
      message: "Event accepted.",
    });

    await insertAssetState({
      runId,
      assetId: "lap-001",
      status: "checked_out",
      condition: "good",
      holderId: "s001",
      locationId: "equipment-store",
      dueAt: "2026-08-04T10:00:00.000Z",
      lastEventId: "e001",
    });

    await insertExceptionCase({
      caseId: `${runId}-EX-0001`,
      runId,
      assetId: "lap-001",
      eventId: `${runId}-e001`,
      severity: "WARNING",
      reasonCode: "TEST_WARNING",
      status: "OPEN",
      recommendedAction: "Review manually.",
    });

    await insertReportArtifact({
      runId,
      reportName: "run_summary",
      path: "outputs/latest/run_summary.md",
      format: "md",
      createdAt: "2026-08-03T10:00:00.000Z",
      hash: "test-report-hash",
    });

    await completeReconciliationRun(
      runId,
      "2026-08-03T10:01:00.000Z",
      "COMPLETED",
    );

    const run = await getReconciliationRun(runId);
    const decisions = await getEventDecisions(runId);
    const exceptions = await getExceptionCases(runId);
    const assetStates = await getAssetStates(runId);
    const rawRecords = await getRawRecords(runId);
    const canonicalEvents = await getCanonicalEvents(runId);
    const reportArtifacts = await getReportArtifacts(runId);

    expect(run).toBeDefined();
    expect(run.run_id).toBe(runId);
    expect(run.policy_version).toBe("2.0.0");
    expect(run.status).toBe("COMPLETED");

    expect(decisions).toHaveLength(1);
    expect(decisions[0].decision_type).toBe("ACCEPTED");

    expect(exceptions).toHaveLength(1);
    expect(exceptions[0].reason_code).toBe("TEST_WARNING");

    expect(assetStates).toHaveLength(1);
    expect(assetStates[0].asset_id).toBe("lap-001");
    expect(assetStates[0].status).toBe("checked_out");

    expect(rawRecords).toHaveLength(1);
    expect(rawRecords[0].source_name).toBe("events.csv");
    expect(rawRecords[0].source_row_id).toBe("events.csv-1");

    expect(canonicalEvents).toHaveLength(1);
    expect(canonicalEvents[0].event_type).toBe("CHECKOUT");
    expect(canonicalEvents[0].asset_id).toBe("lap-001");

    expect(reportArtifacts).toHaveLength(1);
    expect(reportArtifacts[0].report_name).toBe("run_summary");
    expect(reportArtifacts[0].path).toBe("outputs/latest/run_summary.md");
    expect(reportArtifacts[0].format).toBe("md");
  });
});
