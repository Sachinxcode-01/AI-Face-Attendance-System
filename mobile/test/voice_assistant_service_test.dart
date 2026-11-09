import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/features/chatbot/services/voice_assistant_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('VoiceAssistantService Unit Tests', () {
    late VoiceAssistantService service;

    setUp(() {
      service = VoiceAssistantService();
    });

    test('Initial state is idle', () {
      expect(service.isListening, isFalse);
      expect(service.isSpeaking, isFalse);
      expect(service.currentlySpeakingId, isNull);
    });

    test('Singleton instance verification', () {
      final s1 = VoiceAssistantService();
      final s2 = VoiceAssistantService();
      expect(identical(s1, s2), isTrue);
    });

    test('Stop functions safely execute without exceptions', () async {
      await expectLater(service.stopListening(), completes);
      await expectLater(service.stopSpeaking(), completes);
      await expectLater(service.dispose(), completes);
      expect(service.isListening, isFalse);
      expect(service.isSpeaking, isFalse);
    });
  });
}

