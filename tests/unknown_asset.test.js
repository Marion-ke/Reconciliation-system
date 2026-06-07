import { describe, test, expect } from "@jest/globals";

import { validateEvents } from "../src/validation/eventValidator.js";

import { mockPolicy } from "./fixtures/mockPolicy.js";

import { mockInventory } from "./fixtures/mockInventory.js";

import { createEvent } from "./fixtures/createEvent.js";

describe("Unknown Asset Validation", () => {
  test("should detect unknown asset", () => {
    const records = [
      createEvent({
        asset_id: "cam-999",
      }),
    ];

    const errors = validateEvents(records, mockPolicy, mockInventory);

    expect(errors.some((error) => error.reasonCode === "UNKNOWN_ASSET")).toBe(
      true,
    );
  });
});
