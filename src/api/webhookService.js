import {
  insertWebhookConfiguration,
  listActiveWebhookConfigurations,
  insertWebhookDispatch,
} from "../persistence/repository.js";

/**
 * Register a webhook configuration.
 */
export async function registerWebhook({
  url,
  eventTypes = [],
  severities = [],
}) {
  const webhookId = `wh-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  return insertWebhookConfiguration({
    webhookId,
    url,
    eventTypes,
    severities,
    active: true,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Determines whether a webhook should receive a notification.
 */
export function webhookMatches(webhook, { eventType, severity }) {
  const matchesEventType =
    webhook.event_types.length === 0 || webhook.event_types.includes(eventType);

  const matchesSeverity =
    webhook.severities.length === 0 || webhook.severities.includes(severity);

  return matchesEventType && matchesSeverity;
}

/**
 * Dispatch one payload with a maximum of three attempts.
 */
export async function dispatchWebhook({
  webhook,
  payload,
  runId = null,
  eventId = null,
  exceptionCaseId = null,
  fetchImpl = fetch,
}) {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetchImpl(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.text();

      await insertWebhookDispatch({
        dispatchId: `${webhook.webhook_id}-${Date.now()}-${attempt}`,
        webhookId: webhook.webhook_id,
        runId,
        eventId,
        exceptionCaseId,
        attempt,
        status: response.ok ? "SUCCESS" : "FAILED",
        payload,
        responseCode: response.status,
        responseBody,
        attemptedAt: new Date().toISOString(),
      });

      if (response.ok) {
        return {
          success: true,
          attempts: attempt,
        };
      }

      lastError = new Error(`Webhook returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;

      await insertWebhookDispatch({
        dispatchId: `${webhook.webhook_id}-${Date.now()}-${attempt}`,
        webhookId: webhook.webhook_id,
        runId,
        eventId,
        exceptionCaseId,
        attempt,
        status: "FAILED",
        payload,
        errorMessage: error.message,
        attemptedAt: new Date().toISOString(),
      });
    }
  }

  return {
    success: false,
    attempts: 3,
    error: lastError?.message ?? "Webhook delivery failed.",
  };
}

/**
 * Dispatch a notification to all matching active webhooks.
 */
export async function dispatchToMatchingWebhooks({
  eventType,
  severity,
  payload,
  runId = null,
  eventId = null,
  exceptionCaseId = null,
  fetchImpl = fetch,
}) {
  const webhooks = await listActiveWebhookConfigurations();

  const matchingWebhooks = webhooks.filter((webhook) =>
    webhookMatches(webhook, {
      eventType,
      severity,
    }),
  );

  const results = [];

  for (const webhook of matchingWebhooks) {
    results.push(
      await dispatchWebhook({
        webhook,
        payload,
        runId,
        eventId,
        exceptionCaseId,
        fetchImpl,
      }),
    );
  }

  return results;
}
