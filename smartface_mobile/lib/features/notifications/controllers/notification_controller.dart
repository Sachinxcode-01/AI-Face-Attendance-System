/*
|--------------------------------------------------------------------------
| File: notification_controller.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Presentation controller that manages unread counts, displays foreground banner alerts,
| and handles WebSocket incoming events.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:smartface_attendance/features/notifications/repositories/notification_repository.dart';

class NotificationController extends ChangeNotifier {
  final NotificationRepository _repository;
  List<dynamic> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  StreamSubscription<Map<String, dynamic>>? _wsSubscription;

  NotificationController(this._repository);

  List<dynamic> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Initializes configurations and fetches initial unread count.
  Future<void> init() async {
    await _repository.init();
  }

  Future<void> fetchNotifications(String email) async {
    _setLoading(true);
    try {
      _notifications = await _repository.getNotifications(email);
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchUnreadCount(String email, String token) async {
    _unreadCount = await _repository.getUnreadCount(email, token);
    notifyListeners();
  }

  Future<void> markAsRead(List<String> ids, String email, String token) async {
    final success = await _repository.markNotificationsRead(ids, token);
    if (success) {
      await fetchNotifications(email);
      await fetchUnreadCount(email, token);
    }
  }

  /// Opens the WebSocket notifications stream and subscribes to events.
  void startWebSocketStream({
    String path = '/ws/notifications',
    String? token,
    required String email,
  }) {
    _wsSubscription?.cancel();
    _repository.connectWebSocket(path: path, token: token);
    _wsSubscription = _repository.webSocketStream.listen((event) {
      debugPrint('[NotificationController] WS Message received: $event');
      // Append to the list or show local system banner
      _notifications.insert(0, event);
      _unreadCount++;
      notifyListeners();

      // Trigger local popup alert if it is important
      final title = event['title'] as String? ?? 'SmartFace AI';
      final body = event['message'] as String? ?? '';
      _repository.showAlert(title: title, message: body);
    });
  }

  /// Closes the WebSocket stream subscription.
  void stopWebSocketStream() {
    _wsSubscription?.cancel();
    _wsSubscription = null;
    _repository.disconnectWebSocket();
  }

  @override
  void dispose() {
    stopWebSocketStream();
    super.dispose();
  }
}
