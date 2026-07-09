import EventDecision from "../domain/eventDecision.js";
import { getNextState } from "./stateMachine.js";
import { REASON_CODES } from "./reasonCodes.js";
/**
 * Evaluates whether a canonical event
 * may be applied to the current asset state.
 */
export function evaluateEvent(assetState, event, policy, ledger) {
  // 1. Validate event type
  const eventTypeResult = validateEventType(event, policy);

  if (eventTypeResult) {
    return eventTypeResult;
  }

  // 2. Validate actor permissions
  const permissionResult = validateActorPermission(event, policy);

  if (permissionResult) {
    return permissionResult;
  }

  // 3. Validate state transition
  const transitionResult = validateStateTransition(assetState, event, policy);

  if (transitionResult) {
    return transitionResult;
  }

  // 4. Validate business rules
  const businessRuleResult = validateBusinessRules(
    assetState,
    event,
    policy,
    ledger,
  );

  if (businessRuleResult) {
    return businessRuleResult;
  }
  if (event.isLateEvent) {
    return acceptedWithWarning(
      assetState,
      event,
      policy,
      REASON_CODES.LATE_EVENT,
      `Event arrived ${event.lateHours.toFixed(1)} hours after occurrence.`,
    );
  }

  return accepted(assetState, event, policy);

  function validateBusinessRules(assetState, event, policy, ledger) {
    const validators = {
      CHECKOUT: validateCheckout,
      RETURN: validateReturn,
      MAINTENANCE_OPEN: validateMaintenanceOpen,
      MAINTENANCE_CLOSE: validateMaintenanceClose,
      TRANSFER_OUT: validateTransferOut,
      TRANSFER_IN: validateTransferIn,
      AUDIT_OBSERVATION: validateAuditObservation,
      RETIRE: validateRetire,
    };

    const validator = validators[event.eventType];

    if (!validator) {
      return null;
    }

    return validator(assetState, event, policy, ledger);
  }

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

    return null;
  }
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
  function isConditionDowngrade(assetState, event, policy) {
    if (!event.conditionReport) {
      return false;
    }

    const ranking = policy.conditionSeverityRanking;

    const current = ranking[assetState.condition.toLowerCase()];

    const observed = ranking[event.conditionReport.toLowerCase()];

    if (current === undefined || observed === undefined) {
      return false;
    }

    return observed > current;
  }
  function validateAuditObservation(assetState, event, policy) {
    if (isConditionDowngrade(assetState, event, policy)) {
      return acceptedWithWarning(
        assetState,
        event,
        policy,
        REASON_CODES.CONDITION_DOWNGRADE,
        `Condition downgraded from ${assetState.condition} to ${event.conditionReport}.`,
      );
    }

    if (
      event.conditionReport &&
      event.conditionReport !== assetState.condition
    ) {
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
  if (businessRuleResult) {
    return businessRuleResult;
  }

  // 5. Everything passed
  return accepted(assetState, event, policy);
}

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

  return null;
}
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
}
function acceptedWithWarning(assetState, event, policy, reasonCode, message) {
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
  });
}
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

function reviewRequired(assetState, event, policy, reasonCode, message) {
  return new EventDecision({
    eventId: event.eventId,
    eventType: event.eventType,
    assetId: event.assetId,

    decision: "REVIEW_REQUIRED",

    reasonCode,

    message,

    previousState: assetState?.status ?? "",

    nextState: assetState.status,

    rawRecordId: event.rawRecordId,

    policyVersion: policy.policyVersion,
  });
}

function warningOnly(assetState, event, policy, reasonCode, message) {
  return new EventDecision({
    eventId: event.eventId,
    eventType: event.eventType, 
    assetId: event.assetId,

    decision: "WARNING_ONLY",

    reasonCode,

    message,

    previousState: assetState?.status ?? "",
    nextState: assetState.status,

    rawRecordId: event.rawRecordId,

    policyVersion: policy.policyVersion,
  });
}
