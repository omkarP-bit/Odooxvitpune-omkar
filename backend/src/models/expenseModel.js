const pool = require("../config/db");

const createExpensesTable = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id BIGSERIAL PRIMARY KEY,
        public_id UUID UNIQUE NOT NULL,
        company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        employee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_original NUMERIC(14, 2) NOT NULL,
        original_currency VARCHAR(10) NOT NULL,
        amount_company_currency NUMERIC(14, 2) NOT NULL,
        company_currency VARCHAR(10) NOT NULL,
        category VARCHAR(80) NOT NULL,
        description TEXT,
        expense_date DATE NOT NULL,
        receipt_text TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_expenses_employee_date ON expenses(employee_id, expense_date);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_expenses_company_status ON expenses(company_id, status);`);
};

const createExpense = async ({
    publicId,
    companyId,
    employeeId,
    amountOriginal,
    originalCurrency,
    amountCompanyCurrency,
    companyCurrency,
    category,
    description,
    expenseDate,
    receiptText
}) => {
    const result = await pool.query(
        `
          INSERT INTO expenses (
            public_id,
            company_id,
            employee_id,
            amount_original,
            original_currency,
            amount_company_currency,
            company_currency,
            category,
            description,
            expense_date,
            receipt_text
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          RETURNING *
        `,
        [
            publicId,
            companyId,
            employeeId,
            amountOriginal,
            originalCurrency,
            amountCompanyCurrency,
            companyCurrency,
            category,
            description || null,
            expenseDate,
            receiptText || null
        ]
    );

    return result.rows[0];
};

const findPotentialDuplicate = async ({ employeeId, amountOriginal, originalCurrency, expenseDate, category }) => {
    const result = await pool.query(
        `
          SELECT *
          FROM expenses
          WHERE employee_id = $1
            AND amount_original = $2
            AND original_currency = $3
            AND expense_date = $4
            AND LOWER(category) = LOWER($5)
          LIMIT 1
        `,
        [employeeId, amountOriginal, originalCurrency, expenseDate, category]
    );

    return result.rows[0] || null;
};

const listExpensesByEmployee = async (employeeId) => {
    const result = await pool.query(
        `SELECT * FROM expenses WHERE employee_id = $1 ORDER BY created_at DESC`,
        [employeeId]
    );

    return result.rows;
};

const findExpenseByPublicId = async (publicId) => {
    const result = await pool.query(
        `SELECT * FROM expenses WHERE public_id = $1`,
        [publicId]
    );

    return result.rows[0] || null;
};

const updateExpenseStatus = async ({ expenseId, status }) => {
    const result = await pool.query(
        `UPDATE expenses SET status = $2 WHERE id = $1 RETURNING *`,
        [expenseId, status]
    );

    return result.rows[0] || null;
};

module.exports = {
    createExpensesTable,
    createExpense,
    findPotentialDuplicate,
    listExpensesByEmployee,
    findExpenseByPublicId,
    updateExpenseStatus
};
