/*
|--------------------------------------------------------------------------
| File: api_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Base HTTP client layer executing generic GET, POST, PATCH, and Multipart
| requests using the validated environment parameters.
|
| Responsibilities:
| - Communicates with server endpoints using EnvConfig.apiUrl.
| - Configures request headers including bearer tokens and Content-Type.
| - Provides error tracing and request debugging logging.
| - Performs automatic token refresh on 401 Unauthorized responses.
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:smartface_attendance/app/config/env_config.dart';
import 'package:smartface_attendance/core/network/secure_token_storage.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final String? path;

  ApiException({required this.statusCode, required this.message, this.path});

  @override
  String toString() =>
      'ApiException($statusCode): $message${path != null ? " [$path]" : ""}';
}

class ApiService {
  final http.Client _client;
  static VoidCallback? onSessionExpired;
  static ValueChanged<String>? onTokenRefreshed;
  bool _isRefreshing = false;
  final Map<String, Future<http.Response>> _inFlightRequests = {};

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  String get baseUrl => EnvConfig.apiUrl;

  Future<Map<String, String>> _getHeaders(
    Map<String, String>? userHeaders,
  ) async {
    final headers = <String, String>{};
    if (userHeaders != null) {
      headers.addAll(userHeaders);
    }
    if (!headers.containsKey('Content-Type') &&
        !headers.containsKey('content-type')) {
      headers['Content-Type'] = 'application/json';
    }
    final token = await SecureTokenStorage.getAccessToken();
    if (token != null &&
        token.isNotEmpty &&
        !headers.containsKey('Authorization')) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<http.Response> _handleUnauthorized(
    http.Response originalResponse,
    Future<http.Response> Function() retryCallback,
  ) async {
    if (_isRefreshing) {
      return originalResponse;
    }
    _isRefreshing = true;
    try {
      final refreshToken = await SecureTokenStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        _isRefreshing = false;
        await SecureTokenStorage.clearTokens();
        onSessionExpired?.call();
        return originalResponse;
      }

      final refreshUri = Uri.parse('$baseUrl/auth/token/refresh');
      final refreshRes = await _client
          .post(
            refreshUri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'refresh_token': refreshToken}),
          )
          .timeout(const Duration(seconds: 15));

      if (refreshRes.statusCode == 200) {
        final data = jsonDecode(refreshRes.body);
        final newAccessToken = data['access_token'] as String;
        final newRefreshToken = data['refresh_token'] as String;

        await SecureTokenStorage.saveTokens(
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        );
        onTokenRefreshed?.call(newAccessToken);
        _isRefreshing = false;
        return await retryCallback();
      } else {
        _isRefreshing = false;
        await SecureTokenStorage.clearTokens();
        onSessionExpired?.call();
        return originalResponse;
      }
    } catch (e) {
      _isRefreshing = false;
      debugPrint('[ApiService] Token refresh exception (credentials hidden)');
      return originalResponse;
    }
  }

  /// Deduplicates in-flight requests with identical keys.
  Future<http.Response> _dedupRequest(
    String key,
    Future<http.Response> Function() requestFn,
  ) {
    if (_inFlightRequests.containsKey(key)) {
      debugPrint('[ApiService] Duplicate request prevented for key: $key');
      return _inFlightRequests[key]!;
    }
    final future = requestFn().whenComplete(() {
      _inFlightRequests.remove(key);
    });
    _inFlightRequests[key] = future;
    return future;
  }

  /// Performs an HTTP GET request.
  Future<http.Response> get(String path, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$path');
    final reqKey = 'GET:$path';
    debugPrint('[ApiService] GET Request: $path');
    return _dedupRequest(reqKey, () async {
      try {
        final reqHeaders = await _getHeaders(headers);
        var response = await _client
            .get(uri, headers: reqHeaders)
            .timeout(const Duration(seconds: 15));
        debugPrint('[ApiService] GET Response Status: ${response.statusCode}');

        if (response.statusCode == 401) {
          response = await _handleUnauthorized(response, () async {
            final newHeaders = await _getHeaders(headers);
            return await _client
                .get(uri, headers: newHeaders)
                .timeout(const Duration(seconds: 15));
          });
        }
        return response;
      } catch (e) {
        debugPrint('[ApiService] GET Error on $path');
        rethrow;
      }
    });
  }

  /// Performs an HTTP POST request.
  Future<http.Response> post(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final reqKey = 'POST:$path:${body.hashCode}';
    debugPrint('[ApiService] POST Request: $path');
    return _dedupRequest(reqKey, () async {
      try {
        final reqHeaders = await _getHeaders(headers);
        final reqBody = body is Map || body is List ? jsonEncode(body) : body;
        var response = await _client
            .post(uri, headers: reqHeaders, body: reqBody)
            .timeout(const Duration(seconds: 15));
        debugPrint('[ApiService] POST Response Status: ${response.statusCode}');

        if (response.statusCode == 401) {
          response = await _handleUnauthorized(response, () async {
            final newHeaders = await _getHeaders(headers);
            return await _client
                .post(uri, headers: newHeaders, body: reqBody)
                .timeout(const Duration(seconds: 15));
          });
        }
        return response;
      } catch (e) {
        debugPrint('[ApiService] POST Error on $path');
        rethrow;
      }
    });
  }

  /// Performs an HTTP PATCH request.
  Future<http.Response> patch(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    debugPrint('[ApiService] PATCH Request: $path');
    try {
      final reqHeaders = await _getHeaders(headers);
      final reqBody = body is Map || body is List ? jsonEncode(body) : body;
      var response = await _client
          .patch(uri, headers: reqHeaders, body: reqBody)
          .timeout(const Duration(seconds: 15));
      debugPrint('[ApiService] PATCH Response Status: ${response.statusCode}');

      if (response.statusCode == 401) {
        response = await _handleUnauthorized(response, () async {
          final newHeaders = await _getHeaders(headers);
          return await _client
              .patch(uri, headers: newHeaders, body: reqBody)
              .timeout(const Duration(seconds: 15));
        });
      }
      return response;
    } catch (e) {
      debugPrint('[ApiService] PATCH Error on $path');
      rethrow;
    }
  }

  /// Dispatches a standard multipart/form-data request.
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    debugPrint('[ApiService] Send Multipart Request to: ${request.url.path}');
    try {
      final token = await SecureTokenStorage.getAccessToken();
      if (token != null &&
          token.isNotEmpty &&
          !request.headers.containsKey('Authorization')) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      final response = await _client
          .send(request)
          .timeout(const Duration(seconds: 30));
      debugPrint(
        '[ApiService] Multipart Response Status: ${response.statusCode}',
      );
      return response;
    } catch (e) {
      debugPrint('[ApiService] Multipart Error on ${request.url.path}');
      rethrow;
    }
  }
}

Map<String, dynamic> normalizeAuthResponse(dynamic rawJson) {
  if (rawJson == null || rawJson is! Map) {
    return {
      'success': false,
      'detail': 'Invalid response from server.',
    };
  }
  final json = Map<String, dynamic>.from(rawJson);
  final normalized = Map<String, dynamic>.from(json);

  // Extract access and refresh tokens safely
  String? extractedToken;
  String? extractedRefreshToken;

  if (json.containsKey('data') && json['data'] is Map) {
    final data = Map<String, dynamic>.from(json['data'] as Map);

    if (data['accessToken'] != null && data['accessToken'].toString().isNotEmpty) {
      extractedToken = data['accessToken'].toString();
    }
    if (data['refreshToken'] != null && data['refreshToken'].toString().isNotEmpty) {
      extractedRefreshToken = data['refreshToken'].toString();
    }

    if (data['user'] is Map) {
      final user = Map<String, dynamic>.from(data['user'] as Map);
      if (user.containsKey('id')) normalized['id'] = user['id'];
      if (user.containsKey('email')) normalized['email'] = user['email'];
      if (user.containsKey('name')) {
        normalized['name'] = user['name'];
        normalized['full_name'] = user['name'];
      }
      if (user.containsKey('role')) normalized['role'] = user['role'];

      final intro = user['introCompleted'] ?? false;
      final wizard = user['wizardCompleted'] ??
          user['setup_completed'] ??
          user['biometric_registered'] ??
          false;
      normalized['introCompleted'] = intro;
      normalized['wizardCompleted'] = wizard;
      normalized['biometric_registered'] = wizard;
      normalized['setup_completed'] = wizard;
    }
  }

  // Fallback to top-level token fields if not in data object
  if (extractedToken == null || extractedToken.isEmpty) {
    if (json['access_token'] != null && json['access_token'].toString().isNotEmpty) {
      extractedToken = json['access_token'].toString();
    } else if (json['token'] != null && json['token'].toString().isNotEmpty) {
      extractedToken = json['token'].toString();
    }
  }

  if (extractedRefreshToken == null || extractedRefreshToken.isEmpty) {
    if (json['refresh_token'] != null && json['refresh_token'].toString().isNotEmpty) {
      extractedRefreshToken = json['refresh_token'].toString();
    }
  }

  final bool hasValidToken = extractedToken != null && extractedToken.isNotEmpty;

  if (hasValidToken) {
    normalized['access_token'] = extractedToken;
    normalized['token'] = extractedToken;
    normalized['success'] = true;
  } else {
    normalized.remove('access_token');
    normalized.remove('token');
    normalized['success'] = json['success'] == true;
  }

  if (extractedRefreshToken != null && extractedRefreshToken.isNotEmpty) {
    normalized['refresh_token'] = extractedRefreshToken;
  } else {
    normalized.remove('refresh_token');
  }

  if (json.containsKey('full_name') || json.containsKey('name')) {
    normalized['full_name'] = json['full_name'] ?? json['name'];
    normalized['name'] = json['full_name'] ?? json['name'];
  }

  return normalized;
}
