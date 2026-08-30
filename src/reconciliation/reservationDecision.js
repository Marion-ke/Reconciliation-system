const RESERVABLE_STATUSES = new Set(["AVAILABLE", "CHECKED_OUT"]);

const ELIGIBLE_ACTOR_ROLES = new Set([
  "student",
  "staff",
  "technician",
  "auditor",
  "admin",
]);

export function evaluateReserveEvent({
  event,
  actorRole,
  assetState,
  hasConflictingHold,
}) {
  if (!ELIGIBLE_ACTOR_ROLES.has(actorRole)) {
    return {
      decisionType: "REJECTED",
      reasonCode: "RESERVATION_ACTOR_NOT_ELIGIBLE",
      message: "Actor is not eligible to create a reservation.",
    };
  }

  if (!assetState) {
    return {
      decisionType: "REJECTED",
      reasonCode: "RESERVATION_UNKNOWN_ASSET",
      message: `Asset ${event.asset_id ?? event.assetId} does not exist.`,
    };
  }

  if (hasConflictingHold) {
    return {
      decisionType: "REJECTED",
      reasonCode: "RESERVATION_CONFLICT",
      message: `Asset ${
        event.asset_id ?? event.assetId
      } already has a conflicting reservation.`,
    };
  }

  const normalizedStatus = String(assetState.status).toUpperCase();

  if (!RESERVABLE_STATUSES.has(normalizedStatus)) {
    return {
      decisionType: "REJECTED",
      reasonCode: "ASSET_NOT_RESERVABLE",
      message:
        `Asset ${event.asset_id ?? event.assetId} cannot be reserved in ` +
        `state ${assetState.status}.`,
    };
  }

  return {
    decisionType: "ACCEPTED",
    reasonCode: "RESERVATION_CREATED",
    message: `Reservation created for asset ${
      event.asset_id ?? event.assetId
    }.`,
  };
}
