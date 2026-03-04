/**
 * Transaction service.
 */
import { ValidationError } from '../errors.js';
import { TRANSACTION_CATEGORIES } from '../config/constants.js';
import { parseDate, validateNonNegative } from '../utils/validation.js';
import { requireId, requireFound, normOneOf, buildUpdates } from '../utils/serviceHelpers.js';
import * as transactionModel from '../models/transaction.js';
import { publishEvent } from '../events/publish.js';
import { upsertEmbedding, buildEmbeddingText, deleteEmbedding } from './embeddings.js';

const TYPE_ERROR = 'type must be income or expense';

function normTransactionCategory(value: unknown, body: Record<string, unknown> | undefined) {
  const type = body?.type as 'income' | 'expense' | undefined;
  const allowed =
    type === 'income' || type === 'expense'
      ? TRANSACTION_CATEGORIES[type]
      : [...TRANSACTION_CATEGORIES.income, ...TRANSACTION_CATEGORIES.expense];
  return (typeof value === 'string' && allowed.includes(value)) ? value : 'Other';
}

export async function list(userId: string, query: { limit?: number; offset?: number; month?: string; type?: string } = {}) {
  const limit = Math.min(Math.max(1, parseInt(String(query.limit ?? 500), 10) || 500), 1000);
  const offset = Math.max(0, parseInt(String(query.offset ?? 0), 10) || 0);
  return transactionModel.findByUserId(userId, {
    month: query.month,
    type: query.type,
    limit,
    offset,
  });
}

export async function create(userId: string, body: Record<string, unknown>) {
  const { date, type, amount, currency, category, description, isRecurring, groupId } = body ?? {};
  normOneOf(type, ['income', 'expense'], { errorMessage: TYPE_ERROR });
  const cat = (type === 'income' || type === 'expense') && typeof category === 'string' && TRANSACTION_CATEGORIES[type].includes(category) ? category : 'Other';
  const transaction = await transactionModel.create({
    userId,
    date: parseDate(date as string | Date | null | undefined),
    type: type as 'income' | 'expense',
    amount: validateNonNegative(amount, 'amount'),
    currency: (currency && String(currency).length === 3 ? String(currency).toUpperCase() : 'USD') as string,
    category: cat as string,
    description: typeof description === 'string' ? description : undefined,
    isRecurring: !!isRecurring,
    groupId: (typeof groupId === 'string' ? groupId : null) ?? null,
  });
  await publishEvent('money.TransactionCreated', transaction, userId);
  upsertEmbedding(userId, 'transaction', String(transaction.id), buildEmbeddingText('transaction', transaction));
  return transaction;
}

export async function update(userId: string, id: string, body: Record<string, unknown>) {
  requireId(id);
  const input = body ?? {};
  const updates = buildUpdates(input, {
    date: (v: unknown) => v,
    type: (v: unknown) => normOneOf(v, ['income', 'expense'], { errorMessage: TYPE_ERROR }),
    amount: (v: unknown) => validateNonNegative(v, 'amount'),
    currency: (v: unknown) => (v && String(v).length === 3 ? String(v).toUpperCase() : undefined),
    category: (v: unknown) => normTransactionCategory(v, input),
    description: (v: unknown) => v,
    isRecurring: (v: unknown) => !!v,
    groupId: (v: unknown) => v ?? null,
  });
  const updated = await transactionModel.update(id, userId, updates);
  requireFound(updated, 'Transaction');
  await publishEvent('money.TransactionUpdated', updated, userId);
  upsertEmbedding(userId, 'transaction', updated.id as string, buildEmbeddingText('transaction', updated));
  return updated;
}

export async function remove(userId: string, id: string) {
  requireId(id);
  const deleted = await transactionModel.deleteById(id, userId);
  requireFound(deleted, 'Transaction');
  await publishEvent('money.TransactionDeleted', { id }, userId);
  deleteEmbedding(id, 'transaction');
}

export async function getBalance(userId: string, month: string | undefined) {
  return transactionModel.getBalance(userId, month);
}
