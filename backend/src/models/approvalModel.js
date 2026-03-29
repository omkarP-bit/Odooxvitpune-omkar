const pool = require("../config/db");

const createExpenseApprovalsTable = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_approvals (
        id BIGSERIAL PRIMARY KEY,
        expense_id BIGINT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        approver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                approver_role VARCHAR(20) NOT NULL,
        sequence_no INTEGER NOT NULL,
        decision VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'approved', 'rejected')),
        comments TEXT,
        decided_at TIMESTAMP WITH TIME ZONE,
        due_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(expense_id, approver_id, sequence_no)
      );
    `);

    await pool.query(`ALTER TABLE expense_approvals ADD COLUMN IF NOT EXISTS approver_role VARCHAR(20);`);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_expense_approvals_approver_decision ON expense_approvals(approver_id, decision);`);
};

const createApprovalSteps = async (steps) => {
    if (!steps.length) {
        return [];
    }

    const values = [];
    const params = [];

    steps.forEach((step, index) => {
        const offset = index * 6;
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
        params.push(step.expenseId, step.approverId, step.approverRole, step.sequenceNo, "pending", step.dueAt || null);
    });

    const result = await pool.query(
        `
          INSERT INTO expense_approvals (expense_id, approver_id, approver_role, sequence_no, decision, due_at)
          VALUES ${values.join(",")}
          RETURNING *
        `,
        params
    );

    return result.rows;
};

const listPendingApprovalsForUser = async (approverId) => {
    const result = await pool.query(
        `
          SELECT ea.*, e.public_id AS expense_public_id, e.amount_company_currency, e.company_currency, e.category, e.expense_date
          FROM expense_approvals ea
          JOIN expenses e ON e.id = ea.expense_id
          WHERE ea.approver_id = $1 AND ea.decision = 'pending'
          ORDER BY ea.sequence_no ASC, ea.created_at ASC
        `,
        [approverId]
    );

    return result.rows;
};

const findApprovalsByExpenseId = async (expenseId) => {
    const result = await pool.query(
        `SELECT * FROM expense_approvals WHERE expense_id = $1 ORDER BY sequence_no ASC`,
        [expenseId]
    );

    return result.rows;
};

const findApprovalByExpenseAndApprover = async ({ expenseId, approverId }) => {
    const result = await pool.query(
        `
          SELECT *
          FROM expense_approvals
          WHERE expense_id = $1 AND approver_id = $2
          ORDER BY sequence_no ASC
          LIMIT 1
        `,
        [expenseId, approverId]
    );

    return result.rows[0] || null;
};

const setApprovalDecision = async ({ approvalId, decision, comments }) => {
    const result = await pool.query(
        `
          UPDATE expense_approvals
          SET decision = $2,
              comments = $3,
              decided_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `,
        [approvalId, decision, comments || null]
    );

    return result.rows[0] || null;
};

module.exports = {
    createExpenseApprovalsTable,
    createApprovalSteps,
    listPendingApprovalsForUser,
    findApprovalsByExpenseId,
    findApprovalByExpenseAndApprover,
    setApprovalDecision
};
