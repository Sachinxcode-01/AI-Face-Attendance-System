module.exports = function reportInternalError(res, error, context) {
  console.error(`[${context}] Request failed:`, error);
  return res.status(500).json({ detail: 'Internal server error.' });
};
