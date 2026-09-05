import 'analytics_models.dart';

/// AnalyticsDataMapper — Safe data mapper converting raw API JSON payloads into
/// immutable domain models with zero-division protection and null safety.
class AnalyticsDataMapper {
  AnalyticsDataMapper._();

  static List<AttendancePoint> parseWeeklyPoints(List<dynamic>? rawList) {
    if (rawList == null || rawList.isEmpty) return [];
    return rawList
        .map(
          (item) => AttendancePoint.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  static List<SubjectAttendancePoint> parseSubjectPoints(
    List<dynamic>? rawList,
  ) {
    if (rawList == null || rawList.isEmpty) return [];
    return rawList
        .map(
          (item) =>
              SubjectAttendancePoint.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  static List<DepartmentAttendancePoint> parseDepartmentPoints(
    List<dynamic>? rawList,
  ) {
    if (rawList == null || rawList.isEmpty) return [];
    return rawList
        .map(
          (item) => DepartmentAttendancePoint.fromJson(
            Map<String, dynamic>.from(item),
          ),
        )
        .toList();
  }

  static double safePercentage(int present, int total) {
    if (total <= 0) return 0.0;
    return ((present / total) * 100.0).clamp(0.0, 100.0);
  }
}
