function escapeCsv(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function buildWebhookDispatchLog(dispatches = []) {
  const headers = [
    "dispatch_id",
    "webhook_id",
    "run_id",
    "event_id",
    "exception_case_id",
    "target_url",
    "attempt",
    "status",
    "payload",
    "response_code",
    "response_body",
    "error_message",
    "attempted_at",
  ];

  const rows = [headers.join(",")];

  for (const dispatch of dispatches) {
    rows.push(
      [
        dispatch.dispatch_id,
        dispatch.webhook_id,
        dispatch.run_id,
        dispatch.event_id,
        dispatch.exception_case_id,
        dispatch.target_url,
        dispatch.attempt,
        dispatch.status,
        dispatch.payload,
        dispatch.response_code,
        dispatch.response_body,
        dispatch.error_message,
        dispatch.attempted_at,
      ]
        .map(escapeCsv)
        .join(","),
    );
  }

  return rows.join("\n");
}
