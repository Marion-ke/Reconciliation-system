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

export function buildAutoResolutionSummary(resolutions = []) {
  const headers = [
    "exception_id",
    "asset_id",
    "event_id",
    "exception_type",
    "rule_id",
    "rule_name",
    "previous_state",
    "resulting_state",
    "resolution_status",
    "resolved_at",
  ];

  const rows = [headers.join(",")];

  for (const resolution of resolutions) {
    let ruleId = "";
    let ruleName = "";

    if (resolution.reasonCode === "CONDITION_DOWNGRADE") {
      ruleId = "AUTO-CONDITION-DOWNGRADE";
      ruleName = "Minor Condition Downgrade";
    }

    if (resolution.reasonCode === "LATE_RETURN_WITHIN_GRACE_PERIOD") {
      ruleId = "AUTO-LATE-RETURN-GRACE";
      ruleName = "Late Return Within Grace Period";
    }

    let previousState = "";
    let resultingState = "";

    if (resolution.reasonCode === "CONDITION_DOWNGRADE") {
      previousState = resolution.conditionBefore ?? "";
      resultingState = resolution.conditionAfter ?? "";
    }

    if (resolution.reasonCode === "LATE_RETURN_WITHIN_GRACE_PERIOD") {
      previousState = "CHECKED_OUT";
      resultingState = "AVAILABLE";
    }

    rows.push(
      [
        resolution.caseId ?? "",
        resolution.assetId ?? "",
        resolution.eventId ?? "",
        resolution.reasonCode ?? "",
        ruleId,
        ruleName,
        previousState,
        resultingState,
        resolution.status ?? "AUTO_RESOLVED",
        resolution.resolvedAt ?? "",
      ]
        .map(escapeCsv)
        .join(","),
    );
  }

  return rows.join("\n");
}
