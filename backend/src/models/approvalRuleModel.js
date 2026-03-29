const pool = require("../config/db");

const createApprovalRulesTable = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approval_rules (
        id BIGSERIAL PRIMARY KEY,
        company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        is_manager_approver BOOLEAN NOT NULL DEFAULT true,
        additional_approver_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
        percentage_threshold INTEGER,
        specific_approver_role VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id)
      );
    `);
};

const upsertRule = async ({
    companyId,
    isManagerApprover,
    additionalApproverRoles,
    percentageThreshold,
    specificApproverRole
}) => {
    const result = await pool.query(
        `
          INSERT INTO approval_rules (
            company_id,
            is_manager_approver,
            additional_approver_roles,
            percentage_threshold,
            specific_approver_role,
            updated_at
          )
          VALUES ($1, $2, $3::jsonb, $4, $5, CURRENT_TIMESTAMP)
          ON CONFLICT (company_id)
          DO UPDATE SET
            is_manager_approver = EXCLUDED.is_manager_approver,
            additional_approver_roles = EXCLUDED.additional_approver_roles,
            percentage_threshold = EXCLUDED.percentage_threshold,
            specific_approver_role = EXCLUDED.specific_approver_role,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id, company_id, is_manager_approver, additional_approver_roles, percentage_threshold, specific_approver_role, created_at, updated_at
        `,
        [
            companyId,
            isManagerApprover,
            JSON.stringify(additionalApproverRoles || []),
            percentageThreshold || null,
            specificApproverRole || null
        ]
    );

    return result.rows[0];
};

const findRuleByCompanyId = async (companyId) => {
    const result = await pool.query(
        `
          SELECT id, company_id, is_manager_approver, additional_approver_roles, percentage_threshold, specific_approver_role, created_at, updated_at
          FROM approval_rules
          WHERE company_id = $1
        `,
        [companyId]
    );

    return result.rows[0] || null;
};

module.exports = {
    createApprovalRulesTable,
    upsertRule,
    findRuleByCompanyId
};
