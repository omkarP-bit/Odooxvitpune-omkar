const { v4: uuidv4 } = require("uuid");
const {
    upsertRule,
    findRuleByCompanyId
} = require("../../models/approvalRuleModel");
const {
    createApprovalSteps,
    listPendingApprovalsForUser,
    findApprovalsByExpenseId,
    findApprovalByExpenseAndApprover,
    setApprovalDecision
} = require("../../models/approvalModel");
const {
    findUserById,
    listUsersByRoles
} = require("../../models/userModel");
const {
    findExpenseByPublicId,
    updateExpenseStatus
} = require("../../models/expenseModel");
const { evaluateApprovalOutcome } = require("./rule.engine");
const { computeDueAt } = require("./sla.engine");

const getRuleConfig = async (companyId) => {
    const existing = await findRuleByCompanyId(companyId);
    if (existing) {
        return existing;
    }

    return {
        company_id: companyId,
        is_manager_approver: true,
        additional_approver_roles: [],
        percentage_threshold: null,
        specific_approver_role: null
    };
};

const upsertApprovalRule = async ({ adminUserId, payload }) => {
    const admin = await findUserById(adminUserId);
    if (!admin || admin.role !== "admin") {
        throw new Error("Only admins can configure approval rules");
    }

    const rule = await upsertRule({
        companyId: admin.company_id,
        isManagerApprover: payload.isManagerApprover !== false,
        additionalApproverRoles: payload.additionalApproverRoles || [],
        percentageThreshold: payload.percentageThreshold || null,
        specificApproverRole: payload.specificApproverRole || null
    });

    return rule;
};

const getPendingApprovals = async (userId) => {
    return listPendingApprovalsForUser(userId);
};

const buildApprovalStepsForExpense = async ({ expense, employee }) => {
    const rule = await getRuleConfig(employee.company_id);

    const steps = [];
    let sequence = 1;
    const seenApproverIds = new Set();

    if (rule.is_manager_approver && employee.manager_id) {
        const manager = await findUserById(employee.manager_id);
        if (manager && manager.company_id === employee.company_id) {
            steps.push({
                expenseId: expense.id,
                approverId: manager.id,
                approverRole: manager.role,
                sequenceNo: sequence,
                dueAt: computeDueAt({ createdAt: new Date(), hours: 24 })
            });
            seenApproverIds.add(manager.id);
            sequence += 1;
        }
    }

    const additionalRoles = Array.isArray(rule.additional_approver_roles)
        ? rule.additional_approver_roles
        : [];

    if (additionalRoles.length > 0) {
        const approvers = await listUsersByRoles({
            companyId: employee.company_id,
            roles: additionalRoles
        });

        approvers.forEach((approver) => {
            if (seenApproverIds.has(approver.id)) {
                return;
            }

            steps.push({
                expenseId: expense.id,
                approverId: approver.id,
                approverRole: approver.role,
                sequenceNo: sequence,
                dueAt: computeDueAt({ createdAt: new Date(), hours: 24 })
            });
            seenApproverIds.add(approver.id);
            sequence += 1;
        });
    }

    if (steps.length === 0) {
        const admins = await listUsersByRoles({ companyId: employee.company_id, roles: ["admin"] });
        const fallbackAdmin = admins[0];

        if (!fallbackAdmin) {
            throw new Error("No approver configured for this company");
        }

        steps.push({
            expenseId: expense.id,
            approverId: fallbackAdmin.id,
            approverRole: fallbackAdmin.role,
            sequenceNo: 1,
            dueAt: computeDueAt({ createdAt: new Date(), hours: 24 })
        });
    }

    await createApprovalSteps(steps);

    return {
        workflowId: uuidv4(),
        stepsCount: steps.length,
        rule
    };
};

const decideExpenseApproval = async ({ expensePublicId, approverUserId, decision, comments }) => {
    if (!["approved", "rejected"].includes(decision)) {
        throw new Error("decision must be approved or rejected");
    }

    const expense = await findExpenseByPublicId(expensePublicId);
    if (!expense) {
        throw new Error("Expense not found");
    }

    const approval = await findApprovalByExpenseAndApprover({
        expenseId: expense.id,
        approverId: approverUserId
    });

    if (!approval) {
        throw new Error("No approval task assigned to this user");
    }

    if (approval.decision !== "pending") {
        throw new Error("This approval has already been decided");
    }

    const allApprovalsBeforeDecision = await findApprovalsByExpenseId(expense.id);
    const smallestPendingSequence = allApprovalsBeforeDecision
        .filter((step) => step.decision === "pending")
        .reduce((min, step) => Math.min(min, step.sequence_no), Number.MAX_SAFE_INTEGER);

    if (approval.sequence_no !== smallestPendingSequence) {
        throw new Error("Waiting for earlier approval step to complete");
    }

    await setApprovalDecision({
        approvalId: approval.id,
        decision,
        comments
    });

    const refreshedApprovals = await findApprovalsByExpenseId(expense.id);
    const ruleConfig = await getRuleConfig(expense.company_id);

    const outcome = evaluateApprovalOutcome({ approvals: refreshedApprovals, ruleConfig });
    if (outcome === "approved" || outcome === "rejected") {
        await updateExpenseStatus({ expenseId: expense.id, status: outcome });
    }

    return {
        expensePublicId,
        workflowState: outcome
    };
};

module.exports = {
    upsertApprovalRule,
    getPendingApprovals,
    buildApprovalStepsForExpense,
    decideExpenseApproval
};
