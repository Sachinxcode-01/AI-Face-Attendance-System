import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smartface_attendance/core/services/api_service.dart';
import 'package:smartface_attendance/core/services/attendance_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AttendanceService - Face Attendance Integration Tests', () {
    late ApiService apiService;

    setUp(() {
      apiService = ApiService();
    });

    test('markAttendanceWithFace returns success on matched face', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.path, '/attendance/mark/face');
        expect(request.headers['Authorization'], 'Bearer fake_jwt_token');

        return http.Response(
          jsonEncode({
            'status': 'success',
            'matched': true,
            'confidence': 0.88,
            'message': 'Face attendance marked successfully',
          }),
          200,
        );
      });

      final service = AttendanceService(apiService);
      final result = await service.markAttendanceWithFace(
        token: 'fake_jwt_token',
        sessionId: 'sess_123',
        imageBytes: [1, 2, 3, 4, 5],
        fileName: 'test_face.jpg',
        client: mockClient,
      );

      expect(result['status'], 'success');
      expect(result['matched'], true);
      expect(result['confidence'], 0.88);
    });

    test(
      'markAttendanceWithFace handles 422 mismatch gracefully without identity leak',
      () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'detail': 'Face verification failed',
              'matched': false,
            }),
            422,
          );
        });

        final service = AttendanceService(apiService);
        final result = await service.markAttendanceWithFace(
          token: 'fake_jwt_token',
          sessionId: 'sess_123',
          imageBytes: [1, 2, 3],
          fileName: 'test_face.jpg',
          client: mockClient,
        );

        expect(result['status'], 'mismatch');
        expect(result['matched'], false);
        expect(result['detail'], 'Face verification failed');
        expect(result.containsKey('student_email'), false);
      },
    );

    test('markAttendanceWithFace handles 413 payload too large', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({'detail': 'Uploaded image is too large (max 5MB)'}),
          413,
        );
      });

      final service = AttendanceService(apiService);
      final result = await service.markAttendanceWithFace(
        token: 'fake_jwt_token',
        sessionId: 'sess_123',
        imageBytes: [1, 2, 3],
        fileName: 'test_face.jpg',
        client: mockClient,
      );

      expect(result['status'], 'payload_too_large');
      expect(result['matched'], false);
      expect(result['detail'], contains('too large'));
    });

    test('markAttendanceWithFace handles 415 unsupported type', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({'detail': 'Unsupported image format'}),
          415,
        );
      });

      final service = AttendanceService(apiService);
      final result = await service.markAttendanceWithFace(
        token: 'fake_jwt_token',
        sessionId: 'sess_123',
        imageBytes: [1, 2, 3],
        fileName: 'test_file.txt',
        client: mockClient,
      );

      expect(result['status'], 'unsupported_type');
      expect(result['matched'], false);
      expect(result['detail'], contains('Unsupported'));
    });

    test('markAttendanceWithFace handles 429 rate limited', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'detail':
                'Too many verification attempts. Please wait a few minutes.',
          }),
          429,
        );
      });

      final service = AttendanceService(apiService);
      final result = await service.markAttendanceWithFace(
        token: 'fake_jwt_token',
        sessionId: 'sess_123',
        imageBytes: [1, 2, 3],
        fileName: 'test_face.jpg',
        client: mockClient,
      );

      expect(result['status'], 'rate_limited');
      expect(result['matched'], false);
      expect(result['detail'], contains('Too many'));
    });

    test('markAttendanceWithFace returns conflict on duplicate 409', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'detail': 'Attendance already marked for this session',
            'message': 'Attendance already marked for this session',
          }),
          409,
        );
      });

      final service = AttendanceService(apiService);
      final result = await service.markAttendanceWithFace(
        token: 'fake_jwt_token',
        sessionId: 'sess_123',
        imageBytes: [1, 2, 3],
        fileName: 'test_face.jpg',
        client: mockClient,
      );

      expect(result['status'], 'conflict');
      expect(result['matched'], false);
      expect(result['detail'], contains('already marked'));
    });

    test('markAttendanceWithFace handles 503 unavailable gracefully', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'detail': 'AI face recognition service is currently unavailable',
          }),
          503,
        );
      });

      final service = AttendanceService(apiService);
      final result = await service.markAttendanceWithFace(
        token: 'fake_jwt_token',
        sessionId: 'sess_123',
        imageBytes: [1, 2, 3],
        fileName: 'test_face.jpg',
        client: mockClient,
      );

      expect(result['status'], 'unavailable');
      expect(result['matched'], false);
      expect(result['detail'], contains('unavailable'));
    });

    test('markAttendanceWithFace handles 504 timeout gracefully', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({'detail': 'AI face recognition request timed out'}),
          504,
        );
      });

      final service = AttendanceService(apiService);
      final result = await service.markAttendanceWithFace(
        token: 'fake_jwt_token',
        sessionId: 'sess_123',
        imageBytes: [1, 2, 3],
        fileName: 'test_face.jpg',
        client: mockClient,
      );

      expect(result['status'], 'timeout');
      expect(result['matched'], false);
      expect(result['detail'], contains('timed out'));
    });
  });
}
