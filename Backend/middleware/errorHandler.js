const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const method = req.method;
  const url = req.originalUrl;

  // Always log full error on the server with context
  console.error(`❌ [${method} ${url}] ${statusCode} — ${err.message}`);
  if (statusCode >= 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
