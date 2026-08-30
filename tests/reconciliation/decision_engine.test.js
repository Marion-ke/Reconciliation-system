import AssetState from "../../src/domain/assetState.js";
import { evaluateEvent } from "../../src/reconciliation/decisionEngine.js";
import { mockPolicy } from "../fixtures/mockPolicy.js";

describe("Decision Engine", () => {
  const policy = mockPolicy;

  test("accepts a valid checkout", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "AVAILABLE",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e001",
      assetId: "cam-001",
      eventType: "CHECKOUT",
      actorId: "s201",
      actorRole: "student",
      occurredAt: "2026-06-01T09:00:00Z",
      receivedAt: "2026-06-01T09:01:00Z",
      locationId: "media-lab",
      conditionReport: "good",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger);

    expect(decision.decision).toBe("ACCEPTED");
    expect(decision.nextState).toBe("CHECKED_OUT");
    expect(decision.eventId).toBe("e001");
  });

  test("rejects an illegal transition", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "RETIRED",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e002",
      assetId: "cam-001",
      eventType: "CHECKOUT",
      actorId: "s201",
      actorRole: "student",
      occurredAt: "2026-06-01T10:00:00Z",
      receivedAt: "2026-06-01T10:01:00Z",
      locationId: "media-lab",
      conditionReport: "good",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger);

    expect(decision.decision).toBe("REJECTED");
    expect(decision.nextState).toBeNull();
  });
  test("evaluates a valid RESERVE event", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "AVAILABLE",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e003",
      assetId: "cam-001",
      eventType: "RESERVE",
      actorId: "s201",
      actorRole: "student",
      reservationId: "res-001",
      occurredAt: "2026-06-01T11:00:00Z",
      receivedAt: "2026-06-01T11:01:00Z",
      locationId: "media-lab",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger, {
      hasConflictingHold: false,
    });

    expect(decision.decision).toBe("ACCEPTED");
    expect(decision.reasonCode).toBe("RESERVATION_CREATED");
    expect(decision.eventId).toBe("e003");
  });
  test("rejects a RESERVE event with a conflicting reservation", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "AVAILABLE",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e004",
      assetId: "cam-001",
      eventType: "RESERVE",
      actorId: "s201",
      actorRole: "student",
      reservationId: "res-002",
      occurredAt: "2026-06-01T12:00:00Z",
      receivedAt: "2026-06-01T12:01:00Z",
      locationId: "media-lab",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger, {
      hasConflictingHold: true,
    });

    expect(decision.decision).toBe("REJECTED");
    expect(decision.reasonCode).toBe("RESERVATION_CONFLICT");
  });

  test("evaluates a valid CANCEL_RESERVATION event", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "AVAILABLE",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e005",
      assetId: "cam-001",
      eventType: "CANCEL_RESERVATION",
      actorId: "s201",
      actorRole: "student",
      reservationId: "res-001",
      occurredAt: "2026-06-01T13:00:00Z",
      receivedAt: "2026-06-01T13:01:00Z",
      locationId: "media-lab",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger, {
      reservation: {
        reservation_id: "res-001",
        requester_id: "s201",
        status: "ACTIVE",
      },
    });

    expect(decision.decision).toBe("ACCEPTED_WITH_WARNING");
    expect(decision.reasonCode).toBe("RESERVATION_CANCELLED");
    expect(decision.eventId).toBe("e005");
  });

  test("rejects an unauthorized CANCEL_RESERVATION event", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "AVAILABLE",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e006",
      assetId: "cam-001",
      eventType: "CANCEL_RESERVATION",
      actorId: "s999",
      actorRole: "student",
      reservationId: "res-001",
      occurredAt: "2026-06-01T14:00:00Z",
      receivedAt: "2026-06-01T14:01:00Z",
      locationId: "media-lab",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger, {
      reservation: {
        reservation_id: "res-001",
        requester_id: "s201",
        status: "ACTIVE",
      },
    });

    expect(decision.decision).toBe("REJECTED");
    expect(decision.reasonCode).toBe("CANCEL_RESERVATION_UNAUTHORIZED");
  });

  test("rejects CANCEL_RESERVATION when reservation does not exist", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "AVAILABLE",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e007",
      assetId: "cam-001",
      eventType: "CANCEL_RESERVATION",
      actorId: "s201",
      actorRole: "student",
      reservationId: "res-999",
      occurredAt: "2026-06-01T15:00:00Z",
      receivedAt: "2026-06-01T15:01:00Z",
      locationId: "media-lab",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger, {
      reservation: null,
    });

    expect(decision.decision).toBe("REJECTED");
    expect(decision.reasonCode).toBe("RESERVATION_NOT_FOUND");
  });

  test("evaluates a valid MANUAL_CORRECTION event", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "AVAILABLE",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e008",
      assetId: "cam-001",
      eventType: "MANUAL_CORRECTION",
      actorId: "staff-001",
      actorRole: "staff",
      occurredAt: "2026-06-01T16:00:00Z",
      receivedAt: "2026-06-01T16:01:00Z",
      locationId: "media-lab",
      evidence_ref: "audit-001",
      note: "Corrected inventory record after physical verification.",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger, {
      evidence: {
        evidence_ref: "audit-001",
        reason: "Physical verification confirmed the correction.",
      },
    });

    expect(decision.decision).toBe("ACCEPTED_WITH_WARNING");
    expect(decision.reasonCode).toBe("MANUAL_CORRECTION_APPLIED");
    expect(decision.eventId).toBe("e008");
  });

  test("rejects unauthorized MANUAL_CORRECTION event", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "AVAILABLE",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e009",
      assetId: "cam-001",
      eventType: "MANUAL_CORRECTION",
      actorId: "s201",
      actorRole: "student",
      occurredAt: "2026-06-01T17:00:00Z",
      receivedAt: "2026-06-01T17:01:00Z",
      locationId: "media-lab",
      evidence_ref: "audit-002",
      note: "Attempted correction.",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger, {
      evidence: {
        evidence_ref: "audit-002",
        reason: "Test evidence.",
      },
    });

    expect(decision.decision).toBe("REJECTED");
    expect(decision.reasonCode).toBe("MANUAL_CORRECTION_UNAUTHORIZED");
  });

  test("rejects MANUAL_CORRECTION when evidence is incomplete", () => {
    const asset = new AssetState({
      assetId: "cam-001",
      status: "AVAILABLE",
      holderId: "",
      locationId: "media-lab",
      condition: "good",
    });

    const ledger = new Map();
    ledger.set("cam-001", asset);

    const event = {
      eventId: "e010",
      assetId: "cam-001",
      eventType: "MANUAL_CORRECTION",
      actorId: "staff-001",
      actorRole: "staff",
      occurredAt: "2026-06-01T18:00:00Z",
      receivedAt: "2026-06-01T18:01:00Z",
      locationId: "media-lab",
      evidence_ref: "",
      note: "",
      isLateEvent: false,
      lateHours: 0,
    };

    const decision = evaluateEvent(asset, event, policy, ledger, {
      evidence: {
        evidence_ref: "",
        reason: "",
      },
    });

    expect(decision.decision).toBe("REJECTED");
    expect(decision.reasonCode).toBe("MANUAL_CORRECTION_INSUFFICIENT_EVIDENCE");
  });
});
