import {
  insertExceptionCase,
  insertReportArtifact,
  completeReconciliationRun,
} from "./repository.js";

export async function persistExceptions({ runId, exceptionQueue }) {
  for (const exception of exceptionQueue) {
    await insertExceptionCase({
      caseId: `${runId}-${exception.caseId}`,
      runId,
      assetId: exception.assetId ?? null,
      eventId: exception.eventId ?? null,
      severity: exception.severity,
      reasonCode: exception.reasonCode,
      status: exception.status ?? "OPEN",
      recommendedAction:
        exception.recommendedNextAction ?? exception.recommendedAction ?? null,
    });
  }
}

export async function persistReportArtifacts({ runId, artifacts }) {
  for (const artifact of artifacts) {
    await insertReportArtifact({
      runId,
      reportName: artifact.reportName,
      path: artifact.path,
      format: artifact.format,
      createdAt: artifact.createdAt ?? new Date().toISOString(),
      hash: artifact.hash ?? null,
    });
  }
}

export async function completeRun({ runId, status = "COMPLETED" }) {
  const completedAt = new Date().toISOString();

  return completeReconciliationRun(runId, completedAt, status);
}
