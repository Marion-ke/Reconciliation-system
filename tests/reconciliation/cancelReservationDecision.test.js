import { describe, test, expect } from "@jest/globals";

import { evaluateCancelReservationEvent } from "../../src/reconciliation/cancelReservationDecision.js";

describe("CANCEL_RESERVATION event decision", () => {
  const reservation = {
    reservation_id: "RES-001",
    asset_id: "lap-001",
    requester_id: "s001",
    status: "OPEN",
  };

  test("allows the original requester to cancel", () => {
    const result = evaluateCancelReservationEvent({
      event: {
        event_id: "cancel-001",
        event_type: "CANCEL_RESERVATION",
        reservation_id: "RES-001",
        actor_id: "s001",
      },
      reservation,
      actorRole: "student",
    });

    expect(result.decisionType).toBe("ACCEPTED_WITH_WARNING");
    expect(result.reasonCode).toBe("RESERVATION_CANCELLED");
  });

  test("allows authorized staff to cancel", () => {
    const result = evaluateCancelReservationEvent({
      event: {
        event_id: "cancel-002",
        event_type: "CANCEL_RESERVATION",
        reservation_id: "RES-001",
        actor_id: "staff-001",
      },
      reservation,
      actorRole: "staff",
    });

    expect(result.decisionType).toBe("ACCEPTED_WITH_WARNING");
    expect(result.reasonCode).toBe("RESERVATION_CANCELLED");
  });

  test("rejects an unauthorized actor", () => {
    const result = evaluateCancelReservationEvent({
      event: {
        event_id: "cancel-003",
        event_type: "CANCEL_RESERVATION",
        reservation_id: "RES-001",
        actor_id: "s002",
      },
      reservation,
      actorRole: "student",
    });

    expect(result.decisionType).toBe("REJECTED");
    expect(result.reasonCode).toBe("CANCEL_RESERVATION_UNAUTHORIZED");
  });

  test("rejects a missing reservation", () => {
    const result = evaluateCancelReservationEvent({
      event: {
        event_id: "cancel-004",
        event_type: "CANCEL_RESERVATION",
        reservation_id: "RES-999",
        actor_id: "s001",
      },
      reservation: null,
      actorRole: "student",
    });

    expect(result.decisionType).toBe("REJECTED");
    expect(result.reasonCode).toBe("RESERVATION_NOT_FOUND");
  });

  test("rejects an already cancelled reservation", () => {
    const result = evaluateCancelReservationEvent({
      event: {
        event_id: "cancel-005",
        event_type: "CANCEL_RESERVATION",
        reservation_id: "RES-001",
        actor_id: "s001",
      },
      reservation: {
        ...reservation,
        status: "CANCELLED",
      },
      actorRole: "student",
    });

    expect(result.decisionType).toBe("REJECTED");
    expect(result.reasonCode).toBe("RESERVATION_ALREADY_CANCELLED");
  });
});
