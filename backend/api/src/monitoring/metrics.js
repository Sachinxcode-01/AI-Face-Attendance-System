const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// 1. API Latency
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// 2. Recognition Latency
const faceRecognitionDuration = new client.Histogram({
  name: 'face_recognition_duration_seconds',
  help: 'End-to-end face recognition verification latency in seconds',
  labelNames: ['status', 'model_version', 'lighting'],
  buckets: [0.05, 0.1, 0.2, 0.35, 0.5, 1, 2]
});

// 3. AI Processing Time
const aiInferenceDuration = new client.Histogram({
  name: 'ai_inference_duration_seconds',
  help: 'Raw deep learning feature extraction & cosine similarity inference time',
  labelNames: ['pipeline_stage', 'accelerator'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1]
});

// 4. Attendance Success Rate
const attendanceSubmissionsTotal = new client.Counter({
  name: 'attendance_submissions_total',
  help: 'Total count of attendance recording attempts',
  labelNames: ['status', 'method', 'college_id']
});

// 5. Authentication Failures & Success
const authAttemptsTotal = new client.Counter({
  name: 'auth_attempts_total',
  help: 'Authentication attempts split by mechanism, status, and tenant',
  labelNames: ['status', 'type', 'college_id']
});

// 6. Queue Processing Time
const queueJobDuration = new client.Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Time spent executing background jobs in BullMQ / in-memory queues',
  labelNames: ['queue_name', 'status'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5, 15, 30]
});

// 7. Database Query Performance
const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query execution time in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
});

// 8. Active Users Gauge
const activeUsersGauge = new client.Gauge({
  name: 'active_users_gauge',
  help: 'Number of currently active concurrent users connected or active in session',
  labelNames: ['role', 'college_id']
});

// 9. Active Attendance Sessions Gauge
const activeSessionsGauge = new client.Gauge({
  name: 'active_attendance_sessions_gauge',
  help: 'Number of currently active classroom/hall attendance sessions',
  labelNames: ['college_id']
});

// 10. Active Colleges Gauge
const activeCollegesGauge = new client.Gauge({
  name: 'active_colleges_gauge',
  help: 'Number of active multi-tenant educational institutions onboarded'
});

// 11. Component Health Status
const systemHealthStatusGauge = new client.Gauge({
  name: 'system_health_status',
  help: 'Component health status (1 = healthy, 0 = degraded/unhealthy)',
  labelNames: ['component']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(faceRecognitionDuration);
register.registerMetric(aiInferenceDuration);
register.registerMetric(attendanceSubmissionsTotal);
register.registerMetric(authAttemptsTotal);
register.registerMetric(queueJobDuration);
register.registerMetric(dbQueryDuration);
register.registerMetric(activeUsersGauge);
register.registerMetric(activeSessionsGauge);
register.registerMetric(activeCollegesGauge);
register.registerMetric(systemHealthStatusGauge);

// Initialize baseline health metrics based on actual readiness state
const mongoose = require('mongoose');
const isDbConnected = (mongoose.connection && mongoose.connection.readyState === 1) ? 1 : 0;
systemHealthStatusGauge.set({ component: 'database' }, isDbConnected);
systemHealthStatusGauge.set({ component: 'queue' }, 0);
systemHealthStatusGauge.set({ component: 'ai_engine' }, 0);
systemHealthStatusGauge.set({ component: 'api_gateway' }, 1);
activeCollegesGauge.set(2);

// Dynamic lifecycle hooks for database connection state
if (mongoose.connection) {
  mongoose.connection.on('connected', () => {
    systemHealthStatusGauge.set({ component: 'database' }, 1);
  });
  mongoose.connection.on('disconnected', () => {
    systemHealthStatusGauge.set({ component: 'database' }, 0);
  });
  mongoose.connection.on('error', () => {
    systemHealthStatusGauge.set({ component: 'database' }, 0);
  });
}

const updateComponentHealth = (component, isHealthy) => {
  systemHealthStatusGauge.set({ component }, isHealthy ? 1 : 0);
};

module.exports = {
  register,
  client,
  httpRequestDuration,
  faceRecognitionDuration,
  aiInferenceDuration,
  attendanceSubmissionsTotal,
  authAttemptsTotal,
  queueJobDuration,
  dbQueryDuration,
  activeUsersGauge,
  activeSessionsGauge,
  activeCollegesGauge,
  systemHealthStatusGauge,
  updateComponentHealth
};
