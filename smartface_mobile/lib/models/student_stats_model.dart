class StudentStatsModel {
  const StudentStatsModel({
    required this.overallPercentage,
    required this.standing,
    required this.rank,
    required this.streak,
    required this.subjects,
  });

  final double overallPercentage;
  final String standing;
  final String rank;
  final int streak;
  final List<SubjectProgressModel> subjects;

  factory StudentStatsModel.fromJson(Map<String, dynamic> json) {
    final subjectItems =
        json['subjects'] ?? json['subject_progress'] ?? json['subjectProgress'];

    return StudentStatsModel(
      overallPercentage: _percentageValue(
        json['overall_percentage'] ?? json['overallPercentage'] ?? json['attendance_percentage'],
      ),
      standing: _stringValue(json['standing'], fallback: 'Good Standing'),
      rank: _stringValue(json['rank'], fallback: 'Unranked'),
      streak: _intValue(json['streak'] ?? json['attendance_streak']),
      subjects: subjectItems is List
          ? subjectItems
                .whereType<Map>()
                .map((item) => SubjectProgressModel.fromJson(Map<String, dynamic>.from(item)))
                .toList()
          : const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'overall_percentage': overallPercentage,
      'standing': standing,
      'rank': rank,
      'streak': streak,
      'subjects': subjects.map((subject) => subject.toJson()).toList(),
    };
  }
}

class SubjectProgressModel {
  const SubjectProgressModel({
    required this.subject,
    required this.present,
    required this.total,
    required this.percentage,
  });

  final String subject;
  final int present;
  final int total;
  final double percentage;

  factory SubjectProgressModel.fromJson(Map<String, dynamic> json) {
    final present = _intValue(json['present'] ?? json['attended']);
    final total = _intValue(json['total'] ?? json['sessions']);
    final suppliedPercentage = json['percentage'] ?? json['attendance_percentage'];

    return SubjectProgressModel(
      subject: _stringValue(json['subject'] ?? json['name'], fallback: 'Unknown Subject'),
      present: present,
      total: total,
      percentage: suppliedPercentage == null
          ? (total == 0 ? 0 : present / total)
          : _percentageValue(suppliedPercentage),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'present': present,
      'total': total,
      'percentage': percentage,
    };
  }
}

String _stringValue(Object? value, {String fallback = ''}) {
  if (value == null) return fallback;
  return value.toString();
}

int _intValue(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

double _percentageValue(Object? value) {
  final number = switch (value) {
    int v => v.toDouble(),
    double v => v,
    String v => double.tryParse(v) ?? 0,
    _ => 0.0,
  };

  return number > 1 ? number / 100 : number;
}
