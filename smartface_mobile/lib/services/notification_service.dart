import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';
import 'api_service.dart';

class NotificationService {
  static final _localNotif = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;
  static String? _fcmToken;

  static String? get fcmToken => _fcmToken;

  // ─── WebSocket real-time stream ───────────────────────────────────
  static String get _wsBaseUrl => 'ws://${ApiService.serverHost}:${ApiService.serverPort}';
  WebSocketChannel? _channel;
  final _streamController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get stream => _streamController.stream;

  void connect({String path = '/ws/notifications', String? token}) {
    try {
      final wsPath = (token != null && token.isNotEmpty)
          ? '$path?token=$token'
          : path;
      debugPrint('[WS] connecting to $_wsBaseUrl$wsPath');
      _channel = WebSocketChannel.connect(Uri.parse('$_wsBaseUrl$wsPath'));
      _channel!.stream.listen(
        (data) {
          try {
            final parsed = jsonDecode(data.toString()) as Map<String, dynamic>;
            _streamController.add(parsed);
          } catch (_) {}
        },
        onError: (e) => debugPrint('[WS] error: $e'),
        onDone: () => debugPrint('[WS] disconnected'),
      );
      debugPrint('[WS] connected to $wsPath');
    } catch (e) {
      debugPrint('[WS] connect failed: $e');
    }
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
  }

  // ─── Initialize ───────────────────────────────────────────────────
  static Future<void> init() async {
    if (_initialized) return;

    // Android channel
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

    // Initialize local notifications
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

    // Request FCM permissions
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);

    // Get FCM token
    try {
      _fcmToken = await messaging.getToken();
      debugPrint('[FCM] Token: $_fcmToken');
    } catch (e) {
      debugPrint('[FCM] token error: $e');
    }

    // Foreground notifications
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Notification tapped while app was in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpen);

    _initialized = true;
  }

  static void _onNotificationTap(NotificationResponse details) {
    debugPrint('[Notification Tap] payload: ${details.payload}');
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
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

  // ─── Show local notification ──────────────────────────────────────
  static Future<void> _showLocalNotification({
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

  // ─── Manual alert trigger ─────────────────────────────────────────
  static Future<void> showAlert({
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

  // ─── Dismiss all ─────────────────────────────────────────────────
  static Future<void> dismissAll() async {
    await _localNotif.cancelAll();
  }
}
