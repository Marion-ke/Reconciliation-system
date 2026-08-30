import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";

import db, { initializeDatabase } from "../../src/persistence/database.js";

import {
  createReconciliationRun,
  completeReconciliationRun,
  getReconciliationRun,
  listReconciliationRuns,
  insertRawRecord,
  insertCanonicalEvent,
  insertEventDecision,
  insertAssetState,
  insertExceptionCase,
  insertReportArtifact,
  getEventDecisions,
  getExceptionCases,
  getAssetStates,
} from "../../src/persistence/repository.js";

const RUN_ID = "test-run-001";

function clearDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("DELETE FROM report_artifacts", (error) => {
        if (error) {
          reject(error);
          return;
        }

        db.run("DELETE FROM exception_cases", (error) => {
          if (error) {
            reject(error);
            return;
          }

          db.run("DELETE FROM asset_states", (error) => {
            if (error) {
              reject(error);
              return;
            }

            db.run("DELETE FROM event_decisions", (error) => {
              if (error) {
                reject(error);
                return;
              }

              db.run("DELETE FROM canonical_events", (error) => {
                if (error) {
                  reject(error);
                  return;
                }

                db.run("DELETE FROM raw_records", (error) => {
                  if (error) {
                    reject(error);
                    return;
                  }

                  db.run("DELETE FROM reconciliation_runs", (error) => {
                    if (error) {
                      reject(error);
                      return;
                    }

                    resolve();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

beforeAll(async () => {
  await initializeDatabase();
  await clearDatabase();
});

afterAll(async () => {
  await new Promise((resolve) => {
    db.close(() => resolve());
  });
});

describe("Persistence Repository", () => {
  test("creates and retrieves a reconciliation run", async () => {
    const run = await createReconciliationRun({
      runId: RUN_ID,
      policyVersion: "2.0.0",
      inputHash: "test-input-hash",
      startedAt: "2026-07-30T10:00:00Z",
      status: "RUNNING",
      notes: "Persistence repository test",
    });

    expect(run).toBeDefined();
    expect(run.run_id).toBe(RUN_ID);
    expect(run.policy_version).toBe("2.0.0");
    expect(run.status).toBe("RUNNING");

    const retrieved = await getReconciliationRun(RUN_ID);

    expect(retrieved).toBeDefined();
    expect(retrieved.run_id).toBe(RUN_ID);
  });

  test("completes a reconciliation run", async () => {
    const completed = await completeReconciliationRun(
      RUN_ID,
      "2026-07-30T10:05:00Z",
    );

    expect(completed).toBeDefined();
    expect(completed.status).toBe("COMPLETED");
    expect(completed.completed_at).toBe("2026-07-30T10:05:00Z");
  });

  test("lists reconciliation runs", async () => {
    const runs = await listReconciliationRuns();

    expect(Array.isArray(runs)).toBe(true);
    expect(runs.length).toBeGreaterThanOrEqual(1);
    expect(runs.some((run) => run.run_id === RUN_ID)).toBe(true);
  });

  test("stores a raw record", async () => {
    await insertRawRecord({
      rawRecordId: "raw-test-001",
      runId: RUN_ID,
      sourceName: "events.csv",
      sourceRowId: "events.csv-1",
      payload: {
        event_id: "e001",
        asset_id: "cam-001",
        event_type: "CHECKOUT",
      },
      schemaStatus: "VALID",
      createdAt: "2026-07-30T10:00:00Z",
    });

    const row = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT *
        FROM raw_records
        WHERE raw_record_id = ?
        `,
        ["raw-test-001"],
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        },
      );
    });

    expect(row).toBeDefined();
    expect(row.raw_record_id).toBe("raw-test-001");
    expect(row.source_name).toBe("events.csv");
    expect(JSON.parse(row.payload).event_id).toBe("e001");
  });

  test("stores a canonical event", async () => {
    await insertCanonicalEvent({
      eventId: "e001",
      runId: RUN_ID,
      eventType: "CHECKOUT",
      assetId: "cam-001",
      actorId: "s201",
      occurredAt: "2026-07-30T10:00:00Z",
      sourceRef: "events.csv-1",
      idempotencyKey: "events.csv-1-e001",
    });

    const row = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT *
        FROM canonical_events
        WHERE run_id = ?
        AND event_id = ?
        `,
        [RUN_ID, "e001"],
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        },
      );
    });

    expect(row).toBeDefined();
    expect(row.event_id).toBe("e001");
    expect(row.event_type).toBe("CHECKOUT");
    expect(row.asset_id).toBe("cam-001");
  });

  test("stores an event decision", async () => {
    await insertEventDecision({
      decisionId: "decision-test-001",
      runId: RUN_ID,
      eventId: "e001",
      decisionType: "ACCEPTED",
      reasonCode: "VALID_CHECKOUT",
      stateBefore: "AVAILABLE",
      stateAfter: "CHECKED_OUT",
      message: "Checkout accepted.",
    });

    const decisions = await getEventDecisions(RUN_ID);

    expect(decisions).toHaveLength(1);
    expect(decisions[0].decision_type).toBe("ACCEPTED");
    expect(decisions[0].event_id).toBe("e001");
  });

  test("stores a final asset state", async () => {
    await insertAssetState({
      runId: RUN_ID,
      assetId: "cam-001",
      status: "CHECKED_OUT",
      condition: "good",
      holderId: "s201",
      locationId: "media-lab",
      dueAt: "2026-08-01T10:00:00Z",
      lastEventId: "e001",
    });

    const states = await getAssetStates(RUN_ID);

    expect(states).toHaveLength(1);
    expect(states[0].asset_id).toBe("cam-001");
    expect(states[0].status).toBe("CHECKED_OUT");
  });

  test("stores an exception case", async () => {
    await insertExceptionCase({
      caseId: "EX-TEST-001",
      runId: RUN_ID,
      assetId: "cam-001",
      eventId: "e001",
      severity: "ERROR",
      reasonCode: "TEST_EXCEPTION",
      status: "OPEN",
      recommendedAction: "Review manually.",
    });

    const exceptions = await getExceptionCases(RUN_ID);

    expect(exceptions).toHaveLength(1);
    expect(exceptions[0].case_id).toBe("EX-TEST-001");
    expect(exceptions[0].severity).toBe("ERROR");
  });

  test("stores a report artifact", async () => {
    await insertReportArtifact({
      runId: RUN_ID,
      reportName: "run_summary.md",
      path: "outputs/latest/run_summary.md",
      format: "markdown",
      createdAt: "2026-07-30T10:05:00Z",
      hash: "test-report-hash",
    });

    const artifact = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT *
        FROM report_artifacts
        WHERE run_id = ?
        AND report_name = ?
        `,
        [RUN_ID, "run_summary.md"],
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        },
      );
    });

    expect(artifact).toBeDefined();
    expect(artifact.report_name).toBe("run_summary.md");
    expect(artifact.format).toBe("markdown");
  });
});
