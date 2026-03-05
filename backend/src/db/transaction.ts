/**
 * Transaction helper — wraps operations in a database transaction.
 * Usage: const result = await withTransaction(pool, async (client) => { ... });
 */
import pg from 'pg';

export type TransactionClient = pg.PoolClient;

/**
 * Execute a function within a database transaction.
 * Automatically commits on success, rolls back on error.
 */
export async function withTransaction<T>(
  pool: pg.Pool,
  fn: (client: TransactionClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
