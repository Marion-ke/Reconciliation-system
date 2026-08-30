export function detectReservationConflicts(reservationRecords, assetStates) {
  const conflicts = [];

  for (const record of reservationRecords) {
    const reservation = record.payload ?? record;

    const reservationId =
      reservation.reservation_id ?? reservation.reservationId;

    const assetId = reservation.asset_id ?? reservation.assetId;

    const requesterId = reservation.requester_id ?? reservation.requesterId;

    const reservationStatus = String(reservation.status ?? "").toUpperCase();

    // Cancelled reservations are no longer active.
    if (reservationStatus === "CANCELLED") {
      continue;
    }

    const assetState = assetStates.get(assetId);

    if (!assetState) {
      conflicts.push({
        reservationId,
        assetId,
        reasonCode: "RESERVATION_UNKNOWN_ASSET",
        severity: "ERROR",
        message: `Reservation ${reservationId} references unknown asset ${assetId}.`,
      });

      continue;
    }

    const assetStatus = String(assetState.status ?? "").toUpperCase();

    const holderId = assetState.holderId ?? assetState.holder_id;

    // A checked-out asset conflicts only when the reservation
    // belongs to someone other than the current holder.
    if (assetStatus === "CHECKED_OUT") {
      if (requesterId !== holderId) {
        conflicts.push({
          reservationId,
          assetId,
          reasonCode: "RESERVATION_CHECKOUT_CONFLICT",
          severity: "ERROR",
          message:
            `Reservation ${reservationId} conflicts because asset ` +
            `${assetId} is currently checked out by another holder.`,
        });
      }

      continue;
    }

    // These asset states cannot satisfy an active reservation.
    if (
      assetStatus === "RETIRED" ||
      assetStatus === "MAINTENANCE" ||
      assetStatus === "IN_TRANSIT"
    ) {
      conflicts.push({
        reservationId,
        assetId,
        reasonCode: "RESERVATION_CONFLICT",
        severity: "ERROR",
        message:
          `Reservation ${reservationId} conflicts with the current ` +
          `state of asset ${assetId}: ${assetState.status}.`,
      });
    }
  }

  return conflicts;
}
