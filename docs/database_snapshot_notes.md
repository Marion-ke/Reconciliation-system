# Database Snapshot Notes

## 1. Purpose

This document describes the SQLite persistence model used by the
Reconciliation Intelligence System and explains how a reviewer can inspect
the evidence produced by a reconciliation run.

The database provides durable traceability for:

- reconciliation runs
- raw source records
- canonical events
- event decisions
- final asset states
- exception cases
- generated report artifacts

The persistence layer complements the generated CSV and Markdown reports.
A reviewer can inspect the reports without opening the database, while the
database provides the underlying evidence and traceability.

---

## 2. Persistence Technology

The system uses SQLite as its durable persistence store.

The application initializes the SQLite database before processing the source
data and creates the required schema if it does not already exist.

The database is therefore intended to preserve reconciliation evidence across
runs rather than relying only on in-memory JavaScript objects.

---

## 3. Reconciliation Run

Each execution is assigned a unique run ID.

A reconciliation run records:

- run ID
- policy version
- input hash
- start timestamp
- completion timestamp
- run status
- run notes

The input hash provides a fingerprint of the source inputs and policy used
for the run.

This allows a reviewer to distinguish one reconciliation execution from
another and associate decisions and reports with the policy version and
inputs used at that time.

---

## 4. Database Schema

The persistence model contains the following logical tables.

### `reconciliation_runs`

Stores metadata for each reconciliation execution.

Important fields include:

- `run_id`
- `policy_version`
- `input_hash`
- `started_at`
- `completed_at`
- `status`
- `notes`

Purpose:

Identifies a reconciliation run and records the policy and input fingerprint
under which the run was executed.

---

### `raw_records`

Stores source records before or independently of normalization.

Important fields include:

- `raw_record_id`
- `run_id`
- `source_name`
- `source_row_id`
- `payload`
- `schema_status`
- `created_at`

Purpose:

Preserves the original source evidence and allows a reviewer to identify
which source file and source row produced a record.

The raw payload is retained so that downstream decisions can be traced back
to the original source information.

---

### `canonical_events`

Stores normalized operational event candidates.

Important concepts include:

- `event_id`
- `run_id`
- `event_type`
- `asset_id`
- `actor_id`
- `occurred_at`
- `source_ref`
- `idempotency_key`

Purpose:

Provides the normalized representation used by reconciliation while
retaining a reference to the source evidence.

---

### `event_decisions`

Stores the decision produced when a canonical event is evaluated.

Important concepts include:

- `decision_id`
- `run_id`
- `event_id`
- `decision_type`
- `reason_code`
- `state_before`
- `state_after`
- `message`

Purpose:

Records why an event was accepted, accepted with warning, rejected,
review-required, or otherwise classified by the reconciliation engine.

This table is a key part of the audit trail because it connects an event to
the business decision made by the system.

---

### `asset_states`

Stores the final reconciled state of each asset for a run.

Important fields include:

- `run_id`
- `asset_id`
- `status`
- `condition`
- `holder_id`
- `location_id`
- `due_at`
- `last_event_id`

Purpose:

Provides the resulting ledger state after reconciliation.

The run ID allows final states from different reconciliation executions to be
distinguished and compared.

---

### `exception_cases`

Stores cases requiring attention or follow-up.

Important concepts include:

- `case_id`
- `run_id`
- `asset_id`
- `event_id`
- `severity`
- `reason_code`
- `status`
- `recommended_action`

Purpose:

Provides a human-reviewable queue for rejected events, warnings, conflicts,
and other reconciliation cases requiring investigation or follow-up.

---

### `report_artifacts`

Stores or indexes generated report artifacts for a reconciliation run.

Important concepts include:

- `run_id`
- `report_name`
- `path`
- `format`
- `created_at`
- `hash`

Purpose:

Allows generated reports to be associated with the reconciliation run that
produced them.

Where report hashes are recorded, they can also be used to verify the
integrity of generated artifacts.

---

## 5. Evidence Traceability

The intended evidence path is:

```text
Raw Source Record
       |
       v
Canonical Event
       |
       v
Event Decision
       |
       v
Final Asset State
```
