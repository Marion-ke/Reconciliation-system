/**
 * Generate dataset profile statistics.
 */
export function buildEventProfile(records) {
  const profile = {
    totalEvents: records.length,

    missingValues: {},

    duplicateEventIds: 0,

    eventTypeCounts: {},

    actorRoleCounts: {},

    conditionCounts: {},
  };

  const seenEventIds = new Set();

  records.forEach((record) => {
    const payload = record.payload;

    // Missing values
    Object.entries(payload).forEach(([field, value]) => {
      if (!value) {
        profile.missingValues[field] = (profile.missingValues[field] || 0) + 1;
      }
    });

    // Duplicate IDs
    if (seenEventIds.has(payload.event_id)) {
      profile.duplicateEventIds += 1;
    } else {
      seenEventIds.add(payload.event_id);
    }

    // Event types
    profile.eventTypeCounts[payload.event_type] =
      (profile.eventTypeCounts[payload.event_type] || 0) + 1;

    // Actor roles
    profile.actorRoleCounts[payload.actor_role] =
      (profile.actorRoleCounts[payload.actor_role] || 0) + 1;

    // Conditions
    if (payload.condition_report) {
      profile.conditionCounts[payload.condition_report] =
        (profile.conditionCounts[payload.condition_report] || 0) + 1;
    }
  });

  return profile;
}
