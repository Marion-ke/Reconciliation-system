# Reconciliation Intelligence System

## Overview

The Reconciliation Intelligence System is a policy-driven asset operations reconciliation platform. It ingests inventory, operational events, reservations, audit observations, and manual correction records; validates and normalizes the data; reconciles asset state transitions; detects exceptions and source discrepancies; applies controlled automated resolutions; persists an auditable processing history; and exposes operational results through a REST API.

The system was developed incrementally across the internship packets and is currently implemented through **Packet 04 — Weeks 7 & 8**, extending the earlier ingestion and reconciliation foundation with persistence, API access, webhook notifications, retry handling, automated resolution, manual exception resolution, policy comparison, and operational reporting.

---

## Current Capabilities

### Data Ingestion

The system supports:

- Inventory CSV loading
- Event CSV loading
- Reservation data loading
- Audit observation loading
- Manual correction loading
- JSON policy loading
- Raw record creation with source traceability

### Validation

Validation covers:

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

Validation results distinguish between errors and warnings and retain reason codes, source values, expected rules, and recommended next actions.

### Canonicalization and Reconciliation

The reconciliation pipeline provides:

- Canonical event generation
- Deterministic event ordering
- State-transition validation
- Policy-driven decision making
- Asset state tracking
- Exception generation
- Review-required decisions
- Warning-only decisions
- Accepted-with-warning decisions
- Source conflict detection
- Audit discrepancy detection

Each decision retains the information required to trace the decision back to the originating event and asset state.

---

## Packet 04 Enhancements

Packet 04 extends the reconciliation foundation with operational and integration capabilities.

### SQLite Persistence

The system persists:

- Reconciliation runs
- Raw records
- Canonical events
- Event decisions
- Final asset states
- Exception cases
- Report artifacts
- Webhook configurations
- Webhook dispatch attempts
- API usage records

The database schema is initialized automatically when the application starts.

### REST API

The API is implemented under `/api/v1` and provides endpoints for:

- Reconciliation run listing
- Reconciliation run details
- Exception listing
- Exception resolution
- Asset event history
- Webhook registration
- Event ingestion

A health endpoint is also available at:

```text
GET /health
```

The event ingestion endpoint supports both single-event and batch requests and requires an `Idempotency-Key` to prevent duplicate processing.

### Exception Management

Exception cases are persisted with:

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

Manual resolution is restricted to authorized actors and is recorded for auditability.

### Automated Resolution

Policy-driven automated resolution is supported for eligible exception cases.

The system records:

- Which exception was evaluated
- Whether it was automatically resolved
- The applied rule
- The resulting resolution
- The associated asset and event

Automated resolution does not replace exceptions that require manual review.

### Webhooks

The system supports configurable webhook notifications for reconciliation outcomes.

Webhook functionality includes:

- Webhook registration
- Event-type filtering
- Severity filtering
- Dispatch persistence
- Response-code recording
- Response-body recording
- Retry handling
- Dispatch attempt tracking

Failed webhook deliveries can be retried and each attempt remains auditable.

### API Usage Monitoring

API requests are persisted with:

- Request ID
- HTTP method
- Endpoint
- Status code
- Response time
- Creation timestamp

The system generates an API usage summary containing:

- Total requests
- Total errors
- Error rate
- Average response time
- Per-endpoint statistics

---

## Current Dataset

The current sample dataset is designed for the later reconciliation packets and contains:

- 55 inventory records
- 250 event records
- Multiple asset types
- Multiple actor roles
- Multiple source systems
- Normal operational events
- Invalid records
- Late-arriving events
- Unknown assets
- Invalid conditions
- Unsupported event types
- Manual correction scenarios
- Webhook acknowledgement events
- Automated-resolution events
- Late-return review scenarios

The intentional abnormal records are used to exercise validation, exception handling, policy decisions, and reconciliation behavior.

---

## Generated Outputs

The current pipeline generates operational reports in:

```text
outputs/latest/
```

Key outputs include:

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

Report artifacts are also registered in the persistence layer for the corresponding reconciliation run.

---

## Project Structure

```text
src/
├── api/
├── contracts/
├── domain/
├── exporters/
├── ingestion/
├── normalization/
├── persistence/
├── profiling/
├── reconciliation/
├── validation/
├── run.js
└── index.js

tests/
├── api/
├── integration/
├── reconciliation/
└── ...

data/
├── policy/
└── sample/

outputs/
└── latest/

docs/
├── architecture.md
├── assumptions.md
├── state_transition_table.md
├── test_evidence.md
├── test_evidence_updated.md
├── policy_comparison_notes.md
├── database_snapshot_notes.md
└── ASSISTANCE_DISCLOSURE.md
```

---

## Installation

Install dependencies with:

```bash
npm install
```

---

## Running the Reconciliation Pipeline

Execute:

```bash
npm start
```

The application:

1. Initializes the SQLite database.
2. Creates a reconciliation run.
3. Loads source datasets and policy configuration.
4. Validates raw records.
5. Generates canonical events.
6. Reconciles asset state transitions.
7. Detects discrepancies and exceptions.
8. Applies eligible automated resolutions.
9. Persists reconciliation results.
10. Generates operational reports.
11. Registers generated report artifacts.
12. Completes the reconciliation run.

Generated reports are written to:

```text
outputs/latest/
```

---

## Running the API

Start the API with:

```bash
node src/startApi.js
```

The API listens on port `3000` by default.

Health check:

```text
GET http://localhost:3000/health
```

---

## Running Tests

Run the complete test suite with:

```bash
npm test
```

API tests can be run with:

```bash
npm test -- --runInBand tests/api
```

Individual test files can also be executed when debugging a specific capability.

The test suite covers areas including:

- Validation
- Canonicalization
- Deterministic ordering
- State transitions
- Reconciliation decisions
- Exception handling
- API endpoints
- API idempotency
- Manual exception resolution
- Webhook dispatch
- Webhook retry handling
- Automated resolution
- Persistence
- Integration pipelines
- Report generation

---

## Design Principles

The system is designed around:

- **Traceability** — processing decisions can be traced to source records, events, assets, and runs.
- **Determinism** — ordering and generated outputs are reproducible.
- **Validation-first processing** — invalid records are identified before downstream reconciliation.
- **Policy-driven behavior** — event handling and automated actions are controlled by policy configuration.
- **Auditability** — reconciliation runs, exceptions, resolutions, webhook attempts, and API usage are persisted.
- **Separation of concerns** — ingestion, validation, normalization, reconciliation, persistence, API access, and exporting remain separate components.
- **Controlled automation** — automated resolution is applied only when policy conditions permit it.
- **Extensibility** — the architecture supports additional reconciliation packets and operational capabilities without replacing the underlying data model.

---

## Documentation

Additional project documentation is available in:

```text
docs/
```

Important documents include:

- `docs/architecture.md`
- `docs/assumptions.md`
- `docs/state_transition_table.md`
- `docs/test_evidence_updated.md`
- `docs/policy_comparison_notes.md`
- `docs/database_snapshot_notes.md`
- `docs/ASSISTANCE_DISCLOSURE.md`
