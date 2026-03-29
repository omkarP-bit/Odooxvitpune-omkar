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

const LEGACY_DEFAULT_CONDITION = "all";

const normalizeStep = (step, fallbackSequence) => {
    const roleSlots = Array.isArray(step?.roleSlots)
        ? step.roleSlots.map((role) => String(role).toLowerCase())
        : [];

    return {
        sequenceNo: Number(step?.sequenceNo || fallbackSequence),
        roleSlots,
        conditionType: String(step?.conditionType || LEGACY_DEFAULT_CONDITION).toLowerCase(),
        percentageThreshold: step?.percentageThreshold || null,
        specificApproverRole: step?.specificApproverRole
            ? String(step.specificApproverRole).toLowerCase()
            : null,
        slaHours: Number(step?.slaHours || 24)
    };
};

const normalizeRulePayload = (payload) => {
    if (Array.isArray(payload?.steps) && payload.steps.length > 0) {
        return payload.steps.map((step, index) => normalizeStep(step, index + 1));
    }

    const steps = [];
    let sequenceNo = 1;

    if (payload?.isManagerApprover !== false) {
        steps.push(
            normalizeStep(
                {
                    sequenceNo,
                    roleSlots: ["manager"],
                    conditionType: LEGACY_DEFAULT_CONDITION,
                    slaHours: 24
                },
                sequenceNo
            )
        );
        sequenceNo += 1;
    }

    const additionalRoles = Array.isArray(payload?.additionalApproverRoles)
        ? payload.additionalApproverRoles
        : [];

    additionalRoles.forEach((role) => {
        steps.push(
            normalizeStep(
                {
                    sequenceNo,
                    roleSlots: [String(role).toLowerCase()],
                    conditionType: LEGACY_DEFAULT_CONDITION,
                    slaHours: 24
                },
                sequenceNo
            )
        );
        sequenceNo += 1;
    });

    if (steps.length === 0) {
        steps.push(
            normalizeStep(
                {
                    sequenceNo: 1,
                    roleSlots: ["admin"],
                    conditionType: LEGACY_DEFAULT_CONDITION,
                    slaHours: 24
                },
                1
            )
        );
    }

    const lastStep = steps[steps.length - 1];
    const hasThreshold = Number(payload?.percentageThreshold || 0) > 0;
    const hasSpecific = Boolean(payload?.specificApproverRole);

    if (hasThreshold && hasSpecific) {
        lastStep.conditionType = "hybrid";
        lastStep.percentageThreshold = Number(payload.percentageThreshold);
        lastStep.specificApproverRole = String(payload.specificApproverRole).toLowerCase();
    } else if (hasThreshold) {
        lastStep.conditionType = "percentage";
        lastStep.percentageThreshold = Number(payload.percentageThreshold);
    } else if (hasSpecific) {
        lastStep.conditionType = "specific";
        lastStep.specificApproverRole = String(payload.specificApproverRole).toLowerCase();
    }

    return steps;
};

const getRuleConfig = async (companyId) => {
    const existing = await findRuleByCompanyId(companyId);
    if (existing && Array.isArray(existing.steps) && existing.steps.length > 0) {
        return existing;
    }

    return {
        company_id: companyId,
        steps: [
            {
                sequenceNo: 1,
                roleSlots: ["manager"],
                conditionType: "all",
                percentageThreshold: null,
                specificApproverRole: null,
                slaHours: 24
            },
            {
                sequenceNo: 2,
                roleSlots: ["finance"],
                conditionType: "all",
                percentageThreshold: null,
                specificApproverRole: null,
                slaHours: 24
            },
            {
                sequenceNo: 3,
                roleSlots: ["director"],
                conditionType: "hybrid",
                percentageThreshold: 60,
                specificApproverRole: "cfo",
                slaHours: 24
            }
        ]
    };
};

const upsertApprovalRule = async ({ adminUserId, payload }) => {
    const admin = await findUserById(adminUserId);
    if (!admin || admin.role !== "admin") {
        throw new Error("Only admins can configure approval rules");
    }

    const steps = normalizeRulePayload(payload);

    const rule = await upsertRule({
        companyId: admin.company_id,
        steps
    });

    return rule;
};

const getPendingApprovals = async (userId) => {
    return listPendingApprovalsForUser(userId);
};

const buildApprovalStepsForExpense = async ({ expense, employee }) => {
    const rule = await getRuleConfig(employee.company_id);

    const steps = [];
    const configuredSteps = (rule.steps || []).slice().sort((a, b) => a.sequenceNo - b.sequenceNo);

    for (const configuredStep of configuredSteps) {
        const seenInStep = new Set();

        for (const roleSlotRaw of configuredStep.roleSlots || []) {
            const roleSlot = String(roleSlotRaw).toLowerCase();

            if (roleSlot === "manager") {
                if (!employee.manager_id) {
                    continue;
                }

                const manager = await findUserById(employee.manager_id);
                if (!manager || manager.company_id !== employee.company_id || seenInStep.has(manager.id)) {
                    continue;
                }

                steps.push({
                    expenseId: expense.id,
                    approverId: manager.id,
                    approverRole: manager.role,
                    sequenceNo: configuredStep.sequenceNo,
                    dueAt: computeDueAt({ createdAt: new Date(), hours: configuredStep.slaHours || 24 })
                });
                seenInStep.add(manager.id);
                continue;
            }

            const users = await listUsersByRoles({
                companyId: employee.company_id,
                roles: [roleSlot]
            });

            users.forEach((user) => {
                if (seenInStep.has(user.id)) {
                    return;
                }

                steps.push({
                    expenseId: expense.id,
                    approverId: user.id,
                    approverRole: user.role,
                    sequenceNo: configuredStep.sequenceNo,
                    dueAt: computeDueAt({ createdAt: new Date(), hours: configuredStep.slaHours || 24 })
                });
                seenInStep.add(user.id);
            });
        }

        const hasApproverForStep = steps.some(
            (step) => Number(step.sequenceNo) === Number(configuredStep.sequenceNo)
        );
        if (!hasApproverForStep) {
            throw new Error(`No approver found for sequence step ${configuredStep.sequenceNo}`);
        }
    }

    if (steps.length === 0) {
        throw new Error("No approver configured for this company");
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
