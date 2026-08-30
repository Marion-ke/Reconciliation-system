/**
 * Builds the policy breach summary.
 *
 * The report captures:
 * - unauthorized actions
 * - exceeded checkout limits
 * - unsupported event types
 * - invalid manual corrections
 * - repeat offenders
 */

function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

const DECISION_BREACHES = new Set([
  "UNAUTHORIZED_ACTOR",
  "UNKNOWN_ACTOR_ROLE",
  "CHECKOUT_LIMIT_EXCEEDED",
]);

const VALIDATION_BREACHES = new Set(["UNKNOWN_EVENT_TYPE"]);

const MANUAL_CORRECTION_BREACHES = new Set([
  "MANUAL_CORRECTION_UNAUTHORIZED",
  "MANUAL_CORRECTION_INSUFFICIENT_EVIDENCE",
  "UNAUTHORIZED_CORRECTION",
  "MISSING_CORRECTION_EVIDENCE",
  "INVALID_AUTHORIZATION_OUTCOME",
  "INVALID_CORRECTION_OUTCOME",
]);

export function buildPolicyBreachSummaryCsv({
  decisions = [],
  validationErrors = [],
  eventRawRecords = [],
  manualCorrectionRawRecords = [],
  manualCorrectionDecisions = [],
  policyVersion = "",
}) {
  const header = [
    "policy_version",
    "breach_type",
    "record_id",
    "asset_id",
    "actor_id",
    "actor_role",
    "event_type",
    "decision",
    "reason_code",
    "severity",
    "repeat_offender",
    "repeat_count",
    "message",
  ].join(",");

  const eventByRawRecordId = new Map(
    eventRawRecords.map((record) => [record.rawRecordId, record]),
  );

  const correctionByRawRecordId = new Map(
    manualCorrectionRawRecords.map((record) => [record.rawRecordId, record]),
  );

  const rows = [];

  /*
   * Build actor breach counts first so repeat offenders
   * are calculated from the complete breach set.
   */
  const actorBreachCounts = new Map();

  const addActorCount = (actorId) => {
    if (!actorId) return;

    actorBreachCounts.set(actorId, (actorBreachCounts.get(actorId) ?? 0) + 1);
  };

  /*
   * Event reconciliation breaches.
   */
  for (const decision of decisions) {
    if (!DECISION_BREACHES.has(decision.reasonCode)) {
      continue;
    }

    const rawRecord = eventByRawRecordId.get(decision.rawRecordId);
    const event = rawRecord?.payload ?? {};

    addActorCount(event.actor_id ?? event.actorId);
  }

  /*
   * Unsupported event types found during validation.
   */
  for (const error of validationErrors) {
    if (!VALIDATION_BREACHES.has(error.reasonCode)) {
      continue;
    }

    const rawRecord = eventByRawRecordId.get(error.rawRecordId);
    const event = rawRecord?.payload ?? {};

    addActorCount(event.actor_id ?? event.actorId);
  }

  /*
   * Manual correction control failures.
   */
  for (const decision of manualCorrectionDecisions) {
    if (!MANUAL_CORRECTION_BREACHES.has(decision.reasonCode)) {
      continue;
    }

    const correctionRecord = manualCorrectionRawRecords.find((record) => {
      const correction = record.payload ?? record;

      return (
        correction.correction_id === decision.correctionId ||
        correction.correctionId === decision.correctionId
      );
    });

    const correction = correctionRecord?.payload ?? {};

    addActorCount(correction.actor_id ?? correction.actorId);
  }

  /*
   * Event reconciliation breaches.
   */
  for (const decision of decisions) {
    if (!DECISION_BREACHES.has(decision.reasonCode)) {
      continue;
    }

    const rawRecord = eventByRawRecordId.get(decision.rawRecordId);
    const event = rawRecord?.payload ?? {};

    const actorId = event.actor_id ?? event.actorId ?? "";

    rows.push(
      [
        policyVersion,
        decision.reasonCode === "CHECKOUT_LIMIT_EXCEEDED"
          ? "EXCEEDED_LIMIT"
          : "UNAUTHORIZED_ACTION",
        decision.eventId ?? decision.rawRecordId ?? "",
        decision.assetId ?? "",
        actorId,
        event.actor_role ?? event.actorRole ?? "",
        event.event_type ?? event.eventType ?? decision.eventType ?? "",
        decision.decision ?? "",
        decision.reasonCode ?? "",
        decision.decision === "REJECTED" ? "ERROR" : "WARNING",
        actorBreachCounts.get(actorId) > 1 ? "YES" : "NO",
        actorBreachCounts.get(actorId) ?? 0,
        decision.message ?? "",
      ]
        .map(csv)
        .join(","),
    );
  }

  /*
   * Unsupported event types.
   */
  for (const error of validationErrors) {
    if (!VALIDATION_BREACHES.has(error.reasonCode)) {
      continue;
    }

    const rawRecord = eventByRawRecordId.get(error.rawRecordId);
    const event = rawRecord?.payload ?? {};

    const actorId = event.actor_id ?? event.actorId ?? "";

    rows.push(
      [
        policyVersion,
        "UNSUPPORTED_EVENT_TYPE",
        error.rawRecordId ?? "",
        event.asset_id ?? event.assetId ?? "",
        actorId,
        event.actor_role ?? event.actorRole ?? "",
        event.event_type ?? event.eventType ?? "",
        "REJECTED",
        error.reasonCode ?? "",
        error.severity ?? "ERROR",
        actorBreachCounts.get(actorId) > 1 ? "YES" : "NO",
        actorBreachCounts.get(actorId) ?? 0,
        error.message ?? "",
      ]
        .map(csv)
        .join(","),
    );
  }

  /*
   * Invalid manual corrections.
   */
  for (const decision of manualCorrectionDecisions) {
    if (!MANUAL_CORRECTION_BREACHES.has(decision.reasonCode)) {
      continue;
    }

    const correctionRecord = manualCorrectionRawRecords.find((record) => {
      const correction = record.payload ?? record;

      return (
        correction.correction_id === decision.correctionId ||
        correction.correctionId === decision.correctionId
      );
    });

    const correction = correctionRecord?.payload ?? {};

    const actorId = correction.actor_id ?? correction.actorId ?? "";

    rows.push(
      [
        policyVersion,
        "INVALID_CORRECTION",
        decision.correctionId ?? "",
        decision.assetId ?? "",
        actorId,
        correction.actor_role ?? correction.actorRole ?? "",
        "MANUAL_CORRECTION",
        decision.decisionType ?? "REJECTED",
        decision.reasonCode ?? "",
        decision.severity ?? "ERROR",
        actorBreachCounts.get(actorId) > 1 ? "YES" : "NO",
        actorBreachCounts.get(actorId) ?? 0,
        decision.message ?? "",
      ]
        .map(csv)
        .join(","),
    );
  }

  /*
   * Deterministic ordering makes the report reproducible.
   */
  rows.sort((a, b) => a.localeCompare(b));

  return [header, ...rows].join("\n");
}
