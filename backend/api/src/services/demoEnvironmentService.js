const jwt = require('jsonwebtoken');

class DemoEnvironmentService {
  /**
   * Catalog of pre-configured demo sandbox environments
   */
  static getSandboxProfiles() {
    return [
      {
        id: 'apex_tech',
        name: 'Apex Institute of Technology',
        code: 'APEX_TECH',
        campusType: 'Engineering & Technology',
        studentCount: 1250,
        facultyCount: 48,
        activeKiosks: 6,
        theme: {
          primaryColor: '#2563eb',
          secondaryColor: '#38bdf8',
          portalTitle: 'Apex Tech SmartFace Portal'
        },
        personas: [
          { role: 'admin', name: 'Dr. Evelyn Reed (Dean of Academics)', email: 'dean@apextech.edu' },
          { role: 'teacher', name: 'Prof. Marcus Chen (CS Dept Head)', email: 'marcus.chen@apextech.edu' },
          { role: 'student', name: 'Aria Sharma (CS Sophomore)', email: 'aria.sharma@apextech.edu' }
        ]
      },
      {
        id: 'metro_univ',
        name: 'Metropolitan University System',
        code: 'METRO_UNIV',
        campusType: 'Multi-Campus University',
        studentCount: 5400,
        facultyCount: 180,
        activeKiosks: 24,
        theme: {
          primaryColor: '#059669',
          secondaryColor: '#10b981',
          portalTitle: 'Metro University Attendance Hub'
        },
        personas: [
          { role: 'admin', name: 'Registrar Michael Hayes', email: 'registrar@metrouniv.edu' },
          { role: 'teacher', name: 'Dr. Sarah Connor', email: 's.connor@metrouniv.edu' },
          { role: 'student', name: 'Lucas Scott', email: 'l.scott@metrouniv.edu' }
        ]
      }
    ];
  }

  /**
   * Issues a temporary 2-hour sandbox JWT token for sales demonstrations
   */
  static createDemoToken(environmentId, role = 'admin') {
    const envs = this.getSandboxProfiles();
    const targetEnv = envs.find(e => e.id === environmentId) || envs[0];
    const persona = targetEnv.personas.find(p => p.role === role) || targetEnv.personas[0];

    const secret = process.env.SECRET_KEY || process.env.JWT_SECRET || 'smartface-demo-secret-key';
    const payload = {
      sub: `demo_${environmentId}_${persona.role}`,
      email: persona.email,
      name: persona.name,
      role: persona.role,
      college: targetEnv.code,
      isDemo: true
    };

    const token = jwt.sign(payload, secret, { expiresIn: '2h' });

    return {
      token,
      environment: {
        id: targetEnv.id,
        name: targetEnv.name,
        code: targetEnv.code
      },
      persona,
      expiresIn: '2 hours'
    };
  }

  /**
   * Generates synthetic real-time attendance burst stream for sales walkthroughs
   */
  static generateAttendanceBurst(count = 20) {
    const students = [
      'Aria Sharma', 'Devin Vance', 'Kavita Patel', 'Rohan Mehta', 'Liam O\'Connor',
      'Maya Lin', 'Carlos Rodriguez', 'Ananya Gupta', 'Zainab Al-Mansoor', 'Jin Woo'
    ];
    const departments = ['Computer Science', 'Data Science', 'Electronics & Comm'];

    const events = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const studentName = students[i % students.length];
      const dept = departments[i % departments.length];
      const isFaceScan = Math.random() > 0.3; // 70% face scan, 30% QR
      const confidence = isFaceScan ? (0.91 + Math.random() * 0.08).toFixed(3) : null;

      events.push({
        id: `att_demo_${now}_${i}`,
        studentName,
        email: `${studentName.toLowerCase().replace(/[^a-z]/g, '.')}@apextech.edu`,
        department: dept,
        method: isFaceScan ? 'BIOMETRIC_FACE_RECOGNITION' : 'DYNAMIC_QR_CODE',
        confidenceScore: confidence,
        timestamp: new Date(now - (count - i) * 800).toISOString(),
        kioskNode: `Kiosk-Gate-${(i % 3) + 1}`,
        status: 'VERIFIED_PRESENT'
      });
    }

    return events;
  }
}

module.exports = DemoEnvironmentService;
