import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Mock Native Channel for FlutterSecureStorage
  const channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  final Map<String, String> mockSecureStorage = {};

  setUpAll(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (MethodCall methodCall) async {
          switch (methodCall.method) {
            case 'read':
              final key = methodCall.arguments['key'] as String;
              return mockSecureStorage[key];
            case 'write':
              final key = methodCall.arguments['key'] as String;
              final value = methodCall.arguments['value'] as String;
              mockSecureStorage[key] = value;
              return null;
            case 'delete':
              final key = methodCall.arguments['key'] as String;
              mockSecureStorage.remove(key);
              return null;
            case 'deleteAll':
              mockSecureStorage.clear();
              return null;
            case 'readAll':
              return mockSecureStorage;
            default:
              return null;
          }
        });
  });

  setUp(() {
    mockSecureStorage.clear();
  });

  group('SessionManager Unit Tests', () {
    test('Initializes with empty session when storage is clean', () async {
      final session = SessionManager();
      final loggedIn = await session.init();

      expect(loggedIn, isFalse);
      expect(session.isLoggedIn, isFalse);
      expect(session.token, isNull);
      expect(session.email, isNull);
      expect(session.role, isNull);
    });

    test('Saves session correctly and updates variables', () async {
      final session = SessionManager();

      await session.saveSession(
        token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummyPayload.dummySignature',
        email: 'student@example.com',
        role: 'student',
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.png',
        biometricRegistered: true,
      );

      expect(session.isLoggedIn, isTrue);
      expect(
        session.token,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummyPayload.dummySignature',
      );
      expect(session.email, 'student@example.com');
      expect(session.role, 'student');
      expect(session.name, 'John Doe');
      expect(session.avatarUrl, 'https://example.com/avatar.png');
      expect(session.biometricRegistered, isTrue);
      expect(session.isStudent, isTrue);
      expect(session.isAdmin, isFalse);
      expect(session.isTeacher, isFalse);
    });

    test('Validates hasValidToken correctly', () async {
      final session = SessionManager();

      // Non JWT token
      await session.saveSession(
        token: 'simple_token',
        email: 'a@a.com',
        role: 'admin',
      );
      expect(session.hasValidToken, isFalse);

      // JWT token (3 dot-separated parts)
      await session.saveSession(
        token: 'part1.part2.part3',
        email: 'a@a.com',
        role: 'admin',
      );
      expect(session.hasValidToken, isTrue);
    });

    test('Clears session on logout', () async {
      final session = SessionManager();

      await session.saveSession(
        token: 'test_token',
        email: 'teacher@example.com',
        role: 'teacher',
      );
      expect(session.isLoggedIn, isTrue);

      await session.logout();

      expect(session.isLoggedIn, isFalse);
      expect(session.token, isNull);
      expect(session.email, isNull);
      expect(session.role, isNull);
      expect(mockSecureStorage.isEmpty, isTrue);
    });
  });
}
