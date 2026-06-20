/*
|--------------------------------------------------------------------------
| File: notification_repository.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Repository class managing local and push alarms configurations along with
| WebSocket connections.
|--------------------------------------------------------------------------
*/

import 'package:smartface_attendance/core/services/notification_service.dart';
import 'package:smartface_attendance/core/services/websocket_service.dart';

class NotificationRepository {
  final NotificationService _notificationService;
  final WebSocketService _webSocketService;

  NotificationRepository(this._notificationService, this._webSocketService);

  Future<void> init() async {
    await _notificationService.init();
  }

  Future<List<dynamic>> getNotifications(String email) async {
    return await _notificationService.getNotifications(email);
  }

  Future<int> getUnreadCount(String email, String token) async {
    return await _notificationService.getUnreadCount(email, token);
  }

  Future<bool> markNotificationsRead(List<String> ids, String token) async {
    return await _notificationService.markNotificationsRead(ids, token);
  }

  Future<void> showAlert({required String title, required String message, String? payload}) async {
    await _notificationService.showAlert(title: title, message: message, payload: payload);
  }

  Future<void> dismissAll() async {
    await _notificationService.dismissAll();
  }

  // WebSocket interfaces
  void connectWebSocket({String path = '/ws/notifications', String? token}) {
    _webSocketService.connect(path: path, token: token);
  }

  void disconnectWebSocket() {
    _webSocketService.disconnect();
  }

  Stream<Map<String, dynamic>> get webSocketStream => _webSocketService.stream;
}
