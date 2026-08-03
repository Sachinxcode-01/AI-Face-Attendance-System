import 'package:flutter/foundation.dart';

@immutable
class ChatMessage {
  final String id;
  final String sender; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;
  final List<Map<String, dynamic>> suggestedActions;
  final String? feedback; // 'helpful', 'not_helpful', or null
  final String? dataSource; // 'knowledge', 'live-data', 'offline-fallback'

  const ChatMessage({
    required this.id,
    required this.sender,
    required this.content,
    required this.timestamp,
    this.suggestedActions = const [],
    this.feedback,
    this.dataSource,
  });

  bool get isUser => sender == 'user';

  ChatMessage copyWith({
    String? id,
    String? sender,
    String? content,
    DateTime? timestamp,
    List<Map<String, dynamic>>? suggestedActions,
    String? feedback,
    String? dataSource,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      sender: sender ?? this.sender,
      content: content ?? this.content,
      timestamp: timestamp ?? this.timestamp,
      suggestedActions: suggestedActions ?? this.suggestedActions,
      feedback: feedback ?? this.feedback,
      dataSource: dataSource ?? this.dataSource,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'sender': sender,
    'content': content,
    'timestamp': timestamp.toIso8601String(),
    'suggestedActions': suggestedActions,
    'feedback': feedback,
    'dataSource': dataSource,
  };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
    id: json['id'] as String? ?? 'msg_${DateTime.now().millisecondsSinceEpoch}',
    sender: json['sender'] as String? ?? 'assistant',
    content: json['content'] as String? ?? '',
    timestamp: json['timestamp'] != null
        ? DateTime.parse(json['timestamp'] as String)
        : DateTime.now(),
    suggestedActions:
        (json['suggestedActions'] as List?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList() ??
        const [],
    feedback: json['feedback'] as String?,
    dataSource: json['dataSource'] as String?,
  );
}
