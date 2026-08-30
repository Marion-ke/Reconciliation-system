/**
 * Builds database snapshot documentation for a reconciliation run.
 *
 * This report describes the actual SQLite schema used by the project,
 * how the run is persisted, and how a reviewer can inspect the evidence.
 */

export function buildDatabaseSnapshotNotes({
  runId,
  policyVersion,
  inputHash,
  startedAt,
  completedAt,
  status,
  sourceCounts = {},
  reportArtifacts = [],
}) {
  const lines = [];

  lines.push("# Database Snapshot Notes");
  lines.push("");

  lines.push("## Run");
  lines.push("");
  lines.push(`- Run ID: ${runId}`);
  lines.push(`- Policy Version: ${policyVersion}`);
  lines.push(`- Input Hash: ${inputHash}`);
  lines.push(`- Started At: ${startedAt}`);
  lines.push(`- Completed At: ${completedAt ?? "Not completed"}`);
  lines.push(`- Status: ${status}`);
  lines.push("");

  lines.push("## Persisted Source Evidence");
  lines.push("");
  lines.push(
    "Raw source records are stored in the `raw_records` table and linked to the reconciliation run.",
  );
  lines.push("");

  for (const [source, count] of Object.entries(sourceCounts)) {
    lines.push(`- ${source}: ${count}`);
  }

  lines.push("");

  lines.push("## Database Tables");
  lines.push("");
  lines.push(
    "- `reconciliation_runs` — run identity, policy version, input hash, timestamps, status, and notes.",
  );
  lines.push(
    "- `raw_records` — original source payloads, source identifiers, schema status, and run linkage.",
  );
  lines.push(
    "- `canonical_events` — normalized operational events linked back to their source records.",
  );
  lines.push(
    "- `event_decisions` — reconciliation decisions, reason codes, state transitions, and messages.",
  );
  lines.push(
    "- `asset_states` — final reconciled state for each asset in a run.",
  );
  lines.push(
    "- `exception_cases` — reviewable rejection, warning, conflict, and escalation cases.",
  );
  lines.push(
    "- `report_artifacts` — generated report names, paths, formats, timestamps, and optional hashes.",
  );
  lines.push("");

  lines.push("## Traceability Path");
  lines.push("");
  lines.push(
    "`raw_records → canonical_events → event_decisions → asset_states`",
  );
  lines.push("");
  lines.push(
    "Exceptions are linked to the run through `exception_cases`, while generated reports are registered through `report_artifacts`.",
  );
  lines.push("");

  lines.push("## Schema Initialization");
  lines.push("");
  lines.push(
    "The application initializes the SQLite schema using `CREATE TABLE IF NOT EXISTS` statements.",
  );
  lines.push(
    "The current implementation does not contain a separate migration-version table or migration framework; schema initialization is therefore idempotent table creation rather than versioned migrations.",
  );
  lines.push("");

  lines.push("## Reviewer Inspection");
  lines.push("");
  lines.push("A reviewer can inspect a run with queries such as:");
  lines.push("");
  lines.push("```sql");
  lines.push("SELECT * FROM reconciliation_runs WHERE run_id = '<RUN_ID>';");
  lines.push("");
  lines.push(
    "SELECT * FROM raw_records WHERE run_id = '<RUN_ID>' ORDER BY source_name, source_row_id;",
  );
  lines.push("");
  lines.push(
    "SELECT * FROM canonical_events WHERE run_id = '<RUN_ID>' ORDER BY occurred_at;",
  );
  lines.push("");
  lines.push(
    "SELECT * FROM event_decisions WHERE run_id = '<RUN_ID>' ORDER BY event_id;",
  );
  lines.push("");
  lines.push(
    "SELECT * FROM asset_states WHERE run_id = '<RUN_ID>' ORDER BY asset_id;",
  );
  lines.push("");
  lines.push(
    "SELECT * FROM exception_cases WHERE run_id = '<RUN_ID>' ORDER BY severity, case_id;",
  );
  lines.push("");
  lines.push(
    "SELECT * FROM report_artifacts WHERE run_id = '<RUN_ID>' ORDER BY report_id;",
  );
  lines.push("```");
  lines.push("");

  lines.push("## Generated Reports");
  lines.push("");

  for (const artifact of reportArtifacts) {
    lines.push(`- ${artifact.reportName}: ${artifact.path}`);
  }

  return lines.join("\n");
}
