# Assumptions

## Purpose

This document records the assumptions made during the design and implementation of the Reconciliation Intelligence System . The assumptions support consistent processing while documenting boundaries around validation, reconciliation, persistence, API behavior, webhooks, automated resolution, and manual exception handling.

---

## Data Assumptions

### Unique Event Identifiers

Each event is expected to have a unique event identifier.

If duplicate event IDs are encountered, the event is considered invalid and is rejected during validation.

---

### Timestamp Format

All timestamps are expected to be valid ISO-8601 date-time values.

Examples:

- `2026-06-01T08:00:00Z`
- `2026-06-05T20:00:00Z`

Invalid timestamp formats are rejected.

---

### Required Fields

The following fields are required for event processing:

- `event_id`
- `occurred_at`
- `received_at`
- `actor_id`
- `event_type`
- `asset_id`

Records missing required fields are rejected.

---

### Actor Roles

Every event is expected to include an actor role.

Actor roles are required because authorization and policy validation depend on them.

Missing actor roles result in validation errors.

---

### Asset Existence

Events are expected to reference assets that exist in the inventory dataset.

References to unknown assets are treated as validation failures.

---

### Event Types

Event types must exist within the active policy definition.

Unknown event types are rejected to prevent unsupported business actions from entering the canonical model.

---

### Condition Values

Condition values are expected to conform to policy-approved values.

Unexpected condition values are treated as validation failures.

---

### Source Data

The implementation uses the supplied datasets as the authoritative input for development, testing, validation, profiling, reconciliation, and report generation.

The current sample data includes operational records and intentional abnormal scenarios used to exercise later-packet functionality.

---

### Synthetic Test Scenarios

Abnormal records are intentionally included to verify system behavior under error and exception conditions.

Examples include:

- Duplicate event identifiers
- Invalid timestamps
- Missing required fields
- Missing actor roles
- Unknown event types
- Unknown assets
- Invalid condition values
- Late-arriving events
- Unauthorized manual corrections
- Late returns beyond configured grace periods
- Webhook-related integration scenarios
- Automated-resolution scenarios

These scenarios are treated as test data rather than unexpected defects in the source dataset.

---

## Processing Assumptions

### Validation Before Reconciliation

Validation occurs before normal canonicalization and reconciliation processing.

Records with blocking validation failures are rejected from normal downstream processing, while records containing non-blocking warnings may continue according to the reconciliation decision rules.

---

### Reconciliation Outcomes

The reconciliation layer may produce the following outcomes:

- `ACCEPTED`
- `ACCEPTED_WITH_WARNING`
- `REJECTED`
- `REVIEW_REQUIRED`
- `WARNING_ONLY`

The decision is determined using the current asset state, event information, and policy rules.

---

### Deterministic Ordering

Canonical events are processed using deterministic ordering based on event timing and source information, including:

1. `occurredAt`
2. `receivedAt`
3. source-system priority
4. source row
5. `eventId`

This supports repeatable execution and reproducible outputs.

---

### Traceability Preservation

Records retain references to their originating raw records and source information.

Canonical events, validation errors, reconciliation decisions, exception cases, webhook dispatches, and generated reports retain sufficient identifiers to support investigation and audit.

---

### Policy Trust

The policy file is treated as trusted configuration input.

The system evaluates operational records against the policy but does not assume that business policy itself is free from configuration mistakes.

Policy versions can be compared so that differences between policy configurations and resulting decision outcomes can be identified.

---

## Persistence Assumptions

### Reconciliation Run

Each execution is represented by a reconciliation run containing information such as:

- Run ID
- Policy version
- Input hash
- Start time
- Completion time
- Status
- Notes

The run provides the execution boundary for persisted processing results.

---

### SQLite Persistence

SQLite is used as the persistence store for the current implementation.

The schema is initialized when the application starts.

Persisted information includes:

- Reconciliation runs
- Raw records
- Canonical events
- Event decisions
- Asset states
- Exception cases
- Report artifacts
- Webhook configurations
- Webhook dispatches
- API usage records

---

### Report Registry

Generated reports are assumed to be associated with the reconciliation run that produced them.

The `report_artifacts` table records report name, path, format, creation time, and optional hash information.

---

## Exception Assumptions

### Exception Cases

Reconciliation outcomes that require investigation or exception handling may be converted into persisted exception cases.

Exception cases are assumed to remain auditable throughout their lifecycle.

---

### Manual Resolution

Manual exception resolution requires resolution information and an authorized actor role.

A successful resolution records:

- Resolver
- Actor role
- Resolution
- Resolution timestamp
- Updated exception status

Manual resolution is therefore treated as an auditable state change rather than simply removing an exception from the queue.

---

### Automated Resolution

Automated resolution is policy-driven.

An exception is automatically resolved only when the configured policy conditions permit the action.

Exceptions that do not satisfy the automation rules remain available for manual review.

---

## API Assumptions

### API Input

The REST API accepts JSON requests.

The event ingestion endpoint supports:

- A single event object
- A batch containing an `events` array

An empty event batch is rejected.

---

### API Idempotency

Event ingestion requires an `Idempotency-Key`.

Repeated submission with the same idempotency key is treated as a duplicate request rather than processing the same event again.

This assumption protects the reconciliation pipeline from accidental repeated submissions.

---

### API Usage Logging

API requests are recorded for operational visibility.

The logged information includes:

- Request ID
- HTTP method
- Endpoint
- Status code
- Response time
- Creation timestamp

These records are used to generate the API usage summary.

---

## Webhook Assumptions

### Webhook Configuration

Webhook destinations are configured through the API.

Configurations may specify event-type and severity filters.

Only active configurations matching the relevant reconciliation outcome are considered for dispatch.

---

### Webhook Delivery

Webhook dispatches are persisted with their payload and delivery information.

A failed delivery does not silently disappear; its attempt and response information are retained for auditability.

---

### Webhook Retry

Failed webhook deliveries may be retried according to the implemented retry behavior.

Each retry is recorded as a separate dispatch attempt so the delivery history can be reconstructed.

---

## Output Assumptions

Generated reports are written to:

```text
outputs/latest/
```

The output directory represents the latest generated reporting view, while the database preserves the associated run and report-artifact records.

The system assumes the configured output directory is writable.

---

## Dataset and Reconciliation Scope

The current dataset is intentionally designed to exercise the later reconciliation capabilities.

The current run contains:

- 55 inventory records
- 250 event records
- Multiple event types
- Multiple actor roles
- Multiple source systems
- Normal and abnormal operational scenarios
- Exception cases
- Automated-resolution scenarios
- Manual-correction scenarios
- Webhook scenarios

The intentional abnormal records are necessary for demonstrating validation, exception handling, policy decisions, automation, and reporting.

---

## Testing Assumptions

Automated tests use controlled fixtures and database initialization appropriate to the test environment.

Tests may use an isolated in-memory SQLite database where configured by the application environment.

API tests use the Express application directly and can use Supertest without requiring a separately running production API process.

Integration tests exercise multiple components together to verify end-to-end behavior.

---

## Future Assumptions

Future packets may introduce additional:

- Source systems
- Event types
- Reconciliation rules
- Authorization rules
- Cross-system consistency checks
- API capabilities
- Operational integrations
- Reporting requirements

New functionality should extend the existing raw-record, canonical-event, decision, exception, persistence, and reporting models where possible rather than replacing them.

When a new requirement conflicts with an existing assumption, the assumption should be updated explicitly and the affected implementation and tests should be reviewed.
