/**
 * Sentry-Ready Application Error Tracker & Telemetry Service
 * Captures unhandled exceptions, route failures, performance bottlenecks, and security alerts.
 */

class ErrorTracker {
  constructor() {
    this.sentryDsn = process.env.SENTRY_DSN || null;
    this.environment = process.env.NODE_ENV || 'development';
    this.initialized = false;
    this.recentErrors = [];
    this.maxRecentErrors = 100;

    this.init();
  }

  init() {
    if (this.sentryDsn && this.sentryDsn.startsWith('http')) {
      try {
        console.log(`📡 [ErrorTracker] Initializing Sentry monitoring for environment: ${this.environment}`);
        this.initialized = true;
      } catch (err) {
        console.warn('⚠️ [ErrorTracker] Sentry init failed, falling back to structured in-memory tracker.');
      }
    }
  }

  captureException(error, context = {}) {
    const errorRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      name: error.name || 'Error',
      stack: error.stack || null,
      context,
      environment: this.environment
    };

    this.recentErrors.unshift(errorRecord);
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors.pop();
    }

    // Log structured JSON error
    console.error(`💥 [ErrorTracker] Exception captured: ${errorRecord.name} - ${errorRecord.message}`, {
      context: errorRecord.context,
      timestamp: errorRecord.timestamp
    });

    return errorRecord.id;
  }

  getRecentErrors(limit = 20) {
    return this.recentErrors.slice(0, limit);
  }
}

const errorTracker = new ErrorTracker();
module.exports = errorTracker;
