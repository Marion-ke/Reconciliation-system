/**
 * Represents the reconciliation decision
 * made for a canonical event.
 */
export default class EventDecision {
  constructor({
    eventId,
    eventType,
    assetId,
    decision,
    reasonCode,
    message,
    previousState,
    nextState,
    rawRecordId,
    policyVersion,
  }) {
    // Event being evaluated
    this.eventId = eventId;
    this.eventType = eventType;

    // Related asset
    this.assetId = assetId;

    // ACCEPTED
    // ACCEPTED_WITH_WARNING
    // REJECTED
    // WARNING_ONLY
    // REVIEW_REQUIRED
    this.decision = decision;

    // Why the decision was made
    this.reasonCode = reasonCode;

    // Human-readable explanation
    this.message = message;

    // Asset state before processing
    this.previousState = previousState;

    // Asset state after processing
    this.nextState = nextState;

    // Source record that produced this decision
    this.rawRecordId = rawRecordId;

    // Policy version used during reconciliation
    this.policyVersion = policyVersion;
  }
}
