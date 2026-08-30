import { describe, test, expect } from "@jest/globals";

import { detectAuditDiscrepancies } from "../../src/reconciliation/auditReconciliation.js";

describe("Audit reconciliation", () => {
  test("detects a discrepancy between observed and reconciled state", () => {
    const auditRecords = [
      {
        rawRecordId: "audit_observations.csv-1",
        payload: {
          observation_id: "AUD-001",
          asset_id: "lap-001",
          observed_status: "available",
          observed_condition: "damaged",
          observed_location_id: "studio-a",
        },
      },
    ];

    const assetStates = new Map([
      [
        "lap-001",
        {
          assetId: "lap-001",
          status: "checked_out",
          condition: "good",
          locationId: "equipment-store",
        },
      ],
    ]);

    const discrepancies = detectAuditDiscrepancies(auditRecords, assetStates);

    expect(discrepancies).toHaveLength(1);

    expect(discrepancies[0].reasonCode).toBe("AUDIT_STATE_DISCREPANCY");

    expect(discrepancies[0].severity).toBe("WARNING");

    expect(discrepancies[0].differences).toEqual(
      expect.arrayContaining(["STATUS", "CONDITION", "LOCATION"]),
    );
  });

  test("does not report a discrepancy when audit matches state", () => {
    const auditRecords = [
      {
        rawRecordId: "audit_observations.csv-2",
        payload: {
          observation_id: "AUD-002",
          asset_id: "lap-001",
          observed_status: "checked_out",
          observed_condition: "good",
          observed_location_id: "equipment-store",
        },
      },
    ];

    const assetStates = new Map([
      [
        "lap-001",
        {
          assetId: "lap-001",
          status: "checked_out",
          condition: "good",
          locationId: "equipment-store",
        },
      ],
    ]);

    const discrepancies = detectAuditDiscrepancies(auditRecords, assetStates);

    expect(discrepancies).toHaveLength(0);
  });

  test("reports an unknown asset", () => {
    const auditRecords = [
      {
        rawRecordId: "audit_observations.csv-3",
        payload: {
          observation_id: "AUD-003",
          asset_id: "ghost-999",
          observed_status: "available",
          observed_condition: "good",
          observed_location_id: "equipment-store",
        },
      },
    ];

    const assetStates = new Map();

    const discrepancies = detectAuditDiscrepancies(auditRecords, assetStates);

    expect(discrepancies).toHaveLength(1);

    expect(discrepancies[0].reasonCode).toBe("AUDIT_UNKNOWN_ASSET");

    expect(discrepancies[0].severity).toBe("ERROR");
  });
});
