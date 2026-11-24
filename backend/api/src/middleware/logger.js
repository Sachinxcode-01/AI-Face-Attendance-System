const crypto = require('crypto');
const { httpRequestDuration } = require('../monitoring/metrics');
const { defaultTracer } = require('../monitoring/tracer');

const securityAndLogger = (req, res, next) => {
  const span = defaultTracer.startSpan('http_request', req, {
    'http.method': req.method,
    'http.target': req.originalUrl || req.url
  });

  req.traceSpan = span;
  req.traceId = span.traceId;
  req.requestId = req.headers['x-request-id'] || span.traceId;

  res.setHeader('X-Request-ID', req.requestId);
  res.setHeader('traceparent', `00-${span.traceId}-${span.spanId}-01`);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');

  const start = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const latencyMs = parseFloat(((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2));
    const durationSeconds = latencyMs / 1000.0;

    span.setTag('http.status_code', res.statusCode);
    span.end();

    const normalizedRoute = req.route && typeof req.route.path === 'string'
      ? (req.baseUrl || '') + req.route.path
      : 'unmatched';

    httpRequestDuration.observe(
      {
        method: req.method,
        route: normalizedRoute,
        status_code: res.statusCode.toString()
      },
      durationSeconds
    );
    
    const logData = {
      time: new Date().toISOString(),
      level: res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARNING" : "INFO",
      logger: "smartface.api",
      trace_id: span.traceId,
      span_id: span.spanId,
      msg: {
        request_id: req.requestId,
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
