import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";

import { createApiServer } from "../../src/api/server.js";
import { initializeDatabase } from "../../src/persistence/database.js";
import db from "../../src/persistence/database.js";
import { getWebhookDispatches } from "../../src/persistence/repository.js";

function clearDatabase() {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM reconciliation_runs", (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

const inventoryRawRecords = [
  {
    rawRecordId: "packet04-inventory-001",
    sourceFile: "inventory.csv",
    sourceRow: 1,
    payload: {
      asset_id: "cam-001",
      asset_type: "camera",
      status: "AVAILABLE",
      holder_id: "",
      location_id: "media-lab",
      condition: "good",
      due_at: "",
    },
  },
];

const packet04Policy = {
  policyVersion: "2.0.0",

  eventDefinitions: {
    AUDIT_OBSERVATION: {},
  },

  actorPermissions: {
    technician: ["AUDIT_OBSERVATION"],
  },

  allowedConditions: [
    "new",
    "good",
    "worn",
    "scratched",
    "damaged",
    "unusable",
  ],

  conditionSeverityRanking: {
    new: 0,
    good: 1,
    worn: 2,
    scratched: 3,
    damaged: 4,
    unusable: 5,
  },

  autoResolutionRules: {
    enabled: true,
    conditionDowngrade: {
      enabled: true,
      maxRankDifference: 1,
      decision: "ACCEPTED_WITH_WARNING",
    },
  },

  lateEventPolicy: {
    enabled: true,
    thresholdHours: 24,
    decision: "ACCEPTED_WITH_WARNING",
  },

  transitionTable: {
    AVAILABLE: {
      AUDIT_OBSERVATION: "AVAILABLE",
    },
  },
};

describe("Packet 04 API → webhook → auto-resolution integration", () => {
  beforeEach(async () => {
    await initializeDatabase();
    await clearDatabase();
  });

  test("submitting a minor condition downgrade triggers a webhook and auto-resolves the exception", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "accepted",
    });

    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    try {
      const app = createApiServer({
        inventoryRawRecords,
        policy: packet04Policy,
      });

      const webhookResponse = await request(app)
        .post("/api/v1/webhooks")
        .send({
          url: "https://example.com/packet04-webhook",
          eventTypes: ["AUDIT_OBSERVATION"],
          severities: ["WARNING"],
        });

      expect(webhookResponse.status).toBe(201);

      const webhookId = webhookResponse.body.webhook.webhookId;

      const response = await request(app)
        .post("/api/v1/events")
        .set("Idempotency-Key", "packet04-auto-resolution-001")
        .send({
          event_id: "packet04-event-001",
          occurred_at: "2026-08-31T09:00:00Z",
          received_at: "2026-08-31T09:01:00Z",
          actor_id: "tech01",
          actor_role: "technician",
          event_type: "AUDIT_OBSERVATION",
          asset_id: "cam-001",
          location_id: "media-lab",
          condition_report: "worn",
          source_system: "audit_system",
        });

      expect(response.status).toBe(200);

      expect(response.body.decisions[0].reasonCode).toBe("CONDITION_DOWNGRADE");

      const dispatches = await getWebhookDispatches(webhookId);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(dispatches).toHaveLength(1);
      expect(dispatches[0].status).toBe("SUCCESS");
      expect(dispatches[0].response_code).toBe(200);

      const exceptionsResponse = await request(app).get("/api/v1/exceptions");

      expect(exceptionsResponse.status).toBe(200);

      const autoResolved = exceptionsResponse.body.exceptions.find(
        (exception) =>
          exception.event_id === "packet04-event-001" &&
          exception.reason_code === "CONDITION_DOWNGRADE",
      );

      expect(autoResolved).toBeDefined();
      expect(autoResolved.status).toBe("AUTO_RESOLVED");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
