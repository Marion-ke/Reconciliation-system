import ExceptionCase from "../domain/exceptionCase.js";
import { RECOMMENDED_ACTIONS } from "./recommendedActions.js";
import { DECISION_SEVERITY } from "./decisionSeverity.js";
/**
 * Builds a human-reviewable exception queue
 * from reconciliation decisions.
 */
export function buildExceptionQueue(decisions) {
  return decisions
    .filter(
      (decision) =>
        decision.decision === "REJECTED" ||
        decision.decision === "REVIEW_REQUIRED" ||
        decision.decision === "WARNING_ONLY",
    )
    .map(
      (decision, index) =>
        new ExceptionCase({
          caseId: `EX-${String(index + 1).padStart(4, "0")}`,

          severity: DECISION_SEVERITY[decision.decision] ?? "INFO",

          reasonCode: decision.reasonCode,

          assetId: decision.assetId,

          eventId: decision.eventId,

          rawRecordId: decision.rawRecordId,

          message: decision.message,

          recommendedNextAction:
            RECOMMENDED_ACTIONS[decision.reasonCode] ?? "Review manually.",

          groupingKey: `${decision.assetId}-${decision.reasonCode}`,
        }),
    );
}
