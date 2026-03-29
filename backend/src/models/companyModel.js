const pool = require("../config/db");

const createCompaniesTable = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id BIGSERIAL PRIMARY KEY,
        public_id UUID UNIQUE NOT NULL,
        name VARCHAR(150) UNIQUE NOT NULL,
        country VARCHAR(120) NOT NULL,
        currency_code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
};

const createCompany = async ({ publicId, name, country, currencyCode }) => {
    const result = await pool.query(
        `
          INSERT INTO companies (public_id, name, country, currency_code)
          VALUES ($1, $2, $3, $4)
          RETURNING id, public_id, name, country, currency_code, created_at
        `,
        [publicId, name, country, currencyCode]
    );

    return result.rows[0];
};

const findCompanyById = async (id) => {
    const result = await pool.query(
        `SELECT id, public_id, name, country, currency_code, created_at FROM companies WHERE id = $1`,
        [id]
    );

    return result.rows[0] || null;
};

const findCompanyByName = async (name) => {
    const result = await pool.query(
        `SELECT id, public_id, name, country, currency_code, created_at FROM companies WHERE LOWER(name) = LOWER($1)`,
        [name]
    );

    return result.rows[0] || null;
};

module.exports = {
    createCompaniesTable,
    createCompany,
    findCompanyById,
    findCompanyByName
};
