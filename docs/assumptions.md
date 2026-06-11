# Assumptions

## Purpose

This document records the assumptions made during the design and implementation of Packet 01. These assumptions simplify processing while providing a foundation for future reconciliation functionality.

---

## Data Assumptions

### Unique Event Identifiers

Each event is expected to have a unique event identifier.

If duplicate event IDs are encountered, the event is considered invalid and is rejected during validation.

---

### Timestamp Format

All timestamps are expected to be valid ISO-8601 date-time values.

Examples:

- 2026-06-01T08:00:00Z
- 2026-06-05T20:00:00Z

Invalid timestamp formats are rejected.

---

### Required Fields

The following fields are required for event processing:

- event_id
- occurred_at
- received_at
- actor_id
- event_type
- asset_id

Records missing required fields are rejected.

---

### Actor Roles

Every event is expected to include an actor role.

Actor roles are required because future authorization and policy validation depend on them.

Missing actor roles result in validation errors.

---

### Asset Existence

Events are expected to reference assets that exist in the inventory dataset.

References to unknown assets are treated as validation failures.

---

### Event Types

Event types must exist within the policy definition.

Unknown event types are rejected to prevent unsupported business actions from entering the canonical model.

---

### Condition Values

Condition values are expected to conform to policy-approved values.

Unexpected condition values are treated as validation failures.

---

## Processing Assumptions

### Accepted Records Only

Only records that pass validation are transformed into canonical events.

Rejected records remain available through traceability artifacts but are excluded from canonical processing.

---

### Deterministic Ordering

Canonical events are processed using deterministic ordering based on:

1. occurredAt
2. receivedAt
3. eventId

This guarantees repeatable execution and reproducible outputs.

---

### Traceability Preservation

All records retain a reference to their originating raw record.

This assumption ensures that every canonical event and validation error can be traced back to its source.

---

### Policy Trust

The policy file is assumed to be trusted input.

Packet 01 validates event data against policy definitions but does not validate policy correctness itself.

---

## Future Assumptions

Future packets may introduce:

- Reconciliation rules
- Asset state reconstruction
- Authorization enforcement
- Cross-system consistency checks

These features may require revisiting the assumptions documented above.
