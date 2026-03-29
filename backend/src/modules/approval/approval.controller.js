const approvalService = require("./approval.service");

const configureRule = async (req, res, next) => {
    try {
        const rule = await approvalService.upsertApprovalRule({
            adminUserId: req.user.id,
            payload: req.body
        });

        return res.status(200).json({ rule });
    } catch (error) {
        if (error.message.includes("Only admins")) {
            return res.status(403).json({ message: error.message });
        }

        if (error.message.includes("No approver") || error.message.includes("step")) {
            return res.status(400).json({ message: error.message });
        }

        return next(error);
    }
};

const pendingApprovals = async (req, res, next) => {
    try {
        const approvals = await approvalService.getPendingApprovals(req.user.id);
        return res.status(200).json({ approvals });
    } catch (error) {
        return next(error);
    }
};

const decideApproval = async (req, res, next) => {
    try {
        const { decision, comments } = req.body;

        const result = await approvalService.decideExpenseApproval({
            expensePublicId: req.params.expenseId,
            approverUserId: req.user.id,
            decision,
            comments
        });

        return res.status(200).json(result);
    } catch (error) {
        if (error.message.includes("not found") || error.message.includes("decision") || error.message.includes("Waiting") || error.message.includes("No approval") || error.message.includes("already")) {
            return res.status(400).json({ message: error.message });
        }

        return next(error);
    }
};

module.exports = {
    configureRule,
    pendingApprovals,
    decideApproval
};
