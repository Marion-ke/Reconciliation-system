/**
 * Converts a policy version into the common shape expected by
 * the reconciliation decision engine.
 *
 * The adapter preserves the original policy object and only supplies
 * compatibility fields required by shared decision logic.
 */
export function adaptPolicyForReconciliation(policy) {
  const adaptedPolicy = {
    ...policy,
  };

  /*
   * Policy v1 uses maxActiveItemsPerStudent.
   * Policy v2 uses checkoutLimits by actor role.
   *
   * Normalize v1 into the same checkoutLimits structure used by
   * the current decision engine.
   */
  if (!adaptedPolicy.checkoutLimits) {
    adaptedPolicy.checkoutLimits = {
      student: adaptedPolicy.maxActiveItemsPerStudent,
    };
  }

  return adaptedPolicy;
}
