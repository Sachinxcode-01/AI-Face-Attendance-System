import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/core/constants/asset_paths.dart';
import 'package:smartface_attendance/design_system/ui/app_colors.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/chatbot/controllers/chatbot_controller.dart';
import 'package:smartface_attendance/features/chatbot/models/chat_message.dart';

class NexaChatSheet extends StatefulWidget {
  const NexaChatSheet({super.key});

  @override
  State<NexaChatSheet> createState() => _NexaChatSheetState();
}

class _NexaChatSheetState extends State<NexaChatSheet> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  String _getRoleWelcome(String role) {
    switch (role.toLowerCase()) {
      case 'teacher':
        return 'Hello, I’m Nexa. I can help you manage attendance sessions, rolling QR codes, live attendance, reports, assigned classes, and leave requests.';
      case 'parent':
        return 'Hello, I’m Nexa. I can help you view your linked ward’s attendance, subject reports, alerts, and leave status.';
      case 'admin':
      case 'hod':
        return 'Hello, I’m Nexa. I can help you understand system monitoring, users, active sessions, reports, audit logs, and security events.';
      case 'student':
      default:
        return 'Hello, I’m Nexa. I can help you understand your attendance, timetable, QR scanning, face attendance, reports, leave requests, and app settings.';
    }
  }

  List<String> _getRoleSuggestions(String role) {
    switch (role.toLowerCase()) {
      case 'teacher':
        return [
          'How do I start a session?',
          'How does rolling QR work?',
          'How do I view live attendance?',
          'How do I review leave requests?',
        ];
      case 'parent':
        return [
          'How do I switch wards?',
          'Where can I see attendance alerts?',
          'How do I view subject attendance?',
          'How do I check leave status?',
        ];
      case 'admin':
      case 'hod':
        return [
          'How do I monitor active sessions?',
          'Where are security logs?',
          'How do I manage users?',
          'How is system health checked?',
        ];
      case 'student':
      default:
        return [
          'How do I mark QR attendance?',
          'Why is my attendance low?',
          'How do I use face attendance?',
          'Show today’s timetable',
          'How do I apply for leave?',
          'Where can I view reports?',
        ];
    }
  }

  void _handleSend(String query) {
    if (query.trim().isEmpty) return;

    final session = context.read<SessionManager>();
    final chatbot = context.read<ChatbotController>();
    String currentRoute = '/';
    try {
      currentRoute = GoRouterState.of(context).matchedLocation;
    } catch (_) {
      try {
        currentRoute = GoRouter.of(
          context,
        ).routerDelegate.currentConfiguration.uri.toString();
      } catch (_) {
        currentRoute = '/';
      }
    }

    chatbot.sendMessage(
      text: query,
      currentRoute: currentRoute,
      userRole: session.userRole.name,
      token: session.token ?? '',
    );

    _textController.clear();
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;
    final session = context.watch<SessionManager>();
    final chatbot = context.watch<ChatbotController>();
    final role = session.userRole.name;

    final suggestions = _getRoleSuggestions(role);

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            children: [
              // Sheet handle
              const SizedBox(height: 10),
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 8),

              // Header
              _buildHeader(context, chatbot, isDark, role),
              const Divider(height: 1, color: Colors.white10),

              // Body area
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  children: [
                    // Privacy notice (first-time)
                    if (!chatbot.hasSeenNotice)
                      _buildPrivacyNotice(context, chatbot, isDark),

                    // Welcome card
                    _buildWelcomeCard(role, isDark),
                    const SizedBox(height: 16),

                    // Messages list
                    ...chatbot.messages.map(
                      (msg) => _buildMessageBubble(msg, isDark),
                    ),

                    // Loading indicator
                    if (chatbot.isLoading) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.gold,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            'Nexa is thinking...',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: isDark ? Colors.white54 : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Suggestion Chips
                    Text(
                      'SUGGESTED QUESTIONS',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                        color: AppColors.gold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: suggestions
                          .map(
                            (q) => ActionChip(
                              label: Text(
                                q,
                                style: const TextStyle(fontSize: 12),
                              ),
                              backgroundColor: isDark
                                  ? Colors.white.withValues(alpha: 0.08)
                                  : AppColors.primary.withValues(alpha: 0.08),
                              side: BorderSide(
                                color: AppColors.gold.withValues(alpha: 0.3),
                              ),
                              onPressed: () => _handleSend(q),
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),

              // Input bar
              _buildInputBar(isDark, chatbot),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader(
    BuildContext context,
    ChatbotController chatbot,
    bool isDark,
    String role,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
              gradient: AppColors.headerGradient,
              shape: BoxShape.circle,
            ),
            child: ClipOval(
              child: Image.asset(
                AppAssets.chatbotIcon,
                fit: BoxFit.contain,
                filterQuality: FilterQuality.high,
                errorBuilder: (_, _, _) => const Icon(
                  Icons.auto_awesome,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Nexa AI Assistant',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppColors.textHeading,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
                Text(
                  'Role: ${role.toUpperCase()} • Verified Knowledge Base',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: isDark ? Colors.white54 : Colors.black54,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.cleaning_services_outlined, size: 20),
            tooltip: 'Clear Chat',
            onPressed: () => chatbot.clearMessages(),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 22),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacyNotice(
    BuildContext context,
    ChatbotController chatbot,
    bool isDark,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.shield_outlined, color: AppColors.gold, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Nexa uses your message & role context to provide attendance assistance. Do not enter passwords or OTPs.',
              style: GoogleFonts.inter(
                fontSize: 11,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.87)
                    : Colors.black87,
              ),
            ),
          ),
          const SizedBox(width: 6),
          TextButton(
            onPressed: () => chatbot.acceptPrivacyNotice(),
            child: const Text('GOT IT', style: TextStyle(fontSize: 11)),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeCard(String role, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.15),
            AppColors.cyan.withValues(alpha: 0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.psychology, color: AppColors.cyan, size: 24),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _getRoleWelcome(role),
              style: GoogleFonts.inter(
                fontSize: 12.5,
                height: 1.4,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg, bool isDark) {
    final isUser = msg.isUser;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Row(
        mainAxisAlignment: isUser
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 26,
              height: 26,
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                gradient: AppColors.headerGradient,
                shape: BoxShape.circle,
              ),
              child: ClipOval(
                child: Image.asset(
                  AppAssets.chatbotIcon,
                  fit: BoxFit.contain,
                  filterQuality: FilterQuality.high,
                  errorBuilder: (_, _, _) => const Icon(
                    Icons.auto_awesome,
                    color: Colors.white,
                    size: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isUser
                    ? AppColors.primary
                    : (isDark
                          ? Colors.white.withValues(alpha: 0.1)
                          : Colors.grey.shade100),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                border: Border.all(
                  color: isUser
                      ? AppColors.primary
                      : (isDark ? Colors.white12 : Colors.black12),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    msg.content,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      height: 1.4,
                      color: isUser
                          ? Colors.white
                          : (isDark ? Colors.white : Colors.black87),
                    ),
                  ),

                  // Suggested Actions buttons (e.g. Open QR Attendance)
                  if (!isUser && msg.suggestedActions.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      children: msg.suggestedActions.map((action) {
                        final label = action['label'] as String? ?? 'Open';
                        final route = action['route'] as String? ?? '';
                        return ElevatedButton.icon(
                          onPressed: () {
                            if (route.isNotEmpty) {
                              Navigator.of(context).pop();
                              context.push(route);
                            }
                          },
                          icon: const Icon(Icons.launch, size: 14),
                          label: Text(
                            label,
                            style: const TextStyle(fontSize: 11),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  if (!isUser) ...[
                    const SizedBox(height: 4),
                    Align(
                      alignment: Alignment.centerRight,
                      child: GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: msg.content));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Copied response to clipboard'),
                              duration: Duration(seconds: 1),
                            ),
                          );
                        },
                        child: const Icon(
                          Icons.copy_rounded,
                          size: 14,
                          color: Colors.white38,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar(bool isDark, ChatbotController chatbot) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        8,
        16,
        MediaQuery.of(context).viewInsets.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        border: Border(
          top: BorderSide(color: isDark ? Colors.white10 : Colors.black12),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _textController,
              onSubmitted: _handleSend,
              style: TextStyle(color: isDark ? Colors.white : Colors.black87),
              decoration: InputDecoration(
                hintText: 'Ask Nexa anything about Smart Attendance...',
                hintStyle: TextStyle(
                  color: isDark ? Colors.white38 : Colors.black38,
                  fontSize: 13,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                filled: true,
                fillColor: isDark
                    ? Colors.white.withValues(alpha: 0.06)
                    : Colors.black.withValues(alpha: 0.04),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: AppColors.primary,
            shape: const CircleBorder(),
            child: InkWell(
              onTap: () => _handleSend(_textController.text),
              customBorder: const CircleBorder(),
              child: const Padding(
                padding: EdgeInsets.all(10.0),
                child: Icon(Icons.send_rounded, color: Colors.white, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
