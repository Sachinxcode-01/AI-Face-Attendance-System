import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartface_attendance/core/services/calendar_reminder_service.dart';

/// Service coordinating automated 10-minute pre-lecture notifications
/// based on the student's active semester timetable slots.
class TimetableReminderService {
  static const String _keyRemindersEnabled = 'class_reminders_enabled';

  /// Returns whether class notifications are currently enabled.
  static Future<bool> isEnabled() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(_keyRemindersEnabled) ?? true;
    } catch (_) {
      return true;
    }
  }

  /// Toggles class notification preferences.
  static Future<void> setEnabled(bool value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyRemindersEnabled, value);
      if (!value) {
        await CalendarReminderService.clearAllReminders();
      }
    } catch (e) {
      debugPrint('[TimetableReminderService] setEnabled error: $e');
    }
  }

  /// Parses a time string (e.g., '09:00 AM', '11:30 AM', '02:15 PM') into hour and minute.
  static DateTime? parseSlotTimeToday(String timeStr) {
    try {
      final clean = timeStr.trim();
      final format = DateFormat('hh:mm a');
      final parsed = format.parse(clean);

      final now = DateTime.now();
      return DateTime(now.year, now.month, now.day, parsed.hour, parsed.minute);
    } catch (_) {
      try {
        // Fallback for 24h format (e.g. '09:00')
        final parts = timeStr.trim().split(':');
        if (parts.length >= 2) {
          final h = int.parse(parts[0]);
          final m = int.parse(parts[1].split(' ')[0]);
          final now = DateTime.now();
          return DateTime(now.year, now.month, now.day, h, m);
        }
      } catch (_) {}
      return null;
    }
  }

  /// Automatically schedules 10-minute advance reminders for all upcoming slots today.
  static Future<int> syncTodayReminders(List<dynamic> timetableSlots) async {
    final enabled = await isEnabled();
    if (!enabled || timetableSlots.isEmpty) return 0;

    final now = DateTime.now();
    final todayName = DateFormat(
      'EEEE',
    ).format(now).toLowerCase(); // 'monday', 'tuesday', etc.

    // Filter today's slots
    final todaySlots = timetableSlots.where((slot) {
      final day = slot['day']?.toString().toLowerCase() ?? '';
      return day == todayName;
    }).toList();

    int scheduledCount = 0;

    for (int i = 0; i < todaySlots.length; i++) {
      final slot = todaySlots[i];
      final subject = (slot['subject'] ?? slot['course'] ?? 'Class').toString();
      final timeStr = (slot['time'] ?? '').toString();
      final room = (slot['room'] ?? slot['room_number'] ?? 'Assigned Room')
          .toString();

      final classTime = parseSlotTimeToday(timeStr);
      if (classTime == null) continue;

      // 10 minutes prior
      final reminderTime = classTime.subtract(const Duration(minutes: 10));

      // Only schedule if class has not already started
      if (classTime.isAfter(now)) {
        final notificationId = 1000 + i;
        await CalendarReminderService.scheduleClassReminder(
          id: notificationId,
          title: '🔔 Class in 10 mins: $subject',
          body: '$subject starts at $timeStr in $room. Tap to view timetable.',
          hour: reminderTime.hour,
          minute: reminderTime.minute,
        );
        scheduledCount++;
      }
    }

    debugPrint(
      '[TimetableReminderService] Scheduled $scheduledCount pre-lecture alerts for today ($todayName).',
    );
    return scheduledCount;
  }
}
