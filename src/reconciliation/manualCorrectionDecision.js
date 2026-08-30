const AUTHORIZED_ROLES = new Set(["staff", "admin"]);

const REQUIRED_EVIDENCE_FIELDS = ["evidence_ref", "reason"];

export function evaluateManualCorrectionEvent({
  event,
  actorRole,
  evidence,
  assetState,
}) {
  if (!AUTHORIZED_ROLES.has(actorRole)) {
    return {
      decisionType: "REJECTED",
      reasonCode: "MANUAL_CORRECTION_UNAUTHORIZED",
      message:
        "Only authorized administrative actors may perform manual corrections.",
    };
  }

  if (!assetState) {
    return {
      decisionType: "REJECTED",
      reasonCode: "MANUAL_CORRECTION_UNKNOWN_ASSET",
      message: `Asset ${event.asset_id} does not exist.`,
    };
  }

  const missingEvidence = REQUIRED_EVIDENCE_FIELDS.filter(
    (field) =>
      evidence?.[field] === undefined ||
      evidence?.[field] === null ||
      String(evidence[field]).trim() === "",
  );

  if (missingEvidence.length > 0) {
    return {
      decisionType: "REJECTED",
      reasonCode: "MANUAL_CORRECTION_INSUFFICIENT_EVIDENCE",
      message:
        `Manual correction is missing required evidence: ` +
        missingEvidence.join(", "),
    };
  }

  return {
    decisionType: "ACCEPTED_WITH_WARNING",
    reasonCode: "MANUAL_CORRECTION_APPLIED",
    message: `Authorized manual correction applied to asset ${event.asset_id}.`,
  };
}
