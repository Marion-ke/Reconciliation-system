import { loadCsv } from "./ingestion/csvLoader.js";
import { loadJson } from "./ingestion/jsonLoader.js";
import { buildRawRecords } from "./ingestion/rawRecordBuilder.js";
import { validateInventory } from "./validation/inventoryValidator.js";

import { validateEvents } from "./validation/eventValidator.js";
import { buildValidationResult } from "./validation/buildValidationResult.js";
import { buildCanonicalEvents } from "./normalization/canonical_mapper.js";

import { buildCanonicalEventsCsv } from "./exporters/canonical_events_exporter.js";

import { writeTextFile } from "./utils/file_utils.js";
import { buildValidationErrorsCsv } from "./exporters/validation_exporter.js";
import { buildRawRecordIndexCsv } from "./exporters/raw_record_exporter.js";
import { buildIngestionSummary } from "./exporters/summary_exporter.js";
import { buildEventProfile } from "./profiling/profiler.js";
import { buildDataProfileMarkdown } from "./exporters/profile_exporter.js";
import { buildLedger } from "./reconciliation/ledger.js";
import { reconcileEvents } from "./reconciliation/reconciliationEngine.js";
import { buildEventDecisionsCsv } from "./exporters/event_decisions_exporter.js";
import { buildFinalAssetStateCsv } from "./exporters/final_asset_state_exporter.js";
import { buildExceptionQueue } from "./reconciliation/exceptionQueue.js";
import { buildExceptionQueueCsv } from "./exporters/exception_queue_exporter.js";
import { orderEvents } from "./reconciliation/replayOrdering.js";
import { detectLateEvents } from "./reconciliation/lateEventDetector.js";
import { buildRunSummary } from "./exporters/run_summary_exporter.js";
export async function main() {
  console.log("\n=== Reconciliation Intelligence System ===\n");

  // Load source files
  const inventory = await loadCsv("./data/sample/inventory.csv");

  const events = await loadCsv("./data/sample/events.csv");

  const policy = await loadJson("./data/policy/policy-v2.json");

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

  const replayOrderedEvents = detectLateEvents(
    orderEvents(canonicalEvents),
    policy,
  );
  const ledger = buildLedger(inventoryRawRecords);
  const reconciliationResult = reconcileEvents(
    replayOrderedEvents,
    ledger,
    policy,
  );
  const finalAssetStateCsv = buildFinalAssetStateCsv(
    reconciliationResult.ledger,
  );

  writeTextFile("outputs/latest/final_asset_state.csv", finalAssetStateCsv);

  console.log(
    `Final asset states exported: ${reconciliationResult.ledger.size}`,
  );
  const eventDecisionsCsv = buildEventDecisionsCsv(
    reconciliationResult.decisions,
  );

  writeTextFile("outputs/latest/event_decisions.csv", eventDecisionsCsv);

  console.log(
    `Event decisions exported: ${reconciliationResult.decisions.length}`,
  );
  // console.log(reconciliationResult);
  // final_asset_state.csv
  const exceptionQueue = buildExceptionQueue(reconciliationResult.decisions);

  const exceptionQueueCsv = buildExceptionQueueCsv(exceptionQueue);

  writeTextFile("outputs/latest/exception_queue.csv", exceptionQueueCsv);

  console.log(`Exception cases exported: ${exceptionQueue.length}`);

  const canonicalCsv = buildCanonicalEventsCsv(replayOrderedEvents);

  writeTextFile("outputs/latest/canonical_events.csv", canonicalCsv);
  console.log(`Canonical events exported: ${replayOrderedEvents.length}`);
  const rawRecordCsv = buildRawRecordIndexCsv(
    eventRawRecords,
    validationResult,
  );

  writeTextFile("outputs/latest/raw_record_index.csv", rawRecordCsv);

  console.log(`Canonical events exported: ${canonicalEvents.length}`);

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
  //   const profile = buildEventProfile(eventRawRecords);

  //   console.log("\n=== Data Profile ===");

  //   console.log(profile);
  const errorCount = validationErrors.filter(
    (error) => error.severity === "ERROR",
  ).length;

  const profile = buildEventProfile(eventRawRecords);

  const profileMarkdown = buildDataProfileMarkdown(profile);

  writeTextFile("outputs/latest/data_profile.md", profileMarkdown);

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

  const runSummary = buildRunSummary({
    policyVersion: policy.policyVersion,

    inventoryCount: inventoryRawRecords.length,

    eventCount: replayOrderedEvents.length,

    reconciliationSummary: reconciliationResult.summary,

    decisions: reconciliationResult.decisions,

    exceptions: exceptionQueue,
  });

  writeTextFile("outputs/latest/run_summary.md", runSummary);

  console.log("\n=== Reconciliation Summary ===");

  console.log(`Processed: ${reconciliationResult.summary.processed}`);

  console.log(`Accepted: ${reconciliationResult.summary.accepted}`);

  console.log(
    `Accepted With Warning: ${reconciliationResult.summary.acceptedWithWarning}`,
  );

  console.log(`Rejected: ${reconciliationResult.summary.rejected}`);

  console.log(
    `Review Required: ${reconciliationResult.summary.reviewRequired}`,
  );

  console.log(`Warning Only: ${reconciliationResult.summary.warningOnly}`);

  console.log("\n=== Validation Summary ===");

  console.log(`Errors: ${errorCount}`);

  console.log(`Warnings: ${warningCount}`);
  console.log("\n=== Validation Result ===");

  console.log(`Accepted: ${validationResult.acceptedRecords.length}`);

  console.log(`Rejected: ${validationResult.rejectedRecords.length}`);

  console.log(`Warnings: ${validationResult.warningRecords.length}`);
  console.log(`Validation errors exported: ${validationErrors.length}`);
}
