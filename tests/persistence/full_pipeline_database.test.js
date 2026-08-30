import { describe, test, expect } from "@jest/globals";
import db, { initializeDatabase } from "../../src/persistence/database.js";
import { main } from "../../src/index.js";

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

describe("Full Pipeline Database Persistence", () => {
  test("persists the complete real reconciliation run", async () => {
    await initializeDatabase();

    await main();

    const runs = await all(`
      SELECT *
      FROM reconciliation_runs
      ORDER BY started_at DESC
      LIMIT 1
    `);

    expect(runs).toHaveLength(1);

    const run = runs[0];

    expect(run.run_id).toBeDefined();
    expect(run.policy_version).toBe("2.0.0");
    expect(run.input_hash).toBeDefined();
    expect(run.started_at).toBeDefined();
    expect(run.completed_at).toBeDefined();
    expect(run.status).toBe("COMPLETED");

    const rawRecords = await all(
      `
      SELECT *
      FROM raw_records
      WHERE run_id = ?
      `,
      [run.run_id],
    );

    const canonicalEvents = await all(
      `
      SELECT *
      FROM canonical_events
      WHERE run_id = ?
      `,
      [run.run_id],
    );

    const decisions = await all(
      `
      SELECT *
      FROM event_decisions
      WHERE run_id = ?
      `,
      [run.run_id],
    );

    const assetStates = await all(
      `
      SELECT *
      FROM asset_states
      WHERE run_id = ?
      `,
      [run.run_id],
    );

    const exceptions = await all(
      `
      SELECT *
      FROM exception_cases
      WHERE run_id = ?
      `,
      [run.run_id],
    );

    const reports = await all(
      `
      SELECT *
      FROM report_artifacts
      WHERE run_id = ?
      `,
      [run.run_id],
    );

    expect(rawRecords.length).toBeGreaterThan(0);
    expect(canonicalEvents.length).toBeGreaterThan(0);
    expect(decisions.length).toBeGreaterThan(0);
    expect(assetStates.length).toBeGreaterThan(0);
    expect(exceptions.length).toBeGreaterThan(0);
    expect(reports.length).toBeGreaterThan(0);

    console.log("\n=== DATABASE PERSISTENCE CHECK ===");
    console.log(`Run:              ${run.run_id}`);
    console.log(`Raw records:      ${rawRecords.length}`);
    console.log(`Canonical events: ${canonicalEvents.length}`);
    console.log(`Decisions:        ${decisions.length}`);
    console.log(`Asset states:     ${assetStates.length}`);
    console.log(`Exceptions:       ${exceptions.length}`);
    console.log(`Reports:          ${reports.length}`);
    console.log(`Status:           ${run.status}`);
  });
});
