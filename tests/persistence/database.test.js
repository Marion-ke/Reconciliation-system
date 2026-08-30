import { describe, test, expect, beforeAll } from "@jest/globals";

import db, { initializeDatabase } from "../../src/persistence/database.js";

describe("SQLite Persistence Layer", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  test("database initializes successfully", () => {
    expect(db).toBeDefined();
  });

  test("required tables exist", async () => {
    const expectedTables = [
      "reconciliation_runs",
      "raw_records",
      "canonical_events",
      "event_decisions",
      "asset_states",
      "exception_cases",
      "report_artifacts",
    ];

    const rows = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        `,
        (error, results) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(results);
        },
      );
    });

    const actualTables = rows.map((row) => row.name);

    expectedTables.forEach((table) => {
      expect(actualTables).toContain(table);
    });
  });
});
