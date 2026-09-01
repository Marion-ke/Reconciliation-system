/**
 * Determines whether an actor role is allowed to resolve
 * reconciliation exception cases.
 *
 * Exception resolution is an operational control, so it is
 * restricted to trusted operational roles.
 */
export function canResolveException(actorRole) {
  const allowedRoles = new Set(["admin", "auditor", "staff", "technician"]);

  return allowedRoles.has(String(actorRole).toLowerCase());
}
