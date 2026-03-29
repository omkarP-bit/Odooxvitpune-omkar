const pool = require("../config/db");

const createApprovalRulesTable = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approval_rules (
        id BIGSERIAL PRIMARY KEY,
        company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS approval_rule_steps (
        id BIGSERIAL PRIMARY KEY,
        rule_id BIGINT NOT NULL REFERENCES approval_rules(id) ON DELETE CASCADE,
        sequence_no INTEGER NOT NULL,
        role_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
        condition_type VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (condition_type IN ('all', 'percentage', 'specific', 'hybrid')),
        percentage_threshold INTEGER,
        specific_approver_role VARCHAR(20),
        sla_hours INTEGER NOT NULL DEFAULT 24,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(rule_id, sequence_no)
      );
    `);

    await pool.query(`ALTER TABLE approval_rule_steps ADD COLUMN IF NOT EXISTS role_slots JSONB NOT NULL DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE approval_rule_steps ADD COLUMN IF NOT EXISTS condition_type VARCHAR(20) NOT NULL DEFAULT 'all';`);
    await pool.query(`ALTER TABLE approval_rule_steps ADD COLUMN IF NOT EXISTS percentage_threshold INTEGER;`);
    await pool.query(`ALTER TABLE approval_rule_steps ADD COLUMN IF NOT EXISTS specific_approver_role VARCHAR(20);`);
    await pool.query(`ALTER TABLE approval_rule_steps ADD COLUMN IF NOT EXISTS sla_hours INTEGER NOT NULL DEFAULT 24;`);
};

const upsertRule = async ({ companyId, steps }) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const ruleResult = await client.query(
            `
              INSERT INTO approval_rules (company_id, updated_at)
              VALUES ($1, CURRENT_TIMESTAMP)
              ON CONFLICT (company_id)
              DO UPDATE SET updated_at = CURRENT_TIMESTAMP
              RETURNING id, company_id, created_at, updated_at
            `,
            [companyId]
        );

        const rule = ruleResult.rows[0];

        await client.query(`DELETE FROM approval_rule_steps WHERE rule_id = $1`, [rule.id]);

        const normalizedSteps = (steps || [])
            .slice()
            .sort((a, b) => Number(a.sequenceNo) - Number(b.sequenceNo));

        for (const step of normalizedSteps) {
            await client.query(
                `
                  INSERT INTO approval_rule_steps (
                    rule_id,
                    sequence_no,
                    role_slots,
                    condition_type,
                    percentage_threshold,
                    specific_approver_role,
                    sla_hours
                  )
                  VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
                `,
                [
                    rule.id,
                    Number(step.sequenceNo),
                    JSON.stringify(step.roleSlots || []),
                    String(step.conditionType || "all").toLowerCase(),
                    step.percentageThreshold || null,
                    step.specificApproverRole || null,
                    Number(step.slaHours || 24)
                ]
            );
        }

        await client.query("COMMIT");
        return findRuleByCompanyId(companyId);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const findRuleByCompanyId = async (companyId) => {
    const ruleResult = await pool.query(
        `
          SELECT id, company_id, created_at, updated_at
          FROM approval_rules
          WHERE company_id = $1
        `,
        [companyId]
    );

    const rule = ruleResult.rows[0];
    if (!rule) {
        return null;
    }

    const stepsResult = await pool.query(
        `
          SELECT
            sequence_no,
            role_slots,
            condition_type,
            percentage_threshold,
            specific_approver_role,
            sla_hours
          FROM approval_rule_steps
          WHERE rule_id = $1
          ORDER BY sequence_no ASC
        `,
        [rule.id]
    );

    return {
        ...rule,
        steps: stepsResult.rows.map((row) => ({
            sequenceNo: row.sequence_no,
            roleSlots: Array.isArray(row.role_slots) ? row.role_slots : [],
            conditionType: row.condition_type,
            percentageThreshold: row.percentage_threshold,
            specificApproverRole: row.specific_approver_role,
            slaHours: row.sla_hours
        }))
    };
};

module.exports = {
    createApprovalRulesTable,
    upsertRule,
    findRuleByCompanyId
};
