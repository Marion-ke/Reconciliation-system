import { SOURCE_AUTHORITY } from "../reconciliation/sourceAuthority.js";

function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/**
 * Builds a cross-source conflict report.
 *
 * The report records conflicts already detected by the
 * reconciliation pipeline and identifies the authority
 * classification of the source involved.
 */
export function buildSourceConflictReportCsv({
  reservationConflicts = [],
  auditDiscrepancies = [],
  manualCorrectionDecisions = [],
}) {
  const header = [
    "source_type",
    "source_record_id",
    "asset_id",
    "conflicting_source",
    "conflict_type",
    "severity",
    "reason_code",
    "authority_classification",
    "authority_action",
    "message",
  ].join(",");

  const rows = [];

  // ----------------------------------------
  // Reservation ↔ operational state
  // ----------------------------------------
  for (const conflict of reservationConflicts) {
    rows.push(
      [
        "RESERVATION",
        conflict.reservationId,
        conflict.assetId,
        "OPERATIONAL_EVENT",
        "RESERVATION_VS_OPERATIONAL_STATE",
        conflict.severity ?? "ERROR",
        conflict.reasonCode,
        SOURCE_AUTHORITY.reservations.classification,
        SOURCE_AUTHORITY.reservations.conflictAction,
        conflict.message,
      ]
        .map(csv)
        .join(","),
    );
  }

  // ----------------------------------------
  // Audit ↔ operational/reconciled state
  // ----------------------------------------
  for (const discrepancy of auditDiscrepancies) {
    rows.push(
      [
        "AUDIT",
        discrepancy.observationId,
        discrepancy.assetId,
        "OPERATIONAL_STATE",
        "AUDIT_VS_RECONCILED_STATE",
        discrepancy.severity ?? "WARNING",
        discrepancy.reasonCode,
        SOURCE_AUTHORITY.audits.classification,
        SOURCE_AUTHORITY.audits.conflictAction,
        discrepancy.message,
      ]
        .map(csv)
        .join(","),
    );
  }

  // ----------------------------------------
  // Manual correction controls
  // ----------------------------------------
  for (const correction of manualCorrectionDecisions) {
    if (
      correction.reasonCode !== "MANUAL_CORRECTION_UNAUTHORIZED" &&
      correction.reasonCode !== "MANUAL_CORRECTION_INSUFFICIENT_EVIDENCE"
    ) {
      continue;
    }

    rows.push(
      [
        "MANUAL_CORRECTION",
        correction.correctionId,
        correction.assetId,
        "OPERATIONAL_STATE",
        "MANUAL_CORRECTION_CONTROL_FAILURE",
        correction.severity ?? "WARNING",
        correction.reasonCode,
        SOURCE_AUTHORITY.manualCorrections.classification,
        SOURCE_AUTHORITY.manualCorrections.conflictAction,
        correction.message,
      ]
        .map(csv)
        .join(","),
    );
  }

  return [header, ...rows].join("\n");
}
