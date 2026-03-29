const expenseService = require("./expense.service");

const createExpense = async (req, res, next) => {
    try {
        const result = await expenseService.submitExpense({
            userId: req.user.id,
            payload: req.body
        });

        return res.status(201).json(result);
    } catch (error) {
        if (error.message.includes("Only employees") || error.message.includes("required") || error.message.includes("duplicate")) {
            return res.status(400).json({ message: error.message });
        }

        return next(error);
    }
};

const myExpenses = async (req, res, next) => {
    try {
        const expenses = await expenseService.myExpenses({ userId: req.user.id });
        return res.status(200).json({ expenses });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    createExpense,
    myExpenses
};
