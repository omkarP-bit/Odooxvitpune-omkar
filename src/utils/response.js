const success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

const error = (res, code, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, error: { code, message } });

module.exports = { success, error };
