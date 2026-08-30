import { loadCsv } from "./ingestion/csvLoader.js";
import { loadJson } from "./ingestion/jsonLoader.js";
import { buildRawRecords } from "./ingestion/rawRecordBuilder.js";
import { validateInventory } from "./validation/inventoryValidator.js";

import { validateEvents } from "./validation/eventValidator.js";
import { buildValidationResult } from "./validation/buildValidationResult.js";
import { buildCanonicalEvents } from "./normalization/canonical_mapper.js";

import { buildCanonicalEventsCsv } from "./exporters/canonical_events_exporter.js";

import { writeTextFile } from "./utils/file_utils.js";
import { buildValidationErrorsCsv } from "./exporters/validation_exporter.js";
import { buildRawRecordIndexCsv } from "./exporters/raw_record_exporter.js";
import { buildIngestionSummary } from "./exporters/summary_exporter.js";
import { buildEventProfile } from "./profiling/profiler.js";
import { buildDataProfileMarkdown } from "./exporters/profile_exporter.js";
import { buildLedger } from "./reconciliation/ledger.js";
import { reconcileEvents } from "./reconciliation/reconciliationEngine.js";
import { buildEventDecisionsCsv } from "./exporters/event_decisions_exporter.js";
import { buildFinalAssetStateCsv } from "./exporters/final_asset_state_exporter.js";
import { buildExceptionQueue } from "./reconciliation/exceptionQueue.js";
import { buildExceptionQueueCsv } from "./exporters/exception_queue_exporter.js";
import { orderEvents } from "./reconciliation/replayOrdering.js";
import { detectLateEvents } from "./reconciliation/lateEventDetector.js";
import { detectReservationConflicts } from "./reconciliation/reservationReconciliation.js";
import { buildRunSummary } from "./exporters/run_summary_exporter.js";
import crypto from "node:crypto";
import { initializeDatabase } from "./persistence/database.js";
import {
  createReconciliationRun,
  completeReconciliationRun,
  insertRawRecord,
  insertCanonicalEvent,
  insertEventDecision,
  insertAssetState,
  insertExceptionCase,
  insertReportArtifact,
} from "./persistence/repository.js";
import {
  persistExceptions,
  persistReportArtifacts,
  completeRun,
} from "./persistence/persistRun.js";

import { validateReservations } from "./validation/reservationValidator.js";
import { validateAuditObservations } from "./validation/auditObservationValidator.js";
import { validateManualCorrections } from "./validation/manualCorrectionValidator.js";
import { detectAuditDiscrepancies } from "./reconciliation/auditReconciliation.js";
import { buildReservationReportCsv } from "./exporters/reservationReportExporter.js";
import { buildManualCorrectionAuditCsv } from "./exporters/manual_correction_audit_exporter.js";
import { buildSourceConflictReportCsv } from "./exporters/source_conflict_exporter.js";
import { evaluateManualCorrectionEvent } from "./reconciliation/manualCorrectionDecision.js";
import { buildPolicyBreachSummaryCsv } from "./exporters/policy_breach_summary_exporter.js";
import { buildAssetStateReportCsv } from "./exporters/asset_state_report_exporter.js";
import { buildDatabaseSnapshotNotes } from "./exporters/database_snapshot_notes_exporter.js";
import { buildPolicyDifferenceCsv } from "./exporters/policy_difference_exporter.js";
import { comparePolicyVersions } from "./reconciliation/policyComparison.js";
function createRunId() {
  return `run-${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${crypto
    .randomBytes(4)
    .toString("hex")}`;
}

function hashInput(data) {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

async function persistRawRecords(
  records,
  runId,
  createdAt,
  validationErrors = [],
) {
  for (const record of records) {
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
      createdAt,
    });
  }
}
export async function main() {
  console.log("\n=== Reconciliation Intelligence System ===\n");
  await initializeDatabase();
  // Load source files
  const inventory = await loadCsv("./data/sample/inventory.csv");

  const events = await loadCsv("./data/sample/events.csv");

  const policy = await loadJson("./data/policy/policy-v2.json");
  const policyV1 = await loadJson("./data/policy/policy-v1.json");
  const reservations = await loadCsv("./data/sample/reservations.csv");

  const auditObservations = await loadCsv(
    "./data/sample/audit_observations.csv",
  );

  const manualCorrections = await loadCsv(
    "./data/sample/manual_corrections.csv",
  );
  // Create reconciliation run metadata
  const runId = createRunId();
  const startedAt = new Date().toISOString();

  const inputHash = hashInput({
    inventory,
    events,
    policy,
    reservations,
    auditObservations,
    manualCorrections,
  });

  await createReconciliationRun({
    runId,
    policyVersion: policy.policyVersion,
    inputHash,
    startedAt,
    status: "RUNNING",
    notes: "Reconciliation Intelligence System run",
  });

  console.log(`Run ID: ${runId}`);
  console.log("Persistence run created.");
  // Create traceable raw records
  const inventoryRawRecords = buildRawRecords(inventory, "inventory.csv");

  const eventRawRecords = buildRawRecords(events, "events.csv");
  const policyComparison = comparePolicyVersions({
    policyV1,
    policyV2: policy,
    eventRawRecords,
    inventoryRawRecords,
  });

  const policyDifferenceCsv = buildPolicyDifferenceCsv({
    policyV1: policyV1.policyVersion,
    policyV2: policy.policyVersion,
    differences: policyComparison.differences,
  });

  writeTextFile(
    "outputs/latest/policy_decision_difference.csv",
    policyDifferenceCsv,
  );

  console.log(
    `Policy comparison: ${policyV1.policyVersion} vs ${policy.policyVersion}`,
  );

  console.log(
    `Policy differences detected: ${policyComparison.differences.length}`,
  );

  console.log(
    `Policy outcome changes: ${policyComparison.changedOutcomeCount}`,
  );
  const reservationRawRecords = buildRawRecords(
    reservations,
    "reservations.csv",
  );

  const auditRawRecords = buildRawRecords(
    auditObservations,
    "audit_observations.csv",
  );

  const manualCorrectionRawRecords = buildRawRecords(
    manualCorrections,
    "manual_corrections.csv",
  );

  const inventoryErrors = validateInventory(inventoryRawRecords);

  const eventErrors = validateEvents(
    eventRawRecords,
    policy,
    inventoryRawRecords,
  );
  const reservationErrors = validateReservations(reservationRawRecords);

  const auditObservationErrors = validateAuditObservations(auditRawRecords);

  const manualCorrectionErrors = validateManualCorrections(
    manualCorrectionRawRecords,
  );

  const validationErrors = [
    ...inventoryErrors,
    ...eventErrors,
    ...reservationErrors,
    ...auditObservationErrors,
    ...manualCorrectionErrors,
  ];
  const validationResult = buildValidationResult(
    eventRawRecords,
    validationErrors,
  );
  // Persist raw inventory records
  for (const record of inventoryRawRecords) {
    await insertRawRecord({
      rawRecordId: `${runId}-${record.rawRecordId}`,
      runId,
      sourceName: record.sourceFile,
      sourceRowId: `${record.sourceFile}-${record.sourceRow}`,
      payload: record.payload,
      schemaStatus: "VALID",
      createdAt: startedAt,
    });
  }

  // Persist raw event records
  for (const record of eventRawRecords) {
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

  console.log(
    `Raw records persisted: ${
      inventoryRawRecords.length + eventRawRecords.length
    }`,
  );
  await persistRawRecords(
    reservationRawRecords,
    runId,
    startedAt,
    validationErrors,
  );

  await persistRawRecords(auditRawRecords, runId, startedAt, validationErrors);

  await persistRawRecords(
    manualCorrectionRawRecords,
    runId,
    startedAt,
    validationErrors,
  );
  console.log(
    `Raw records persisted: ${
      inventoryRawRecords.length +
      eventRawRecords.length +
      reservationRawRecords.length +
      auditRawRecords.length +
      manualCorrectionRawRecords.length
    }`,
  );
  const canonicalEvents = buildCanonicalEvents(
    validationResult.acceptedRecords,
  );

  const replayOrderedEvents = detectLateEvents(
    orderEvents(canonicalEvents),
    policy,
  );
  // Persist canonical events
  for (const event of replayOrderedEvents) {
    await insertCanonicalEvent({
      eventId: `${runId}-${event.eventId}`,
      runId,
      eventType: event.eventType,
      assetId: event.assetId,
      actorId: event.actorId,
      occurredAt: event.occurredAt,
      sourceRef: event.rawRecordId,
      idempotencyKey: `${event.rawRecordId}-${event.eventId}`,
    });
  }

  console.log(`Canonical events persisted: ${replayOrderedEvents.length}`);
  const ledger = buildLedger(inventoryRawRecords);
  const reconciliationResult = reconcileEvents(
    replayOrderedEvents,
    ledger,
    policy,
  );
  const manualCorrectionDecisions = manualCorrectionRawRecords.map((record) => {
    const correction = record.payload ?? record;

    const assetState = reconciliationResult.ledger.get(correction.asset_id);

    return {
      correctionId: correction.correction_id,
      assetId: correction.asset_id,
      severity: correction.outcome === "REJECTED" ? "WARNING" : "INFO",
      ...evaluateManualCorrectionEvent({
        event: correction,
        actorRole: correction.actor_role,
        evidence: {
          evidence_ref: correction.evidence_ref,
          reason: correction.reason,
        },
        assetState,
      }),
    };
  });
  const policyBreachSummaryCsv = buildPolicyBreachSummaryCsv({
    decisions: reconciliationResult.decisions,
    validationErrors,
    eventRawRecords,
    manualCorrectionRawRecords,
    manualCorrectionDecisions,
    policyVersion: policy.policyVersion,
  });
  const reservationConflicts = detectReservationConflicts(
    reservationRawRecords,
    reconciliationResult.ledger,
  );

  const reservationReportCsv = buildReservationReportCsv(
    reservationRawRecords,
    reservationConflicts,
  );
  const historicalAuditStates = new Map();

  for (const record of auditRawRecords) {
    const observation = record.payload ?? record;

    const observationId = observation.observation_id;
    const assetId = observation.asset_id;
    const observedAt = new Date(observation.observed_at);

    const history = reconciliationResult.stateHistory.get(assetId);

    if (!history) {
      continue;
    }

    let historicalState = history[0]?.state ?? null;

    for (const snapshot of history) {
      if (!snapshot.occurredAt) {
        continue;
      }

      const snapshotTime = new Date(snapshot.occurredAt);

      if (snapshotTime <= observedAt) {
        historicalState = snapshot.state;
      } else {
        break;
      }
    }

    if (historicalState) {
      historicalAuditStates.set(observationId, historicalState);
    }
  }
  const auditDiscrepancies = detectAuditDiscrepancies(
    auditRawRecords,
    reconciliationResult.ledger,
    historicalAuditStates,
  );
  const sourceConflictReportCsv = buildSourceConflictReportCsv({
    reservationConflicts,
    auditDiscrepancies,
    manualCorrectionDecisions,
  });
  console.log(`Audit discrepancies detected: ${auditDiscrepancies.length}`);
  // Persist reconciliation decisions
  for (const decision of reconciliationResult.decisions) {
    await insertEventDecision({
      decisionId: `${runId}-${decision.eventId}`,
      runId,
      eventId: `${runId}-${decision.eventId}`,
      decisionType: decision.decision,
      reasonCode: decision.reasonCode ?? null,
      stateBefore: decision.stateBefore ?? null,
      stateAfter: decision.nextState ?? null,
      message: decision.message ?? null,
    });
  }

  console.log(
    `Event decisions persisted: ${reconciliationResult.decisions.length}`,
  );

  // Persist final asset states
  for (const assetState of reconciliationResult.ledger.values()) {
    await insertAssetState({
      runId,
      assetId: assetState.assetId,
      status: assetState.status,
      condition: assetState.condition ?? null,
      holderId: assetState.holderId ?? null,
      locationId: assetState.locationId ?? null,
      dueAt: assetState.dueAt ?? null,
      lastEventId: assetState.lastEventId ?? null,
    });
  }

  console.log(
    `Final asset states persisted: ${reconciliationResult.ledger.size}`,
  );
  const finalAssetStateCsv = buildFinalAssetStateCsv(
    reconciliationResult.ledger,
  );

  writeTextFile("outputs/latest/final_asset_state.csv", finalAssetStateCsv);

  console.log(
    `Final asset states exported: ${reconciliationResult.ledger.size}`,
  );
  const eventDecisionsCsv = buildEventDecisionsCsv(
    reconciliationResult.decisions,
  );

  writeTextFile("outputs/latest/event_decisions.csv", eventDecisionsCsv);

  console.log(
    `Event decisions exported: ${reconciliationResult.decisions.length}`,
  );
  // console.log(reconciliationResult);
  // final_asset_state.csv
  const reservationExceptions = reservationConflicts.map((conflict) => ({
    caseId: `RES-${conflict.reservationId}`,
    assetId: conflict.assetId,
    eventId: null,
    severity: conflict.severity ?? "ERROR",
    reasonCode: conflict.reasonCode,
    message: conflict.message,
    recommendedNextAction:
      "Review the reservation and current asset assignment.",
  }));
  const auditExceptions = auditDiscrepancies.map((discrepancy) => ({
    caseId: `AUDIT-${discrepancy.observationId}`,
    assetId: discrepancy.assetId,
    eventId: null,
    severity: discrepancy.severity,
    reasonCode: discrepancy.reasonCode,
    message: discrepancy.message,
    recommendedNextAction:
      "Review the audit observation against the reconciled asset state.",
  }));

  const exceptionQueue = [
    ...buildExceptionQueue(reconciliationResult.decisions),
    ...reservationExceptions,
    ...auditExceptions,
  ];

  await persistExceptions({
    runId,
    exceptionQueue,
  });
  const assetStateReportCsv = buildAssetStateReportCsv(
    reconciliationResult.ledger,
    {
      decisions: reconciliationResult.decisions,
      exceptions: exceptionQueue,
    },
  );
  const exceptionQueueCsv = buildExceptionQueueCsv(exceptionQueue);

  writeTextFile("outputs/latest/exception_queue.csv", exceptionQueueCsv);

  console.log(`Exception cases exported: ${exceptionQueue.length}`);

  const canonicalCsv = buildCanonicalEventsCsv(replayOrderedEvents);

  writeTextFile("outputs/latest/canonical_events.csv", canonicalCsv);
  console.log(`Canonical events exported: ${replayOrderedEvents.length}`);
  const allRawRecords = [
    ...inventoryRawRecords,
    ...eventRawRecords,
    ...reservationRawRecords,
    ...auditRawRecords,
    ...manualCorrectionRawRecords,
  ];

  const rawRecordCsv = buildRawRecordIndexCsv(allRawRecords, validationResult);

  writeTextFile("outputs/latest/raw_record_index.csv", rawRecordCsv);

  console.log("Database snapshot notes exported.");
  // Basic ingestion verification
  console.log(`Inventory records loaded: ${inventoryRawRecords.length}`);

  console.log(`Event records loaded: ${eventRawRecords.length}`);

  console.log(`Policy version loaded: ${policy.policyVersion}`);

  const validationCsv = buildValidationErrorsCsv(validationErrors);

  writeTextFile("outputs/latest/validation_errors.csv", validationCsv);
  console.log("\nValidation Errors:");

  validationErrors.forEach((error) => {
    console.log(error);
  });
  //   const profile = buildEventProfile(eventRawRecords);

  //   console.log("\n=== Data Profile ===");

  //   console.log(profile);
  const errorCount = validationErrors.filter(
    (error) => error.severity === "ERROR",
  ).length;

  const profile = buildEventProfile(eventRawRecords);

  const profileMarkdown = buildDataProfileMarkdown(profile);

  writeTextFile("outputs/latest/data_profile.md", profileMarkdown);

  const warningCount = validationErrors.filter(
    (error) => error.severity === "WARNING",
  ).length;
  const manualCorrectionAuditCsv = buildManualCorrectionAuditCsv(
    manualCorrectionRawRecords,
  );
  const summary = buildIngestionSummary({
    inventoryCount: inventoryRawRecords.length,

    eventCount: eventRawRecords.length,

    acceptedCount: validationResult.acceptedRecords.length,

    rejectedCount: validationResult.rejectedRecords.length,

    warningCount,

    errorCount,

    policyVersion: policy.policyVersion,
  });

  writeTextFile("outputs/latest/ingestion_summary.md", summary);

  // All reconciliation processing and report data are complete.

  // Capture the completion timestamp before generating the final
  // run-level reports so the summary and database snapshot use
  // the same completion time.
  const completedAt = new Date().toISOString();

  const runSummary = buildRunSummary({
    runId,
    policyVersion: policy.policyVersion,
    inputHash,
    startedAt,
    completedAt,
    status: "COMPLETED",

    sourceCounts: {
      "inventory.csv": inventoryRawRecords.length,
      "events.csv": eventRawRecords.length,
      "reservations.csv": reservationRawRecords.length,
      "audit_observations.csv": auditRawRecords.length,
      "manual_corrections.csv": manualCorrectionRawRecords.length,
    },

    inventoryCount: inventoryRawRecords.length,
    eventCount: replayOrderedEvents.length,

    reconciliationSummary: reconciliationResult.summary,
    decisions: reconciliationResult.decisions,
    exceptions: exceptionQueue,

    auditDiscrepancyCount: auditDiscrepancies.length,

    policyComparison: {
      policyV1: policyV1.policyVersion,
      policyV2: policy.policyVersion,
      totalDifferences: policyComparison.differences.length,
      changedOutcomeCount: policyComparison.changedOutcomeCount,
    },

    outputFiles: [
      "outputs/latest/canonical_events.csv",
      "outputs/latest/event_decisions.csv",
      "outputs/latest/exception_queue.csv",
      "outputs/latest/final_asset_state.csv",
      "outputs/latest/validation_errors.csv",
      "outputs/latest/run_summary.md",
      "outputs/latest/data_profile.md",
      "outputs/latest/ingestion_summary.md",
      "outputs/latest/reservation_report.csv",
      "outputs/latest/manual_correction_audit.csv",
      "outputs/latest/source_conflict_report.csv",
      "outputs/latest/asset_state_report.csv",
      "outputs/latest/policy_breach_summary.csv",
      "outputs/latest/database_snapshot_notes.md",
      "outputs/latest/policy_decision_difference.csv",
    ],
  });

  writeTextFile("outputs/latest/run_summary.md", runSummary);
  writeTextFile("outputs/latest/reservation_report.csv", reservationReportCsv);
  writeTextFile(
    "outputs/latest/manual_correction_audit.csv",
    manualCorrectionAuditCsv,
  );
  writeTextFile(
    "outputs/latest/source_conflict_report.csv",
    sourceConflictReportCsv,
  );
  writeTextFile(
    "outputs/latest/policy_breach_summary.csv",
    policyBreachSummaryCsv,
  );

  writeTextFile("outputs/latest/asset_state_report.csv", assetStateReportCsv);

  // All report files have now been generated.
  // Capture one completion timestamp for the generated snapshot
  // and the final persisted reconciliation run.
  // const  = new Date().toIScompletedAtOString();

  const reportCreatedAt = completedAt;

  const reportArtifacts = [
    {
      reportName: "final_asset_state",
      path: "outputs/latest/final_asset_state.csv",
      format: "csv",
      createdAt: new Date().toISOString(),
    },
    {
      reportName: "asset_state_report",
      path: "outputs/latest/asset_state_report.csv",
      format: "csv",
    },
    {
      reportName: "event_decisions",
      path: "outputs/latest/event_decisions.csv",
      format: "csv",
    },
    {
      reportName: "policy_breach_summary",
      path: "outputs/latest/policy_breach_summary.csv",
      format: "csv",
    },
    {
      reportName: "exception_queue",
      path: "outputs/latest/exception_queue.csv",
      format: "csv",
    },
    {
      reportName: "canonical_events",
      path: "outputs/latest/canonical_events.csv",
      format: "csv",
    },
    {
      reportName: "raw_record_index",
      path: "outputs/latest/raw_record_index.csv",
      format: "csv",
    },
    {
      reportName: "validation_errors",
      path: "outputs/latest/validation_errors.csv",
      format: "csv",
    },
    {
      reportName: "data_profile",
      path: "outputs/latest/data_profile.md",
      format: "md",
    },
    {
      reportName: "ingestion_summary",
      path: "outputs/latest/ingestion_summary.md",
      format: "md",
    },
    {
      reportName: "run_summary",
      path: "outputs/latest/run_summary.md",
      format: "md",
    },
    {
      reportName: "reservation_report",
      path: "outputs/latest/reservation_report.csv",
      format: "csv",
    },
    {
      reportName: "manual_correction_audit",
      path: "outputs/latest/manual_correction_audit.csv",
      format: "csv",
    },
    {
      reportName: "source_conflict_report",
      path: "outputs/latest/source_conflict_report.csv",
      format: "csv",
    },
    {
      reportName: "database_snapshot_notes.md",
      path: "outputs/latest/database_snapshot_notes.md",
      format: "md",
    },
    {
      reportName: "policy_decision_difference.csv",
      path: "outputs/latest/policy_decision_difference.csv",
      format: "csv",
    },
  ];

  // Generate the database snapshot only after the report registry
  // has been assembled so the snapshot can document every report.
  const databaseSnapshotNotes = buildDatabaseSnapshotNotes({
    runId,
    policyVersion: policy.policyVersion,
    inputHash,
    startedAt,
    completedAt,
    status: "COMPLETED",
    sourceCounts: {
      "inventory.csv": inventoryRawRecords.length,
      "events.csv": eventRawRecords.length,
      "reservations.csv": reservationRawRecords.length,
      "audit_observations.csv": auditRawRecords.length,
      "manual_corrections.csv": manualCorrectionRawRecords.length,
    },
    reportArtifacts,
  });

  writeTextFile(
    "outputs/latest/database_snapshot_notes.md",
    databaseSnapshotNotes,
  );

  console.log("Database snapshot notes exported.");
  await persistReportArtifacts({
    runId,
    artifacts: reportArtifacts,
  });

  console.log("\n=== Reconciliation Summary ===");

  console.log(`Processed: ${reconciliationResult.summary.processed}`);

  console.log(`Accepted: ${reconciliationResult.summary.accepted}`);

  console.log(
    `Accepted With Warning: ${reconciliationResult.summary.acceptedWithWarning}`,
  );

  console.log(`Rejected: ${reconciliationResult.summary.rejected}`);

  console.log(
    `Review Required: ${reconciliationResult.summary.reviewRequired}`,
  );

  console.log(`Warning Only: ${reconciliationResult.summary.warningOnly}`);

  console.log("\n=== Validation Summary ===");

  console.log(`Errors: ${errorCount}`);

  console.log(`Warnings: ${warningCount}`);
  console.log("\n=== Validation Result ===");

  console.log(`Accepted: ${validationResult.acceptedRecords.length}`);

  console.log(`Rejected: ${validationResult.rejectedRecords.length}`);

  console.log(`Warnings: ${validationResult.warningRecords.length}`);
  console.log(`Validation errors exported: ${validationErrors.length}`);

  await completeReconciliationRun(runId, completedAt, "COMPLETED");

  await completeRun({
    runId,
    status: "COMPLETED",
  });

  console.log(`Reconciliation run completed: ${runId}`);
}
