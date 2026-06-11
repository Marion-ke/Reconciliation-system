import { describe, test, expect } from "@jest/globals";

import { buildEventProfile } from "../src/profiling/profiler.js";

describe("Profiler", () => {
  test("should generate event statistics", () => {
    const records = [
      {
        payload: {
          event_id: "e001",
          event_type: "CHECKOUT",
          actor_role: "student",
          condition_report: "good",
        },
      },

      {
        payload: {
          event_id: "e002",
          event_type: "CHECKOUT",
          actor_role: "student",
          condition_report: "good",
        },
      },

      {
        payload: {
          event_id: "e003",
          event_type: "RETURN",
          actor_role: "staff",
          condition_report: "scratched",
        },
      },
    ];

    const profile = buildEventProfile(records);

    expect(profile.totalEvents).toBe(3);

    expect(profile.eventTypeCounts.CHECKOUT).toBe(2);

    expect(profile.actorRoleCounts.student).toBe(2);
  });
});
