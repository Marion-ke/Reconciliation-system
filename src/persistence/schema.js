/**
 * SQLite schema for the Reconciliation Intelligence System.
 *
 * The schema persists:
 * - reconciliation runs
 * - raw source records
 * - canonical events
 * - reconciliation decisions
 * - final asset states
 * - exception cases
 * - generated report artifacts
 */

export const CREATE_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS reconciliation_runs (
    run_id TEXT PRIMARY KEY,
    policy_version TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS raw_records (
    raw_record_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_row_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    schema_status TEXT NOT NULL,
    created_at TEXT NOT NULL,

    FOREIGN KEY (run_id)
        REFERENCES reconciliation_runs(run_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS canonical_events (
    event_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    asset_id TEXT,
    actor_id TEXT,
    occurred_at TEXT NOT NULL,
    source_ref TEXT,
    idempotency_key TEXT NOT NULL,

    PRIMARY KEY (run_id, event_id),

    FOREIGN KEY (run_id)
        REFERENCES reconciliation_runs(run_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_decisions (
    decision_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    reason_code TEXT,
    state_before TEXT,
    state_after TEXT,
    message TEXT,

    FOREIGN KEY (run_id, event_id)
        REFERENCES canonical_events(run_id, event_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asset_states (
    run_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    status TEXT NOT NULL,
    condition TEXT,
    holder_id TEXT,
    location_id TEXT,
    due_at TEXT,
    last_event_id TEXT,

    PRIMARY KEY (run_id, asset_id),

    FOREIGN KEY (run_id)
        REFERENCES reconciliation_runs(run_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exception_cases (
    case_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    asset_id TEXT,
    event_id TEXT,
    severity TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    status TEXT NOT NULL,
    recommended_action TEXT,

    FOREIGN KEY (run_id)
        REFERENCES reconciliation_runs(run_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_artifacts (
    report_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    report_name TEXT NOT NULL,
    path TEXT NOT NULL,
    format TEXT NOT NULL,
    created_at TEXT NOT NULL,
    hash TEXT,

    FOREIGN KEY (run_id)
        REFERENCES reconciliation_runs(run_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_raw_records_run
    ON raw_records(run_id);

CREATE INDEX IF NOT EXISTS idx_canonical_events_run
    ON canonical_events(run_id);

CREATE INDEX IF NOT EXISTS idx_event_decisions_run
    ON event_decisions(run_id);

CREATE INDEX IF NOT EXISTS idx_exception_cases_run
    ON exception_cases(run_id);

CREATE INDEX IF NOT EXISTS idx_report_artifacts_run
    ON report_artifacts(run_id);
`;
