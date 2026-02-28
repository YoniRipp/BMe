/**
 * Embeddings service — generates vector embeddings via Gemini for semantic search.
 * Stores embeddings in the user_embeddings table (pgvector).
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { getPool } from '../db/pool.js';
import { logger } from '../lib/logger.js';

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIM = 768;

function getEmbeddingClient() {
  if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY not configured');
  return new GoogleGenerativeAI(config.geminiApiKey).getGenerativeModel({ model: EMBEDDING_MODEL });
}

/** Generate a single embedding vector for a text string. */
export async function embed(text) {
  const model = getEmbeddingClient();
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Build a plain-text description of a data record for embedding.
 * @param {'transaction'|'workout'|'food_entry'|'schedule'} type
 * @param {object} record
 */
export function buildEmbeddingText(type, record) {
  switch (type) {
    case 'transaction':
      return [
        `${record.type === 'income' ? 'Income' : 'Expense'}`,
        record.category,
        record.description ?? '',
        `${record.amount} ${record.currency ?? 'USD'}`,
        `on ${record.date}`,
        record.isRecurring ? 'recurring' : '',
      ].filter(Boolean).join(' ');

    case 'workout':
      return [
        `Workout: ${record.title}`,
        `type: ${record.type}`,
        `duration: ${record.durationMinutes} minutes`,
        `on ${record.date}`,
        record.notes ?? '',
        Array.isArray(record.exercises)
          ? record.exercises.map((e) => `${e.name} ${e.sets}x${e.reps}${e.weight ? ` @${e.weight}kg` : ''}`).join(', ')
          : '',
      ].filter(Boolean).join('. ');

    case 'food_entry':
      return [
        `Food: ${record.name}`,
        `${record.calories} kcal`,
        `protein ${record.protein}g`,
        `carbs ${record.carbs}g`,
        `fat ${record.fats}g`,
        `on ${record.date}`,
      ].filter(Boolean).join(', ');

    case 'schedule':
      return [
        `Schedule: ${record.title}`,
        `category: ${record.category}`,
        `from ${record.startTime} to ${record.endTime}`,
        `on ${record.date}`,
        record.recurrence ? `repeats ${record.recurrence}` : '',
      ].filter(Boolean).join(', ');

    default:
      return JSON.stringify(record);
  }
}

/**
 * Upsert an embedding for a data record.
 * @param {string} userId
 * @param {'transaction'|'workout'|'food_entry'|'schedule'} recordType
 * @param {string} recordId
 * @param {string} text - Plain-text representation for embedding
 */
export async function upsertEmbedding(userId, recordType, recordId, text) {
  if (!config.geminiApiKey) return; // gracefully skip when not configured
  const pool = getPool();
  try {
    const vector = await embed(text);
    const vectorLiteral = `[${vector.join(',')}]`;
    await pool.query(
      `INSERT INTO user_embeddings (user_id, record_type, record_id, content_text, embedding)
       VALUES ($1, $2, $3, $4, $5::vector)
       ON CONFLICT (record_id, record_type)
       DO UPDATE SET content_text = EXCLUDED.content_text, embedding = EXCLUDED.embedding, updated_at = now()`,
      [userId, recordType, recordId, text, vectorLiteral]
    );
  } catch (err) {
    // Non-fatal: log and continue. Embedding is a background enrichment.
    logger.warn({ err, recordType, recordId }, 'Failed to upsert embedding');
  }
}

/**
 * Delete embedding for a record (call when record is deleted).
 * @param {string} recordId
 * @param {'transaction'|'workout'|'food_entry'|'schedule'} recordType
 */
export async function deleteEmbedding(recordId, recordType) {
  const pool = getPool();
  try {
    await pool.query('DELETE FROM user_embeddings WHERE record_id = $1 AND record_type = $2', [recordId, recordType]);
  } catch (err) {
    logger.warn({ err, recordType, recordId }, 'Failed to delete embedding');
  }
}

/**
 * Semantic search: embed the query and find the top-k most similar records for a user.
 * @param {string} userId
 * @param {string} query - Natural language search query
 * @param {{ types?: string[], limit?: number }} options
 * @returns {Promise<Array<{ recordType: string, recordId: string, contentText: string, similarity: number }>>}
 */
export async function semanticSearch(userId, query, { types = [], limit = 10 } = {}) {
  const pool = getPool();
  const queryVector = await embed(query);
  const vectorLiteral = `[${queryVector.join(',')}]`;

  const conditions = ['user_id = $1'];
  const params = [userId, vectorLiteral, limit];
  let paramIdx = 4;

  if (types.length > 0) {
    conditions.push(`record_type = ANY($${paramIdx})`);
    params.push(types);
    paramIdx++;
  }

  const where = conditions.join(' AND ');
  const result = await pool.query(
    `SELECT record_type, record_id, content_text,
            1 - (embedding <=> $2::vector) AS similarity
     FROM user_embeddings
     WHERE ${where}
     ORDER BY embedding <=> $2::vector
     LIMIT $3`,
    params
  );

  return result.rows.map((row) => ({
    recordType: row.record_type,
    recordId: row.record_id,
    contentText: row.content_text,
    similarity: Math.round(Number(row.similarity) * 1000) / 1000,
  }));
}
