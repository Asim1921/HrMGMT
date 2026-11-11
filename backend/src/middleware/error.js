export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message, ...(err.code && { code: err.code }) });
}

export function notFound(req, _res, next) {
  const err = new Error(`Not Found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}
