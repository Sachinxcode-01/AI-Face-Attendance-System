import 'package:flutter/foundation.dart';

@immutable
class ChatMessage {
  final String id;
  final String sender; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;
  final List<Map<String, dynamic>> suggestedActions;

  const ChatMessage({
    required this.id,
    required this.sender,
    required this.content,
    required this.timestamp,
    this.suggestedActions = const [],
  });

  bool get isUser => sender == 'user';

  Map<String, dynamic> toJson() => {
        'id': id,
        'sender': sender,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
        'suggestedActions': suggestedActions,
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String? ?? 'msg_${DateTime.now().millisecondsSinceEpoch}',
        sender: json['sender'] as String? ?? 'assistant',
        content: json['content'] as String? ?? '',
        timestamp: json['timestamp'] != null
            ? DateTime.parse(json['timestamp'] as String)
            : DateTime.now(),
        suggestedActions: (json['suggestedActions'] as List?)
                ?.map((e) => Map<String, dynamic>.from(e as Map))
                .toList() ??
            const [],
      );
}
