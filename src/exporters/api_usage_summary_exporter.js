export function buildApiUsageSummary(apiUsageRecords = []) {
  const endpointStats = new Map();

  let totalRequests = 0;
  let totalErrors = 0;
  let totalResponseTime = 0;

  for (const record of apiUsageRecords) {
    const method = record.method ?? "UNKNOWN";
    const endpoint = record.endpoint ?? "UNKNOWN";
    const statusCode = Number(record.statusCode ?? record.status_code ?? 0);
    const responseTime = Number(
      record.responseTimeMs ?? record.response_time_ms ?? 0,
    );

    const key = `${method} ${endpoint}`;

    if (!endpointStats.has(key)) {
      endpointStats.set(key, {
        count: 0,
        errors: 0,
        responseTime: 0,
      });
    }

    const stats = endpointStats.get(key);

    stats.count += 1;
    stats.responseTime += responseTime;

    if (statusCode >= 400) {
      stats.errors += 1;
      totalErrors += 1;
    }

    totalRequests += 1;
    totalResponseTime += responseTime;
  }

  const errorRate =
    totalRequests === 0 ? 0 : (totalErrors / totalRequests) * 100;

  const averageResponseTime =
    totalRequests === 0 ? 0 : totalResponseTime / totalRequests;

  const lines = [
    "# API Usage Summary",
    "",
    "## Overview",
    "",
    `- Total Requests: ${totalRequests}`,
    `- Total Errors: ${totalErrors}`,
    `- Error Rate: ${errorRate.toFixed(2)}%`,
    `- Average Response Time: ${averageResponseTime.toFixed(2)} ms`,
    "",
    "## Endpoint Statistics",
    "",
  ];

  if (endpointStats.size === 0) {
    lines.push("- No API usage records available.");
  } else {
    for (const [endpoint, stats] of endpointStats) {
      const endpointErrorRate =
        stats.count === 0 ? 0 : (stats.errors / stats.count) * 100;

      const endpointAverage =
        stats.count === 0 ? 0 : stats.responseTime / stats.count;

      lines.push(`### ${endpoint}`);
      lines.push(`- Requests: ${stats.count}`);
      lines.push(`- Errors: ${stats.errors}`);
      lines.push(`- Error Rate: ${endpointErrorRate.toFixed(2)}%`);
      lines.push(`- Average Response Time: ${endpointAverage.toFixed(2)} ms`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
