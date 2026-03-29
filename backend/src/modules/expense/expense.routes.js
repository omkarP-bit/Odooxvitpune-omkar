const express = require("express");
const { createExpense, myExpenses } = require("./expense.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("employee"), createExpense);
router.get("/my", authenticateToken, authorizeRoles("employee", "manager", "admin", "finance", "director", "cfo"), myExpenses);

module.exports = router;
