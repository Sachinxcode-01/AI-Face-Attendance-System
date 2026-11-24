/*
|--------------------------------------------------------------------------
| File: teacher_models.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI - Modern Enterprise Classroom Operations Platform
|
| Purpose:
| Strongly-typed domain models for Teacher / Faculty operations:
| - TeacherSessionModel (Active/past lecture sessions)
| - RosterStudent (Classroom roster status, verification method, confidence)
| - AtRiskStudent (Debarment risk, attendance %, required classes calculation)
| - AttendanceDispute (Dispute claim, evidence, review workflow)
| - TeacherTelemetry (Command center metrics, verification mix, audit logs)
|--------------------------------------------------------------------------
*/

enum RosterStatus { present, late, absent, excused }

enum VerificationMethod { faceAi, qrScan, manual, kiosk, unknown }

extension RosterStatusExtension on RosterStatus {
  String get label {
    switch (this) {
      case RosterStatus.present:
        return 'Present';
      case RosterStatus.late:
        return 'Late';
      case RosterStatus.absent:
        return 'Absent';
      case RosterStatus.excused:
        return 'Excused';
    }
  }

  static RosterStatus fromString(String? val) {
    switch (val?.toLowerCase()) {
      case 'present':
        return RosterStatus.present;
      case 'late':
        return RosterStatus.late;
      case 'excused':
        return RosterStatus.excused;
      case 'absent':
      default:
        return RosterStatus.absent;
    }
  }
}

class TeacherSessionModel {
  final String id;
  final String subject;
  final String room;
  final String teacherEmail;
  final DateTime startTime;
  final DateTime? endTime;
  final bool isActive;
  final int enrolledCount;
  final int presentCount;

  const TeacherSessionModel({
    required this.id,
    required this.subject,
    required this.room,
    required this.teacherEmail,
    required this.startTime,
    this.endTime,
    this.isActive = true,
    this.enrolledCount = 0,
    this.presentCount = 0,
  });

  factory TeacherSessionModel.fromJson(Map<String, dynamic> json) {
    return TeacherSessionModel(
      id: json['session_id']?.toString() ?? json['id']?.toString() ?? '',
      subject: json['subject']?.toString() ?? 'General Lecture',
      room: json['room']?.toString() ?? 'Room 101',
      teacherEmail: json['teacher_email']?.toString() ?? '',
      startTime: json['start_time'] != null
          ? DateTime.tryParse(json['start_time'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endTime: json['end_time'] != null
          ? DateTime.tryParse(json['end_time'].toString())
          : null,
      isActive: json['is_active'] == true || json['status'] == 'active',
      enrolledCount: (json['enrolled_count'] as num?)?.toInt() ?? 0,
      presentCount: (json['present_count'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'subject': subject,
        'room': room,
        'teacher_email': teacherEmail,
        'start_time': startTime.toIso8601String(),
        'end_time': endTime?.toIso8601String(),
        'is_active': isActive,
        'enrolled_count': enrolledCount,
        'present_count': presentCount,
      };
}

class RosterStudent {
  final String id;
  final String name;
  final String usn;
  final String? avatarUrl;
  RosterStatus status;
  final RosterStatus originalStatus;
  final String? verificationTime;
  final VerificationMethod verificationMethod;
  final double confidence;

  RosterStudent({
    required this.id,
    required this.name,
    required this.usn,
    this.avatarUrl,
    this.status = RosterStatus.absent,
    this.originalStatus = RosterStatus.absent,
    this.verificationTime,
    this.verificationMethod = VerificationMethod.unknown,
    this.confidence = 1.0,
  });

  factory RosterStudent.fromJson(Map<String, dynamic> json) {
    final statusStr = json['status']?.toString();
    final parsedStatus = RosterStatusExtension.fromString(statusStr);
    final methodStr = json['verified_by']?.toString().toLowerCase() ?? '';
    
    VerificationMethod method = VerificationMethod.unknown;
    if (methodStr.contains('face') || methodStr.contains('biometric')) {
      method = VerificationMethod.faceAi;
    } else if (methodStr.contains('qr')) {
      method = VerificationMethod.qrScan;
    } else if (methodStr.contains('manual')) {
      method = VerificationMethod.manual;
    } else if (methodStr.contains('kiosk')) {
      method = VerificationMethod.kiosk;
    }

    return RosterStudent(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? json['student_id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['student_name']?.toString() ?? 'Student',
      usn: json['usn']?.toString() ?? json['roll_number']?.toString() ?? '1SF23CS---',
      avatarUrl: json['avatar_url']?.toString(),
      status: parsedStatus,
      originalStatus: parsedStatus,
      verificationTime: json['verification_time']?.toString() ?? json['time']?.toString(),
      verificationMethod: method,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 1.0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'usn': usn,
        'status': status.label,
        'verification_time': verificationTime,
        'confidence': confidence,
      };
}

class AtRiskStudent {
  final String id;
  final String name;
  final String usn;
  final String department;
  final double attendance;
  final int classesAttended;
  final int totalClasses;
  final String parentEmail;
  bool warningSent;

  AtRiskStudent({
    required this.id,
    required this.name,
    required this.usn,
    required this.department,
    required this.attendance,
    required this.classesAttended,
    required this.totalClasses,
    required this.parentEmail,
    this.warningSent = false,
  });

  int get classesNeededFor75 {
    if (attendance >= 75.0) return 0;
    final needed = ((0.75 * totalClasses - classesAttended) / 0.25).ceil();
    return needed > 0 ? needed : 1;
  }

  factory AtRiskStudent.fromJson(Map<String, dynamic> json) {
    final attended = (json['attended'] as num?)?.toInt() ?? 
                     (json['classes_attended'] as num?)?.toInt() ?? 10;
    final total = (json['total'] as num?)?.toInt() ?? 
                  (json['total_classes'] as num?)?.toInt() ?? 25;
    final pct = (json['attendance'] as num?)?.toDouble() ??
        (total > 0 ? (attended / total) * 100 : 0.0);

    return AtRiskStudent(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? json['usn']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Student',
      usn: json['usn']?.toString() ?? json['roll_number']?.toString() ?? '1SF23CS000',
      department: json['department']?.toString() ?? 'Computer Science',
      attendance: pct,
      classesAttended: attended,
      totalClasses: total,
      parentEmail: json['parent_email']?.toString() ?? 'guardian@example.com',
      warningSent: json['warning_sent'] == true,
    );
  }
}

class AttendanceDispute {
  final String id;
  final String studentName;
  final String usn;
  final String subject;
  final DateTime sessionDate;
  final String claimedStatus;
  final String currentStatus;
  final String reasonCategory;
  final String explanation;
  final String? evidenceAttachment;
  String reviewStatus; // 'pending', 'approved', 'rejected'
  String? teacherRemarks;

  AttendanceDispute({
    required this.id,
    required this.studentName,
    required this.usn,
    required this.subject,
    required this.sessionDate,
    required this.claimedStatus,
    required this.currentStatus,
    required this.reasonCategory,
    required this.explanation,
    this.evidenceAttachment,
    this.reviewStatus = 'pending',
    this.teacherRemarks,
  });

  factory AttendanceDispute.fromJson(Map<String, dynamic> json) {
    return AttendanceDispute(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? 'DSP-0000',
      studentName: json['student_name']?.toString() ?? json['name']?.toString() ?? 'Student',
      usn: json['usn']?.toString() ?? json['roll_number']?.toString() ?? '1SF23CS---',
      subject: json['subject']?.toString() ?? 'Lecture',
      sessionDate: json['session_date'] != null
          ? DateTime.tryParse(json['session_date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      claimedStatus: json['claimed_status']?.toString() ?? 'Present',
      currentStatus: json['current_status']?.toString() ?? 'Absent',
      reasonCategory: json['reason_category']?.toString() ?? 'General Dispute',
      explanation: json['explanation']?.toString() ?? '',
      evidenceAttachment: json['evidence_attachment']?.toString() ?? json['evidence']?.toString(),
      reviewStatus: json['status']?.toString().toLowerCase() ?? 'pending',
      teacherRemarks: json['teacher_remarks']?.toString(),
    );
  }
}

class TeacherTelemetry {
  final double averageAttendance;
  final int totalStudents;
  final int activeSessions;
  final double faceScansPct;
  final double qrScansPct;
  final double manualScansPct;
  final List<dynamic> auditLogs;

  const TeacherTelemetry({
    this.averageAttendance = 85.0,
    this.totalStudents = 120,
    this.activeSessions = 0,
    this.faceScansPct = 70.0,
    this.qrScansPct = 25.0,
    this.manualScansPct = 5.0,
    this.auditLogs = const [],
  });

  factory TeacherTelemetry.fromJson(Map<String, dynamic> json) {
    return TeacherTelemetry(
      averageAttendance: (json['average_attendance'] as num?)?.toDouble() ?? 85.0,
      totalStudents: (json['total_students'] as num?)?.toInt() ?? 120,
      activeSessions: (json['active_sessions'] as num?)?.toInt() ?? 0,
      faceScansPct: (json['face_scans_pct'] as num?)?.toDouble() ?? 70.0,
      qrScansPct: (json['qr_scans_pct'] as num?)?.toDouble() ?? 25.0,
      manualScansPct: (json['manual_scans_pct'] as num?)?.toDouble() ?? 5.0,
      auditLogs: (json['audit_logs'] as List?) ?? const [],
    );
  }
}
