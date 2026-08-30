import { describe, test, expect } from "@jest/globals";

import { evaluateReserveEvent } from "../../src/reconciliation/reservationDecision.js";

describe("RESERVE event decision", () => {
  const event = {
    event_id: "reserve-001",
    event_type: "RESERVE",
    asset_id: "lap-001",
  };

  const assetState = {
    assetId: "lap-001",
    status: "available",
  };

  test("accepts an eligible reservation without a conflicting hold", () => {
    const result = evaluateReserveEvent({
      event,
      actorRole: "student",
      assetState,
      hasConflictingHold: false,
    });

    expect(result.decisionType).toBe("ACCEPTED");
    expect(result.reasonCode).toBe("RESERVATION_CREATED");
  });

  test("rejects an ineligible actor", () => {
    const result = evaluateReserveEvent({
      event,
      actorRole: "unknown_role",
      assetState,
      hasConflictingHold: false,
    });

    expect(result.decisionType).toBe("REJECTED");
    expect(result.reasonCode).toBe("RESERVATION_ACTOR_NOT_ELIGIBLE");
  });

  test("rejects an unknown asset", () => {
    const result = evaluateReserveEvent({
      event,
      actorRole: "student",
      assetState: null,
      hasConflictingHold: false,
    });

    expect(result.decisionType).toBe("REJECTED");
    expect(result.reasonCode).toBe("RESERVATION_UNKNOWN_ASSET");
  });

  test("rejects a conflicting reservation", () => {
    const result = evaluateReserveEvent({
      event,
      actorRole: "student",
      assetState,
      hasConflictingHold: true,
    });

    expect(result.decisionType).toBe("REJECTED");
    expect(result.reasonCode).toBe("RESERVATION_CONFLICT");
  });
});
