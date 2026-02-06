/**
 * Transaction service.
 */
import { ValidationError } from '../errors.js';
import { TRANSACTION_CATEGORIES } from '../config/constants.js';
import { parseDate, validateNonNegative } from '../utils/validation.js';
import { requireId, requireFound, normOneOf, buildUpdates } from '../utils/serviceHelpers.js';
import * as transactionModel from '../models/transaction.js';

const TYPE_ERROR = 'type must be income or expense';

function normTransactionCategory(value, body) {
  const type = body?.type;
  const allowed =
    type !== undefined && TRANSACTION_CATEGORIES[type]
      ? TRANSACTION_CATEGORIES[type]
      : [...TRANSACTION_CATEGORIES.income, ...TRANSACTION_CATEGORIES.expense];
  return allowed?.includes(value) ? value : 'Other';
}

export async function list(userId, query = {}) {
  const limit = Math.min(Math.max(1, parseInt(query.limit, 10) || 500), 1000);
  const offset = Math.max(0, parseInt(query.offset, 10) || 0);
  return transactionModel.findByUserId(userId, {
    month: query.month,
    type: query.type,
    limit,
    offset,
  });
}

export async function create(userId, body) {
  const { date, type, amount, category, description, isRecurring, groupId } = body ?? {};
  normOneOf(type, ['income', 'expense'], { errorMessage: TYPE_ERROR });
  const cat = TRANSACTION_CATEGORIES[type]?.includes(category) ? category : 'Other';
  return transactionModel.create({
    userId,
    date: parseDate(date),
    type,
    amount: validateNonNegative(amount, 'amount'),
    category: cat,
    description,
    isRecurring,
    groupId,
  });
}

export async function update(userId, id, body) {
  requireId(id);
  const input = body ?? {};
  const updates = buildUpdates(input, {
    date: (v) => v,
    type: (v) => normOneOf(v, ['income', 'expense'], { errorMessage: TYPE_ERROR }),
    amount: (v) => validateNonNegative(v, 'amount'),
    category: (v) => normTransactionCategory(v, input),
    description: (v) => v,
    isRecurring: (v) => !!v,
    groupId: (v) => v ?? null,
  });
  const updated = await transactionModel.update(id, userId, updates);
  requireFound(updated, 'Transaction');
  return updated;
}

export async function remove(userId, id) {
  requireId(id);
  const deleted = await transactionModel.deleteById(id, userId);
  requireFound(deleted, 'Transaction');
}

export async function getBalance(userId, month) {
  return transactionModel.getBalance(userId, month);
}
