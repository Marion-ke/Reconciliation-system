/**
 * Builds a reservation operational report.
 *
 * Combines reservation source records with any
 * reconciliation conflicts detected for those reservations.
 */
export function buildReservationReportCsv(
  reservationRecords,
  reservationConflicts,
) {
  const header = [
    "reservation_id",
    "asset_id",
    "requester_id",
    "requested_at",
    "reserved_from",
    "reserved_until",
    "status",
    "source_system",
    "conflict_event_id",
    "conflict_detected",
    "conflict_reason_code",
    "conflict_severity",
    "conflict_message",
    "note",
  ].join(",");

  const conflictsByReservationId = new Map(
    reservationConflicts.map((conflict) => [conflict.reservationId, conflict]),
  );

  const rows = reservationRecords.map((record) => {
    const reservation = record.payload ?? record;

    const reservationId =
      reservation.reservation_id ?? reservation.reservationId;

    const conflict = conflictsByReservationId.get(reservationId);

    const values = [
      reservationId,
      reservation.asset_id ?? reservation.assetId ?? "",
      reservation.requester_id ?? reservation.requesterId ?? "",
      reservation.requested_at ?? reservation.requestedAt ?? "",
      reservation.reserved_from ?? reservation.reservedFrom ?? "",
      reservation.reserved_until ?? reservation.reservedUntil ?? "",
      reservation.status ?? "",
      reservation.source_system ?? reservation.sourceSystem ?? "",
      reservation.conflict_event_id ?? reservation.conflictEventId ?? "",
      conflict ? "YES" : "NO",
      conflict?.reasonCode ?? "",
      conflict?.severity ?? "",
      conflict?.message ?? "",
      reservation.note ?? "",
    ];

    return values
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",");
  });

  return [header, ...rows].join("\n");
}
