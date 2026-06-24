/*
|--------------------------------------------------------------------------
| File: ai_analyst_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the chat portal interface for the "Nexa AI" (AI Analyst) module,
| allowing students to query their records, request leaves, and get academic
| standing recommendations using natural language.
|
| Responsibilities:
| - Provides a text chat input and suggestions chips.
| - Implements custom Markdown parsing and high-fidelity HTML-like table rendering for query outputs.
| - Connects queries to the LLM backend via ApiService.askAI.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter_animate/flutter_animate.dart
| - package:google_fonts/google_fonts.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/data/services/api_service.dart
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

// ======================================================
// State & Core Imports
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/app/config/cache_service.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// Screen widget for interactive chat with the AI Analyst assistant.
class AIAnalystScreen extends StatefulWidget {
  const AIAnalystScreen({super.key});

  @override
  State<AIAnalystScreen> createState() => _AIAnalystScreenState();
}

class _AIAnalystScreenState extends State<AIAnalystScreen> {
  final List<Map<String, dynamic>> _messages = [
    {
      'isMe': false,
      'text':
          'Hello! I am your SmartFace AI Analyst. How can I help you with your academic performance today?',
      'time': 'Just now',
    },
  ];
  final TextEditingController _controller = TextEditingController();
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCachedMessages();
    });
  }

  Future<void> _loadCachedMessages() async {
    try {
      final session = context.read<SessionManager>();
      final email = session.email ?? 'student@smartface.elite';
      final cached = await CacheService.get<List<dynamic>>(
        'chat_history_$email',
      );
      if (cached != null && cached.isNotEmpty && mounted) {
        setState(() {
          _messages.clear();
          _messages.addAll(
            cached.map((m) => Map<String, dynamic>.from(m as Map)),
          );
        });
      }
    } catch (e) {
      debugPrint('[AIAnalystScreen] Error loading cached messages: $e');
    }
  }

  Future<void> _saveCachedMessages() async {
    try {
      final session = context.read<SessionManager>();
      final email = session.email ?? 'student@smartface.elite';
      await CacheService.set(
        'chat_history_$email',
        _messages,
        ttl: const Duration(days: 30),
        persist: true,
      );
    } catch (e) {
      debugPrint('[AIAnalystScreen] Error saving cached messages: $e');
    }
  }

  void _sendMessage() async {
    if (_controller.text.isEmpty) return;

    final userQuery = _controller.text;
    setState(() {
      _messages.add({'isMe': true, 'text': userQuery, 'time': 'Now'});
      _isTyping = true;
    });

    _controller.clear();
    _saveCachedMessages();

    // CALL REAL AI ENGINE
    final session = context.read<SessionManager>();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final email = args?['email'] ?? session.email ?? 'student@smartface.elite';
    final result = await ApiService.askAI(email, userQuery);

    if (mounted) {
      setState(() {
        _isTyping = false;
        _messages.add({
          'isMe': false,
          'text':
              result['response'] ??
              result['answer'] ??
              'I apologize, but my neural processing units are currently undergoing maintenance. Please try again in a few minutes.',
          'time': 'Just now',
        });
      });
      _saveCachedMessages();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuroraBackground(
      baseColor: AppColors.bgDeep,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'AI Analyst',
          titleWidget: Row(
            children: [
              const CircleAvatar(
                backgroundColor: AppColors.gold,
                child: Icon(Icons.psychology, color: Colors.black),
              ),
              const SizedBox(width: 15),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'AI Analyst',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'Neural Engine Online',
                    style: TextStyle(fontSize: 10, color: Colors.greenAccent),
                  ),
                ],
              ),
            ],
          ),
        ),
        body: Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[index];
                  return _buildChatBubble(msg['text'], msg['isMe']);
                },
              ),
            ),
            if (_isTyping)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 30, vertical: 10),
                child: Row(
                  children: [
                    Text(
                      'AI is thinking...',
                      style: TextStyle(color: Colors.white30, fontSize: 10),
                    ),
                  ],
                ),
              ).animate().shimmer(),
            _buildQuickReplyChips(),
            _buildInputArea(),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickReplyChips() {
    final chips = [
      'Why is Cloud Arch attendance low?',
      'Apply leave for tomorrow',
      'Check my current streak',
      'How to improve overall standing?',
    ];
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.2),
        border: const Border(
          top: BorderSide(color: Colors.white10, width: 0.5),
        ),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: chips.length,
        itemBuilder: (context, index) {
          final query = chips[index];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              label: Text(
                query,
                style: GoogleFonts.inter(
                  color: Colors.black,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
              backgroundColor: AppColors.gold,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              onPressed: () {
                _controller.text = query;
                _sendMessage();
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildChatBubble(String text, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 15),
        padding: const EdgeInsets.all(16),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.8,
        ),
        decoration: BoxDecoration(
          color: isMe ? AppColors.gold : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(isMe ? 20 : 0),
            bottomRight: Radius.circular(isMe ? 0 : 20),
          ),
          border: isMe ? null : Border.all(color: Colors.white10),
        ),
        child: isMe
            ? Text(
                text,
                style: const TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              )
            : _buildMarkdownContent(text),
      ),
    ).animate().fadeIn().slideX(begin: isMe ? 0.1 : -0.1);
  }

  Widget _buildMarkdownContent(String text) {
    final List<Widget> children = [];
    final lines = text.split('\n');

    List<List<String>> currentTable = [];

    void flushTable() {
      if (currentTable.isEmpty) return;

      final rows = currentTable.where((row) {
        if (row.isEmpty) return false;
        final firstCell = row.first.trim();
        return !firstCell.startsWith('---') && !firstCell.startsWith(':---');
      }).toList();

      if (rows.isNotEmpty) {
        final header = rows.first;
        final dataRows = rows.skip(1).toList();

        children.add(
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.02),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(15),
              child: Table(
                border: TableBorder(
                  horizontalInside: BorderSide(
                    color: Colors.white.withValues(alpha: 0.05),
                    width: 1,
                  ),
                ),
                columnWidths: const {
                  0: FlexColumnWidth(2),
                  1: FlexColumnWidth(1.2),
                  2: FlexColumnWidth(1.2),
                },
                children: [
                  TableRow(
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.1),
                    ),
                    children: header.map((cell) {
                      return Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          cell.trim(),
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            color: AppColors.gold,
                            fontSize: 11,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  ...dataRows.asMap().entries.map((entry) {
                    final int index = entry.key;
                    final List<String> rowCells = entry.value;
                    final isEven = index % 2 == 0;
                    return TableRow(
                      decoration: BoxDecoration(
                        color: isEven
                            ? Colors.white.withValues(alpha: 0.02)
                            : Colors.transparent,
                      ),
                      children: rowCells.map((cell) {
                        return Padding(
                          padding: const EdgeInsets.all(12),
                          child: _buildInlineStyledText(
                            cell.trim(),
                            style: GoogleFonts.inter(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  }),
                ],
              ),
            ),
          ),
        );
      }
      currentTable = [];
    }

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i].trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        final cells = line.split('|').map((c) => c.trim()).toList();
        if (cells.isNotEmpty && cells.first.isEmpty) cells.removeAt(0);
        if (cells.isNotEmpty && cells.last.isEmpty) cells.removeLast();
        currentTable.add(cells);
      } else {
        flushTable();

        if (line.isEmpty) {
          children.add(const SizedBox(height: 8));
        } else if (line.startsWith('* ') ||
            line.startsWith('- ') ||
            line.startsWith('• ')) {
          final content = line.substring(2);
          children.add(
            Padding(
              padding: const EdgeInsets.only(left: 8, bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 6, right: 8),
                    child: Icon(Icons.circle, size: 5, color: AppColors.gold),
                  ),
                  Expanded(
                    child: _buildInlineStyledText(
                      content,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        } else {
          children.add(
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _buildInlineStyledText(
                line,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ),
          );
        }
      }
    }

    flushTable();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    );
  }

  Widget _buildInlineStyledText(String text, {required TextStyle style}) {
    if (!text.contains('**')) {
      return Text(text, style: style);
    }

    final List<TextSpan> spans = [];
    final parts = text.split('**');
    for (int i = 0; i < parts.length; i++) {
      final isBold = i % 2 == 1;
      spans.add(
        TextSpan(
          text: parts[i],
          style: style.copyWith(
            fontWeight: isBold ? FontWeight.bold : style.fontWeight,
            color: isBold ? AppColors.gold : style.color,
          ),
        ),
      );
    }

    return RichText(
      text: TextSpan(children: spans, style: style),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        border: const Border(top: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Ask your AI analyst...',
                hintStyle: const TextStyle(color: Colors.white24),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.05),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          CircleAvatar(
            backgroundColor: AppColors.gold,
            child: IconButton(
              icon: const Icon(Icons.send, color: Colors.black),
              onPressed: _sendMessage,
            ),
          ),
        ],
      ),
    );
  }
}
