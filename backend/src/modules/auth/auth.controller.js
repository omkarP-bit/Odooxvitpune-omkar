const authService = require("./auth.service");

const companySignup = async (req, res, next) => {
    try {
        const { companyName, country, adminName, email, password } = req.body;
        if (!companyName || !country || !adminName || !email || !password) {
            return res.status(400).json({
                message: "companyName, country, adminName, email and password are required"
            });
        }

        const data = await authService.companySignup({
            companyName,
            country,
            adminName,
            email,
            password
        });

        return res.status(201).json(data);
    } catch (error) {
        if (error.message.includes("exists")) {
            return res.status(409).json({ message: error.message });
        }

        return next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email and password are required" });
        }

        const data = await authService.login({ email, password });
        return res.status(200).json(data);
    } catch (error) {
        if (error.message === "Invalid credentials") {
            return res.status(401).json({ message: error.message });
        }

        return next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const user = await authService.createCompanyUser({
            adminUserId: req.user.id,
            payload: req.body
        });

        return res.status(201).json({ user });
    } catch (error) {
        if (error.message.includes("Only admins") || error.message.includes("role") || error.message.includes("required") || error.message.includes("not found") || error.message.includes("exists")) {
            const status = error.message.includes("Only admins") ? 403 : error.message.includes("exists") ? 409 : 400;
            return res.status(status).json({ message: error.message });
        }

        return next(error);
    }
};

const me = async (req, res, next) => {
    try {
        const user = await authService.getMyProfile(req.user.id);
        return res.status(200).json({ user });
    } catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({ message: error.message });
        }

        return next(error);
    }
};

const users = async (req, res, next) => {
    try {
        const userList = await authService.getCompanyUsers(req.user.id);
        return res.status(200).json({ users: userList });
    } catch (error) {
        if (error.message.includes("Only admins")) {
            return res.status(403).json({ message: error.message });
        }

        return next(error);
    }
};

const changeRole = async (req, res, next) => {
    try {
        const updated = await authService.changeUserRole({
            adminUserId: req.user.id,
            targetUserId: req.params.userId,
            role: req.body.role
        });

        return res.status(200).json({ user: updated });
    } catch (error) {
        if (error.message.includes("Only admins")) {
            return res.status(403).json({ message: error.message });
        }

        if (error.message.includes("not found") || error.message.includes("Invalid role")) {
            return res.status(400).json({ message: error.message });
        }

        return next(error);
    }
};

const assignManager = async (req, res, next) => {
    try {
        const updated = await authService.assignManager({
            adminUserId: req.user.id,
            userPublicId: req.params.userId,
            managerPublicId: req.body.managerId
        });

        return res.status(200).json({ user: updated });
    } catch (error) {
        if (error.message.includes("Only admins")) {
            return res.status(403).json({ message: error.message });
        }

        if (error.message.includes("not found") || error.message.includes("must have")) {
            return res.status(400).json({ message: error.message });
        }

        return next(error);
    }
};

module.exports = {
    companySignup,
    login,
    createUser,
    me,
    users,
    changeRole,
    assignManager
};
