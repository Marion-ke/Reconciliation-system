import EventDecision from "../domain/eventDecision.js";
import { getNextState } from "./stateMachine.js";
import { REASON_CODES } from "./reasonCodes.js";
import { evaluateReserveEvent } from "./reservationDecision.js";
import { evaluateCancelReservationEvent } from "./cancelReservationDecision.js";
import { evaluateManualCorrectionEvent } from "./manualCorrectionDecision.js";

/**
 * Main Decision Engine
 *
 * Evaluates whether a canonical event can be applied
 * to the current asset state.
 */

export function evaluateEvent(assetState, event, policy, ledger, context = {}) {
  // 1. Validate event type
  const eventTypeResult = validateEventType(event, policy);

  if (eventTypeResult) {
    return eventTypeResult;
  }

  // 2. Validate actor permissions
  // 2. Validate actor permissions
  // Special events handle their own authorization so they can
  // return their specific reason codes.
  const specialAuthorizationEvents = new Set([
    "MANUAL_CORRECTION",
    "CANCEL_RESERVATION",
  ]);

  if (!specialAuthorizationEvents.has(event.eventType)) {
    const permissionResult = validateActorPermission(event, policy);

    if (permissionResult) {
      return permissionResult;
    }
  }

  // 3. Validate state transition only for events
  // that actually change the asset's physical state.
  const stateChangingEvents = new Set([
    "CHECKOUT",
    "RETURN",
    "TRANSFER_OUT",
    "TRANSFER_IN",
    "MAINTENANCE_OPEN",
    "MAINTENANCE_CLOSE",
    "AUDIT_OBSERVATION",
    "RETIRE",
  ]);

  if (stateChangingEvents.has(event.eventType)) {
    const transitionResult = validateStateTransition(assetState, event, policy);

    if (transitionResult) {
      return transitionResult;
    }
  }

  // 4. Validate business rules
  const businessRuleResult = validateBusinessRules(
    assetState,
    event,
    policy,
    ledger,
    context,
  );

  if (businessRuleResult) {
    return businessRuleResult;
  }

  // 5. Handle late events
  if (event.isLateEvent) {
    return acceptedWithWarning(
      assetState,
      event,
      policy,
      REASON_CODES.LATE_EVENT,
      `Event arrived ${event.lateHours.toFixed(1)} hours after occurrence.`,
    );
  }

  // 6. Operational events do not change asset state.
  const nonStateChangingEvents = new Set([
    "WEBHOOK_ACK",
    "AUTO_RESOLUTION_APPLIED",
  ]);

  if (nonStateChangingEvents.has(event.eventType)) {
    return acceptedSpecialEvent(assetState, event, policy);
  }

  // 7. Normal accepted event
  return accepted(assetState, event, policy);
}

/**
 * ---------------------------------------------------------
 * EVENT TYPE VALIDATION
 * ---------------------------------------------------------
 */
function validateEventType(event, policy) {
  if (!policy.eventDefinitions[event.eventType]) {
    return rejected(
      null,
      event,
      policy,
      "UNKNOWN_EVENT_TYPE",
      `Unknown event type '${event.eventType}'.`,
    );
  }

  return null;
}

/**
 * ---------------------------------------------------------
 * ACTOR PERMISSION VALIDATION
 * ---------------------------------------------------------
 */
function validateActorPermission(event, policy) {
  const allowedEvents = policy.actorPermissions[event.actorRole];

  if (!allowedEvents) {
    return rejected(
      null,
      event,
      policy,
      "UNKNOWN_ACTOR_ROLE",
      `Unknown actor role '${event.actorRole}'.`,
    );
  }

  if (!allowedEvents.includes(event.eventType)) {
    return rejected(
      null,
      event,
      policy,
      "UNAUTHORIZED_ACTOR",
      `${event.actorRole} is not permitted to perform ${event.eventType}.`,
    );
  }

  return null;
}

/**
 * ---------------------------------------------------------
 * STATE TRANSITION VALIDATION
 * ---------------------------------------------------------
 */
function validateStateTransition(assetState, event, policy) {
  const nextState = getNextState(assetState.status, event.eventType);

  if (!nextState) {
    return rejected(
      assetState,
      event,
      policy,
      "ILLEGAL_STATE_TRANSITION",
      `Cannot ${event.eventType} an asset in state ${assetState.status}.`,
    );
  }

  // A valid transition is only a validation success.
  // Do not return an ACCEPTED decision here because
  // business rules must still be evaluated afterward.
  return null;
}

/**
 * ---------------------------------------------------------
 * BUSINESS RULE VALIDATION
 * ---------------------------------------------------------
 */
function validateBusinessRules(assetState, event, policy, ledger, context) {
  const validators = {
    CHECKOUT: validateCheckout,
    RETURN: validateReturn,
    MAINTENANCE_OPEN: validateMaintenanceOpen,
    MAINTENANCE_CLOSE: validateMaintenanceClose,
    TRANSFER_OUT: validateTransferOut,
    TRANSFER_IN: validateTransferIn,
    AUDIT_OBSERVATION: validateAuditObservation,
    RETIRE: validateRetire,

    RESERVE: evaluateReserveEvent,
    CANCEL_RESERVATION: evaluateCancelReservationEvent,
    MANUAL_CORRECTION: evaluateManualCorrectionEvent,
  };

  const validator = validators[event.eventType];

  if (!validator) {
    return null;
  }

  // RESERVE
  if (event.eventType === "RESERVE") {
    const result = validator({
      event,
      actorRole: event.actorRole,
      assetState,
      hasConflictingHold: context.hasConflictingHold ?? false,
    });

    return convertSpecialDecision(result, assetState, event, policy);
  }

  // CANCEL_RESERVATION
  if (event.eventType === "CANCEL_RESERVATION") {
    const result = validator({
      event,
      reservation: context.reservation ?? null,
      actorRole: event.actorRole,
    });

    return convertSpecialDecision(result, assetState, event, policy);
  }

  // MANUAL_CORRECTION
  if (event.eventType === "MANUAL_CORRECTION") {
    const result = validator({
      event,
      actorRole: event.actorRole,
      evidence: context.evidence ?? {
        evidence_ref: event.evidence_ref,
        reason: event.note,
      },
      assetState,
    });

    return convertSpecialDecision(result, assetState, event, policy);
  }

  // Normal validators
  return validator(assetState, event, policy, ledger);
}

/**
 * ---------------------------------------------------------
 * SPECIAL EVENT RESULT CONVERSION
 * ---------------------------------------------------------
 */
function convertSpecialDecision(result, assetState, event, policy) {
  if (!result) {
    return null;
  }

  if (result.decisionType === "REJECTED") {
    return rejected(
      assetState,
      event,
      policy,
      result.reasonCode,
      result.message,
    );
  }

  if (result.decisionType === "ACCEPTED") {
    return acceptedSpecialEvent(
      assetState,
      event,
      policy,
      result.reasonCode,
      result.message,
    );
  }

  if (result.decisionType === "ACCEPTED_WITH_WARNING") {
    return acceptedWithWarningSpecialEvent(
      assetState,
      event,
      policy,
      result.reasonCode,
      result.message,
    );
  }

  return null;
}

/**
 * ---------------------------------------------------------
 * CHECKOUT
 * ---------------------------------------------------------
 */
function validateCheckout(assetState, event, policy, ledger) {
  const limit = policy.checkoutLimits[event.actorRole];

  if (limit === undefined) {
    return null;
  }

  const activeLoans = [...ledger.values()].filter(
    (asset) =>
      asset.holderId === event.actorId && asset.status === "CHECKED_OUT",
  );

  if (activeLoans.length >= limit) {
    return rejected(
      assetState,
      event,
      policy,
      "CHECKOUT_LIMIT_EXCEEDED",
      `${event.actorId} has reached the checkout limit.`,
    );
  }

  return null;
}

/**
 * ---------------------------------------------------------
 * RETURN
 * ---------------------------------------------------------
 */
function validateReturn(assetState, event, policy) {
  if (assetState.holderId !== event.actorId) {
    return rejected(
      assetState,
      event,
      policy,
      "HOLDER_MISMATCH",
      "Asset holder does not match the returning actor.",
    );
  }

  const lateReturnRules = policy?.autoResolutionRules?.lateReturn;

  if (lateReturnRules?.enabled && assetState.dueAt && event.occurredAt) {
    const dueAt = new Date(assetState.dueAt);
    const returnedAt = new Date(event.occurredAt);

    if (
      !Number.isNaN(dueAt.getTime()) &&
      !Number.isNaN(returnedAt.getTime()) &&
      returnedAt > dueAt
    ) {
      const lateHours =
        (returnedAt.getTime() - dueAt.getTime()) / (1000 * 60 * 60);

      if (lateHours <= lateReturnRules.gracePeriodHours) {
        return acceptedWithWarning(
          assetState,
          event,
          policy,
          "LATE_RETURN_WITHIN_GRACE_PERIOD",
          `Return was ${lateHours.toFixed(1)} hours late but is within the ${lateReturnRules.gracePeriodHours}-hour grace period.`,
        );
      }

      return null;
    }
  }

  return null;
}
/**
 * ---------------------------------------------------------
 * TRANSFER OUT
 * ---------------------------------------------------------
 */
function validateTransferOut(assetState, event, policy) {
  if (assetState.locationId !== event.locationId) {
    return rejected(
      assetState,
      event,
      policy,
      "ORIGIN_LOCATION_MISMATCH",
      "Transfer origin does not match the current asset location.",
    );
  }

  return null;
}

/**
 * ---------------------------------------------------------
 * TRANSFER IN
 * ---------------------------------------------------------
 */
function validateTransferIn(assetState, event, policy) {
  if (assetState.status !== "IN_TRANSIT") {
    return rejected(
      assetState,
      event,
      policy,
      "DESTINATION_LOCATION_MISMATCH",
      "Asset is not currently in transit.",
    );
  }

  return null;
}

/**
 * ---------------------------------------------------------
 * MAINTENANCE OPEN
 * ---------------------------------------------------------
 */
function validateMaintenanceOpen(assetState, event, policy) {
  if (assetState.status !== "AVAILABLE") {
    return rejected(
      assetState,
      event,
      policy,
      "MAINTENANCE_NOT_ALLOWED",
      "Only available assets can enter maintenance.",
    );
  }

  return null;
}

/**
 * ---------------------------------------------------------
 * MAINTENANCE CLOSE
 * ---------------------------------------------------------
 */
function validateMaintenanceClose(assetState, event, policy) {
  if (assetState.status !== "MAINTENANCE") {
    return rejected(
      assetState,
      event,
      policy,
      "MAINTENANCE_NOT_ACTIVE",
      "Asset is not currently in maintenance.",
    );
  }

  return null;
}

/**
 * ---------------------------------------------------------
 * CONDITION COMPARISON
 * ---------------------------------------------------------
 */
function getConditionDowngradeAmount(assetState, event, policy) {
  if (!event.conditionReport) {
    return 0;
  }

  const ranking = policy.conditionSeverityRanking;

  const current = ranking[assetState.condition?.toLowerCase()];
  const observed = ranking[event.conditionReport.toLowerCase()];

  if (current === undefined || observed === undefined) {
    return 0;
  }

  return Math.max(0, observed - current);
}

/**
 * ---------------------------------------------------------
 * AUDIT OBSERVATION
 * ---------------------------------------------------------
 */
function validateAuditObservation(assetState, event, policy) {
  const downgradeAmount = getConditionDowngradeAmount(
    assetState,
    event,
    policy,
  );

  if (downgradeAmount === 1) {
    return acceptedWithWarning(
      assetState,
      event,
      policy,
      REASON_CODES.CONDITION_DOWNGRADE,
      `Condition downgraded from ${assetState.condition} to ${event.conditionReport}.`,
      {
        conditionBefore: assetState.condition,
        conditionAfter: event.conditionReport,
      },
    );
  }

  if (downgradeAmount >= 2) {
    return reviewRequired(
      assetState,
      event,
      policy,
      REASON_CODES.CONDITION_DOWNGRADE,
      `Condition downgraded by ${downgradeAmount} ranks from ${assetState.condition} to ${event.conditionReport}.`,
    );
  }

  if (event.conditionReport && event.conditionReport !== assetState.condition) {
    return reviewRequired(
      assetState,
      event,
      policy,
      REASON_CODES.AUDIT_DISCREPANCY,
      "Audit observation differs from recorded condition.",
    );
  }

  return warningOnly(
    assetState,
    event,
    policy,
    REASON_CODES.AUDIT_DISCREPANCY,
    "Audit observation recorded successfully.",
  );
}

/**
 * ---------------------------------------------------------
 * RETIRE
 * ---------------------------------------------------------
 */
function validateRetire(assetState, event, policy) {
  if (assetState.status === "CHECKED_OUT") {
    return rejected(
      assetState,
      event,
      policy,
      REASON_CODES.RETIREMENT_BLOCKED,
      "Checked out assets cannot be retired.",
    );
  }

  if (assetState.status === "IN_TRANSIT") {
    return rejected(
      assetState,
      event,
      policy,
      "RETIREMENT_BLOCKED",
      "Assets in transit cannot be retired.",
    );
  }

  if (assetState.status === "RETIRED") {
    return rejected(
      assetState,
      event,
      policy,
      "ALREADY_RETIRED",
      "Asset is already retired.",
    );
  }

  return null;
}

/**
 * ---------------------------------------------------------
 * ACCEPTED NORMAL EVENT
 * ---------------------------------------------------------
 */
function accepted(assetState, event, policy) {
  const nextState = getNextState(assetState.status, event.eventType);

  if (!nextState) {
    throw new Error(
      `Illegal transition accepted: ${assetState.status} -> ${event.eventType}`,
    );
  }

  return new EventDecision({
    eventId: event.eventId,
    eventType: event.eventType,
    assetId: event.assetId,

    decision: "ACCEPTED",

    reasonCode: REASON_CODES.STATE_TRANSITION_ALLOWED,

    message: buildSuccessMessage(event.eventType),

    previousState: assetState.status,
    nextState,

    rawRecordId: event.rawRecordId,

    policyVersion: policy.policyVersion,
  });
}

/**
 * ---------------------------------------------------------
 * ACCEPTED WITH WARNING
 * ---------------------------------------------------------
 */
function acceptedWithWarning(
  assetState,
  event,
  policy,
  reasonCode,
  message,
  conditionData = {},
) {
  const nextState = getNextState(assetState.status, event.eventType);

  if (!nextState) {
    throw new Error(
      `Illegal transition accepted: ${assetState.status} -> ${event.eventType}`,
    );
  }

  return new EventDecision({
    eventId: event.eventId,
    eventType: event.eventType,
    assetId: event.assetId,

    decision: "ACCEPTED_WITH_WARNING",

    reasonCode,
    message,

    previousState: assetState.status,
    nextState,

    rawRecordId: event.rawRecordId,

    policyVersion: policy.policyVersion,

    ...conditionData,
  });
}

/**
 * ---------------------------------------------------------
 * REJECTED
 * ---------------------------------------------------------
 */
function rejected(assetState, event, policy, reasonCode, message) {
  return new EventDecision({
    eventId: event.eventId,
    eventType: event.eventType,
    assetId: event.assetId,

    decision: "REJECTED",

    reasonCode,
    message,

    previousState: assetState?.status ?? "",

    nextState: null,

    rawRecordId: event.rawRecordId,

    policyVersion: policy.policyVersion,
  });
}

/**
 * ---------------------------------------------------------
 * REVIEW REQUIRED
 * ---------------------------------------------------------
 */
function reviewRequired(assetState, event, policy, reasonCode, message) {
  return new EventDecision({
    eventId: event.eventId,
    eventType: event.eventType,
    assetId: event.assetId,

    decision: "REVIEW_REQUIRED",

    reasonCode,
    message,

    previousState: assetState?.status ?? "",

    nextState: assetState?.status ?? null,

    rawRecordId: event.rawRecordId,

    policyVersion: policy.policyVersion,
  });
}

/**
 * ---------------------------------------------------------
 * WARNING ONLY
 * ---------------------------------------------------------
 */
function warningOnly(assetState, event, policy, reasonCode, message) {
  return new EventDecision({
    eventId: event.eventId,
    eventType: event.eventType,
    assetId: event.assetId,

    decision: "WARNING_ONLY",

    reasonCode,
    message,

    previousState: assetState?.status ?? "",

    nextState: assetState?.status ?? null,

    rawRecordId: event.rawRecordId,

    policyVersion: policy.policyVersion,
  });
}

/**
 * ---------------------------------------------------------
 * SPECIAL EVENT: ACCEPTED
 * ---------------------------------------------------------
 */
function acceptedSpecialEvent(assetState, event, policy, reasonCode, message) {
  return new EventDecision({
    eventId: event.eventId,
    eventType: event.eventType,
    assetId: event.assetId,

    decision: "ACCEPTED",

    reasonCode,
    message,

    previousState: assetState?.status ?? "",

    nextState: assetState?.status ?? null,

    rawRecordId: event.rawRecordId,

    policyVersion: policy.policyVersion,
  });
}

/**
 * ---------------------------------------------------------
 * SPECIAL EVENT: ACCEPTED WITH WARNING
 * ---------------------------------------------------------
 */
function acceptedWithWarningSpecialEvent(
  assetState,
  event,
  policy,
  reasonCode,
  message,
) {
  return new EventDecision({
    eventId: event.eventId,
    eventType: event.eventType,
    assetId: event.assetId,

    decision: "ACCEPTED_WITH_WARNING",

    reasonCode,
    message,

    previousState: assetState?.status ?? "",

    nextState: assetState?.status ?? null,

    rawRecordId: event.rawRecordId,

    policyVersion: policy.policyVersion,
  });
}

/**
 * ---------------------------------------------------------
 * SUCCESS MESSAGES
 * ---------------------------------------------------------
 */
function buildSuccessMessage(eventType) {
  const messages = {
    CHECKOUT: "CHECKOUT completed successfully.",
    RETURN: "RETURN completed successfully.",
    MAINTENANCE_OPEN: "Maintenance started successfully.",
    MAINTENANCE_CLOSE: "Maintenance completed successfully.",
    TRANSFER_OUT: "Transfer initiated successfully.",
    TRANSFER_IN: "Transfer completed successfully.",
    AUDIT_OBSERVATION: "Audit recorded successfully.",
    RETIRE: "Asset retired successfully.",
  };

  return messages[eventType] ?? `${eventType} completed successfully.`;
}
