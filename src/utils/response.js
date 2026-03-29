const bigIntReplacer = (_, value) =>
  typeof value === 'bigint' ? value.toString() : value;

const success = (res, data, statusCode = 200) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).end(JSON.stringify({ success: true, data }, bigIntReplacer));
};

const error = (res, code, message, statusCode = 400) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).end(JSON.stringify({ success: false, error: { code, message } }, bigIntReplacer));
};

module.exports = { success, error };
