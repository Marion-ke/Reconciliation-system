import { buildRawRecords } from "../ingestion/rawRecordBuilder.js";
import { validateEvents } from "../validation/eventValidator.js";
import { buildCanonicalEvents } from "../normalization/canonical_mapper.js";
import { orderEvents } from "../reconciliation/replayOrdering.js";
import { detectLateEvents } from "../reconciliation/lateEventDetector.js";
import { buildLedger } from "../reconciliation/ledger.js";
import { reconcileEvents } from "../reconciliation/reconciliationEngine.js";

/**
 * Processes events submitted through the API.
 *
 * The API deliberately reuses the same validation,
 * canonicalization, ordering, late-event detection,
 * ledger construction, and reconciliation components
 * used by the batch pipeline.
 */
export function processApiEvents({ events, inventoryRawRecords, policy }) {
  if (!Array.isArray(events)) {
    throw new Error("events must be an array");
  }

  const rawRecords = buildRawRecords(events, "api");

  // Validate API events using the same validator as the batch pipeline.
  const validationErrors = validateEvents(
    rawRecords,
    policy,
    inventoryRawRecords,
  );

  /*
   * Only records without ERROR-level validation failures
   * are allowed into canonical reconciliation.
   */
  const rejectedIds = new Set(
    validationErrors
      .filter((error) => error.severity === "ERROR")
      .map((error) => error.rawRecordId),
  );

  const acceptedRecords = rawRecords.filter(
    (record) => !rejectedIds.has(record.rawRecordId),
  );

  // Convert validated records into the existing canonical event model.
  const canonicalEvents = buildCanonicalEvents(acceptedRecords);

  // Preserve deterministic replay ordering.
  const orderedEvents = orderEvents(canonicalEvents);

  // Apply the same late-event handling used by the batch pipeline.
  const replayOrderedEvents = detectLateEvents(orderedEvents, policy);

  // Start from the same inventory baseline used by the batch pipeline.
  const ledger = buildLedger(inventoryRawRecords);

  // Reuse the existing reconciliation state machine and decision engine.
  const reconciliationResult = reconcileEvents(
    replayOrderedEvents,
    ledger,
    policy,
  );

  return {
    rawRecords,
    validationErrors,
    canonicalEvents: replayOrderedEvents,
    reconciliationResult,
  };
}
