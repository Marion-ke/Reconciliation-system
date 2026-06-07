import { describe, test, expect } from "@jest/globals";

import { validateEvents } from "../src/validation/eventValidator.js";

import { mockPolicy } from "./fixtures/mockPolicy.js";

import { mockInventory } from "./fixtures/mockInventory.js";

import { createEvent } from "./fixtures/createEvent.js";

describe("Timestamp Validation", () => {
  test("should detect invalid timestamp", () => {
    const records = [
      createEvent({
        occurred_at: "INVALID_DATE",
      }),
    ];

    const errors = validateEvents(records, mockPolicy, mockInventory);

    expect(
      errors.some((error) => error.reasonCode === "INVALID_TIMESTAMP"),
    ).toBe(true);
  });
});
