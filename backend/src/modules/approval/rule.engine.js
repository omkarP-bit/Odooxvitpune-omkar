const evaluateStepOutcome = ({ stepApprovals, stepRule }) => {
    if (!stepApprovals.length) {
        return "pending";
    }

    const approved = stepApprovals.filter((item) => item.decision === "approved");
    const rejected = stepApprovals.filter((item) => item.decision === "rejected");
    const total = stepApprovals.length;

    if (rejected.length > 0) {
        return "rejected";
    }

    const conditionType = String(stepRule?.conditionType || "all").toLowerCase();
    const threshold = Number(stepRule?.percentageThreshold || 0);
    const specificRole = stepRule?.specificApproverRole || null;
    const approvedRatio = total > 0 ? (approved.length / total) * 100 : 0;
    const specificApproved = specificRole
        ? approved.some((item) => item.approver_role === specificRole)
        : false;

    if (conditionType === "all") {
        return approved.length === total ? "approved" : "pending";
    }

    if (conditionType === "percentage") {
        return total > 0 && approvedRatio >= threshold ? "approved" : "pending";
    }

    if (conditionType === "specific") {
        return specificApproved ? "approved" : "pending";
    }

    if (conditionType === "hybrid") {
        const percentageHit = total > 0 && threshold > 0 && approvedRatio >= threshold;
        return percentageHit || specificApproved ? "approved" : "pending";
    }

    return approved.length === total ? "approved" : "pending";
};

const evaluateApprovalOutcome = ({ approvals, ruleConfig }) => {
    const steps = Array.isArray(ruleConfig?.steps) ? ruleConfig.steps : [];

    for (const step of steps) {
        const stepApprovals = approvals.filter(
            (item) => Number(item.sequence_no) === Number(step.sequenceNo)
        );
        const stepOutcome = evaluateStepOutcome({ stepApprovals, stepRule: step });

        if (stepOutcome === "rejected") {
            return "rejected";
        }

        if (stepOutcome === "pending") {
            return "pending";
        }
    }

    return steps.length > 0 ? "approved" : "pending";
};

module.exports = { evaluateStepOutcome, evaluateApprovalOutcome };
