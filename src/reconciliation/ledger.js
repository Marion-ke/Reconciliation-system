import AssetState from "../domain/assetState.js";

/**
 * Builds the initial ledger from inventory.
 *
 * Every inventory asset starts with
 * its current known state.
 */
export function buildLedger(inventoryRawRecords) {
  const ledger = new Map();

  inventoryRawRecords.forEach((record) => {
    const asset = record.payload;

    ledger.set(
      asset.asset_id,
      new AssetState({
        assetId: asset.asset_id,
        assetType: asset.asset_type,
        status: asset.status.toUpperCase(),
        holderId: asset.holder_id,
        locationId: asset.location_id,
        condition: asset.condition,
        dueAt: asset.due_at,
        lastEventId: null,
        lastOccurredAt: null,
      }),
    );
  });

  return ledger;
}
