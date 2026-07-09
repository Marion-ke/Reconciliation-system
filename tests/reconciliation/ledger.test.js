import { buildLedger } from "../../src/reconciliation/ledger.js";

describe("Ledger", () => {
  test("creates an asset state for every inventory record", () => {
    const inventory = [
      {
        payload: {
          asset_id: "cam-001",
          asset_type: "Camera",
          status: "AVAILABLE",
          holder_id: "",
          location_id: "Media Lab",
          condition: "good",
          due_at: "",
        },
      },
    ];

    const ledger = buildLedger(inventory);

    expect(ledger.size).toBe(1);

    expect(ledger.get("cam-001").status).toBe("AVAILABLE");
  });
});
