/**
 * Request body validation middleware using Zod.
 * On failure sends 400 with first error message or formatted Zod errors.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      next();
      return;
    }
    const err = result.error;
    const first = err.errors[0];
    const message = first ? `${first.path.length ? first.path.join('.') + ': ' : ''}${first.message}` : 'Validation failed';
    return res.status(400).json({ error: message, details: err.flatten() });
  };
}
