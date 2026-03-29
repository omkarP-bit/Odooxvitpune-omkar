const express = require("express");
const {
    companySignup,
    login,
    createUser,
    me,
    users,
    changeRole,
    assignManager
} = require("./auth.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/company-signup", companySignup);
router.post("/login", login);
router.get("/me", authenticateToken, me);
router.get("/users", authenticateToken, authorizeRoles("admin"), users);
router.post("/users", authenticateToken, authorizeRoles("admin"), createUser);
router.patch("/users/:userId/role", authenticateToken, authorizeRoles("admin"), changeRole);
router.patch("/users/:userId/manager", authenticateToken, authorizeRoles("admin"), assignManager);

module.exports = router;
