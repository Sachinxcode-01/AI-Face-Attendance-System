/*
|--------------------------------------------------------------------------
| File: notification_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Service layer coordinating push notifications using Firebase Cloud Messaging (FCM)
| and local devices notification dispatchers. Delegates websocket connections
| to WebSocketService.
|
| Responsibilities:
| - Registers FCM channels and retrieves registration tokens.
| - Pulls user notifications lists and manages read actions via ApiService.
| - Triggers sound/visual alerts for active foreground threats.
| - Delegates live WebSocket subscriptions to WebSocketService.
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:smartface_attendance/core/services/api_service.dart';
import 'package:smartface_attendance/core/services/websocket_service.dart';

class NotificationService {
  final ApiService _api;
  final WebSocketService _ws;
  static final _localNotif = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;
  static String? _fcmToken;

  NotificationService(this._api, this._ws);

  static String? get fcmToken => _fcmToken;

  /// WebSocket Delegates
  void connect({String path = '/ws/notifications', String? token}) {
    _ws.connect(path: path, token: token);
  }

  void disconnect() {
    _ws.disconnect();
  }

  Stream<Map<String, dynamic>> get stream => _ws.stream;

  /// Fetches the user notifications history.
  Future<List<dynamic>> getNotifications(String email) async {
    try {
      final response = await _api.get('/notifications/$email');
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      debugPrint('[NotificationService] getNotifications error: $e');
    }
    return [];
  }

  /// Fetches unread notifications count.
  Future<int> getUnreadCount(String email, String token) async {
    try {
      final response = await _api.get(
        '/notifications/unread-count/$email',
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['unread_count'] as int? ?? 0;
      }
    } catch (e) {
      debugPrint('[NotificationService] getUnreadCount error: $e');
    }
    return 0;
  }

  /// Marks a specific list of notifications as read.
  Future<bool> markNotificationsRead(List<String> ids, String token) async {
    try {
      final response = await _api.patch(
        '/notifications/mark-read',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: {'ids': ids},
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[NotificationService] markNotificationsRead error: $e');
      return false;
    }
  }

  /// Initializes the notification system configurations.
  Future<void> init() async {
    if (_initialized) return;

    // Configure standard Android high importance channel
    const androidChannel = AndroidNotificationChannel(
      'smartface_high',
      'SmartAttendance Alerts',
      description: 'Real-time attendance, security, and leave notifications',
      importance: Importance.max,
      playSound: true,
    );

    final androidImpl = _localNotif
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidImpl?.createNotificationChannel(androidChannel);

    // Initialize local notifications system
    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      ),
    );

    await _localNotif.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Request FCM permissions from the operating system
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);

    // Retrieve unique FCM registration token
    try {
      _fcmToken = await messaging.getToken();
      debugPrint('[FCM] Token: $_fcmToken');
    } catch (e) {
      debugPrint('[FCM] token error: $e');
    }

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpen);

    _initialized = true;
  }

  static void _onNotificationTap(NotificationResponse details) {
    debugPrint('[Notification Tap] payload: ${details.payload}');
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;
    debugPrint('[FCM Foreground] ${notification.title}: ${notification.body}');
    await _showLocalNotification(
      id: message.hashCode,
      title: notification.title ?? 'SmartAttendance',
      body: notification.body ?? '',
      payload: message.data['route'],
    );
  }

  static void _handleNotificationOpen(RemoteMessage message) {
    debugPrint('[FCM Opened] ${message.data}');
  }

  Future<void> _showLocalNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'smartface_high',
      'SmartAttendance Alerts',
      channelDescription: 'Real-time alerts',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    await _localNotif.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );
  }

  /// Manually dispatches a local device notification card alert.
  Future<void> showAlert({
    required String title,
    required String message,
    String? payload,
  }) async {
    await _showLocalNotification(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: message,
      payload: payload,
    );
  }

  /// Clears notifications from list.
  Future<void> dismissAll() async {
    await _localNotif.cancelAll();
  }
}
