# Architecture Overview

## Purpose

The Reconciliation Intelligence System is a policy-driven asset operations reconciliation platform. It ingests operational asset data, validates data quality, transforms trusted records into a canonical representation, reconciles asset-state transitions, detects exceptions and source discrepancies, supports controlled automated and manual resolution, persists an auditable processing history, exposes operational capabilities through a REST API, and generates traceable output artifacts.

The architecture is designed around traceability, deterministic processing, validation-first design, separation of concerns, auditability, policy-driven behavior, and extensibility for future reconciliation packets.

---

# Processing Pipeline

## Source Files

Primary input datasets include:

- `inventory.csv`
- `events.csv`
- `reservations.csv`
- `audit_observations.csv`
- `manual_corrections.csv`
- `policy.json`

↓

## Ingestion Layer

Responsibilities:

- Load CSV and JSON datasets.
- Verify source files can be processed.
- Convert source records into a common internal representation.
- Preserve source-level information required for traceability.

Components include:

- CSV Loader
- JSON Loader
- Raw Record Builder

↓

## Raw Record Builder

Responsibilities:

- Create `RawRecord` objects.
- Assign unique raw record identifiers.
- Preserve source file references.
- Preserve source row numbers.
- Maintain original payloads.

This layer provides source traceability throughout the processing lifecycle.

↓

## Validation Layer

Responsibilities:

- Verify data quality.
- Enforce policy-driven rules.
- Detect abnormal records.
- Separate blocking validation failures from non-blocking warnings.

Validation checks include:

- Required fields
- Duplicate event IDs
- Invalid timestamps
- Invalid received timestamps
- Unknown event types
- Unknown assets
- Missing actor roles
- Invalid condition values
- Late-arriving events
- Reservation validation
- Audit observation validation
- Manual correction authorization validation

Validation issues are classified as:

- `ERROR`
- `WARNING`

↓

## Validation Result

Records are classified into processing outcomes such as:

### Accepted

Records that satisfy the validation requirements and can proceed through reconciliation.

### Accepted With Warning

Records that remain processable but contain non-blocking policy or data-quality warnings.

### Rejected

Records containing blocking validation or policy failures that prevent normal processing.

### Review Required

Records that require manual investigation or controlled exception handling.

### Warning Only

Records for which a non-blocking warning is recorded without requiring rejection.

↓

## Canonical Mapping

Validated records are transformed into `CanonicalEvent` objects.

The Canonical Event model provides a standardized representation independent of source formats and prepares records for downstream reconciliation logic.

Canonicalization preserves references back to the originating raw record and source information.

↓

## Deterministic Ordering

Canonical events are sorted using deterministic ordering rules based on event timing and source information, including:

1. `occurredAt`
2. `receivedAt`
3. source-system priority
4. source row
5. `eventId`

This supports repeatable execution and reproducible reconciliation outputs.

↓

## Reconciliation Layer

The reconciliation engine evaluates canonical events against:

- Current asset state
- Event type
- Policy definitions
- Actor permissions
- State-transition rules
- Timing rules
- Relevant source observations

The engine produces traceable decisions such as:

- `ACCEPTED`
- `ACCEPTED_WITH_WARNING`
- `REJECTED`
- `REVIEW_REQUIRED`
- `WARNING_ONLY`

Decisions retain information such as:

- Event ID
- Event type
- Asset ID
- Previous state
- Next state
- Decision
- Reason code
- Explanation/message

↓

## Exception Management

Reconciliation decisions that require exception handling are converted into persisted exception cases.

Exception cases retain:

- Case ID
- Run ID
- Asset ID
- Event ID
- Severity
- Reason code
- Status
- Recommended action
- Resolution timestamp
- Resolver
- Resolution information

This creates a durable queue for investigation and resolution.

↓

## Automated Resolution

Eligible exceptions are evaluated against policy-driven automated resolution rules.

The automated-resolution layer:

- Determines whether an exception is eligible for automation.
- Applies only configured policy rules.
- Records successful automated resolutions.
- Leaves cases requiring human review unresolved.

Automated resolution is deliberately separated from general reconciliation so that policy-controlled automation does not bypass the underlying decision and audit trail.

↓

## Manual Resolution

Exceptions that require human intervention can be resolved through the API by authorized actors.

Manual resolution records:

- Resolver identity
- Actor role
- Resolution information
- Resolution timestamp
- Updated exception status

This preserves an auditable history of human intervention.

↓

## Persistence Layer

The system persists reconciliation information in SQLite.

The database includes tables for:

- `reconciliation_runs`
- `raw_records`
- `canonical_events`
- `event_decisions`
- `asset_states`
- `exception_cases`
- `report_artifacts`
- `webhook_configurations`
- `webhook_dispatches`
- `api_usage`

Persistence allows reconciliation runs and operational records to be queried after processing rather than existing only in memory.

↓

## Export Layer

Generated artifacts include:

- `final_asset_state.csv`
- `asset_state_report.csv`
- `event_decisions.csv`
- `exception_queue.csv`
- `canonical_events.csv`
- `raw_record_index.csv`
- `validation_errors.csv`
- `policy_breach_summary.csv`
- `reservation_report.csv`
- `manual_correction_audit.csv`
- `source_conflict_report.csv`
- `policy_decision_difference.csv`
- `auto_resolution_summary.csv`
- `webhook_dispatch_log.csv`
- `api_usage_summary.md`
- `data_profile.md`
- `ingestion_summary.md`
- `run_summary.md`
- `database_snapshot_notes.md`

Generated reports are also registered in `report_artifacts` for the associated reconciliation run.

---

# REST API Layer

The API provides operational access to persisted reconciliation data and controlled processing functions.

## Endpoints

The current API includes:

- `GET /health`
- `GET /api/v1/runs`
- `GET /api/v1/runs/:runId`
- `GET /api/v1/exceptions`
- `POST /api/v1/exceptions/:caseId/resolve`
- `GET /api/v1/assets/:assetId`
- `POST /api/v1/webhooks`
- `POST /api/v1/events`

The event ingestion endpoint supports both single-event and batch requests.

API event ingestion uses an `Idempotency-Key` to prevent the same request from being processed more than once.

---

# API Usage Logging

API requests are recorded in the persistence layer with:

- Request ID
- HTTP method
- Endpoint
- HTTP status code
- Response time
- Creation timestamp

These records are used to generate `api_usage_summary.md`, which reports total requests, errors, error rate, average response time, and endpoint-level statistics.

This provides basic operational observability for the REST API.

---

# Webhook Layer

The webhook subsystem provides integration notifications for selected reconciliation outcomes.

## Webhook Configuration

Webhook configurations contain:

- Webhook ID
- Destination URL
- Event-type filters
- Severity filters
- Active status
- Creation timestamp

## Dispatch

When a qualifying reconciliation decision occurs, the dispatcher creates a persisted webhook dispatch record.

Dispatch records include:

- Dispatch ID
- Webhook ID
- Run ID
- Event ID
- Exception case ID where applicable
- Attempt number
- Status
- Payload
- Response code
- Response body

## Retry Handling

Failed webhook deliveries can be retried according to the configured retry behavior.

Each attempt is retained so that delivery history remains auditable and deterministic reporting can show the outcome of the integration.

---

# Core Domain Objects

## RawRecord

Represents the original source record received by the system.

Responsibilities:

- Preserve source data
- Preserve source file references
- Preserve source row numbers
- Support auditing and traceability

---

## ValidationError

Represents a validation failure or warning.

Responsibilities:

- Store severity classification
- Store reason codes
- Capture source values
- Document expected rules
- Recommend corrective actions

---

## ValidationResult

Stores validation outcomes.

Responsibilities:

- Accepted records
- Rejected records
- Warning records
- Validation errors

---

## CanonicalEvent

Represents a validated business event in a standardized format.

Responsibilities:

- Normalize source records
- Support deterministic processing
- Enable reconciliation workflows
- Maintain traceability to source records

---

## Event Decision

Represents the reconciliation outcome for a canonical event.

Responsibilities:

- Record the decision
- Record the reason code
- Record the previous asset state
- Record the resulting state
- Explain the reconciliation outcome

---

## Exception Case

Represents an operational issue requiring investigation, automation, or resolution.

Responsibilities:

- Preserve the exception reason
- Link the exception to its run, asset, and event
- Track status
- Record recommended action
- Preserve resolution information

---

# Traceability Strategy

Traceability is maintained throughout the processing lifecycle.

Raw records retain:

- Source file
- Source row
- Original payload
- Raw record ID

Canonical events retain references to their source records.

Validation errors retain:

- Raw record ID
- Event ID where applicable
- Source value
- Expected rule

Event decisions retain:

- Event ID
- Asset ID
- State before processing
- State after processing
- Decision
- Reason code

Exception cases retain:

- Run ID
- Asset ID
- Event ID
- Reason code
- Resolution information

Report artifacts are linked to their reconciliation run through the `report_artifacts` table.

Webhook dispatches and API usage records provide additional operational traceability.

This enables:

- Auditability
- Error investigation
- Data lineage tracking
- Source reconstruction
- Decision explanation
- Operational monitoring

---

# Persistence and Run Lifecycle

Each reconciliation execution is represented by a reconciliation run.

The lifecycle is:

1. Create run.
2. Load source data and policy.
3. Persist raw records.
4. Validate and canonicalize events.
5. Reconcile events.
6. Detect discrepancies and exceptions.
7. Apply eligible automated resolutions.
8. Persist decisions, states, and exceptions.
9. Generate reports.
10. Register report artifacts.
11. Complete the run.

The run stores:

- Run ID
- Policy version
- Input hash
- Start time
- Completion time
- Status
- Notes

This provides a durable execution boundary for reproducibility and audit purposes.

---

# Schema Evolution

## Adding a New Source File

The architecture supports additional source systems without replacing the core processing model.

Steps:

1. Create a source contract.
2. Create or extend the appropriate loader.
3. Convert records into `RawRecord` objects.
4. Add source-specific validation where necessary.
5. Reuse canonical mapping and downstream reconciliation components.

The shared raw-record model keeps source-specific ingestion concerns separated from reconciliation logic.

---

## Adding a New Event Type

The architecture supports additional event types through policy-driven configuration.

Steps:

1. Add the event type to the policy definition.
2. Define its allowed states and actor permissions where required.
3. Extend validation or reconciliation rules only when the event has special behavior.
4. Process the event through the existing canonical event and decision models.

The ingestion, deterministic ordering, persistence, and export layers do not need to be replaced for ordinary new event types.

---

## Adding New Operational Integrations

The API and webhook layers provide extension points for additional operational integrations.

New integrations can reuse:

- Persisted reconciliation runs
- Canonical events
- Event decisions
- Exception cases
- Webhook dispatch infrastructure
- Existing API contracts

This keeps integration concerns separate from the core reconciliation engine.

---

# Design Principles

The system is designed around:

- **Traceability**
- **Deterministic processing**
- **Validation-first architecture**
- **Policy-driven behavior**
- **Separation of concerns**
- **Auditability**
- **Controlled automation**
- **Persistence**
- **Idempotency**
- **Extensibility**

These principles allow later reconciliation functionality to be introduced without replacing the foundational data model.
