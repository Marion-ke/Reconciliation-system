import { describe, test, expect } from "@jest/globals";

import { buildCanonicalEvents } from "../src/normalization/canonical_mapper.js";

import { createEvent } from "./fixtures/createEvent.js";

describe("Canonical Mapper", () => {
  test("should convert raw records into canonical events", () => {
    const records = [
      createEvent({
        event_id: "e001",
        asset_id: "cam-001",
        event_type: "CHECKOUT",
      }),
    ];

    const canonicalEvents = buildCanonicalEvents(records);

    expect(canonicalEvents.length).toBe(1);

    expect(canonicalEvents[0].eventId).toBe("e001");

    expect(canonicalEvents[0].assetId).toBe("cam-001");

    expect(canonicalEvents[0].eventType).toBe("CHECKOUT");
  });
});
