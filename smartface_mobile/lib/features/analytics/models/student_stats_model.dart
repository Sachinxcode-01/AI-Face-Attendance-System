/*
|--------------------------------------------------------------------------
| File: student_stats_model.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Data models representing student academic/attendance analytics and course progress.
|
| Responsibilities:
| - Encapsulates overall attendance percentage, standing, rank, and session streaks.
| - Details per-subject metrics (present counts, total classes, percentage scores).
| - Provides serialization mappings for local and remote communication.
|
| Dependencies:
| - None
|--------------------------------------------------------------------------
*/

// ======================================================
// Data Models: Student Analytics
// ======================================================

/// Student Overall Statistics Model
///
/// Combines overall attendance calculations with department rankings,
/// daily check-in streaks, and detailed class progress breakdowns.
class StudentStatsModel {
  final double overallPercentage;
  final String standing;
  final String rank;
  final int streak;
  final List<SubjectProgressModel> subjects;

  /// Default constructor for creating student statistics model.
  const StudentStatsModel({
    required this.overallPercentage,
    required this.standing,
    required this.rank,
    required this.streak,
    required this.subjects,
  });

  /// Factory constructor for deserializing student statistics from JSON.
  ///
  /// Parameters:
  /// - [json]: Map of raw API key-value pairs.
  ///
  /// Returns:
  /// A parsed [StudentStatsModel] instance.
  factory StudentStatsModel.fromJson(Map<String, dynamic> json) {
    final subjectsList = json['subjects'] as List<dynamic>? ?? [];
    return StudentStatsModel(
      overallPercentage: json['overall_percentage']?.toDouble() ?? 0.82,
      standing: json['standing'] as String? ?? 'Elite Performer',
      rank: json['rank'] as String? ?? 'Ranked #4 in Department',
      streak: json['streak'] as int? ?? 0,
      subjects: subjectsList
          .map((sub) => SubjectProgressModel.fromJson(sub as Map<String, dynamic>))
          .toList(),
    );
  }

  /// Converts the stats model back to a JSON-compatible map.
  ///
  /// Returns:
  /// A Map of serialization key-value pairs.
  Map<String, dynamic> toJson() {
    return {
      'overall_percentage': overallPercentage,
      'standing': standing,
      'rank': rank,
      'streak': streak,
      'subjects': subjects.map((sub) => sub.toJson()).toList(),
    };
  }
}

// ======================================================
// Data Models: Subject Specific Progress
// ======================================================

/// Subject Progress Model
///
/// Holds attendance counters (classes attended vs. total classes held)
/// and calculates percentage statistics for a specific course subject.
class SubjectProgressModel {
  final String subject;
  final double percentage;
  final int present;
  final int total;

  /// Default constructor for creating subject progress model.
  const SubjectProgressModel({
    required this.subject,
    required this.percentage,
    required this.present,
    required this.total,
  });

  /// Factory constructor for deserializing subject progress from JSON.
  ///
  /// Parameters:
  /// - [json]: Map of raw API key-value pairs.
  ///
  /// Returns:
  /// A parsed [SubjectProgressModel] instance.
  factory SubjectProgressModel.fromJson(Map<String, dynamic> json) {
    return SubjectProgressModel(
      subject: json['subject'] as String? ?? 'Unknown Subject',
      percentage: json['percentage']?.toDouble() ?? 0.0,
      present: json['present'] as int? ?? 0,
      total: json['total'] as int? ?? 0,
    );
  }

  /// Converts the subject progress model back to a JSON-compatible map.
  ///
  /// Returns:
  /// A Map of serialization key-value pairs.
  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'percentage': percentage,
      'present': present,
      'total': total,
    };
  }
}

