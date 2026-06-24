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
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:smartface_attendance/app/config/env_config.dart';

class ApiService {
  final http.Client _client;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  String get baseUrl => EnvConfig.apiUrl;

  /// Performs an HTTP GET request.
  Future<http.Response> get(String path, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$path');
    debugPrint('[ApiService] GET Request: $uri');
    try {
      final response = await _client
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 15));
      debugPrint('[ApiService] GET Response Status: ${response.statusCode}');
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
      final reqHeaders = headers ?? {'Content-Type': 'application/json'};
      final reqBody = body is Map || body is List ? jsonEncode(body) : body;
      final response = await _client
          .post(uri, headers: reqHeaders, body: reqBody)
          .timeout(const Duration(seconds: 15));
      debugPrint('[ApiService] POST Response Status: ${response.statusCode}');
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
      final reqHeaders = headers ?? {'Content-Type': 'application/json'};
      final reqBody = body is Map || body is List ? jsonEncode(body) : body;
      final response = await _client
          .patch(uri, headers: reqHeaders, body: reqBody)
          .timeout(const Duration(seconds: 15));
      debugPrint('[ApiService] PATCH Response Status: ${response.statusCode}');
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
