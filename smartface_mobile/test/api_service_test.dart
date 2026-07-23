import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smartface_attendance/core/services/api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

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

  group('ApiService Unit Tests', () {
    test('deduplicates identical concurrent GET requests', () async {
      int requestCount = 0;
      final mockClient = MockClient((request) async {
        requestCount++;
        await Future.delayed(const Duration(milliseconds: 50));
        return http.Response(jsonEncode({'status': 'ok'}), 200);
      });

      final apiService = ApiService(client: mockClient);

      final req1 = apiService.get('/health');
      final req2 = apiService.get('/health');

      final results = await Future.wait([req1, req2]);

      expect(results[0].statusCode, equals(200));
      expect(results[1].statusCode, equals(200));
      expect(requestCount, equals(1));
    });

    test('normalizeAuthResponse formats nested token payloads accurately', () {
      final input = {
        'data': {
          'accessToken': 'test-access-token',
          'refreshToken': 'test-refresh-token',
          'user': {
            'id': 'u123',
            'email': 'user@example.com',
            'name': 'Test User',
            'role': 'student',
            'introCompleted': true,
            'wizardCompleted': true,
          },
        },
      };

      final normalized = normalizeAuthResponse(input);

      expect(normalized['access_token'], equals('test-access-token'));
      expect(normalized['refresh_token'], equals('test-refresh-token'));
      expect(normalized['email'], equals('user@example.com'));
      expect(normalized['introCompleted'], isTrue);
    });

    test('ApiException formats error message correctly', () {
      final exc = ApiException(
        statusCode: 409,
        message: 'Attendance already marked for this session',
        path: '/attendance/mark',
      );

      expect(exc.statusCode, equals(409));
      expect(exc.toString(), contains('409'));
      expect(exc.toString(), contains('/attendance/mark'));
    });
  });
}
