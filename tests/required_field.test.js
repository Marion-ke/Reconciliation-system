import { describe, test, expect } from "@jest/globals";

import { validateEvents } from "../src/validation/eventValidator.js";

import { mockPolicy } from "./fixtures/mockPolicy.js";

import { mockInventory } from "./fixtures/mockInventory.js";

import { createEvent } from "./fixtures/createEvent.js";

describe("Required Field Validation", () => {
  test("should detect missing occurred_at", () => {
    const records = [
      createEvent({
        occurred_at: "",
      }),
    ];

    const errors = validateEvents(records, mockPolicy, mockInventory);

    expect(
      errors.some((error) => error.reasonCode === "MISSING_REQUIRED_FIELD"),
    ).toBe(true);
  });
});
