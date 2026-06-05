/**
 * Standardized event representation.
 *
 * All downstream reconciliation logic
 * operates on canonical events rather
 * than raw source records.
 */
export default class CanonicalEvent {
  constructor({
    canonicalEventId,
    eventId,
    occurredAt,
    receivedAt,
    actorId,
    actorRole,
    eventType,
    assetId,
    locationId,
    conditionReport,
    sourceSystem,
    note,
    rawRecordId,
  }) {
    this.canonicalEventId = canonicalEventId;

    this.eventId = eventId;

    this.occurredAt = occurredAt;

    this.receivedAt = receivedAt;

    this.actorId = actorId;

    this.actorRole = actorRole;

    this.eventType = eventType;

    this.assetId = assetId;

    this.locationId = locationId;

    this.conditionReport = conditionReport;

    this.sourceSystem = sourceSystem;

    this.note = note;

    this.rawRecordId = rawRecordId;
  }
}
