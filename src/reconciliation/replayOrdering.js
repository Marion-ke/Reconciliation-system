/**
 * Orders canonical events according to the
 * reconciliation replay policy.
 *
 * Priority:
 * 1. occurred_at
 * 2. received_at
 * 3. event_id
 */
export function orderEvents(events) {
  return [...events].sort((left, right) => {
    // 1. occurred_at
    const occurred = new Date(left.occurredAt) - new Date(right.occurredAt);

    if (occurred !== 0) {
      return occurred;
    }

    // 2. received_at
    const received = new Date(left.receivedAt) - new Date(right.receivedAt);

    if (received !== 0) {
      return received;
    }

    // 3. event_id
    return left.eventId.localeCompare(right.eventId);
  });
}
