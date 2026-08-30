const AUTHORIZED_STAFF_ROLES = new Set(["staff", "admin"]);

export function evaluateCancelReservationEvent({
  event,
  reservation,
  actorRole,
}) {
  const reservationId = event.reservationId ?? event.reservation_id;

  const actorId = event.actorId ?? event.actor_id;

  if (!reservation) {
    return {
      decisionType: "REJECTED",
      reasonCode: "RESERVATION_NOT_FOUND",
      message: `Reservation ${reservationId} does not exist.`,
    };
  }

  const storedReservationId =
    reservation.reservation_id ?? reservation.reservationId;

  const requesterId = reservation.requester_id ?? reservation.requesterId;

  const status = String(reservation.status ?? "").toUpperCase();

  if (status === "CANCELLED") {
    return {
      decisionType: "REJECTED",
      reasonCode: "RESERVATION_ALREADY_CANCELLED",
      message: `Reservation ${storedReservationId} is already cancelled.`,
    };
  }

  const isRequester = actorId === requesterId;

  const isAuthorizedStaff = AUTHORIZED_STAFF_ROLES.has(actorRole);

  if (!isRequester && !isAuthorizedStaff) {
    return {
      decisionType: "REJECTED",
      reasonCode: "CANCEL_RESERVATION_UNAUTHORIZED",
      message:
        "Only the requester or authorized staff may cancel this reservation.",
    };
  }

  return {
    decisionType: "ACCEPTED_WITH_WARNING",
    reasonCode: "RESERVATION_CANCELLED",
    message: `Reservation ${storedReservationId} cancelled successfully.`,
  };
}
