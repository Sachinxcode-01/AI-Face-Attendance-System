// Immutable domain models for pseudo-3D attendance analytics.

class AttendancePoint {
  final String date;
  final int presentCount;
  final int absentCount;
  final double percentage;

  const AttendancePoint({
    required this.date,
    required this.presentCount,
    required this.absentCount,
    required this.percentage,
  });

  factory AttendancePoint.fromJson(Map<String, dynamic> json) {
    final present =
        json['present'] as int? ?? json['present_count'] as int? ?? 0;
    final absent = json['absent'] as int? ?? json['absent_count'] as int? ?? 0;
    final total = present + absent;
    final pct = json['percentage'] != null
        ? (json['percentage'] as num).toDouble()
        : (total > 0 ? (present / total) * 100.0 : 0.0);

    return AttendancePoint(
      date: json['date'] as String? ?? json['day'] as String? ?? 'N/A',
      presentCount: present,
      absentCount: absent,
      percentage: pct.clamp(0.0, 100.0),
    );
  }
}

class SubjectAttendancePoint {
  final String subjectName;
  final String subjectCode;
  final int present;
  final int absent;
  final int total;
  final double percentage;

  const SubjectAttendancePoint({
    required this.subjectName,
    required this.subjectCode,
    required this.present,
    required this.absent,
    required this.total,
    required this.percentage,
  });

  factory SubjectAttendancePoint.fromJson(Map<String, dynamic> json) {
    final p = json['present'] as int? ?? 0;
    final a = json['absent'] as int? ?? 0;
    final t = json['total'] as int? ?? (p + a);
    final pct = json['percentage'] != null
        ? (json['percentage'] as num).toDouble()
        : (t > 0 ? (p / t) * 100.0 : 0.0);

    return SubjectAttendancePoint(
      subjectName:
          json['subject'] as String? ?? json['name'] as String? ?? 'Subject',
      subjectCode: json['code'] as String? ?? 'SUB',
      present: p,
      absent: a,
      total: t,
      percentage: pct.clamp(0.0, 100.0),
    );
  }
}

class DepartmentAttendancePoint {
  final String department;
  final int students;
  final double attendancePercentage;
  final int activeSessions;

  const DepartmentAttendancePoint({
    required this.department,
    required this.students,
    required this.attendancePercentage,
    required this.activeSessions,
  });

  factory DepartmentAttendancePoint.fromJson(Map<String, dynamic> json) {
    return DepartmentAttendancePoint(
      department: json['department'] as String? ?? 'CS',
      students: json['students'] as int? ?? json['student_count'] as int? ?? 0,
      attendancePercentage:
          (json['attendance_percentage'] as num? ??
                  json['percentage'] as num? ??
                  0.0)
              .toDouble()
              .clamp(0.0, 100.0),
      activeSessions: json['active_sessions'] as int? ?? 0,
    );
  }
}
