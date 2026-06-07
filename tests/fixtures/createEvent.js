export function createEvent(overrides = {}) {
  return {
    rawRecordId: overrides.rawRecordId ?? "test-record",

    payload: {
      event_id: "e001",
      occurred_at: "2026-06-01T08:00:00Z",
      received_at: "2026-06-01T08:01:00Z",
      actor_id: "s001",
      actor_role: "student",
      event_type: "CHECKOUT",
      asset_id: "cam-001",
      location_id: "LIBRARY",
      condition_report: "good",
      source_system: "inventory_app",
      note: "",

      ...overrides,
    },
  };
}
