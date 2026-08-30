import { describe, test, expect } from "@jest/globals";

import { detectReservationConflicts } from "../../src/reconciliation/reservationReconciliation.js";

describe("Reservation reconciliation", () => {
  test("detects a reservation conflicting with a checkout", () => {
    const reservations = [
      {
        rawRecordId: "reservations.csv-1",
        payload: {
          reservation_id: "RES-001",
          asset_id: "lap-001",
          requester_id: "s002",
          status: "OPEN",
        },
      },
    ];

    const assetStates = new Map([
      [
        "lap-001",
        {
          assetId: "lap-001",
          status: "checked_out",
          holderId: "s001",
        },
      ],
    ]);

    const conflicts = detectReservationConflicts(reservations, assetStates);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].reasonCode).toBe("RESERVATION_CHECKOUT_CONFLICT");
    expect(conflicts[0].assetId).toBe("lap-001");
  });

  test("does not report a conflict when the reservation matches the holder", () => {
    const reservations = [
      {
        rawRecordId: "reservations.csv-2",
        payload: {
          reservation_id: "RES-002",
          asset_id: "lap-001",
          requester_id: "s001",
          status: "OPEN",
        },
      },
    ];

    const assetStates = new Map([
      [
        "lap-001",
        {
          assetId: "lap-001",
          status: "checked_out",
          holderId: "s001",
        },
      ],
    ]);

    const conflicts = detectReservationConflicts(reservations, assetStates);

    expect(conflicts).toHaveLength(0);
  });
});
