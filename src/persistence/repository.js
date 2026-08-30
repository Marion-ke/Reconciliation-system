import db from "./database.js";

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

/**
 * Create a new reconciliation run.
 */
export async function createReconciliationRun({
  runId,
  policyVersion,
  inputHash,
  startedAt,
  status = "RUNNING",
  notes = null,
}) {
  await run(
    `
    INSERT INTO reconciliation_runs (
      run_id,
      policy_version,
      input_hash,
      started_at,
      status,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [runId, policyVersion, inputHash, startedAt, status, notes],
  );

  return getReconciliationRun(runId);
}

/**
 * Mark a reconciliation run as completed.
 */
export async function completeReconciliationRun(
  runId,
  completedAt,
  status = "COMPLETED",
) {
  await run(
    `
    UPDATE reconciliation_runs
    SET completed_at = ?,
        status = ?
    WHERE run_id = ?
    `,
    [completedAt, status, runId],
  );

  return getReconciliationRun(runId);
}

/**
 * Retrieve a reconciliation run.
 */
export async function getReconciliationRun(runId) {
  return get(
    `
    SELECT *
    FROM reconciliation_runs
    WHERE run_id = ?
    `,
    [runId],
  );
}

/**
 * Retrieve all reconciliation runs.
 */
export async function listReconciliationRuns() {
  return all(
    `
    SELECT *
    FROM reconciliation_runs
    ORDER BY started_at DESC, run_id ASC
    `,
  );
}

/**
 * Store a raw source record.
 */
export async function insertRawRecord({
  rawRecordId,
  runId,
  sourceName,
  sourceRowId,
  payload,
  schemaStatus,
  createdAt,
}) {
  await run(
    `
    INSERT INTO raw_records (
      raw_record_id,
      run_id,
      source_name,
      source_row_id,
      payload,
      schema_status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      rawRecordId,
      runId,
      sourceName,
      sourceRowId,
      JSON.stringify(payload),
      schemaStatus,
      createdAt,
    ],
  );
}

/**
 * Store a canonical event.
 */
export async function insertCanonicalEvent({
  eventId,
  runId,
  eventType,
  assetId,
  actorId,
  occurredAt,
  sourceRef,
  idempotencyKey,
}) {
  await run(
    `
    INSERT INTO canonical_events (
      event_id,
      run_id,
      event_type,
      asset_id,
      actor_id,
      occurred_at,
      source_ref,
      idempotency_key
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      eventId,
      runId,
      eventType,
      assetId,
      actorId,
      occurredAt,
      sourceRef,
      idempotencyKey,
    ],
  );
}

/**
 * Store an event decision.
 */
export async function insertEventDecision({
  decisionId,
  runId,
  eventId,
  decisionType,
  reasonCode,
  stateBefore,
  stateAfter,
  message,
}) {
  await run(
    `
    INSERT INTO event_decisions (
      decision_id,
      run_id,
      event_id,
      decision_type,
      reason_code,
      state_before,
      state_after,
      message
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      decisionId,
      runId,
      eventId,
      decisionType,
      reasonCode,
      stateBefore,
      stateAfter,
      message,
    ],
  );
}

/**
 * Store a final asset state.
 */
export async function insertAssetState({
  runId,
  assetId,
  status,
  condition,
  holderId,
  locationId,
  dueAt,
  lastEventId,
}) {
  await run(
    `
    INSERT INTO asset_states (
      run_id,
      asset_id,
      status,
      condition,
      holder_id,
      location_id,
      due_at,
      last_event_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      runId,
      assetId,
      status,
      condition,
      holderId,
      locationId,
      dueAt,
      lastEventId,
    ],
  );
}

/**
 * Store an exception case.
 */
export async function insertExceptionCase({
  caseId,
  runId,
  assetId,
  eventId,
  severity,
  reasonCode,
  status,
  recommendedAction,
}) {
  await run(
    `
    INSERT INTO exception_cases (
      case_id,
      run_id,
      asset_id,
      event_id,
      severity,
      reason_code,
      status,
      recommended_action
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      caseId,
      runId,
      assetId,
      eventId,
      severity,
      reasonCode,
      status,
      recommendedAction,
    ],
  );
}

/**
 * Store a generated report artifact.
 */
export async function insertReportArtifact({
  runId,
  reportName,
  path,
  format,
  createdAt,
  hash = null,
}) {
  await run(
    `
    INSERT INTO report_artifacts (
      run_id,
      report_name,
      path,
      format,
      created_at,
      hash
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [runId, reportName, path, format, createdAt, hash],
  );
}

/**
 * Retrieve all decisions for a reconciliation run.
 */
export async function getEventDecisions(runId) {
  return all(
    `
    SELECT *
    FROM event_decisions
    WHERE run_id = ?
    ORDER BY event_id ASC
    `,
    [runId],
  );
}

/**
 * Retrieve all exceptions for a reconciliation run.
 */
export async function getExceptionCases(runId) {
  return all(
    `
    SELECT *
    FROM exception_cases
    WHERE run_id = ?
    ORDER BY case_id ASC
    `,
    [runId],
  );
}

/**
 * Retrieve final asset states for a reconciliation run.
 */
export async function getAssetStates(runId) {
  return all(
    `
    SELECT *
    FROM asset_states
    WHERE run_id = ?
    ORDER BY asset_id ASC
    `,
    [runId],
  );
}

/**
 * Retrieve raw records for a reconciliation run.
 */
export async function getRawRecords(runId) {
  return all(
    `
    SELECT *
    FROM raw_records
    WHERE run_id = ?
    ORDER BY source_name ASC, source_row_id ASC
    `,
    [runId],
  );
}

/**
 * Retrieve canonical events for a reconciliation run.
 */
export async function getCanonicalEvents(runId) {
  return all(
    `
    SELECT *
    FROM canonical_events
    WHERE run_id = ?
    ORDER BY occurred_at ASC, event_id ASC
    `,
    [runId],
  );
}

/**
 * Retrieve report artifacts for a reconciliation run.
 */
export async function getReportArtifacts(runId) {
  return all(
    `
    SELECT *
    FROM report_artifacts
    WHERE run_id = ?
    ORDER BY created_at ASC, report_id ASC
    `,
    [runId],
  );
}
