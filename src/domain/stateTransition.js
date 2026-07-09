/**
 * Represents a single state transition
 * performed by the reconciliation engine.
 */
export default class StateTransition {
  constructor({ assetId, fromState, eventType, toState, eventId, occurredAt }) {
    // Asset affected
    this.assetId = assetId;

    // Previous state
    this.fromState = fromState;

    // Triggering event
    this.eventType = eventType;

    // New state
    this.toState = toState;

    // Event reference
    this.eventId = eventId;

    // Transition time
    this.occurredAt = occurredAt;
  }
}
