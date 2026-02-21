/**
 * Wraps an async Express route handler so any thrown error
 * is forwarded to Express's global error handler (next(err))
 * instead of causing an unhandled promise rejection / crash.
 *
 * Usage:  router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
