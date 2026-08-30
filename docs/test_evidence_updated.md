# Test Evidence

## Overview

The Reconciliation Intelligence System is supported by an automated Jest test suite covering the validation, reconciliation, policy, persistence, integration, export, and regression layers.

The test suite is designed to verify both individual business rules and the behaviour of the complete reconciliation pipeline.

---

## Test Execution

Run the complete test suite with:

```bash
npm test
```

The final test run should be used as the authoritative evidence for the number of passing tests and test suites.

---

## Test Coverage Areas

### Validation

Tests cover validation of:

- Required event fields
- Invalid timestamps
- Invalid received timestamps
- Unknown event types
- Unknown assets
- Invalid conditions
- Duplicate event identifiers
- Invalid reservation records
- Invalid audit observations
- Invalid manual correction records

---

### Reconciliation

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

---

### Deterministic Replay

Tests verify that events are replayed using deterministic ordering.

The ordering considers:

1. `occurred_at`
2. `received_at`
3. source priority
4. source row
5. `event_id`

This ensures that the same source data produces the same deterministic reconciliation results.

---

### Exception Management

Tests cover generation of reviewable exception cases for:

- Rejected events
- Policy violations
- Unknown assets
- Unauthorized actions
- Holder mismatches
- Audit discrepancies
- Reservation conflicts
- Manual correction failures

---

### Audit Reconciliation

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

### Reservation Reconciliation

Tests cover reservation processing including:

- Valid reservations
- Unknown assets
- Conflicts with asset state
- Maintenance conflicts
- In-transit conflicts
- Retired assets
- Cancelled reservations

---

### Manual Corrections

Tests cover:

- Authorized corrections
- Unauthorized corrections
- Missing evidence
- Invalid correction requests
- Accepted correction decisions
- Review-required correction decisions

---

## Policy Version Testing

The project contains multiple policy versions.

The policy comparison tests verify that the same input inventory and event dataset can be evaluated against different policy versions.

Current real-data comparison evidence:

```text
Policy v1: 1.0.0
Policy v2: 2.0.0
Input events: 150
Total policy differences: 89
Changed reconciliation outcomes: 58
```

This demonstrates that policy version changes can materially affect reconciliation outcomes.

The comparison output is generated as:

```text
outputs/latest/policy_decision_difference.csv
```

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

The persistence model links generated evidence to a specific reconciliation run.

---

## Integration Testing

Integration tests exercise multiple stages of the reconciliation pipeline together.

These tests verify that:

- Source records are ingested
- Records are validated
- Events are canonicalized
- Events are deterministically ordered
- Reconciliation decisions are produced
- Asset states are updated correctly
- Exceptions are generated
- Reports are exported
- Persistence records are created

---

## Export Testing

The exporter tests verify generation of the project's report artifacts, including:

- Canonical events
- Event decisions
- Exception queue
- Final asset state
- Asset state report
- Validation errors
- Raw record index
- Reservation report
- Manual correction audit
- Source conflict report
- Policy breach summary
- Policy decision difference
- Data profile
- Ingestion summary
- Run summary
- Database snapshot notes

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

The run-specific `run_summary.md` is intentionally excluded because it contains metadata that changes between executions, including:

- Run ID
- Start time
- Completion time

The purpose of this test is to verify that reconciliation results and deterministic exports remain stable across repeated executions.

---

## Policy Comparison Regression

The policy comparison tests verify both:

1. Comparison using controlled test input.
2. Comparison using the project's real dataset.

The real-data comparison confirms that policy version changes produce measurable differences rather than merely different version labels.

Current evidence:

```text
Policy v1: 1.0.0
Policy v2: 2.0.0
Input events: 150
Changed outcomes: 58
Total differences: 89
```

---

## Expected Final Test Result

The final test command is:

```bash
npm test
```

The expected final state for submission is:

```text
All test suites passing
All tests passing
No failing tests
```

The exact number of suites and tests should be taken from the final clean execution rather than manually maintained in this document.

---

## Evidence Files

The generated reports provide additional evidence of system behaviour:

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
outputs/latest/run_summary.md
outputs/latest/database_snapshot_notes.md
```

---

## Conclusion

The test suite provides coverage across the major layers of the Reconciliation Intelligence System.

The tests verify not only individual functions but also the integration between ingestion, validation, normalization, deterministic replay, policy evaluation, reconciliation, exception handling, reporting, and persistence.

A clean final execution of `npm test` is required before submission and should be retained as the authoritative final test evidence.
