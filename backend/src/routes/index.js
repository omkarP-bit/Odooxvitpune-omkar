const express = require("express");
const { healthCheck } = require("../controllers/healthController");
const authRoutes = require("../modules/auth/auth.routes");
const expenseRoutes = require("../modules/expense/expense.routes");
const approvalRoutes = require("../modules/approval/approval.routes");

const router = express.Router();

router.get("/", healthCheck);
router.use("/api/auth", authRoutes);
router.use("/api/expenses", expenseRoutes);
router.use("/api/approvals", approvalRoutes);

module.exports = router;
