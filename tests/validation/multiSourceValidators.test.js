import { describe, test, expect } from "@jest/globals";

import { buildRawRecords } from "../../src/ingestion/rawRecordBuilder.js";

import { validateReservations } from "../../src/validation/reservationValidator.js";

import { validateAuditObservations } from "../../src/validation/auditObservationValidator.js";

import { validateManualCorrections } from "../../src/validation/manualCorrectionValidator.js";

describe("Multi-source validation", () => {
  test("validates reservations, audit observations and manual corrections", () => {
    const reservations = buildRawRecords(
      [
        {
          reservation_id: "RES-001",
          asset_id: "lap-001",
          requester_id: "s001",
          requested_at: "2026-08-03T08:00:00Z",
          reserved_from: "2026-08-04T09:00:00Z",
          reserved_until: "2026-08-04T12:00:00Z",
          status: "OPEN",
          source_system: "reservation_system",
        },
      ],
      "reservations.csv",
    );

    const audits = buildRawRecords(
      [
        {
          observation_id: "AUD-001",
          asset_id: "lap-001",
          observed_at: "2026-08-04T10:00:00Z",
          observed_by: "auditor-001",
          observed_location_id: "equipment-store",
          observed_status: "available",
          observed_condition: "good",
          reconciliation_result: "CONFIRMED",
          source_system: "audit_system",
        },
      ],
      "audit_observations.csv",
    );

    const corrections = buildRawRecords(
      [
        {
          correction_id: "MC-001",
          asset_id: "lap-001",
          occurred_at: "2026-08-04T11:00:00Z",
          actor_id: "admin-001",
          actor_role: "admin",
          before_status: "available",
          after_status: "checked_out",
          reason: "Authorized correction",
          evidence_ref: "AUD-001",
          authorization_outcome: "AUTHORIZED",
          outcome: "APPLIED",
          source_system: "admin_portal",
        },
      ],
      "manual_corrections.csv",
    );

    const reservationErrors = validateReservations(reservations);

    const auditErrors = validateAuditObservations(audits);

    const correctionErrors = validateManualCorrections(corrections);

    expect(reservationErrors).toHaveLength(0);
    expect(auditErrors).toHaveLength(0);
    expect(correctionErrors).toHaveLength(0);
  });
});
