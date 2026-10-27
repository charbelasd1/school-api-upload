// Express 4 does not catch errors thrown inside async functions.
// This wrapper forwards any rejected promise to next(err), which reaches errorHandler.js.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
