import { describe, test, expect } from "@jest/globals";

import { validateEvents } from "../src/validation/eventValidator.js";

describe("Duplicate Event Validation", () => {
  test("should detect duplicate event ids", () => {
    const records = [
      {
        rawRecordId: "row-1",

        payload: {
          event_id: "e001",
          occurred_at: "2026-06-01T08:00:00Z",
          received_at: "2026-06-01T08:01:00Z",
          actor_id: "s001",
          actor_role: "student",
          event_type: "CHECKOUT",
          asset_id: "cam-001",
          condition_report: "good",
        },
      },

      {
        rawRecordId: "row-2",

        payload: {
          event_id: "e001",
          occurred_at: "2026-06-01T09:00:00Z",
          received_at: "2026-06-01T09:01:00Z",
          actor_id: "s002",
          actor_role: "student",
          event_type: "CHECKOUT",
          asset_id: "cam-002",
          condition_report: "good",
        },
      },
    ];

    const policy = {
      eventDefinitions: {
        CHECKOUT: {},
      },
      allowedConditions: ["good"],
    };

    const inventory = [
      {
        payload: {
          asset_id: "cam-001",
        },
      },
      {
        payload: {
          asset_id: "cam-002",
        },
      },
    ];

    const errors = validateEvents(records, policy, inventory);

    expect(
      errors.some((error) => error.reasonCode === "DUPLICATE_EVENT_ID"),
    ).toBe(true);
  });
});
