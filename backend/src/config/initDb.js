const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db");
const { createCompaniesTable, createCompany, findCompanyByName } = require("../models/companyModel");
const { createApprovalRulesTable, upsertRule } = require("../models/approvalRuleModel");
const { createExpensesTable } = require("../models/expenseModel");
const { createExpenseApprovalsTable } = require("../models/approvalModel");
const {
    createUsersTable,
    createUser,
    findUserByEmail
} = require("../models/userModel");
const { DEFAULT_CURRENCY } = require("../utils/countryCurrency");

const initializeDatabase = async () => {
    await createCompaniesTable();
    await createUsersTable();
    await createApprovalRulesTable();
    await createExpensesTable();
    await createExpenseApprovalsTable();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const adminName = process.env.ADMIN_NAME || "System Admin";
    const adminCompanyName = process.env.ADMIN_COMPANY_NAME || "Default Company";
    const adminCountry = process.env.ADMIN_COUNTRY || "India";
    const adminCurrency = process.env.ADMIN_CURRENCY || DEFAULT_CURRENCY;

    let company = await findCompanyByName(adminCompanyName);
    if (!company) {
        company = await createCompany({
            publicId: uuidv4(),
            name: adminCompanyName,
            country: adminCountry,
            currencyCode: adminCurrency
        });
    }

    const existingAdmin = await findUserByEmail(adminEmail);

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        await createUser({
            publicId: uuidv4(),
            companyId: company.id,
            managerId: null,
            name: adminName,
            email: adminEmail,
            passwordHash,
            role: "admin"
        });

        console.log(`Default admin created: ${adminEmail}`);
    } else {
        await pool.query(
            `
              UPDATE users
              SET company_id = COALESCE(company_id, $2),
                  public_id = COALESCE(public_id, $3),
                  role = COALESCE(role, 'admin')
              WHERE id = $1
            `,
            [existingAdmin.id, company.id, uuidv4()]
        );
    }

    await upsertRule({
        companyId: company.id,
        isManagerApprover: true,
        additionalApproverRoles: ["finance", "director"],
        percentageThreshold: 60,
        specificApproverRole: "cfo"
    });
};

module.exports = { initializeDatabase };
