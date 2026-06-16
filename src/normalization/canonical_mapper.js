import CanonicalEvent from "../domain/CanonicalEvent.js";

/**
 * Converts accepted raw records
 * into canonical events.
 */
export function buildCanonicalEvents(acceptedRecords) {
  return acceptedRecords.map(
    (record, index) =>
      new CanonicalEvent({
        canonicalEventId: `ce-${String(index + 1).padStart(4, "0")}`,

        eventId: record.payload.event_id,

        occurredAt: record.payload.occurred_at,

        receivedAt: record.payload.received_at,

        actorId: record.payload.actor_id,

        actorRole: record.payload.actor_role,

        eventType: record.payload.event_type,

        assetId: record.payload.asset_id,

        locationId: record.payload.location_id,

        conditionReport: record.payload.condition_report,

        sourceSystem: record.payload.source_system,

        sourceRow: record.sourceRow,

        note: record.payload.note,

        rawRecordId: record.rawRecordId,
      }),
  );
}
