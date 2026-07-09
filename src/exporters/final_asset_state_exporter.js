/**
 * Converts the reconciliation ledger
 * into the final asset state CSV.
 */
export function buildFinalAssetStateCsv(ledger) {
  const header = [
    "asset_id",
    "asset_type",
    "status",
    "holder_id",
    "location_id",
    "condition",
    "last_event_id",
    "last_occurred_at",
  ].join(",");

  const rows = Array.from(ledger.values()).map((asset) =>
    [
      asset.assetId,
      asset.assetType,
      asset.status,
      asset.holderId ?? "",
      asset.locationId ?? "",
      asset.condition ?? "",
      asset.lastEventId ?? "",
      asset.lastOccurredAt ?? "",
    ].join(","),
  );

  return [header, ...rows].join("\n");
}
