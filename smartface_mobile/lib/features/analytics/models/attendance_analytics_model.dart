/*
|--------------------------------------------------------------------------
| File: attendance_analytics_model.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Data models representing attendance scores, AI predictions, personal insights,
| and leaderboard entries for the smart insights dashboard.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';

/// Categories of attendance health
enum AttendanceCategory { excellent, good, warning, critical }

class AttendanceScore {
  final double value; // 0.0 to 100.0
  final AttendanceCategory category;
  final String label; // Excellent, Good, Warning, Critical

  const AttendanceScore({
    required this.value,
    required this.category,
    required this.label,
  });

  Color get color {
    switch (category) {
      case AttendanceCategory.excellent:
        return Colors.greenAccent;
      case AttendanceCategory.good:
        return const Color(0xFF00FF88);
      case AttendanceCategory.warning:
        return Colors.amberAccent;
      case AttendanceCategory.critical:
        return Colors.redAccent;
    }
  }

  factory AttendanceScore.fromPercentage(double percentage) {
    final val = (percentage * 100).clamp(0.0, 100.0);
    AttendanceCategory cat;
    String lab;

    if (val >= 90.0) {
      cat = AttendanceCategory.excellent;
      lab = 'Excellent';
    } else if (val >= 75.0) {
      cat = AttendanceCategory.good;
      lab = 'Good';
    } else if (val >= 60.0) {
      cat = AttendanceCategory.warning;
      lab = 'Warning';
    } else {
      cat = AttendanceCategory.critical;
      lab = 'Critical';
    }

    return AttendanceScore(value: val, category: cat, label: lab);
  }
}

class AIPredictions {
  final double semesterProjection;
  final String trendDirection; // 'improving' | 'declining' | 'stable'
  final String riskLevel; // 'low' | 'medium' | 'high'
  final int missableClasses;

  const AIPredictions({
    required this.semesterProjection,
    required this.trendDirection,
    required this.riskLevel,
    required this.missableClasses,
  });

  factory AIPredictions.fromJson(Map<String, dynamic> json) {
    return AIPredictions(
      semesterProjection: (json['semester_projection'] as num? ?? 85.0).toDouble(),
      trendDirection: json['trend_direction'] as String? ?? 'stable',
      riskLevel: json['risk_level'] as String? ?? 'low',
      missableClasses: json['missable_classes'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'semester_projection': semesterProjection,
        'trend_direction': trendDirection,
        'risk_level': riskLevel,
        'missable_classes': missableClasses,
      };
}

class PersonalInsight {
  final String text;
  final String type; // 'improving' | 'risk' | 'champion' | 'trend'

  const PersonalInsight({
    required this.text,
    required this.type,
  });

  IconData get icon {
    switch (type.toLowerCase()) {
      case 'improving':
        return Icons.bolt_rounded;
      case 'risk':
        return Icons.warning_amber_rounded;
      case 'champion':
        return Icons.emoji_events_rounded;
      case 'trend':
      default:
        return Icons.trending_up_rounded;
    }
  }

  Color get color {
    switch (type.toLowerCase()) {
      case 'improving':
        return Colors.cyanAccent;
      case 'risk':
        return Colors.redAccent;
      case 'champion':
        return Colors.greenAccent;
      case 'trend':
      default:
        return Colors.amberAccent;
    }
  }

  factory PersonalInsight.fromJson(Map<String, dynamic> json) {
    return PersonalInsight(
      text: json['text'] as String? ?? '',
      type: json['type'] as String? ?? 'trend',
    );
  }

  Map<String, dynamic> toJson() => {
        'text': text,
        'type': type,
      };
}

class LeaderboardEntry {
  final String name;
  final String department;
  final int rank;
  final double score;
  final bool isMe;

  const LeaderboardEntry({
    required this.name,
    required this.department,
    required this.rank,
    required this.score,
    this.isMe = false,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      name: json['name'] as String? ?? 'Student',
      department: json['department'] as String? ?? 'CSE',
      rank: json['rank'] as int? ?? 1,
      score: (json['score'] as num? ?? 85.0).toDouble(),
      isMe: json['is_me'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'department': department,
        'rank': rank,
        'score': score,
        'is_me': isMe,
      };
}
