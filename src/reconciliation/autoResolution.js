/**
 * Applies policy-driven automatic resolution rules to exception cases.
 */
export function applyAutoResolution(exceptionQueue, policy) {
  const rules = policy?.autoResolutionRules;

  if (!rules?.enabled) {
    return {
      exceptions: exceptionQueue,
      autoResolved: [],
    };
  }

  const autoResolved = [];
  const remainingExceptions = [];

  for (const exception of exceptionQueue) {
    let autoResolve = false;

    if (
      rules.conditionDowngrade?.enabled &&
      exception.reasonCode === "CONDITION_DOWNGRADE"
    ) {
      const ranking = policy.conditionSeverityRanking ?? {};

      const before =
        ranking[String(exception.conditionBefore ?? "").toLowerCase()];

      const after =
        ranking[String(exception.conditionAfter ?? "").toLowerCase()];

      const maxRankDifference = rules.conditionDowngrade.maxRankDifference ?? 0;

      if (
        before !== undefined &&
        after !== undefined &&
        after > before &&
        after - before <= maxRankDifference
      ) {
        autoResolve = true;
      }
    }
        if (
      !autoResolve &&
      rules.lateReturn?.enabled &&
      exception.reasonCode === "LATE_RETURN_WITHIN_GRACE_PERIOD"
    ) {
      if (rules.lateReturn.decision === "AUTO_RESOLVE") {
        autoResolve = true;
      }
    }
    if (autoResolve) {
      autoResolved.push({
        ...exception,
        status: "AUTO_RESOLVED",
        resolvedBy: "SYSTEM",
        resolvedAt: new Date().toISOString(),
        resolution: "Automatically resolved according to policy.",
      });
    } else {
      remainingExceptions.push(exception);
    }
  }

  return {
    exceptions: remainingExceptions,
    autoResolved,
  };
}
