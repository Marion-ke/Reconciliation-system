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
  canonicalEventId = `ce-${eventId}`,
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
       canonical_event_id,
      run_id,
      event_type,
      asset_id,
      actor_id,
      occurred_at,
      source_ref,
      idempotency_key
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      eventId,
      canonicalEventId,
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
 * Find a previously persisted canonical event by API idempotency key.
 *
 * This allows the API layer to detect duplicate submissions before
 * running the reconciliation engine a second time.
 */
export async function getCanonicalEventByIdempotencyKey(idempotencyKey) {
  return get(
    `
    SELECT *
    FROM canonical_events
    WHERE idempotency_key = ?
    ORDER BY rowid ASC
    LIMIT 1
    `,
    [idempotencyKey],
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

/*/**
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
  resolvedAt = null,
  resolvedBy = null,
  resolution = null,
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
      recommended_action,
      resolved_at,
      resolved_by,
      resolution
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      resolvedAt,
      resolvedBy,
      resolution,
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
/**
 * Store a webhook configuration.
 */
export async function insertWebhookConfiguration({
  webhookId,
  url,
  eventTypes = [],
  severities = [],
  active = true,
  createdAt,
}) {
  await run(
    `
    INSERT INTO webhook_configurations (
      webhook_id,
      url,
      event_types,
      severities,
      active,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      webhookId,
      url,
      JSON.stringify(eventTypes),
      JSON.stringify(severities),
      active ? 1 : 0,
      createdAt,
    ],
  );

  return getWebhookConfiguration(webhookId);
}

/**
 * Retrieve a webhook configuration.
 */
export async function getWebhookConfiguration(webhookId) {
  const webhook = await get(
    `
    SELECT *
    FROM webhook_configurations
    WHERE webhook_id = ?
    `,
    [webhookId],
  );

  if (!webhook) {
    return undefined;
  }

  return {
    ...webhook,
    event_types: JSON.parse(webhook.event_types || "[]"),
    severities: JSON.parse(webhook.severities || "[]"),
    active: Boolean(webhook.active),
  };
}

/**
 * Retrieve all active webhook configurations.
 */
export async function listActiveWebhookConfigurations() {
  const webhooks = await all(
    `
    SELECT *
    FROM webhook_configurations
    WHERE active = 1
    ORDER BY created_at ASC, webhook_id ASC
    `,
  );

  return webhooks.map((webhook) => ({
    ...webhook,
    event_types: JSON.parse(webhook.event_types || "[]"),
    severities: JSON.parse(webhook.severities || "[]"),
    active: Boolean(webhook.active),
  }));
}

/**
 * Store a webhook dispatch attempt.
 */
export async function insertWebhookDispatch({
  dispatchId,
  webhookId,
  runId = null,
  eventId = null,
  exceptionCaseId = null,
  attempt,
  status,
  payload,
  responseCode = null,
  responseBody = null,
  errorMessage = null,
  attemptedAt,
}) {
  await run(
    `
    INSERT INTO webhook_dispatches (
      dispatch_id,
      webhook_id,
      run_id,
      event_id,
      exception_case_id,
      attempt,
      status,
      payload,
      response_code,
      response_body,
      error_message,
      attempted_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dispatchId,
      webhookId,
      runId,
      eventId,
      exceptionCaseId,
      attempt,
      status,
      JSON.stringify(payload),
      responseCode,
      responseBody,
      errorMessage,
      attemptedAt,
    ],
  );
}

/**
 * Retrieve webhook dispatch history.
 */
export async function getWebhookDispatches(webhookId) {
  return all(
    `
    SELECT *
    FROM webhook_dispatches
    WHERE webhook_id = ?
    ORDER BY attempted_at ASC, attempt ASC
    `,
    [webhookId],
  );
}
/**
 * Retrieve webhook dispatch history for all webhooks.
 */
export async function getAllWebhookDispatches() {
  return all(
    `
    SELECT
      wd.*,
      wc.url AS target_url
    FROM webhook_dispatches wd
    LEFT JOIN webhook_configurations wc
      ON wc.webhook_id = wd.webhook_id
    ORDER BY wd.attempted_at ASC, wd.attempt ASC
    `,
  );
}
/**
 * Retrieve webhook dispatch history for all webhooks.
 */
// export async function getAllWebhookDispatches() {
//   return all(
//     `
//     SELECT
//       wd.*,
//       wc.url AS target_url
//     FROM webhook_dispatches wd
//     LEFT JOIN webhook_configurations wc
//       ON wc.webhook_id = wd.webhook_id
//     ORDER BY wd.attempted_at ASC, wd.attempt ASC
//     `,
//   );
// }
/**
 * Retrieve the current authoritative state of one asset.
 *
 * Asset state is stored per reconciliation run, so the most recent
 * completed run is used as the current state.
 */
export async function getCurrentAssetState(assetId) {
  return get(
    `
    SELECT
      asset_states.run_id,
      asset_states.asset_id,
      asset_states.status,
      asset_states.condition,
      asset_states.holder_id,
      asset_states.location_id,
      asset_states.due_at,
      asset_states.last_event_id,
      reconciliation_runs.policy_version,
      reconciliation_runs.status AS run_status,
      reconciliation_runs.completed_at
    FROM asset_states
    INNER JOIN reconciliation_runs
      ON reconciliation_runs.run_id = asset_states.run_id
    WHERE asset_states.asset_id = ?
      AND reconciliation_runs.status = 'COMPLETED'
    ORDER BY reconciliation_runs.completed_at DESC,
             reconciliation_runs.run_id DESC
    LIMIT 1
    `,
    [assetId],
  );
}
/**
 * Retrieve recent canonical events for an asset.
 *
 * Events are ordered chronologically so the API consumer can see
 * the operational history that led to the current asset state.
 */
export async function getAssetEventHistory(assetId, limit = 20) {
  return all(
    `
    SELECT
      canonical_events.*,
      reconciliation_runs.policy_version
    FROM canonical_events
    INNER JOIN reconciliation_runs
      ON reconciliation_runs.run_id = canonical_events.run_id
    WHERE canonical_events.asset_id = ?
    ORDER BY canonical_events.occurred_at DESC,
             canonical_events.event_id DESC
    LIMIT ?
    `,
    [assetId, limit],
  );
}
/**
 * Retrieve all persisted exception cases.
 *
 * Exceptions are ordered by severity and case ID so that API responses
 * remain deterministic across repeated requests.
 */
export async function listExceptionCases() {
  return all(
    `
    SELECT *
    FROM exception_cases
    ORDER BY severity ASC, case_id ASC
    `,
  );
}
/**
 * Resolve an existing exception case.
 *
 * Resolution information is persisted together with the actor and
 * timestamp so that every manual resolution remains auditable.
 */
export async function resolveExceptionCase({
  caseId,
  resolvedBy,
  resolvedAt,
  resolution,
}) {
  await run(
    `
    UPDATE exception_cases
    SET status = 'RESOLVED',
        resolved_at = ?,
        resolved_by = ?,
        resolution = ?
    WHERE case_id = ?
      AND status != 'RESOLVED'
    `,
    [resolvedAt, resolvedBy, resolution, caseId],
  );

  return get(
    `
    SELECT *
    FROM exception_cases
    WHERE case_id = ?
    `,
    [caseId],
  );
}
/**
 * Store an API request usage record.
 */
export async function insertApiUsageRecord({
  method,
  endpoint,
  statusCode,
  responseTimeMs,
  createdAt = new Date().toISOString(),
}) {
  await run(
    `
    INSERT INTO api_usage (
      method,
      endpoint,
      status_code,
      response_time_ms,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      method,
      endpoint,
      statusCode,
      responseTimeMs,
      createdAt,
    ],
  );
}

/**
 * Retrieve persisted API usage records.
 */
export async function getApiUsageRecords() {
  return all(
    `
    SELECT
      request_id,
      method,
      endpoint,
      status_code,
      response_time_ms,
      created_at
    FROM api_usage
    ORDER BY request_id ASC
    `,
  );
}
/**
 * Store a webhook configuration.
 */
