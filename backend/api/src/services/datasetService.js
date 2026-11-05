const fs = require('fs');
const path = require('path');

const masterJsonPath = path.resolve(__dirname, '../../../../data/attendance_history_master.json');

class DatasetService {
  constructor() {
    this.data = null;
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(masterJsonPath)) {
        const raw = fs.readFileSync(masterJsonPath, 'utf-8');
        this.data = JSON.parse(raw);
        console.log(`✅ [DatasetService] Loaded ${this.data.students.length} students & ${this.data.attendance_logs.length} attendance logs from master dataset.`);
      }
    } catch (e) {
      console.warn('[DatasetService] Failed to load attendance master dataset:', e.message);
    }
  }

  findStudent(identifier) {
    if (!this.data || !this.data.students) return null;
    const clean = identifier.trim().toLowerCase();
    return this.data.students.find(s => 
      s.email.toLowerCase() === clean || 
      s.roll.toLowerCase() === clean
    ) || null;
  }

  validatePassword(student, password) {
    if (!student || !password) return false;
    return student.password === password.trim();
  }

  getStudentLogs(email, { limit = 20, page = 1, status = null, month = null } = {}) {
    if (!this.data || !this.data.attendance_logs) return { total: 0, page, limit, logs: [] };
    const student = this.findStudent(email);
    if (!student) return { total: 0, page, limit, logs: [] };

    let logs = this.data.attendance_logs.filter(l => l.roll.toUpperCase() === student.roll.toUpperCase());

    if (status) {
      logs = logs.filter(l => l.status.toLowerCase() === status.toLowerCase());
    }

    if (month) {
      logs = logs.filter(l => l.date.startsWith(month));
    }

    // Sort descending by date and time
    logs.sort((a, b) => new Date(`${b.date}T${b.time}Z`) - new Date(`${a.date}T${a.time}Z`));

    const total = logs.length;
    const startIndex = (page - 1) * limit;
    const paginated = logs.slice(startIndex, startIndex + limit);

    const subjects = [
      'Machine Learning',
      'Deep Learning & Vision',
      'Cloud Architecture',
      'Database Management Systems',
      'Computer Networks',
      'AI Ethics & Cyber Security'
    ];

    const formattedLogs = paginated.map((l, idx) => {
      let hash = 0;
      for (let i = 0; i < l.date.length; i++) hash = (hash * 31 + l.date.charCodeAt(i)) % subjects.length;
      const sub = subjects[hash];
      const confPct = Math.round((l.confidence || 0.85) * 100);

      return {
        id: `log_${student.roll}_${l.date}_${l.time}`.replace(/[: -]/g, '_'),
        date: l.date,
        time: l.time.substring(0, 5),
        subject: sub,
        verified_by: 'face',
        confidence: `${confPct}%`,
        status: l.status,
        lighting_quality: confPct > 75 ? 'Good' : 'Moderate',
        face_visibility: confPct > 70 ? 'Excellent' : 'Good'
      };
    });

    return {
      total,
      page,
      limit,
      logs: formattedLogs
    };
  }

  getStudentStats(email) {
    const student = this.findStudent(email);
    if (!student) {
      return {
        overall_percentage: 85,
        standing: 'Good',
        rank: 'Top 15%',
        streak: 5,
        subjects: [
          { subject: 'Machine Learning', percentage: 90, attended: 18, total: 20 },
          { subject: 'Cloud Architecture', percentage: 85, attended: 17, total: 20 },
          { subject: 'Computer Networks', percentage: 80, attended: 16, total: 20 }
        ]
      };
    }

    const { logs } = this.getStudentLogs(email, { limit: 500 });
    const total = logs.length;
    const presentCount = logs.filter(l => l.status === 'Present').length;
    const overallPercentage = total > 0 ? Math.round((presentCount / total) * 100) : 88;

    let standing = 'Good';
    if (overallPercentage >= 90) standing = 'Excellent';
    else if (overallPercentage >= 75) standing = 'Good';
    else if (overallPercentage >= 60) standing = 'Warning';
    else standing = 'Critical';

    // Subject breakdown
    const subjectMap = {};
    for (const l of logs) {
      if (!subjectMap[l.subject]) subjectMap[l.subject] = { total: 0, attended: 0 };
      subjectMap[l.subject].total++;
      if (l.status === 'Present') subjectMap[l.subject].attended++;
    }

    const subjects = Object.keys(subjectMap).map(name => {
      const s = subjectMap[name];
      const pct = s.total > 0 ? Math.round((s.attended / s.total) * 100) : 80;
      return {
        subject: name,
        percentage: pct,
        attended: s.attended,
        total: s.total
      };
    });

    return {
      overall_percentage: overallPercentage,
      standing,
      rank: overallPercentage >= 90 ? 'Top 5%' : overallPercentage >= 80 ? 'Top 15%' : 'Top 35%',
      streak: overallPercentage >= 80 ? 7 : 3,
      subjects: subjects.length > 0 ? subjects : [
        { subject: 'Machine Learning', percentage: overallPercentage, attended: presentCount, total }
      ]
    };
  }

  getHeatmap(email) {
    const student = this.findStudent(email);
    if (!student) return {};
    const { logs } = this.getStudentLogs(email, { limit: 1000 });
    const heatmap = {};
    for (const l of logs) {
      heatmap[l.date] = l.status === 'Present' ? 1 : 0;
    }
    return heatmap;
  }
}

module.exports = new DatasetService();

