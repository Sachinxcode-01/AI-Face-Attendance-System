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

class ApiService {
  final http.Client _client;
  static VoidCallback? onSessionExpired;
  static ValueChanged<String>? onTokenRefreshed;
  bool _isRefreshing = false;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  String get baseUrl => EnvConfig.apiUrl;

  Future<Map<String, String>> _getHeaders(Map<String, String>? userHeaders) async {
    final headers = <String, String>{};
    if (userHeaders != null) {
      headers.addAll(userHeaders);
    }
    if (!headers.containsKey('Content-Type') && !headers.containsKey('content-type')) {
      headers['Content-Type'] = 'application/json';
    }
    final token = await SecureTokenStorage.getAccessToken();
    if (token != null && token.isNotEmpty && !headers.containsKey('Authorization')) {
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
      final refreshRes = await _client.post(
        refreshUri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refresh_token': refreshToken}),
      ).timeout(const Duration(seconds: 15));

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
      debugPrint('[ApiService] Token refresh exception: $e');
      return originalResponse;
    }
  }

  /// Performs an HTTP GET request.
  Future<http.Response> get(String path, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$path');
    debugPrint('[ApiService] GET Request: $uri');
    try {
      final reqHeaders = await _getHeaders(headers);
      var response = await _client
          .get(uri, headers: reqHeaders)
          .timeout(const Duration(seconds: 15));
      debugPrint('[ApiService] GET Response Status: ${response.statusCode}');
      
      if (response.statusCode == 401) {
        response = await _handleUnauthorized(response, () async {
          final newHeaders = await _getHeaders(headers);
          return await _client.get(uri, headers: newHeaders).timeout(const Duration(seconds: 15));
        });
      }
      return response;
    } catch (e) {
      debugPrint('[ApiService] GET Exception: $e');
      rethrow;
    }
  }

  /// Performs an HTTP POST request.
  Future<http.Response> post(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    debugPrint('[ApiService] POST Request: $uri');
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
          return await _client.post(uri, headers: newHeaders, body: reqBody).timeout(const Duration(seconds: 15));
        });
      }
      return response;
    } catch (e) {
      debugPrint('[ApiService] POST Exception: $e');
      rethrow;
    }
  }

  /// Performs an HTTP PATCH request.
  Future<http.Response> patch(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    debugPrint('[ApiService] PATCH Request: $uri');
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
          return await _client.patch(uri, headers: newHeaders, body: reqBody).timeout(const Duration(seconds: 15));
        });
      }
      return response;
    } catch (e) {
      debugPrint('[ApiService] PATCH Exception: $e');
      rethrow;
    }
  }

  /// Dispatches a standard multipart/form-data request.
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    debugPrint('[ApiService] Send Multipart Request: ${request.url}');
    try {
      final token = await SecureTokenStorage.getAccessToken();
      if (token != null && token.isNotEmpty && !request.headers.containsKey('Authorization')) {
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
      debugPrint('[ApiService] Multipart Exception: $e');
      rethrow;
    }
  }
}

Map<String, dynamic> normalizeAuthResponse(Map<String, dynamic> json) {
  final normalized = Map<String, dynamic>.from(json);
  
  if (json.containsKey('data') && json['data'] is Map<String, dynamic>) {
    final data = json['data'] as Map<String, dynamic>;
    
    if (data.containsKey('accessToken') && data['accessToken'] != null) {
      normalized['access_token'] = data['accessToken'];
      normalized['token'] = data['accessToken'];
    }
    if (data.containsKey('refreshToken') && data['refreshToken'] != null) {
      normalized['refresh_token'] = data['refreshToken'];
    }
    
    if (data.containsKey('user') && data['user'] is Map<String, dynamic>) {
      final user = data['user'] as Map<String, dynamic>;
      if (user.containsKey('id')) normalized['id'] = user['id'];
      if (user.containsKey('email')) normalized['email'] = user['email'];
      if (user.containsKey('name')) {
        normalized['name'] = user['name'];
        normalized['full_name'] = user['name'];
      }
      if (user.containsKey('role')) normalized['role'] = user['role'];
      
      final intro = user['introCompleted'] ?? false;
      final wizard = user['wizardCompleted'] ?? user['setup_completed'] ?? user['biometric_registered'] ?? false;
      normalized['introCompleted'] = intro;
      normalized['wizardCompleted'] = wizard;
      normalized['biometric_registered'] = wizard;
      normalized['setup_completed'] = wizard;
    }
  } else {
    final userMap = <String, dynamic>{};
    if (json.containsKey('id')) userMap['id'] = json['id'];
    if (json.containsKey('email')) userMap['email'] = json['email'];
    if (json.containsKey('full_name') || json.containsKey('name')) {
      userMap['name'] = json['full_name'] ?? json['name'];
    }
    if (json.containsKey('role')) userMap['role'] = json['role'];
    
    final wizard = json['biometric_registered'] ?? json['setup_completed'] ?? false;
    userMap['introCompleted'] = json['introCompleted'] ?? false;
    userMap['wizardCompleted'] = wizard;
    
    normalized['success'] = json['success'] ?? !json.containsKey('detail');
    normalized['message'] = json['message'] ?? json['detail'] ?? '';
    normalized['data'] = {
      'accessToken': json['access_token'] ?? json['token'],
      'refreshToken': json['refresh_token'],
      'user': userMap,
    };
    
    normalized['access_token'] = json['access_token'] ?? json['token'];
    normalized['token'] = json['access_token'] ?? json['token'];
    normalized['biometric_registered'] = wizard;
    normalized['setup_completed'] = wizard;
    if (json.containsKey('full_name') || json.containsKey('name')) {
      normalized['full_name'] = json['full_name'] ?? json['name'];
      normalized['name'] = json['full_name'] ?? json['name'];
    }
  }
  
  return normalized;
}
