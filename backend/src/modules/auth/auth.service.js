const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const {
    createCompany,
    findCompanyByName,
    findCompanyById
} = require("../../models/companyModel");
const {
    createUser,
    findUserByEmail,
    findUserById,
    findUserByPublicId,
    listUsers,
    updateUserRole,
    updateUserManager
} = require("../../models/userModel");
const { getCurrencyByCountry } = require("../../utils/countryCurrency");

const VALID_ROLES = ["admin", "manager", "employee", "finance", "director", "cfo"];

const buildToken = (user) => {
    return jwt.sign(
        {
            sub: String(user.public_id),
            id: user.id,
            role: user.role,
            company_id: user.company_public_id || null
        },
        process.env.JWT_SECRET || "supersecret",
        { expiresIn: "24h" }
    );
};

const toUserResponse = (user) => ({
    id: user.public_id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: {
        id: user.company_public_id,
        name: user.company_name,
        country: user.country,
        currency: user.currency_code
    },
    manager_id: user.manager_id,
    created_at: user.created_at
});

const companySignup = async ({ companyName, country, adminName, email, password }) => {
    const existingCompany = await findCompanyByName(companyName);
    if (existingCompany) {
        throw new Error("Company already exists");
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error("Email already exists");
    }

    const currencyCode = await getCurrencyByCountry(country);
    const company = await createCompany({
        publicId: uuidv4(),
        name: companyName,
        country,
        currencyCode
    });

    const passwordHash = await bcrypt.hash(password, 10);

    await createUser({
        publicId: uuidv4(),
        companyId: company.id,
        managerId: null,
        name: adminName,
        email,
        passwordHash,
        role: "admin"
    });

    const admin = await findUserByEmail(email);
    const token = buildToken(admin);

    return { user: toUserResponse(admin), token };
};

const login = async ({ email, password }) => {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        throw new Error("Invalid credentials");
    }

    const token = buildToken(user);
    return { user: toUserResponse(user), token };
};

const createCompanyUser = async ({ adminUserId, payload }) => {
    const adminUser = await findUserById(adminUserId);
    if (!adminUser || adminUser.role !== "admin") {
        throw new Error("Only admins can create users");
    }

    const { name, email, password, role, managerId } = payload;

    if (!name || !email || !password || !role) {
        throw new Error("name, email, password and role are required");
    }

    if (!VALID_ROLES.includes(role) || role === "admin") {
        throw new Error("role must be manager, employee, finance, director, or cfo");
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error("Email already exists");
    }

    let managerInternalId = null;
    if (managerId) {
        const manager = await findUserByPublicId(managerId);
        if (!manager || manager.company_id !== adminUser.company_id) {
            throw new Error("manager not found in your company");
        }

        managerInternalId = manager.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
        publicId: uuidv4(),
        companyId: adminUser.company_id,
        managerId: managerInternalId,
        name,
        email,
        passwordHash,
        role
    });

    const fullUser = await findUserById(user.id);
    return toUserResponse(fullUser);
};

const getMyProfile = async (userId) => {
    const user = await findUserById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    return toUserResponse(user);
};

const getCompanyUsers = async (adminUserId) => {
    const adminUser = await findUserById(adminUserId);
    if (!adminUser || adminUser.role !== "admin") {
        throw new Error("Only admins can view users");
    }

    const users = await listUsers(adminUser.company_id);
    return users.map(toUserResponse);
};

const changeUserRole = async ({ adminUserId, targetUserId, role }) => {
    const adminUser = await findUserById(adminUserId);
    if (!adminUser || adminUser.role !== "admin") {
        throw new Error("Only admins can change roles");
    }

    if (!VALID_ROLES.includes(role) || role === "admin") {
        throw new Error("Invalid role");
    }

    const target = await findUserByPublicId(targetUserId);
    if (!target || target.company_id !== adminUser.company_id) {
        throw new Error("User not found in your company");
    }

    const updated = await updateUserRole({ userId: target.id, role });
    const full = await findUserById(updated.id);
    return toUserResponse(full);
};

const assignManager = async ({ adminUserId, userPublicId, managerPublicId }) => {
    const adminUser = await findUserById(adminUserId);
    if (!adminUser || adminUser.role !== "admin") {
        throw new Error("Only admins can assign managers");
    }

    const user = await findUserByPublicId(userPublicId);
    const manager = await findUserByPublicId(managerPublicId);

    if (!user || user.company_id !== adminUser.company_id) {
        throw new Error("User not found in your company");
    }

    if (!manager || manager.company_id !== adminUser.company_id) {
        throw new Error("Manager not found in your company");
    }

    if (manager.role !== "manager" && manager.role !== "admin") {
        throw new Error("manager must have manager or admin role");
    }

    const updated = await updateUserManager({ userId: user.id, managerId: manager.id });
    const full = await findUserById(updated.id);
    return toUserResponse(full);
};

const getCompanyByInternalId = async (companyId) => {
    return findCompanyById(companyId);
};

module.exports = {
    companySignup,
    login,
    createCompanyUser,
    getMyProfile,
    getCompanyUsers,
    changeUserRole,
    assignManager,
    getCompanyByInternalId
};
