/**
 * OpenTelemetry-Compatible Distributed Request Tracer
 * Implements W3C Trace Context (traceparent) standard for cross-tier distributed observability.
 */

const crypto = require('crypto');

class Span {
  constructor(name, traceId, parentSpanId = null, tags = {}) {
    this.name = name;
    this.traceId = traceId;
    this.spanId = crypto.randomBytes(8).toString('hex');
    this.parentSpanId = parentSpanId;
    this.startTime = process.hrtime();
    this.tags = { ...tags };
    this.events = [];
    this.status = 'OK';
    this.durationMs = null;
  }

  setTag(key, value) {
    this.tags[key] = value;
    return this;
  }

  addEvent(name, attributes = {}) {
    this.events.push({
      name,
      timestamp: new Date().toISOString(),
      attributes
    });
    return this;
  }

  setError(error) {
    this.status = 'ERROR';
    this.setTag('error', true);
    this.setTag('error.message', error.message || String(error));
    if (error.stack) {
      this.setTag('error.stack', error.stack);
    }
    return this;
  }

  end() {
    const diff = process.hrtime(this.startTime);
    this.durationMs = parseFloat(((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2));
    return this;
  }

  toJSON() {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      status: this.status,
      durationMs: this.durationMs,
      tags: this.tags,
      events: this.events
    };
  }
}

class Tracer {
  constructor(serviceName = 'smartface-backend-api') {
    this.serviceName = serviceName;
  }

  extractTraceContext(req) {
    const traceparent = req.headers['traceparent'];
    if (traceparent && typeof traceparent === 'string') {
      const parts = traceparent.trim().split('-');
      if (parts.length >= 4) {
        const version = parts[0];
        const traceId = parts[1].toLowerCase();
        const parentSpanId = parts[2].toLowerCase();
        const traceHexRegex = /^[0-9a-f]{32}$/;
        const spanHexRegex = /^[0-9a-f]{16}$/;
        if (
          version.length === 2 &&
          traceHexRegex.test(traceId) &&
          traceId !== '00000000000000000000000000000000' &&
          spanHexRegex.test(parentSpanId) &&
          parentSpanId !== '0000000000000000'
        ) {
          return {
            traceId,
            parentSpanId
          };
        }
      }
    }
    // Generate valid 32-hex character traceId when missing or invalid
    return {
      traceId: crypto.randomBytes(16).toString('hex'),
      parentSpanId: null
    };
  }

  startSpan(name, reqOrContext, tags = {}) {
    let traceId;
    let parentSpanId = null;

    if (reqOrContext && reqOrContext.headers) {
      const ctx = this.extractTraceContext(reqOrContext);
      traceId = ctx.traceId;
      parentSpanId = ctx.parentSpanId;
    } else if (reqOrContext && reqOrContext.traceId) {
      traceId = reqOrContext.traceId;
      parentSpanId = reqOrContext.spanId || null;
    } else {
      traceId = crypto.randomBytes(16).toString('hex');
    }

    const span = new Span(name, traceId, parentSpanId, {
      'service.name': this.serviceName,
      ...tags
    });

    return span;
  }

  injectTraceHeader(span, headers = {}) {
    headers['traceparent'] = `00-${span.traceId}-${span.spanId}-01`;
    return headers;
  }
}

const defaultTracer = new Tracer();

module.exports = {
  Tracer,
  Span,
  defaultTracer
};
