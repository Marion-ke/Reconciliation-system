/**
 * Sort canonical events in a
 * deterministic order.
 */
export function sortCanonicalEvents(canonicalEvents) {
  const sourcePriority = {
    repair_system: 1,
    inventory_portal: 2,
    makerspace_app: 3,
  };

  return [...canonicalEvents].sort((a, b) => {
    const occurredDiff = Date.parse(a.occurredAt) - Date.parse(b.occurredAt);

    if (occurredDiff !== 0) {
      return occurredDiff;
    }

    const receivedDiff = Date.parse(a.receivedAt) - Date.parse(b.receivedAt);

    if (receivedDiff !== 0) {
      return receivedDiff;
    }

    const sourceDiff =
      (sourcePriority[a.sourceSystem] ?? 999) -
      (sourcePriority[b.sourceSystem] ?? 999);

    if (sourceDiff !== 0) {
      return sourceDiff;
    }

    const sourceRowDiff = (a.sourceRow ?? 0) - (b.sourceRow ?? 0);

    if (sourceRowDiff !== 0) {
      return sourceRowDiff;
    }

    return a.eventId.localeCompare(b.eventId);
  });
}
