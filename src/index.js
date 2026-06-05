import { loadCsv } from "./ingestion/csvLoader.js";
import { loadJson } from "./ingestion/jsonLoader.js";
import { buildRawRecords } from "./ingestion/rawRecordBuilder.js";
import { validateInventory } from "./validation/inventoryValidator.js";

import { validateEvents } from "./validation/eventValidator.js";
import { buildValidationResult } from "./validation/buildValidationResult.js";

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
  // Basic ingestion verification
  console.log(`Inventory records loaded: ${inventoryRawRecords.length}`);

  console.log(`Event records loaded: ${eventRawRecords.length}`);

  console.log(`Policy version loaded: ${policy.policyVersion}`);

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

  console.log("\n=== Validation Summary ===");

  console.log(`Errors: ${errorCount}`);

  console.log(`Warnings: ${warningCount}`);
  console.log("\n=== Validation Result ===");

  console.log(`Accepted: ${validationResult.acceptedRecords.length}`);

  console.log(`Rejected: ${validationResult.rejectedRecords.length}`);

  console.log(`Warnings: ${validationResult.warningRecords.length}`);
}

main().catch((error) => {
  console.error("Application startup failed:", error);
});
