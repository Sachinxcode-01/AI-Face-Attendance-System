/*
|--------------------------------------------------------------------------
| File: websocket_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Core WebSocket service connecting to real-time events channels
| using EnvConfig.wsUrl.
|
| Responsibilities:
| - Starts/stops active WebSocket connection channels.
| - Manages event streams with automated message parser mapping.
| - Exposes reactive stream events to domain repositories.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:smartface_attendance/app/config/env_config.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  final _streamController = StreamController<Map<String, dynamic>>.broadcast();

  /// Broadcaster stream supplying live notification events.
  Stream<Map<String, dynamic>> get stream => _streamController.stream;

  /// Establishes the real-time WebSocket connection.
  ///
  /// Parameters:
  /// - [path]: Backend socket path route (e.g. '/ws/notifications')
  /// - [token]: Security JWT credentials token
  void connect({String path = '/ws/notifications', String? token}) {
    try {
      final String wsBaseUrl = EnvConfig.wsUrl;
      final wsPath = (token != null && token.isNotEmpty)
          ? '$path?token=$token'
          : path;
      debugPrint('[WS] Connecting to $wsBaseUrl$wsPath');

      _channel = WebSocketChannel.connect(Uri.parse('$wsBaseUrl$wsPath'));
      _channel!.stream.listen(
        (data) {
          try {
            final parsed = jsonDecode(data.toString()) as Map<String, dynamic>;
            _streamController.add(parsed);
          } catch (e) {
            debugPrint('[WS] Stream JSON decode error: $e');
          }
        },
        onError: (e) => debugPrint('[WS] Stream error: $e'),
        onDone: () => debugPrint('[WS] Connection closed'),
      );
      debugPrint('[WS] Connection established successfully.');
    } catch (e) {
      debugPrint('[WS] Connection failed: $e');
    }
  }

  /// Closes the active WebSocket channel listener.
  void disconnect() {
    _channel?.sink.close();
    _channel = null;
    debugPrint('[WS] Disconnected.');
  }
}
