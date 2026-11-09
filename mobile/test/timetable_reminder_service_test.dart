import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartface_attendance/core/services/timetable_reminder_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TimetableReminderService Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({'class_reminders_enabled': true});
    });

    test('Preferences toggle sets and gets properly', () async {
      expect(await TimetableReminderService.isEnabled(), isTrue);

      await TimetableReminderService.setEnabled(false);
      expect(await TimetableReminderService.isEnabled(), isFalse);

      await TimetableReminderService.setEnabled(true);
      expect(await TimetableReminderService.isEnabled(), isTrue);
    });

    test('Parses 12-hour AM/PM time strings into DateTime for today', () {
      final morning = TimetableReminderService.parseSlotTimeToday('09:30 AM');
      expect(morning, isNotNull);
      expect(morning!.hour, equals(9));
      expect(morning.minute, equals(30));

      final afternoon = TimetableReminderService.parseSlotTimeToday('02:45 PM');
      expect(afternoon, isNotNull);
      expect(afternoon!.hour, equals(14));
      expect(afternoon.minute, equals(45));
    });

    test('Parses 24-hour time strings fallback', () {
      final slot = TimetableReminderService.parseSlotTimeToday('15:15');
      expect(slot, isNotNull);
      expect(slot!.hour, equals(15));
      expect(slot.minute, equals(15));
    });

    test('Returns null for malformed time strings gracefully', () {
      final result = TimetableReminderService.parseSlotTimeToday(
        'invalid_time',
      );
      expect(result, isNull);
    });
  });
}
