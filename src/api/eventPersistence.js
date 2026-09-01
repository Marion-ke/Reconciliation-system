import crypto from "node:crypto";

import {
  createReconciliationRun,
  insertRawRecord,
  insertCanonicalEvent,
  insertEventDecision,
  insertAssetState,
  insertExceptionCase,
} from "../persistence/repository.js";
/**
 * Creates a deterministic API run identifier.
 *
 * The timestamp keeps runs distinguishable while the random suffix
 * prevents collisions between separate API requests.
 */
function createApiRunId() {
  return `api-run-${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${crypto
    .randomBytes(4)
    .toString("hex")}`;
}

/**
 * Creates a SHA-256 hash for the API request input.
 */
function hashInput(data) {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

/**
 * Persists the result of an API event submission.
 *
 * The API uses the same database tables as the batch reconciliation
 * pipeline so API submissions remain part of the authoritative
 * audit trail.
 */
export async function persistApiEventResult({
  events,
  rawRecords,
  canonicalEvents,
  reconciliationResult,
  policy,
  idempotencyKey,
  validationErrors = [],
  exceptionQueue = [],
  autoResolvedExceptions = [],
}) {
  const runId = createApiRunId();
  const startedAt = new Date().toISOString();

  const inputHash = hashInput({
    events,
    policyVersion: policy.policyVersion,
    idempotencyKey,
  });

  // Create the API reconciliation run.
  await createReconciliationRun({
    runId,
    policyVersion: policy.policyVersion,
    inputHash,
    startedAt,
    status: "RUNNING",
    notes: "API event submission",
  });

  // Persist every raw API record.
  for (const record of rawRecords) {
    const recordErrors = validationErrors.filter(
      (error) => error.rawRecordId === record.rawRecordId,
    );

    const schemaStatus = recordErrors.some(
      (error) => error.severity === "ERROR",
    )
      ? "INVALID"
      : "VALID";

    await insertRawRecord({
      rawRecordId: `${runId}-${record.rawRecordId}`,
      runId,
      sourceName: record.sourceFile,
      sourceRowId: `${record.sourceFile}-${record.sourceRow}`,
      payload: record.payload,
      schemaStatus,
      createdAt: startedAt,
    });
  }

  // Persist canonical events.
  for (const event of canonicalEvents) {
    await insertCanonicalEvent({
      eventId: event.eventId,
      canonicalEventId: event.canonicalEventId,
      runId,
      eventType: event.eventType,
      assetId: event.assetId,
      actorId: event.actorId,
      occurredAt: event.occurredAt,
      sourceRef: `${event.sourceSystem ?? "api"}-${event.sourceRow ?? ""}`,
      idempotencyKey,
    });
  }

  // Persist reconciliation decisions.
  for (const [index, decision] of reconciliationResult.decisions.entries()) {
    await insertEventDecision({
      decisionId: `${runId}-decision-${String(index + 1).padStart(4, "0")}`,
      runId,
      eventId: decision.eventId,
      decisionType: decision.decision,
      reasonCode: decision.reasonCode ?? null,
      stateBefore: decision.previousState ?? null,
      stateAfter: decision.nextState ?? null,
      message: decision.message ?? null,
    });
  }

  // Persist the resulting asset states.
  for (const assetState of reconciliationResult.ledger.values()) {
    await insertAssetState({
      runId,
      assetId: assetState.assetId,
      status: assetState.status,
      condition: assetState.condition,
      holderId: assetState.holderId,
      locationId: assetState.locationId,
      dueAt: assetState.dueAt,
      lastEventId: assetState.lastEventId,
    });
  }
  // Persist API exception cases, including auto-resolved cases.
  for (const exception of [...exceptionQueue, ...autoResolvedExceptions]) {
    await insertExceptionCase({
      caseId: `${runId}-${exception.caseId}`,
      runId,
      assetId: exception.assetId ?? null,
      eventId: exception.eventId ?? null,
      severity: exception.severity ?? "WARNING",
      reasonCode: exception.reasonCode ?? null,
      status: exception.status ?? "OPEN",
      recommendedAction:
        exception.recommendedNextAction ?? exception.recommendedAction ?? null,
    });
  }
  return {
    runId,
    inputHash,
  };
}
