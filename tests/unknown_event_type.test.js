import { describe, test, expect } from "@jest/globals";

import { validateEvents } from "../src/validation/eventValidator.js";

import { mockPolicy } from "./fixtures/mockPolicy.js";

import { mockInventory } from "./fixtures/mockInventory.js";

import { createEvent } from "./fixtures/createEvent.js";

describe("Unknown Event Type Validation", () => {
  test("should detect unknown event type", () => {
    const records = [
      createEvent({
        event_type: "BORROW",
      }),
    ];

    const errors = validateEvents(records, mockPolicy, mockInventory);

    expect(
      errors.some((error) => error.reasonCode === "UNKNOWN_EVENT_TYPE"),
    ).toBe(true);
  });
});
