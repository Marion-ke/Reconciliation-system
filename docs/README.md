# Reconciliation Intelligence System

## Overview

The Reconciliation Intelligence System is a deterministic event-processing engine developed during the internship project.

The system ingests an inventory baseline and operational event history, validates and normalizes incoming records, replays events deterministically, applies policy-driven business rules, and produces an auditable final asset ledger together with decision logs, exception reports, policy comparison evidence, and management summaries.

The system also processes reservation records, audit observations, and manual correction requests as additional reconciliation inputs.

The primary design goal is to ensure that every material state change is traceable, explainable, and reproducible.

---

# Objectives

The system is designed to:

- Load inventory and operational event datasets
- Validate and normalize operational records
- Process canonical events deterministically
- Enforce a policy-driven state machine
- Prevent invalid events from corrupting the ledger
- Record reconciliation decisions for every event
- Produce a complete final asset state
- Detect audit discrepancies
- Detect reservation conflicts
- Evaluate manual correction requests
- Generate management-readable reports
- Generate exception queues for manual review
- Persist reconciliation evidence in SQLite
- Compare policy versions against the same input data
- Produce repeatable deterministic outputs across multiple runs

---

# Architecture

The reconciliation pipeline consists of the following stages:

1. CSV Ingestion
2. Raw Record Construction
3. Validation
4. Canonical Mapping
5. Replay Ordering
6. Late Event Detection
7. Reconciliation Engine
8. Audit Reconciliation
9. Reservation Reconciliation
10. Manual Correction Evaluation
11. Exception Queue Generation
12. Report Generation
13. SQLite Persistence

Each stage produces structured outputs that are consumed by the next stage, supporting traceable and reproducible reconciliation results.

---

# Project Structure

```text
src/

├── contracts/
├── domain/
├── exporters/
├── ingestion/
├── normalization/
├── persistence/
├── policy/
├── reconciliation/
├── validation/
├── index.js
└── run.js

tests/

├── integration/
├── reconciliation/
├── policy/
├── persistence/
└── regression/

data/

├── sample/
└── policy/

outputs/

└── latest/
```

---

# Core Features

## Deterministic Event Ordering

Canonical events are replayed using deterministic ordering based on:

1. occurred_at
2. received_at
3. source priority
4. source row
5. event_id

This ordering ensures that identical input datasets produce identical reconciliation behaviour and deterministic output content across repeated executions.

Run-specific metadata such as Run ID and execution timestamps is intentionally unique to each reconciliation run.

---

## Policy-Driven Reconciliation

Business rules are externalised in policy files rather than being hard-coded into the reconciliation engine.

The project contains multiple policy versions:

- `data/policy/policy-v1.json`
- `data/policy/policy-v2.json`

The policy comparison mechanism evaluates the same inventory and event dataset against both versions and records differences in reconciliation outcomes.

The current policy includes:

- Actor permissions
- Event definitions
- Asset conditions
- Checkout limits
- Legal transitions
- Condition ranking

---

## Policy Version Comparison

The system supports backward comparison of policy versions using the same input data.

The current real-data comparison records:

- Policy v1: `1.0.0`
- Policy v2: `2.0.0`
- Input events: `150`
- Total policy differences: `89`
- Changed reconciliation outcomes: `58`

The comparison output is generated as:

```text
outputs/latest/policy_decision_difference.csv
```

The run records the active policy version so that decisions remain associated with the policy used during that reconciliation run.

---

# Reproducibility

The system includes an automated regression test that executes the complete reconciliation pipeline twice and compares SHA-256 hashes of deterministic generated output files.

The reproducibility test covers:

- `canonical_events.csv`
- `event_decisions.csv`
- `exception_queue.csv`
- `final_asset_state.csv`

Run-specific `run_summary.md` is excluded from byte-for-byte comparison because it contains intentionally changing metadata such as Run ID and execution timestamps.

This verifies that:

- deterministic replay ordering is preserved;
- policy-driven processing remains stable;
- reconciliation decisions remain reproducible;
- deterministic exported outputs remain unchanged across repeated executions.

---

# State Machine

The reconciliation engine implements an explicit state machine.

Supported event types include:

- CHECKOUT
- RETURN
- MAINTENANCE_OPEN
- MAINTENANCE_CLOSE
- TRANSFER_OUT
- TRANSFER_IN
- AUDIT_OBSERVATION
- RETIRE

Additional operational records are processed for:

- RESERVE
- CANCEL_RESERVATION
- MANUAL_CORRECTION

Illegal transitions are rejected and do not modify the authoritative ledger.

---

# Decision Taxonomy

Every canonical event receives one reconciliation decision.

Supported decision types:

- ACCEPTED
- ACCEPTED_WITH_WARNING
- REJECTED
- WARNING_ONLY
- REVIEW_REQUIRED

Each decision can record:

- Event ID
- Event Type
- Asset ID
- Previous State
- Next State
- Reason Code
- Message
- Raw Record Reference
- Policy Version

---

# Exception Management

Events and reconciliation records requiring human attention are exported into an exception queue.

Examples include:

- Illegal state transitions
- Unauthorized actions
- Holder mismatches
- Audit discrepancies
- Unknown assets
- Policy violations
- Reservation conflicts
- Manual correction failures

Each exception can include:

- Case ID
- Severity
- Reason Code
- Asset
- Event or source record
- Recommended Next Action
- Grouping Key

---

# Audit Reconciliation

Audit observations are compared against the reconciled asset state.

The audit reconciliation process checks:

- Status
- Condition
- Location

When an observation conflicts with the reconciled state, an audit discrepancy is recorded with a reason code, severity, differences, and explanatory message.

The resulting source conflict report is generated as:

```text
outputs/latest/source_conflict_report.csv
```

---

# Reservation Reconciliation

Reservation records are evaluated against the current reconciled asset state.

The system handles:

- Unknown assets
- Conflicts with checked-out assets
- Reservations involving maintenance assets
- Reservations involving in-transit assets
- Reservations involving retired assets
- Cancelled reservations

The resulting reservation report is generated as:

```text
outputs/latest/reservation_report.csv
```

---

# Manual Corrections

Manual correction requests are evaluated using authorization and evidence requirements.

Authorized roles are restricted according to the manual correction policy.

A correction must provide the required evidence before it can be accepted with warning.

Manual correction outcomes are exported as:

```text
outputs/latest/manual_correction_audit.csv
```

---

# SQLite Persistence

The system persists reconciliation evidence in SQLite.

The database contains run-linked records for:

- `reconciliation_runs`
- `raw_records`
- `canonical_events`
- `event_decisions`
- `asset_states`
- `exception_cases`
- `report_artifacts`

Each reconciliation run records identifying metadata including:

- Run ID
- Policy Version
- Input Hash
- Start Time
- Completion Time
- Run Status

This provides backward traceability from a completed run to its source evidence, decisions, final states, exceptions, and generated reports.

The database snapshot documentation is generated as:

```text
outputs/latest/database_snapshot_notes.md
```

---

# Generated Outputs

Running the system produces the following outputs:

```text
outputs/latest/

canonical_events.csv
event_decisions.csv
exception_queue.csv
final_asset_state.csv
asset_state_report.csv
validation_errors.csv
raw_record_index.csv
reservation_report.csv
manual_correction_audit.csv
source_conflict_report.csv
policy_breach_summary.csv
policy_decision_difference.csv
run_summary.md
database_snapshot_notes.md
data_profile.md
ingestion_summary.md
```

---

# Dataset

The current dataset contains:

- 25 inventory assets
- 150 operational events
- 145 canonical events after validation/reconciliation processing
- 30 reservation records
- 20 audit observations
- 12 manual correction records
- Multiple multi-step asset histories
- Late-arriving events
- Duplicate events
- Illegal transitions
- Audit discrepancies
- Unauthorized actions
- Holder mismatches
- Unknown assets
- Condition downgrade scenarios
- Reservation conflicts
- Manual correction cases

The generated run currently produces:

- 145 processed reconciliation decisions
- 78 accepted events
- 1 accepted-with-warning event
- 53 rejected events
- 12 review-required events
- 2 warning-only events
- 100 exception cases
- 20 audit discrepancies

---

# Running the Project

Install dependencies:

```bash
npm install
```

Run the reconciliation engine:

```bash
npm run start
```

Run the automated test suite:

```bash
npm test
```

---

# Requirements Traceability

| Requirement | Implementation |
|---|---|
| Validation | `src/validation/` |
| Canonical Mapping | `src/normalization/` |
| Replay Ordering | `src/reconciliation/replayOrdering.js` |
| Late Event Detection | `src/reconciliation/lateEventDetector.js` |
| Policy Engine | `src/policy/` and `data/policy/` |
| State Machine | `src/reconciliation/stateMachine.js` |
| Reconciliation Engine | `src/reconciliation/reconciliationEngine.js` |
| Audit Reconciliation | `src/reconciliation/auditReconciliation.js` |
| Reservation Reconciliation | `src/reconciliation/reservationReconciliation.js` |
| Manual Corrections | `src/reconciliation/manualCorrectionDecision.js` |
| Exception Queue | `src/reconciliation/exceptionQueue.js` |
| SQLite Persistence | `src/persistence/` |
| Exporters | `src/exporters/` |
| Policy Comparison | `src/reconciliation/policyComparison.js` |
| Deterministic Outputs | `tests/regression/reproducible_outputs.test.js` |

---

# Traceability

Every asset state in the final ledger can be traced through:

1. The source inventory record
2. Source operational events
3. The canonical event record
4. The reconciliation decision
5. Any related exception
6. The resulting record in `final_asset_state.csv`
7. The corresponding persisted records in SQLite

Rejected and review-required events do not mutate the authoritative ledger unless explicitly permitted by the reconciliation logic.

Each reconciliation run is also associated with the policy version and input hash used during processing.

---

# Test Coverage

The project contains automated tests covering the reconciliation, policy, persistence, integration, and regression layers.

Current test coverage includes:

- State transitions
- Deterministic ordering
- Replay ordering
- Late-event handling
- Policy rules
- Policy version comparison
- Checkout limits
- Condition ranking
- Duplicate event handling
- Holder mismatch
- Unknown assets
- Invalid timestamps
- Idempotent replay
- Integration pipeline
- Export generation
- Audit reconciliation
- Reservation reconciliation
- Manual correction evaluation
- SQLite persistence
- Run isolation
- Foreign-key relationships
- Reproducible outputs

Run the complete suite with:

```bash
npm test
```

---

# Design Principles

The system follows several core principles:

- Deterministic replay
- Explicit state machine
- Policy-driven decisions
- Traceability
- No mutation on rejected events
- Repeatable deterministic outputs
- Human-reviewable exceptions
- Run-level persistence
- Policy-version traceability

---

# Known Limitations

Current implementation is command-line based.

The project currently:

- Processes a single reconciliation batch at a time
- Does not include a graphical user interface
- Does not implement distributed or concurrent processing
- Uses idempotent SQLite schema initialization rather than a separate versioned migration framework

These limitations are acceptable for the current project scope.

---

# Outputs

The reconciliation process produces:

- Final asset ledger
- Decision log
- Exception queue
- Validation report
- Data profile
- Ingestion summary
- Run summary
- Reservation report
- Manual correction audit
- Source conflict report
- Asset state report
- Policy breach summary
- Policy decision difference report
- Database snapshot notes

These outputs provide traceability from source records through canonical events and reconciliation decisions to the final authoritative asset ledger.

---

# Requirements

- Node.js 22+
- npm
