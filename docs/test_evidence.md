# Test Evidence

## Overview

The Reconciliation Intelligence System is supported by an automated Jest test suite covering validation, reconciliation, policy evaluation, persistence, API behavior, integration, exports, webhooks, automated resolution, and regression behavior.

The final clean test execution should be retained as the authoritative evidence for submission.

---

## Test Execution

Run the complete test suite with:

```bash
npm test
```

The final verified execution completed with:

```text
Test Suites: 60 passed, 60 total
Tests:       127 passed, 127 total
Snapshots:   0 total
```

The previously failing late-return regression was corrected and the test suite subsequently passes.

---

## API Test Execution

The API test suite can be run with:

```bash
npm test -- --runInBand tests/api
```

Verified API coverage includes:

- Assets
- Events
- Event validation
- Exception resolution
- Exceptions
- Run details
- Runs
- API server health
- Webhook retry behavior

The API suite was verified with:

```text
Test Suites: 9 passed, 9 total
Tests:       23 passed, 23 total
```

The event API tests verify:

- Single-event ingestion
- Batch-event ingestion
- Empty-batch rejection
- Idempotent duplicate handling

The exception-resolution tests verify:

- Successful resolution
- Missing resolution information returns `400`
- Unknown exception case returns `404`

---

## Validation

Tests cover validation of:

- Required event fields
- Invalid timestamps
- Invalid received timestamps
- Unknown event types
- Unknown assets
- Invalid conditions
- Duplicate event identifiers
- Missing actor roles
- Invalid reservation records
- Invalid audit observations
- Invalid manual correction records
- Late-arriving events

Validation issues are classified as errors or warnings according to the validation rules.

---

## Reconciliation

Tests cover:

- Valid state transitions
- Illegal state transitions
- Holder validation
- Location validation
- Condition handling
- Checkout rules
- Maintenance transitions
- Transfers
- Returns
- Retirements
- Warning decisions
- Review-required decisions
- Rejected events
- Ledger mutation rules

Rejected events must not modify the authoritative asset state.

Late-return behavior is also covered. Returns within the configured grace period produce the expected warning/auto-resolution behavior, while returns beyond the grace period remain reviewable rather than being incorrectly auto-resolved.

---

## Deterministic Replay

Tests verify that events are processed using deterministic ordering.

The ordering considers:

1. `occurredAt`
2. `receivedAt`
3. source-system priority
4. source row
5. `eventId`

This ensures that equivalent source data produces reproducible reconciliation results.

---

## Exception Management

Tests cover generation and persistence of reviewable exception cases for:

- Rejected events
- Policy violations
- Unknown assets
- Unauthorized actions
- Holder mismatches
- Audit discrepancies
- Reservation conflicts
- Manual correction failures
- Late returns beyond the configured grace period

Exception cases retain their identifiers, reason codes, status, and relevant asset/event references.

---

## Exception Resolution

Manual exception resolution is exposed through:

```text
POST /api/v1/exceptions/:caseId/resolve
```

Tests verify that a successful resolution records:

- Exception case ID
- `RESOLVED` status
- Resolver identity
- Resolution text
- Resolution timestamp

Validation of resolution information is also tested.

---

## Automated Resolution

The project includes policy-driven automated exception resolution.

Tests and integration scenarios verify that eligible exceptions can be automatically resolved according to configured rules while exceptions outside those rules remain available for review.

The generated output is:

```text
outputs/latest/auto_resolution_summary.csv
```

---

## Audit Reconciliation

Tests verify that audit observations are compared against reconciled asset states.

The audit reconciliation process checks:

- Status
- Condition
- Location

Tests also cover:

- Matching observations
- State discrepancies
- Unknown assets
- Historical state handling

---

## Reservation Reconciliation

Tests cover reservation processing including:

- Valid reservations
- Unknown assets
- Conflicts with asset state
- Maintenance conflicts
- In-transit conflicts
- Retired assets
- Cancelled reservations

---

## Manual Corrections

Tests cover:

- Authorized corrections
- Unauthorized corrections
- Missing evidence
- Invalid correction requests
- Accepted correction decisions
- Review-required correction decisions

The generated manual correction audit is:

```text
outputs/latest/manual_correction_audit.csv
```

The current generated evidence contains both authorized and unauthorized correction scenarios.

---

## Policy Version Testing

The project contains multiple policy versions and supports comparison of their effects on the same operational dataset.

Current real-data comparison evidence:

```text
Policy v1: 1.0.0
Policy v2: 2.0.0
Input events: 250
Total policy differences: 175
Changed reconciliation outcomes: 125
```

The comparison output is:

```text
outputs/latest/policy_decision_difference.csv
```

This demonstrates that policy-version changes can materially affect reconciliation outcomes.

---

## Persistence Testing

SQLite persistence tests verify that reconciliation runs and their evidence are stored correctly.

Persistence coverage includes:

- Reconciliation run creation
- Run completion
- Policy version persistence
- Input hash persistence
- Raw record persistence
- Canonical event persistence
- Event decision persistence
- Asset state persistence
- Exception persistence
- Report artifact persistence
- Foreign-key relationships
- Run isolation

The current schema also persists:

- Webhook configurations
- Webhook dispatches
- API usage records

---

## API Usage Logging

API requests are persisted for operational visibility.

Verified API usage evidence includes:

```text
GET /health
Status: 200
Response time: 8.33 ms
```

The generated summary is:

```text
outputs/latest/api_usage_summary.md
```

The summary reports:

- Total requests
- Total errors
- Error rate
- Average response time
- Endpoint statistics

---

## Webhook Testing

Webhook tests cover webhook configuration and retry behavior.

The system persists webhook dispatch information including:

- Dispatch ID
- Webhook ID
- Run ID
- Event ID
- Exception case ID
- Attempt number
- Status
- Payload
- Response code
- Response body

The generated dispatch evidence is:

```text
outputs/latest/webhook_dispatch_log.csv
```

---

## Integration Testing

Integration tests exercise multiple stages of the reconciliation pipeline together.

Current integration coverage includes:

```text
tests/integration/packet01Pipeline.test.js
tests/integration/packet04ApiWebhookAutoResolution.test.js
tests/integration/packet34Pipeline.test.js
```

These tests verify interactions between ingestion, validation, canonicalization, deterministic processing, reconciliation, exception handling, API/webhook behavior, automated resolution, persistence, and reporting.

---

## Export Testing

The generated reporting artifacts include:

- `canonical_events.csv`
- `event_decisions.csv`
- `exception_queue.csv`
- `final_asset_state.csv`
- `asset_state_report.csv`
- `validation_errors.csv`
- `raw_record_index.csv`
- `reservation_report.csv`
- `manual_correction_audit.csv`
- `source_conflict_report.csv`
- `policy_breach_summary.csv`
- `policy_decision_difference.csv`
- `auto_resolution_summary.csv`
- `webhook_dispatch_log.csv`
- `api_usage_summary.md`
- `data_profile.md`
- `ingestion_summary.md`
- `run_summary.md`
- `database_snapshot_notes.md`

---

## Current Full-Pipeline Evidence

The latest verified reconciliation run produced:

```text
Inventory records loaded: 55
Event records loaded: 250
Policy version loaded: 2.0.0

Canonical events persisted: 245
Event decisions persisted: 245
Final asset states persisted: 55
Exception cases exported: 178
Auto-resolutions exported: 20
Webhook dispatch records exported: 13
API usage records exported: 1
```

Reconciliation decision summary:

```text
Processed: 245
Accepted: 120
Accepted With Warning: 21
Rejected: 86
Review Required: 27
Warning Only: 12
```

Validation summary:

```text
Errors: 6
Warnings: 3
Validation errors exported: 9
```

These figures demonstrate that the system is processing both normal and intentionally anomalous scenarios through the complete pipeline.

---

## Reproducible Output Testing

The project includes a regression test:

```text
tests/regression/reproducible_outputs.test.js
```

The test executes the reconciliation pipeline twice and compares SHA-256 hashes of deterministic output files.

The deterministic files checked are:

```text
outputs/latest/canonical_events.csv
outputs/latest/event_decisions.csv
outputs/latest/exception_queue.csv
outputs/latest/final_asset_state.csv
```

Run-specific metadata reports are excluded because values such as Run ID and execution timestamps naturally change between runs.

The purpose of this test is to verify that deterministic reconciliation results remain stable across repeated executions.

---

## Report Artifact Registration

Generated reports are registered against the reconciliation run in the SQLite `report_artifacts` table.

The latest verified run contains 19 registered report artifacts, including:

- Core reconciliation reports
- Exception and audit reports
- Policy comparison reports
- Automated-resolution reports
- Webhook dispatch logs
- API usage summary

This provides a database-level link between a reconciliation run and the evidence it generated.

---

## Expected Final Test Result

Before submission, run:

```bash
npm test
```

The required state is:

```text
All test suites passing
All tests passing
No failing tests
```

The exact totals should be confirmed from the final clean execution immediately before submission.

---

## Evidence Files

The primary generated evidence is stored under:

```text
outputs/latest/
```

Important submission evidence includes:

```text
outputs/latest/canonical_events.csv
outputs/latest/event_decisions.csv
outputs/latest/exception_queue.csv
outputs/latest/final_asset_state.csv
outputs/latest/validation_errors.csv
outputs/latest/reservation_report.csv
outputs/latest/manual_correction_audit.csv
outputs/latest/source_conflict_report.csv
outputs/latest/policy_breach_summary.csv
outputs/latest/policy_decision_difference.csv
outputs/latest/auto_resolution_summary.csv
outputs/latest/webhook_dispatch_log.csv
outputs/latest/api_usage_summary.md
outputs/latest/run_summary.md
outputs/latest/database_snapshot_notes.md
```

---

## Conclusion

The automated test suite provides coverage across the major layers of the Reconciliation Intelligence System.

The final verified state is **60 test suites passing and 127 tests passing**. Coverage includes validation, deterministic replay, policy evaluation, reconciliation, exception handling, manual and automated resolution, audit and reservation reconciliation, SQLite persistence, REST API behavior, idempotency, webhook delivery and retry behavior, API usage logging, integration processing, and reporting.

A clean final execution of `npm test` should be retained as the authoritative test evidence for submission.
