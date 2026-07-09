/**
 * Represents an exception that requires
 * human review after reconciliation.
 */
export default class ExceptionCase {
  constructor({
    caseId,
    severity,
    reasonCode,
    assetId,
    eventId,
    rawRecordId,
    message,
    recommendedNextAction,
    groupingKey,
  }) {
    this.caseId = caseId;

    this.severity = severity;

    this.reasonCode = reasonCode;

    this.assetId = assetId;

    this.eventId = eventId;

    this.rawRecordId = rawRecordId;

    this.message = message;

    this.recommendedNextAction = recommendedNextAction;

    this.groupingKey = groupingKey;
  }
}
