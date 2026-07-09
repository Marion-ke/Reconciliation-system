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
});
