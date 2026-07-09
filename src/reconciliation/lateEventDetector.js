/**
 * Marks events that arrived later than allowed
 * by policy.
 */
export function detectLateEvents(events, policy) {
  const threshold = policy.lateEventPolicy?.thresholdHours ?? 24;

  const enabled = policy.lateEventPolicy?.enabled ?? false;

  if (!enabled) {
    return events.map((event) => ({
      ...event,
      isLateEvent: false,
      lateHours: 0,
    }));
  }

  return events.map((event) => {
    const occurred = new Date(event.occurredAt);

    const received = new Date(event.receivedAt);

    const hoursLate = (received - occurred) / (1000 * 60 * 60);

    return {
      ...event,
      lateHours: hoursLate,
      isLateEvent: hoursLate > threshold,
    };
  });
}
