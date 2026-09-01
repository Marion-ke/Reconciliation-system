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
    canonical_event_id TEXT NOT NULL,
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

    -- Resolution audit information.
    resolved_at TEXT,
    resolved_by TEXT,
    resolution TEXT,

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

CREATE TABLE IF NOT EXISTS api_usage (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    method TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms REAL NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint
    ON api_usage(endpoint);

CREATE INDEX IF NOT EXISTS idx_api_usage_created
    ON api_usage(created_at);
 CREATE TABLE IF NOT EXISTS webhook_configurations (
    webhook_id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    event_types TEXT,
    severities TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_dispatches (
    dispatch_id TEXT PRIMARY KEY,
    webhook_id TEXT NOT NULL,
    run_id TEXT,
    event_id TEXT,
    exception_case_id TEXT,
    attempt INTEGER NOT NULL,
    status TEXT NOT NULL,
    payload TEXT NOT NULL,
    response_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    attempted_at TEXT NOT NULL,

    FOREIGN KEY (webhook_id)
        REFERENCES webhook_configurations(webhook_id)
        ON DELETE CASCADE,

    FOREIGN KEY (run_id)
        REFERENCES reconciliation_runs(run_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhook_dispatches_webhook
    ON webhook_dispatches(webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_dispatches_run
    ON webhook_dispatches(run_id);

CREATE INDEX IF NOT EXISTS idx_webhook_dispatches_event
    ON webhook_dispatches(event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_dispatches_exception
    ON webhook_dispatches(exception_case_id);
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
