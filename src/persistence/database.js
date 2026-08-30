import sqlite3 from "sqlite3";
import { CREATE_SCHEMA_SQL } from "./schema.js";

sqlite3.verbose();

const databasePath =
  process.env.NODE_ENV === "test" ? ":memory:" : "./database/reconciliation.db";

const db = new sqlite3.Database(databasePath, (error) => {
  if (error) {
    console.error("Failed to connect to SQLite database:", error.message);
    return;
  }

  console.log("Connected to SQLite database.");
});
export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.exec(CREATE_SCHEMA_SQL, (error) => {
      if (error) {
        reject(error);
        return;
      }

      console.log("SQLite schema initialized.");
      resolve();
    });
  });
}

export default db;
