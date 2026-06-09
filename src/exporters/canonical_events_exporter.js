/**
 * Convert canonical events into CSV.
 */
export function buildCanonicalEventsCsv(canonicalEvents) {
  const header = [
    "canonical_event_id",
    "event_id",
    "occurred_at",
    "received_at",
    "actor_id",
    "actor_role",
    "event_type",
    "asset_id",
    "location_id",
    "condition_report",
    "source_system",
    "note",
    "raw_record_id",
  ].join(",");

  const rows = canonicalEvents.map((event) =>
    [
      event.canonicalEventId,
      event.eventId,
      event.occurredAt,
      event.receivedAt,
      event.actorId,
      event.actorRole,
      event.eventType,
      event.assetId,
      event.locationId,
      event.conditionReport,
      event.sourceSystem,
      event.note,
      event.rawRecordId,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}
