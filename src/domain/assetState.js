/**
 * Represents the current reconciled state of an asset.
 *
 * AssetState is updated as canonical events are processed
 * by the reconciliation engine.
 */
export default class AssetState {
  constructor({
    assetId,
    assetType,
    status,
    holderId,
    locationId,
    condition,
    dueAt,
    lastEventId,
    lastOccurredAt,
  }) {
    // Asset identifier
    this.assetId = assetId;

    // Asset category
    this.assetType = assetType;

    // Current lifecycle state
    this.status = status;

    // Current holder (student/staff)
    this.holderId = holderId;

    // Current location
    this.locationId = locationId;

    // Current condition
    this.condition = condition;

    // Expected return date
    this.dueAt = dueAt;

    // Last accepted event
    this.lastEventId = lastEventId;

    // Timestamp of last accepted event
    this.lastOccurredAt = lastOccurredAt;
  }
}
