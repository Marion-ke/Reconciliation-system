import { buildLedger } from "../../src/reconciliation/ledger.js";
import { reconcileEvents } from "../../src/reconciliation/reconciliationEngine.js";
import { mockPolicy } from "../fixtures/mockPolicy.js";

describe("Packet 3-4 Pipeline", () => {
  test("processes a valid packet 3 event", () => {
    const inventory = [
      {
        payload: {
          asset_id: "cam-001",
          asset_type: "camera",
          status: "AVAILABLE",
          holder_id: "",
          location_id: "media-lab",
          condition: "good",
          due_at: "",
        },
      },
    ];

    const ledger = buildLedger(inventory);

    const events = [
      {
        eventId: "e001",
        assetId: "cam-001",
        eventType: "CHECKOUT",
        actorId: "s201",
        actorRole: "student",
        occurredAt: "2026-06-01T09:00:00Z",
        receivedAt: "2026-06-01T09:01:00Z",
        locationId: "media-lab",
        conditionReport: "good",
      },
    ];

    const result = reconcileEvents(events, ledger, mockPolicy);

    expect(result.decisions).toHaveLength(1);
    expect(result.summary.processed).toBe(1);
  });
});
