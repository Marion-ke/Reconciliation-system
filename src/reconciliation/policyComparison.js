import { validateEvents } from "../validation/eventValidator.js";
import { buildValidationResult } from "../validation/buildValidationResult.js";
import { buildCanonicalEvents } from "../normalization/canonical_mapper.js";
import { buildLedger } from "./ledger.js";
import { reconcileEvents } from "./reconciliationEngine.js";
import { orderEvents } from "./replayOrdering.js";
import { detectLateEvents } from "./lateEventDetector.js";
import { adaptPolicyForReconciliation } from "./policyAdapter.js";
/**
 * Runs the same source inputs against one policy version.
 *
 * Validation is performed first. Records that pass validation are then
 * normalized and reconciled using the existing reconciliation engine.
 */
function runPolicy(policy, eventRawRecords, inventoryRawRecords) {
  const reconciliationPolicy = adaptPolicyForReconciliation(policy);
  const validationErrors = validateEvents(
    eventRawRecords,
    policy,
    inventoryRawRecords,
  );

  const validationResult = buildValidationResult(
    eventRawRecords,
    validationErrors,
  );

  const canonicalEvents = buildCanonicalEvents(
    validationResult.acceptedRecords,
  );

  const orderedEvents = detectLateEvents(orderEvents(canonicalEvents), policy);

  const ledger = buildLedger(inventoryRawRecords);

  const reconciliationResult = reconcileEvents(
    orderedEvents,
    ledger,
    reconciliationPolicy,
  );

  const decisionsByEventId = new Map(
    reconciliationResult.decisions.map((decision) => [
      decision.eventId,
      decision,
    ]),
  );

  /*
   * Validation-rejected events never reach reconciliation.
   * Represent them explicitly so the comparison still has an
   * outcome for every original event.
   */
  for (const record of validationResult.rejectedRecords) {
    const event = record.payload;

    const recordErrors = validationErrors.filter(
      (error) => error.rawRecordId === record.rawRecordId,
    );

    const primaryError = recordErrors.find(
      (error) => error.severity === "ERROR",
    );

    decisionsByEventId.set(event.event_id, {
      eventId: event.event_id,
      eventType: event.event_type,
      assetId: event.asset_id,
      decision: "REJECTED",
      reasonCode: primaryError?.reasonCode ?? "VALIDATION_REJECTED",
      message:
        primaryError?.message ?? "Event rejected during policy validation.",
      previousState: "",
      nextState: null,
      rawRecordId: record.rawRecordId,
      policyVersion: policy.policyVersion,
      outcomeSource: "VALIDATION",
    });
  }

  return {
    policyVersion: policy.policyVersion,
    validationErrors,
    validationResult,
    reconciliationResult,
    decisionsByEventId,
  };
}

/**
 * Compare two policy versions against exactly the same
 * inventory and event inputs.
 */
export function comparePolicyVersions({
  policyV1,
  policyV2,
  eventRawRecords,
  inventoryRawRecords,
}) {
  const resultV1 = runPolicy(policyV1, eventRawRecords, inventoryRawRecords);

  const resultV2 = runPolicy(policyV2, eventRawRecords, inventoryRawRecords);

  const differences = [];

  for (const record of eventRawRecords) {
    const event = record.payload;

    const eventId = event.event_id;

    const decisionV1 = resultV1.decisionsByEventId.get(eventId);
    const decisionV2 = resultV2.decisionsByEventId.get(eventId);

    if (!decisionV1 || !decisionV2) {
      continue;
    }

    const decisionChanged = decisionV1.decision !== decisionV2.decision;

    const reasonChanged = decisionV1.reasonCode !== decisionV2.reasonCode;

    const nextStateChanged = decisionV1.nextState !== decisionV2.nextState;

    if (decisionChanged || reasonChanged || nextStateChanged) {
      differences.push({
        eventId,
        assetId: event.asset_id,
        eventType: event.event_type,

        policyV1: resultV1.policyVersion,
        policyV2: resultV2.policyVersion,

        decisionV1: decisionV1.decision,
        decisionV2: decisionV2.decision,

        reasonCodeV1: decisionV1.reasonCode ?? "",
        reasonCodeV2: decisionV2.reasonCode ?? "",

        previousStateV1: decisionV1.previousState ?? "",
        previousStateV2: decisionV2.previousState ?? "",

        nextStateV1: decisionV1.nextState ?? "",
        nextStateV2: decisionV2.nextState ?? "",

        messageV1: decisionV1.message ?? "",
        messageV2: decisionV2.message ?? "",

        outcomeChanged: decisionChanged,
      });
    }
  }

  return {
    policyV1: resultV1,
    policyV2: resultV2,
    differences,

    changedOutcomeCount: differences.filter(
      (difference) => difference.outcomeChanged,
    ).length,
  };
}
