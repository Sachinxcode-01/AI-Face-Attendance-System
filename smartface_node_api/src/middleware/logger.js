const crypto = require('crypto');

const securityAndLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');

  const start = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const latencyMs = parseFloat(((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2));
    
    const logData = {
      time: new Date().toISOString(),
      level: res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARNING" : "INFO",
      logger: "smartface.api",
      msg: {
        request_id: requestId,
        method: req.method,
        path: req.originalUrl || (req.baseUrl + req.path),
        status: res.statusCode,
        latency_ms: latencyMs,
        client: req.ip || "unknown"
      }
    };

    console.log(JSON.stringify(logData));
  });

  next();
};

module.exports = securityAndLogger;
