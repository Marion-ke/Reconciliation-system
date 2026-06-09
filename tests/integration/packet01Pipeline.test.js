import { describe, test, expect } from "@jest/globals";

import { validateEvents } from "../../src/validation/eventValidator.js";

import { buildValidationResult } from "../../src/validation/buildValidationResult.js";

import { mockPolicy } from "../fixtures/mockPolicy.js";

import { mockInventory } from "../fixtures/mockInventory.js";

import { createEvent } from "../fixtures/createEvent.js";

describe("Packet 01 Validation Pipeline", () => {
  test("should classify accepted, rejected and warning records correctly", () => {
    const records = [
      // Valid record
      {
        ...createEvent({
          event_id: "e001",
        }),
        rawRecordId: "r1",
      },

      // Rejected record
      {
        ...createEvent({
          event_id: "e002",
          occurred_at: "INVALID_DATE",
        }),
        rawRecordId: "r2",
      },

      // Warning record
      {
        ...createEvent({
          event_id: "e003",
          occurred_at: "2026-06-01T08:00:00Z",
          received_at: "2026-06-05T20:00:00Z",
        }),
        rawRecordId: "r3",
      },
    ];

    const validationErrors = validateEvents(records, mockPolicy, mockInventory);

    const result = buildValidationResult(records, validationErrors);
    // console.log(validationErrors);

    // console.log(result);

    expect(result.acceptedRecords.length).toBe(2);

    expect(result.rejectedRecords.length).toBe(1);

    expect(result.warningRecords.length).toBe(1);
  });
});
