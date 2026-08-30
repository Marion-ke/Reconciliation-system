# Database Snapshot Notes

## Run

- Run ID: run-20260830065957581-374abf52
- Policy Version: 2.0.0
- Input Hash: bb3ec6aef36f59daf14161ca5d5bf169068639f7131d026f3b94cc90408f53a6
- Started At: 2026-08-30T06:59:57.581Z
- Completed At: 2026-08-30T06:59:59.287Z
- Status: COMPLETED

## Persisted Source Evidence

Raw source records are stored in the `raw_records` table and linked to the reconciliation run.

- inventory.csv: 25
- events.csv: 150
- reservations.csv: 30
- audit_observations.csv: 20
- manual_corrections.csv: 12

## Database Tables

- `reconciliation_runs` — run identity, policy version, input hash, timestamps, status, and notes.
- `raw_records` — original source payloads, source identifiers, schema status, and run linkage.
- `canonical_events` — normalized operational events linked back to their source records.
- `event_decisions` — reconciliation decisions, reason codes, state transitions, and messages.
- `asset_states` — final reconciled state for each asset in a run.
- `exception_cases` — reviewable rejection, warning, conflict, and escalation cases.
- `report_artifacts` — generated report names, paths, formats, timestamps, and optional hashes.

## Traceability Path

`raw_records → canonical_events → event_decisions → asset_states`

Exceptions are linked to the run through `exception_cases`, while generated reports are registered through `report_artifacts`.

## Schema Initialization

The application initializes the SQLite schema using `CREATE TABLE IF NOT EXISTS` statements.
The current implementation does not contain a separate migration-version table or migration framework; schema initialization is therefore idempotent table creation rather than versioned migrations.

## Reviewer Inspection

A reviewer can inspect a run with queries such as:

```sql
SELECT * FROM reconciliation_runs WHERE run_id = '<RUN_ID>';

SELECT * FROM raw_records WHERE run_id = '<RUN_ID>' ORDER BY source_name, source_row_id;

SELECT * FROM canonical_events WHERE run_id = '<RUN_ID>' ORDER BY occurred_at;

SELECT * FROM event_decisions WHERE run_id = '<RUN_ID>' ORDER BY event_id;

SELECT * FROM asset_states WHERE run_id = '<RUN_ID>' ORDER BY asset_id;

SELECT * FROM exception_cases WHERE run_id = '<RUN_ID>' ORDER BY severity, case_id;

SELECT * FROM report_artifacts WHERE run_id = '<RUN_ID>' ORDER BY report_id;
```

## Generated Reports

- final_asset_state: outputs/latest/final_asset_state.csv
- asset_state_report: outputs/latest/asset_state_report.csv
- event_decisions: outputs/latest/event_decisions.csv
- policy_breach_summary: outputs/latest/policy_breach_summary.csv
- exception_queue: outputs/latest/exception_queue.csv
- canonical_events: outputs/latest/canonical_events.csv
- raw_record_index: outputs/latest/raw_record_index.csv
- validation_errors: outputs/latest/validation_errors.csv
- data_profile: outputs/latest/data_profile.md
- ingestion_summary: outputs/latest/ingestion_summary.md
- run_summary: outputs/latest/run_summary.md
- reservation_report: outputs/latest/reservation_report.csv
- manual_correction_audit: outputs/latest/manual_correction_audit.csv
- source_conflict_report: outputs/latest/source_conflict_report.csv
- database_snapshot_notes.md: outputs/latest/database_snapshot_notes.md
- policy_decision_difference.csv: outputs/latest/policy_decision_difference.csv