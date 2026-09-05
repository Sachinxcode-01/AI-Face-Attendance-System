import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/chatbot/models/chat_message.dart';

/// Manages the state, position persistence, enabled toggle, and message history
/// for the Nexa Attendance Assistant chatbot.
class ChatbotController extends ChangeNotifier {
  static const String _keyEnabled = 'ai_chatbot_enabled';
  static const String _keyPosX = 'ai_chatbot_pos_x';
  static const String _keyPosY = 'ai_chatbot_pos_y';
  static const String _keyMessages = 'ai_chatbot_messages';
  static const String _keyNoticeSeen = 'ai_chatbot_notice_seen';

  bool _isEnabled = true;
  bool _isOpen = false;
  double? _posX;
  double? _posY;
  bool _isLoading = false;
  int _unreadCount = 0;
  bool _hasSeenNotice = false;
  Future<void>? _initFuture;

  List<ChatMessage> _messages = [];

  bool get isEnabled => _isEnabled;
  bool get isOpen => _isOpen;
  double? get posX => _posX;
  double? get posY => _posY;
  bool get isLoading => _isLoading;
  int get unreadCount => _unreadCount;
  bool get hasSeenNotice => _hasSeenNotice;
  List<ChatMessage> get messages => List.unmodifiable(_messages);

  ChatbotController() {
    init();
  }

  Future<void> init() {
    return _initFuture ??= _doInit();
  }

  Future<void> _doInit() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _isEnabled = prefs.getBool(_keyEnabled) ?? true;
      _posX = prefs.getDouble(_keyPosX);
      _posY = prefs.getDouble(_keyPosY);
      _hasSeenNotice = prefs.getBool(_keyNoticeSeen) ?? false;

      final rawMsgs = prefs.getString(_keyMessages);
      if (rawMsgs != null && rawMsgs.isNotEmpty) {
        final List list = jsonDecode(rawMsgs) as List;
        _messages = list
            .map(
              (e) => ChatMessage.fromJson(Map<String, dynamic>.from(e as Map)),
            )
            .toList();
      }
      notifyListeners();
    } catch (e) {
      debugPrint('[ChatbotController] Init error: $e');
    }
  }

  Future<void> toggleEnabled(bool value) async {
    await init();
    _isEnabled = value;
    if (!value) {
      _isOpen = false;
    }
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyEnabled, value);
    } catch (e) {
      debugPrint('[ChatbotController] Save error: $e');
    }
  }

  Future<void> updatePosition(
    double rawX,
    double rawY,
    double screenWidth,
    double screenHeight, {
    bool snap = false,
  }) async {
    const double buttonSize = 54.0;
    const double minMargin = 16.0;
    const double minY = 60.0;
    final double maxY = screenHeight - 160.0;

    // Clamp Y
    final double clampedY = rawY.clamp(minY, maxY);

    double targetX;
    if (snap) {
      // Snap to nearest left or right edge
      final double midX = screenWidth / 2;
      targetX = (rawX + buttonSize / 2 < midX)
          ? minMargin
          : screenWidth - buttonSize - minMargin;
    } else {
      targetX = rawX.clamp(minMargin, screenWidth - buttonSize - minMargin);
    }

    _posX = targetX;
    _posY = clampedY;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble(_keyPosX, targetX);
      await prefs.setDouble(_keyPosY, clampedY);
    } catch (e) {
      debugPrint('[ChatbotController] Position save error: $e');
    }
  }

  Future<void> resetPosition() async {
    _posX = null;
    _posY = null;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyPosX);
      await prefs.remove(_keyPosY);
    } catch (e) {
      debugPrint('[ChatbotController] Position reset error: $e');
    }
  }

  void openChat() {
    if (!_isEnabled) return;
    _isOpen = true;
    _unreadCount = 0;
    notifyListeners();
  }

  void closeChat() {
    _isOpen = false;
    notifyListeners();
  }

  void toggleChat() {
    if (_isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  Future<void> acceptPrivacyNotice() async {
    _hasSeenNotice = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyNoticeSeen, true);
    } catch (e) {
      debugPrint('[ChatbotController] Notice save error: $e');
    }
  }

  Future<void> sendMessage({
    required String text,
    required String currentRoute,
    required String userRole,
    required String token,
  }) async {
    if (text.trim().isEmpty || _isLoading) return;

    final userMsg = ChatMessage(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      sender: 'user',
      content: text.trim(),
      timestamp: DateTime.now(),
    );

    _messages.add(userMsg);
    _isLoading = true;
    notifyListeners();
    _saveMessagesToPrefs();

    try {
      final historyPayload = _messages
          .take(_messages.length - 1) // exclude current
          .map((m) => {'role': m.sender, 'content': m.content})
          .toList();

      final res = await ApiService.sendChatMessage(
        message: text.trim(),
        history: historyPayload,
        currentRoute: currentRoute,
        token: token,
      );

      final String replyContent =
          (res['reply'] ??
                  res['message']?['content'] ??
                  'Nexa Assistant is ready to help.')
              as String;

      final List<Map<String, dynamic>> actions =
          (res['suggestedActions'] as List?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          [];

      final assistantMsg = ChatMessage(
        id: 'msg_${DateTime.now().millisecondsSinceEpoch + 1}',
        sender: 'assistant',
        content: replyContent,
        timestamp: DateTime.now(),
        suggestedActions: actions,
      );

      _messages.add(assistantMsg);
      if (!_isOpen) {
        _unreadCount++;
      }
    } catch (e) {
      final errorMsg = ChatMessage(
        id: 'msg_${DateTime.now().millisecondsSinceEpoch + 1}',
        sender: 'assistant',
        content:
            'I am currently offline or using local knowledge base. I can help answer questions about QR scanning, face attendance, timetables, and reports!',
        timestamp: DateTime.now(),
      );
      _messages.add(errorMsg);
    } finally {
      _isLoading = false;
      notifyListeners();
      _saveMessagesToPrefs();
    }
  }

  Future<void> clearMessages() async {
    _messages.clear();
    _unreadCount = 0;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyMessages);
    } catch (e) {
      debugPrint('[ChatbotController] Clear error: $e');
    }
  }

  Future<void> _saveMessagesToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = jsonEncode(_messages.map((m) => m.toJson()).toList());
      await prefs.setString(_keyMessages, encoded);
    } catch (e) {
      debugPrint('[ChatbotController] Message save error: $e');
    }
  }
}
