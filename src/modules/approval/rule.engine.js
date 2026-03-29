/**
 * Rule engine: evaluates DB rules against an expense and returns required approver roles.
 *
 * Rule condition shape: { field: "amount_converted", operator: ">", value: 5000 }
 * Rule action shape:    { approver_role: "MANAGER" } | { approver_role: "ADMIN" }
 */

const OPERATORS = {
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '=': (a, b) => a === b,
};

const evaluateCondition = (condition, expense) => {
  const { field, operator, value } = condition;
  const expenseValue = expense[field];
  return OPERATORS[operator]?.(Number(expenseValue), Number(value)) ?? false;
};

/**
 * Returns ordered list of approver roles required for this expense.
 */
const buildWorkflow = (rules, expense) => {
  const requiredRoles = new Set();

  for (const rule of rules) {
    if (evaluateCondition(rule.condition, expense)) {
      requiredRoles.add(rule.action.approver_role);
    }
  }

  // Default: always require at least MANAGER approval
  if (requiredRoles.size === 0) requiredRoles.add('MANAGER');

  // Ordered: MANAGER first, then ADMIN
  const order = ['MANAGER', 'ADMIN'];
  return order.filter((r) => requiredRoles.has(r));
};

module.exports = { buildWorkflow };
