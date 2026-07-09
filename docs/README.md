# Reconciliation Intelligence System

## Overview

The Reconciliation Intelligence System is a deterministic event-processing engine developed during Weeks 3–4 of the internship project.

The system ingests an inventory baseline and operational event history, validates and normalizes incoming records, replays events deterministically, applies policy-driven business rules, and produces an auditable final asset ledger together with decision logs, exception reports, and management summaries.

The primary design goal is to ensure that every material state change is traceable, explainable, and reproducible.

---

# Objectives

The system is designed to:

- Load inventory and event datasets
- Validate and normalize operational records
- Process canonical events deterministically
- Enforce a policy-driven state machine
- Prevent invalid events from corrupting the ledger
- Record reconciliation decisions for every event
- Produce a complete final asset state
- Generate management-readable reports
- Generate exception queues for manual review
- Produce repeatable outputs across multiple runs

---

# Project Structure

```
src/
│
├── contracts/
├── domain/
├── exporters/
├── ingestion/
├── normalization/
├── policy/
├── reconciliation/
├── validation/
└── index.js

tests/
├── integration/
├── reconciliation/
├── policy/
└── fixtures/

data/
├── inventory.csv
├── events.csv
└── policy.json

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

This guarantees identical replay behaviour across repeated executions.

---

## Policy-Driven Reconciliation

Business rules are read from the policy configuration rather than being hard-coded.

Current policy includes:

- Actor permissions
- Event definitions
- Asset conditions
- Checkout limits
- Legal transitions
- Condition ranking

---

## State Machine

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

Illegal transitions are rejected and do not modify the authoritative ledger.

---

## Decision Taxonomy

Every canonical event receives one reconciliation decision.

Supported decision types:

- ACCEPTED
- ACCEPTED_WITH_WARNING
- REJECTED
- WARNING_ONLY
- REVIEW_REQUIRED

Each decision records:

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

## Exception Management

Events requiring human attention are exported into an exception queue.

Examples include:

- Illegal state transitions
- Unauthorized actions
- Holder mismatches
- Audit discrepancies
- Unknown assets
- Policy violations

Each exception includes:

- Case ID
- Severity
- Reason Code
- Asset
- Event
- Recommended Next Action
- Grouping Key

---

## Generated Outputs

Running the system produces:

```
outputs/latest/

canonical_events.csv
event_decisions.csv
exception_queue.csv
final_asset_state.csv
validation_errors.csv
run_summary.md
data_profile.md
ingestion_summary.md
```

---

# Dataset

Current dataset contains:

- 25 inventory assets
- 100 operational events
- 95 canonical events after validation
- Multiple multi-step asset histories
- Late-arriving events
- Duplicate events
- Illegal transitions
- Audit discrepancies
- Unauthorized actions
- Holder mismatches
- Unknown assets
- Condition downgrade scenarios

---

# Running the Project

Install dependencies

```bash
npm install
```

Run the reconciliation engine

```bash
npm run start
```

Run automated tests

```bash
npm test
```

---

## Traceability

Every asset state in the final ledger can be traced back through:

1. The source event in `events.csv`
2. The canonical event record
3. The reconciliation decision in `event_decisions.csv`
4. Any related exception in `exception_queue.csv`
5. The resulting record in `final_asset_state.csv`

Rejected and review-required events never mutate the authoritative ledger unless explicitly permitted by policy.

# Test Coverage

Automated tests cover:

- State transitions
- Deterministic ordering
- Replay ordering
- Late-event handling
- Policy rules
- Checkout limits
- Condition ranking
- Duplicate event handling
- Holder mismatch
- Unknown assets
- Invalid timestamps
- Idempotent replay
- Integration pipeline
- Export generation

---

# Design Principles

The system follows several core principles:

- Deterministic replay
- Explicit state machine
- Policy-driven decisions
- Traceability
- No mutation on rejected events
- Repeatable outputs
- Human-reviewable exceptions

---

# Known Limitations

Current implementation is command-line based.

The project currently:

- Uses CSV files rather than a database
- Processes a single reconciliation batch at a time
- Does not include a graphical user interface
- Does not implement distributed or concurrent processing

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

These outputs provide complete traceability from the source records to the final authoritative ledger.

---

## Requirements

- Node.js 22+
- npm
