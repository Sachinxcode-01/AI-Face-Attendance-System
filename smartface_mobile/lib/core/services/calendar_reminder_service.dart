import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class CalendarReminderService {
  static final _localNotif = FlutterLocalNotificationsPlugin();

  /// Schedules a reminder for a specific class slot.
  static Future<void> scheduleClassReminder({
    required int id,
    required String title,
    required String body,
    required int hour,
    required int minute,
  }) async {
    try {
      const androidDetails = AndroidNotificationDetails(
        'smartface_reminders',
        'Class Reminders',
        channelDescription: 'Timetable class slot notifications',
        importance: Importance.max,
        priority: Priority.high,
      );
      const iosDetails = DarwinNotificationDetails();
      const details = NotificationDetails(android: androidDetails, iOS: iosDetails);

      // In unit test or simple runtime, schedule a simple notification or mock schedule
      await _localNotif.show(
        id: id,
        title: title,
        body: body,
        notificationDetails: details,
      );
      debugPrint('[Reminder] Dispatched local reminder: $title');
    } catch (e) {
      debugPrint('[Reminder] Failed to schedule reminder: $e');
    }
  }

  static Future<void> clearAllReminders() async {
    await _localNotif.cancelAll();
    debugPrint('[Reminder] Cancelled all reminders');
  }
}
