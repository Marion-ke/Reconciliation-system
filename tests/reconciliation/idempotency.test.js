import { buildLedger } from "../../src/reconciliation/ledger.js";
import { reconcileEvents } from "../../src/reconciliation/reconciliationEngine.js";
import { mockPolicy } from "../fixtures/mockPolicy.js";

describe("Idempotency", () => {
  test("running reconciliation twice produces identical summaries", () => {
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

    const run1 = reconcileEvents(events, buildLedger(inventory), mockPolicy);

    const run2 = reconcileEvents(events, buildLedger(inventory), mockPolicy);

    expect(run1.summary).toEqual(run2.summary);
  });
});
