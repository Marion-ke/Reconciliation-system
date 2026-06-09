/**
 * Sort canonical events in a
 * deterministic order.
 */
export function sortCanonicalEvents(canonicalEvents) {
  return [...canonicalEvents].sort((a, b) => {
    const occurredDiff = Date.parse(a.occurredAt) - Date.parse(b.occurredAt);

    if (occurredDiff !== 0) {
      return occurredDiff;
    }

    const receivedDiff = Date.parse(a.receivedAt) - Date.parse(b.receivedAt);

    if (receivedDiff !== 0) {
      return receivedDiff;
    }

    return a.eventId.localeCompare(b.eventId);
  });
}
