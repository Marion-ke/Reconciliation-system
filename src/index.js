import { loadCsv } from "./ingestion/csvLoader.js";
import { loadJson } from "./ingestion/jsonLoader.js";
import { buildRawRecords } from "./ingestion/rawRecordBuilder.js";
import { validateInventory } from "./validation/inventoryValidator.js";

import { validateEvents } from "./validation/eventValidator.js";
import { buildValidationResult } from "./validation/buildValidationResult.js";
import { buildCanonicalEvents } from "./normalization/canonical_mapper.js";

import { sortCanonicalEvents } from "./normalization/deterministic_sorter.js";

import { buildCanonicalEventsCsv } from "./exporters/canonical_events_exporter.js";

import { writeTextFile } from "./utils/file_utils.js";
import { buildValidationErrorsCsv } from "./exporters/validation_exporter.js";
import { buildRawRecordIndexCsv } from "./exporters/raw_record_exporter.js";
import { buildIngestionSummary } from "./exporters/summary_exporter.js";

/**
 * Packet 01 application entry point.
 *
 * Current responsibility:
 * 1. Load source files
 * 2. Create raw records
 * 3. Verify ingestion succeeded
 *
 * Validation and normalization will be added later.
 */
async function main() {
  console.log("\n=== Reconciliation Intelligence System ===\n");

  // Load source files
  const inventory = await loadCsv("./data/sample/inventory.csv");

  const events = await loadCsv("./data/sample/events.csv");

  const policy = await loadJson("./data/sample/policy.json");

  // Create traceable raw records
  const inventoryRawRecords = buildRawRecords(inventory, "inventory.csv");

  const eventRawRecords = buildRawRecords(events, "events.csv");

  const inventoryErrors = validateInventory(inventoryRawRecords);

  const eventErrors = validateEvents(
    eventRawRecords,
    policy,
    inventoryRawRecords,
  );
  const validationErrors = [...inventoryErrors, ...eventErrors];
  const validationResult = buildValidationResult(
    eventRawRecords,
    validationErrors,
  );

  const canonicalEvents = buildCanonicalEvents(
    validationResult.acceptedRecords,
  );

  const sortedCanonicalEvents = sortCanonicalEvents(canonicalEvents);

  const canonicalCsv = buildCanonicalEventsCsv(sortedCanonicalEvents);

  writeTextFile("outputs/latest/canonical_events.csv", canonicalCsv);

  const rawRecordCsv = buildRawRecordIndexCsv(
    eventRawRecords,
    validationResult,
  );

  writeTextFile("outputs/latest/raw_record_index.csv", rawRecordCsv);

  console.log(`Canonical events exported: ${sortedCanonicalEvents.length}`);

  // Basic ingestion verification
  console.log(`Inventory records loaded: ${inventoryRawRecords.length}`);

  console.log(`Event records loaded: ${eventRawRecords.length}`);

  console.log(`Policy version loaded: ${policy.policyVersion}`);

  const validationCsv = buildValidationErrorsCsv(validationErrors);

  writeTextFile("outputs/latest/validation_errors.csv", validationCsv);
  console.log("\nValidation Errors:");

  validationErrors.forEach((error) => {
    console.log(error);
  });

  const errorCount = validationErrors.filter(
    (error) => error.severity === "ERROR",
  ).length;

  const warningCount = validationErrors.filter(
    (error) => error.severity === "WARNING",
  ).length;

  const summary = buildIngestionSummary({
    inventoryCount: inventoryRawRecords.length,

    eventCount: eventRawRecords.length,

    acceptedCount: validationResult.acceptedRecords.length,

    rejectedCount: validationResult.rejectedRecords.length,

    warningCount,

    errorCount,

    policyVersion: policy.policyVersion,
  });

  writeTextFile("outputs/latest/ingestion_summary.md", summary);

  console.log("\n=== Validation Summary ===");

  console.log(`Errors: ${errorCount}`);

  console.log(`Warnings: ${warningCount}`);
  console.log("\n=== Validation Result ===");

  console.log(`Accepted: ${validationResult.acceptedRecords.length}`);

  console.log(`Rejected: ${validationResult.rejectedRecords.length}`);

  console.log(`Warnings: ${validationResult.warningRecords.length}`);
  console.log(`Validation errors exported: ${validationErrors.length}`);
}

main().catch((error) => {
  console.error("Application startup failed:", error);
});
