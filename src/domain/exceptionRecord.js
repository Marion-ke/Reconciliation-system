/**
 * Represents an event that requires
 * manual investigation during reconciliation.
 */
export default class ExceptionRecord {
  constructor({ eventId, assetId, reasonCode, message }) {
    // Event reference
    this.eventId = eventId;

    // Related asset
    this.assetId = assetId;

    // Exception type
    this.reasonCode = reasonCode;

    // Human-readable explanation
    this.message = message;
  }
}
