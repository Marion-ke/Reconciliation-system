import { buildLedger } from "../../src/reconciliation/ledger.js";
import { reconcileEvents } from "../../src/reconciliation/reconciliationEngine.js";
import { mockPolicy } from "../fixtures/mockPolicy.js";

describe("Reconciliation Engine", () => {
  const policy = mockPolicy;

  test("applies a valid event and updates the ledger", () => {
    const inventory = [
      {
        payload: {
          asset_id: "cam-001",
          asset_type: "Camera",
          status: "AVAILABLE",
          holder_id: "",
          location_id: "media-lab",
          condition: "good",
          due_at: "",
        },
      },
    ];

    const ledger = buildLedger(inventory);

    const canonicalEvents = [
      {
        eventId: "e001",
        assetId: "cam-001",
        eventType: "CHECKOUT",

        actorId: "s201",
        actorRole: "student",

        occurredAt: "2026-06-01T08:00:00Z",
        receivedAt: "2026-06-01T08:01:00Z",

        locationId: "media-lab",
        conditionReport: "good",

        isLateEvent: false,
        lateHours: 0,
      },
    ];

    const result = reconcileEvents(canonicalEvents, ledger, policy);

    expect(result.decisions).toHaveLength(1);

    expect(result.decisions[0].decision).toBe("ACCEPTED");

    const asset = result.ledger.get("cam-001");

    expect(asset.status).toBe("CHECKED_OUT");
    expect(asset.lastEventId).toBe("e001");
    expect(asset.locationId).toBe("media-lab");
    expect(asset.holderId).toBe("s201");
  });

  test("rejects an illegal transition without changing asset state", () => {
    const inventory = [
      {
        payload: {
          asset_id: "cam-002",
          asset_type: "Camera",
          status: "RETIRED",
          holder_id: "",
          location_id: "storage",
          condition: "worn",
          due_at: "",
        },
      },
    ];

    const ledger = buildLedger(inventory);

    const canonicalEvents = [
      {
        eventId: "e002",
        assetId: "cam-002",
        eventType: "CHECKOUT",

        actorId: "s201",
        actorRole: "student",

        occurredAt: "2026-06-02T09:00:00Z",
        receivedAt: "2026-06-02T09:01:00Z",

        locationId: "storage",
        conditionReport: "worn",

        isLateEvent: false,
        lateHours: 0,
      },
    ];

    const result = reconcileEvents(canonicalEvents, ledger, policy);

    expect(result.decisions).toHaveLength(1);

    expect(result.decisions[0].decision).toBe("REJECTED");

    const asset = result.ledger.get("cam-002");

    expect(asset.status).toBe("RETIRED");
    expect(asset.lastEventId).toBeNull();
    expect(asset.locationId).toBe("storage");
  });
});
