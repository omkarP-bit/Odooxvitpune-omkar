const evaluateApprovalOutcome = ({ approvals, ruleConfig }) => {
    const approved = approvals.filter((a) => a.decision === "approved");
    const rejected = approvals.filter((a) => a.decision === "rejected");
    const total = approvals.length;

    if (rejected.length > 0) {
        return "rejected";
    }

    const specificRole = ruleConfig?.specific_approver_role || null;
    if (specificRole) {
        const specificApproved = approved.some((a) => a.approver_role === specificRole);
        if (specificApproved) {
            return "approved";
        }
    }

    const threshold = Number(ruleConfig?.percentage_threshold || 0);
    if (threshold > 0 && total > 0) {
        const ratio = (approved.length / total) * 100;
        if (ratio >= threshold) {
            return "approved";
        }
    }

    if (approved.length === total && total > 0) {
        return "approved";
    }

    return "pending";
};

module.exports = { evaluateApprovalOutcome };
