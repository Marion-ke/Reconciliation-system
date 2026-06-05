import fs from "fs/promises";
import { parse } from "csv-parse/sync";

/**
 * Loads and parses a CSV file.
 *
 * Returns an array of plain JavaScript objects where:
 *
 * {
 *   columnName: value
 * }
 *
 * No validation happens here.
 * Ingestion is responsible only for reading data.
 */
export async function loadCsv(filePath) {
  // Read the entire file into memory
  const content = await fs.readFile(filePath, "utf-8");

  // Convert CSV rows into JavaScript objects
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}
