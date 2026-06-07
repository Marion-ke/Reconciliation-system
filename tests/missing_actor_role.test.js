import { describe, test, expect } from "@jest/globals";

import { validateEvents } from "../src/validation/eventValidator.js";

import { mockPolicy } from "./fixtures/mockPolicy.js";

import { mockInventory } from "./fixtures/mockInventory.js";

import { createEvent } from "./fixtures/createEvent.js";

describe("Missing Actor Role", () => {
  test("should detect missing actor role", () => {
    const records = [
      createEvent({
        actor_role: "",
      }),
    ];

    const errors = validateEvents(records, mockPolicy, mockInventory);

    expect(
      errors.some((error) => error.reasonCode === "MISSING_ACTOR_ROLE"),
    ).toBe(true);
  });
});
