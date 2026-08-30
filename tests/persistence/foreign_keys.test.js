import { describe, test, expect } from "@jest/globals";
import {
  initializeDatabase,
  default as db,
} from "../../src/persistence/database.js";

import {
  createReconciliationRun,
  insertRawRecord,
  insertCanonicalEvent,
  insertEventDecision,
  insertAssetState,
  insertExceptionCase,
  insertReportArtifact,
  getReconciliationRun,
} from "../../src/persistence/repository.js";

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        changes: this.changes,
      });
    });
  });
}

function getSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

describe("Database Foreign Keys", () => {
  test("deleting a reconciliation run cascades to dependent records", async () => {
    await initializeDatabase();

    const runId = "fk-test-run-001";

    await createReconciliationRun({
      runId,
      policyVersion: "2.0.0",
      inputHash: "fk-test-hash",
      startedAt: "2026-08-03T13:00:00.000Z",
    });

    await insertRawRecord({
      rawRecordId: `${runId}-raw`,
      runId,
      sourceName: "events.csv",
      sourceRowId: "events.csv-1",
      payload: { event_id: "e001" },
      schemaStatus: "VALID",
      createdAt: "2026-08-03T13:00:00.000Z",
    });

    await insertCanonicalEvent({
      eventId: `${runId}-e001`,
      runId,
      eventType: "CHECKOUT",
      assetId: "lap-001",
      actorId: "s001",
      occurredAt: "2026-08-03T12:00:00.000Z",
      sourceRef: "events.csv-1",
      idempotencyKey: `${runId}-e001`,
    });

    await insertEventDecision({
      decisionId: `${runId}-decision`,
      runId,
      eventId: `${runId}-e001`,
      decisionType: "ACCEPTED",
      reasonCode: null,
      stateBefore: "available",
      stateAfter: "checked_out",
      message: "Accepted.",
    });

    await insertAssetState({
      runId,
      assetId: "lap-001",
      status: "checked_out",
      condition: "good",
      holderId: "s001",
      locationId: "equipment-store",
      dueAt: null,
      lastEventId: "e001",
    });

    await insertExceptionCase({
      caseId: `${runId}-EX-001`,
      runId,
      assetId: "lap-001",
      eventId: `${runId}-e001`,
      severity: "WARNING",
      reasonCode: "TEST",
      status: "OPEN",
      recommendedAction: "Review.",
    });

    await insertReportArtifact({
      runId,
      reportName: "test-report",
      path: "test/report.md",
      format: "md",
      createdAt: "2026-08-03T13:00:00.000Z",
    });

    await runSql(`DELETE FROM reconciliation_runs WHERE run_id = ?`, [runId]);

    const run = await getReconciliationRun(runId);

    const rawRecords = await getSql(
      `SELECT COUNT(*) AS count FROM raw_records WHERE run_id = ?`,
      [runId],
    );

    const canonicalEvents = await getSql(
      `SELECT COUNT(*) AS count FROM canonical_events WHERE run_id = ?`,
      [runId],
    );

    const decisions = await getSql(
      `SELECT COUNT(*) AS count FROM event_decisions WHERE run_id = ?`,
      [runId],
    );

    const assetStates = await getSql(
      `SELECT COUNT(*) AS count FROM asset_states WHERE run_id = ?`,
      [runId],
    );

    const exceptions = await getSql(
      `SELECT COUNT(*) AS count FROM exception_cases WHERE run_id = ?`,
      [runId],
    );

    const reports = await getSql(
      `SELECT COUNT(*) AS count FROM report_artifacts WHERE run_id = ?`,
      [runId],
    );

    expect(run).toBeUndefined();
    expect(rawRecords.count).toBe(0);
    expect(canonicalEvents.count).toBe(0);
    expect(decisions.count).toBe(0);
    expect(assetStates.count).toBe(0);
    expect(exceptions.count).toBe(0);
    expect(reports.count).toBe(0);
  });
});
