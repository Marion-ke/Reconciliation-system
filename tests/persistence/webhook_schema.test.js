import { describe, test, expect } from "@jest/globals";
import db, { initializeDatabase } from "../../src/persistence/database.js";

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

describe("Webhook database schema", () => {
  test("creates webhook configuration and dispatch tables", async () => {
    await initializeDatabase();

    const tables = await all(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name IN (
          'webhook_configurations',
          'webhook_dispatches'
        )
      ORDER BY name ASC
    `);

    expect(tables.map((table) => table.name)).toEqual([
      "webhook_configurations",
      "webhook_dispatches",
    ]);
  });

  test("webhook dispatches reference webhook configurations", async () => {
    await initializeDatabase();

    const foreignKeys = await all(`
      PRAGMA foreign_key_list(webhook_dispatches)
    `);

    expect(
      foreignKeys.some(
        (foreignKey) =>
          foreignKey.table === "webhook_configurations" &&
          foreignKey.from === "webhook_id" &&
          foreignKey.to === "webhook_id",
      ),
    ).toBe(true);
  });
});
