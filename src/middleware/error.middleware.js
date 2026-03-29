// Matches the project's standard error shape:
// { success: false, error: { code, message } }
 
function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "Something went wrong",
    },
  });
}
 
module.exports = errorMiddleware;
 