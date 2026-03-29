const express = require("express");
const {
    configureRule,
    pendingApprovals,
    decideApproval
} = require("./approval.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/authMiddleware");

const router = express.Router();

router.put("/rules", authenticateToken, authorizeRoles("admin"), configureRule);
router.get("/pending", authenticateToken, authorizeRoles("manager", "admin", "finance", "director", "cfo"), pendingApprovals);
router.post("/:expenseId/decision", authenticateToken, authorizeRoles("manager", "admin", "finance", "director", "cfo"), decideApproval);

module.exports = router;
