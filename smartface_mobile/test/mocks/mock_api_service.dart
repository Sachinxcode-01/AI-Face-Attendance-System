import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smartface_attendance/core/network/api_service.dart';

/// Helper to configure mock API responses for mobile testing.
class MockApiService {
  static void setupSuccessLogin({
    required String email,
    required String token,
    required String role,
    String name = 'Test User',
  }) {
    ApiService.client = MockClient((request) async {
      final path = request.url.path;

      if (path.endsWith('/auth/login-password')) {
        return http.Response(
          jsonEncode({
            'access_token': token,
            'token_type': 'bearer',
            'user': {'email': email, 'full_name': name, 'role': role},
          }),
          200,
        );
      }

      if (path.endsWith('/auth/profile')) {
        return http.Response(
          jsonEncode({
            'email': email,
            'full_name': name,
            'role': role,
            'avatar_url': null,
          }),
          200,
        );
      }

      if (path.endsWith('/health')) {
        return http.Response('{"status": "healthy"}', 200);
      }

      return http.Response('{"detail": "Not found in Mock"}', 404);
    });
  }

  static void setupFailure(int statusCode, String errorDetail) {
    ApiService.client = MockClient((request) async {
      return http.Response(jsonEncode({'detail': errorDetail}), statusCode);
    });
  }

  static void setupCustom(MockClient mockClient) {
    ApiService.client = mockClient;
  }

  static void reset() {
    ApiService.client = http.Client();
  }
}
