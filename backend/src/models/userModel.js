const pool = require("../config/db");

const createUsersTable = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        public_id UUID UNIQUE NOT NULL,
        company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
        manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'finance', 'director', 'cfo')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS public_id UUID;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20);`);
        await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`);
        await pool.query(`
            ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK (role IN ('admin', 'manager', 'employee', 'finance', 'director', 'cfo'))
        `);
};

const createUser = async ({ publicId, companyId, managerId = null, name, email, passwordHash, role }) => {
    const result = await pool.query(
        `
          INSERT INTO users (public_id, company_id, manager_id, name, email, password_hash, role)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, public_id, company_id, manager_id, name, email, role, created_at
        `,
        [publicId, companyId, managerId, name, email, passwordHash, role]
    );

    return result.rows[0];
};

const findUserByEmail = async (email) => {
    const result = await pool.query(
        `
          SELECT u.id, u.public_id, u.company_id, u.manager_id, u.name, u.email, u.password_hash, u.role, u.created_at,
                 c.public_id AS company_public_id, c.name AS company_name, c.country, c.currency_code
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          WHERE u.email = $1
        `,
        [email]
    );

    return result.rows[0] || null;
};

const findUserById = async (id) => {
    const result = await pool.query(
        `
          SELECT u.id, u.public_id, u.company_id, u.manager_id, u.name, u.email, u.role, u.created_at,
                 c.public_id AS company_public_id, c.name AS company_name, c.country, c.currency_code
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          WHERE u.id = $1
        `,
        [id]
    );

    return result.rows[0] || null;
};

const findUserByPublicId = async (publicId) => {
    const result = await pool.query(
        `
          SELECT u.id, u.public_id, u.company_id, u.manager_id, u.name, u.email, u.role, u.created_at,
                 c.public_id AS company_public_id, c.name AS company_name, c.country, c.currency_code
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          WHERE u.public_id = $1
        `,
        [publicId]
    );

    return result.rows[0] || null;
};

const listUsers = async (companyId) => {
    const result = await pool.query(
        `
          SELECT u.id, u.public_id, u.company_id, u.manager_id, u.name, u.email, u.role, u.created_at,
                 c.public_id AS company_public_id, c.name AS company_name, c.country, c.currency_code
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          WHERE ($1::BIGINT IS NULL OR u.company_id = $1)
          ORDER BY u.id ASC
        `,
        [companyId || null]
    );

    return result.rows;
};

const listUsersByRoles = async ({ companyId, roles }) => {
    const result = await pool.query(
        `
          SELECT u.id, u.public_id, u.company_id, u.manager_id, u.name, u.email, u.role, u.created_at,
                 c.public_id AS company_public_id, c.name AS company_name, c.country, c.currency_code
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          WHERE u.company_id = $1 AND u.role = ANY($2::text[])
          ORDER BY u.id ASC
        `,
        [companyId, roles]
    );

    return result.rows;
};

const updateUserRole = async ({ userId, role }) => {
    const result = await pool.query(
        `UPDATE users SET role = $2 WHERE id = $1 RETURNING id, public_id, company_id, manager_id, name, email, role, created_at`,
        [userId, role]
    );

    return result.rows[0] || null;
};

const updateUserManager = async ({ userId, managerId }) => {
    const result = await pool.query(
        `UPDATE users SET manager_id = $2 WHERE id = $1 RETURNING id, public_id, company_id, manager_id, name, email, role, created_at`,
        [userId, managerId]
    );

    return result.rows[0] || null;
};

module.exports = {
    createUsersTable,
    createUser,
    findUserByEmail,
    findUserById,
    findUserByPublicId,
    listUsers,
    listUsersByRoles,
    updateUserRole,
    updateUserManager
};
