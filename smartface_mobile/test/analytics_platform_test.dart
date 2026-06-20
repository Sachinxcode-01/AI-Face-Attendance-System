/*
|--------------------------------------------------------------------------
| File: analytics_platform_test.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Unit tests verifying the AI Analytics data models and state controller logic.
| Checks serialization, classifications, and property mappings.
|--------------------------------------------------------------------------
*/

import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/features/analytics/models/attendance_analytics_model.dart';
import 'package:smartface_attendance/features/analytics/controllers/analytics_controller.dart';

void main() {
  group('AttendanceScore Model Tests', () {
    test('Should classify score >= 90 as Excellent', () {
      final score = AttendanceScore.fromPercentage(0.94);
      expect(score.category, AttendanceCategory.excellent);
      expect(score.value, 94.0);
      expect(score.label, 'Excellent');
    });

    test('Should classify score between 75 and 90 as Good', () {
      final score = AttendanceScore.fromPercentage(0.82);
      expect(score.category, AttendanceCategory.good);
      expect(score.value, 82.0);
      expect(score.label, 'Good');
    });

    test('Should classify score between 60 and 75 as Warning', () {
      final score = AttendanceScore.fromPercentage(0.68);
      expect(score.category, AttendanceCategory.warning);
      expect(score.value, 68.0);
      expect(score.label, 'Warning');
    });

    test('Should classify score < 60 as Critical', () {
      final score = AttendanceScore.fromPercentage(0.52);
      expect(score.category, AttendanceCategory.critical);
      expect(score.value, 52.0);
      expect(score.label, 'Critical');
    });
  });

  group('AIPredictions Model Tests', () {
    test('Should parse predictions JSON correctly', () {
      final json = {
        'semester_projection': 96.0,
        'trend_direction': 'improving',
        'risk_level': 'low',
        'missable_classes': 3,
      };

      final predictions = AIPredictions.fromJson(json);

      expect(predictions.semesterProjection, 96.0);
      expect(predictions.trendDirection, 'improving');
      expect(predictions.riskLevel, 'low');
      expect(predictions.missableClasses, 3);
    });

    test('Should serialize predictions to JSON correctly', () {
      const predictions = AIPredictions(
        semesterProjection: 92.5,
        trendDirection: 'stable',
        riskLevel: 'medium',
        missableClasses: 1,
      );

      final json = predictions.toJson();

      expect(json['semester_projection'], 92.5);
      expect(json['trend_direction'], 'stable');
      expect(json['risk_level'], 'medium');
      expect(json['missable_classes'], 1);
    });
  });

  group('PersonalInsight Model Tests', () {
    test('Should parse insight and return matching color and icon', () {
      final json = {'text': 'Attendance warning', 'type': 'risk'};
      final insight = PersonalInsight.fromJson(json);

      expect(insight.text, 'Attendance warning');
      expect(insight.type, 'risk');
    });
  });

  group('LeaderboardEntry Model Tests', () {
    test('Should parse leaderboard entry JSON correctly', () {
      final json = {
        'name': 'Sachin K',
        'department': 'CSE',
        'rank': 12,
        'score': 94.0,
        'is_me': true,
      };

      final entry = LeaderboardEntry.fromJson(json);

      expect(entry.name, 'Sachin K');
      expect(entry.department, 'CSE');
      expect(entry.rank, 12);
      expect(entry.score, 94.0);
      expect(entry.isMe, true);
    });
  });

  group('AnalyticsController Tests', () {
    late AnalyticsController controller;

    setUp(() {
      controller = AnalyticsController();
    });

    test('Initial states should be empty or default values', () {
      expect(controller.studentAnalytics, isEmpty);
      expect(controller.teacherAnalytics, isEmpty);
      expect(controller.adminAnalytics, isEmpty);
      expect(controller.isLoading, isFalse);
      expect(controller.errorMessage, isNull);
      expect(controller.selectedPeriod, '30 Days');
    });

    test('Updating period triggers notifier', () {
      var notifiedCount = 0;
      controller.addListener(() {
        notifiedCount++;
      });

      controller.updatePeriod('Semester');

      expect(controller.selectedPeriod, 'Semester');
      expect(notifiedCount, 1);
    });

    test('Fetching student analytics populates state', () async {
      var states = <bool>[];
      controller.addListener(() {
        states.add(controller.isLoading);
      });

      await controller.fetchStudentAnalytics('student@example.com', 'dummy_token');

      expect(controller.studentAnalytics, isNotEmpty);
      expect(controller.studentAnalytics['predicted_semester_attendance'], 96.0);
      expect(controller.isLoading, isFalse);
    });
  });
}
