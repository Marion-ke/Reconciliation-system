import { evaluateEvent } from "./decisionEngine.js";

/**
 * Creates a plain snapshot of an asset state.
 */
function snapshotAssetState(assetState) {
  return {
    assetId: assetState.assetId,
    assetType: assetState.assetType,
    status: assetState.status,
    holderId: assetState.holderId,
    locationId: assetState.locationId,
    condition: assetState.condition,
    dueAt: assetState.dueAt,
    lastEventId: assetState.lastEventId,
    lastOccurredAt: assetState.lastOccurredAt,
  };
}

/**
 * Replays canonical events against the asset ledger.
 *
 * For each event:
 * - Finds the corresponding asset
 * - Evaluates the event
 * - Applies accepted state transitions
 * - Records every reconciliation decision
 * - Preserves historical asset-state snapshots
 */
export function reconcileEvents(canonicalEvents, ledger, policy) {
  const decisions = [];

  // Historical snapshots keyed by asset_id.
  const stateHistory = new Map();
  // Preserve the inventory baseline before any events are replayed.
  for (const [assetId, assetState] of ledger.entries()) {
    stateHistory.set(assetId, [
      {
        occurredAt: null,
        eventId: null,
        state: snapshotAssetState(assetState),
      },
    ]);
  }
  // Prevent mutation of caller's array.
  canonicalEvents = [...canonicalEvents];

  canonicalEvents.forEach((event) => {
    const assetState = ledger.get(event.assetId);

    // Unknown asset
    if (!assetState) {
      decisions.push({
        eventId: event.eventId,
        assetId: event.assetId,
        decision: "REJECTED",
        reasonCode: "UNKNOWN_ASSET",
        message: "Asset does not exist in the ledger.",
      });

      return;
    }

    // Evaluate event
    const decision = evaluateEvent(assetState, event, policy, ledger);

    decisions.push(decision);

    const mutatesState =
      decision.decision === "ACCEPTED" ||
      decision.decision === "ACCEPTED_WITH_WARNING";

    if (mutatesState) {
      // Only accepted events update the ledger.
      assetState.status = decision.nextState;

      // Record reconciliation history.
      assetState.lastEventId = event.eventId;
      assetState.lastOccurredAt = event.occurredAt;

      // Holder rules.
      switch (event.eventType) {
        case "CHECKOUT":
          assetState.holderId = event.actorId;
          break;

        case "RETURN":
          assetState.holderId = "";
          break;

        case "RETIRE":
          assetState.holderId = "";
          break;

        case "MAINTENANCE_OPEN":
          assetState.holderId = "";
          break;

        default:
          break;
      }

      // Update location.
      if (event.locationId) {
        assetState.locationId = event.locationId;
      }

      // Update condition.
      if (event.conditionReport) {
        assetState.condition = event.conditionReport;
      }
    }

    // Save the state after processing this event.
    if (!stateHistory.has(event.assetId)) {
      stateHistory.set(event.assetId, []);
    }

    stateHistory.get(event.assetId).push({
      occurredAt: event.occurredAt,
      eventId: event.eventId,
      state: snapshotAssetState(assetState),
    });
  });

  // Build reconciliation summary.
  const accepted = decisions.filter(
    (d) => d.decision === "ACCEPTED" || d.decision === "ACCEPTED_WITH_WARNING",
  ).length;

  const acceptedWithWarning = decisions.filter(
    (d) => d.decision === "ACCEPTED_WITH_WARNING",
  ).length;

  const rejected = decisions.filter((d) => d.decision === "REJECTED").length;

  const reviewRequired = decisions.filter(
    (d) => d.decision === "REVIEW_REQUIRED",
  ).length;

  const warningOnly = decisions.filter(
    (d) => d.decision === "WARNING_ONLY",
  ).length;

  return {
    ledger,
    decisions,
    stateHistory,

    summary: {
      accepted,
      acceptedWithWarning,
      rejected,
      reviewRequired,
      warningOnly,
      processed: decisions.length,
    },
  };
}
