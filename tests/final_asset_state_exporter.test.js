import { buildFinalAssetStateCsv } from "../src/exporters/final_asset_state_exporter.js";

describe("Final Asset State Exporter", () => {
  test("exports the reconciliation ledger as CSV", () => {
    const ledger = new Map();

    ledger.set("cam-001", {
      assetId: "cam-001",
      assetType: "Camera",
      status: "AVAILABLE",
      holderId: "",
      locationId: "Media Lab",
      condition: "good",
      lastEventId: "e010",
      lastOccurredAt: "2026-06-01T10:00:00Z",
    });

    const csv = buildFinalAssetStateCsv(ledger);

    expect(csv).toContain("asset_id");
    expect(csv).toContain("cam-001");
    expect(csv).toContain("AVAILABLE");
    expect(csv).toContain("e010");
  });
});
