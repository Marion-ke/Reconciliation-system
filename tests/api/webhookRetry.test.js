import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { dispatchWebhook } from "../../src/api/webhookService.js";
import { initializeDatabase } from "../../src/persistence/database.js";
import { insertWebhookConfiguration } from "../../src/persistence/repository.js";
describe("Webhook retry logic", () => {
  beforeEach(async () => {
    await initializeDatabase();
  });
  test("retries failed webhook delivery up to 3 attempts", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "server error",
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "service unavailable",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "accepted",
      });

    const webhook = {
      webhook_id: "wh-retry-001",
      url: "https://example.com/webhook",
    };
    await insertWebhookConfiguration({
      webhookId: "wh-retry-001",
      url: "https://example.com/webhook",
      eventTypes: [],
      severities: [],
      active: true,
      createdAt: "2026-08-31T10:00:00.000Z",
    });
    const result = await dispatchWebhook({
      webhook,
      payload: {
        eventId: "e-retry-001",
        severity: "ERROR",
      },
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
  });
});
