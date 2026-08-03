import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/core/constants/asset_paths.dart';
import 'package:smartface_attendance/design_system/ui/app_colors.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/chatbot/controllers/chatbot_controller.dart';
import 'package:smartface_attendance/features/chatbot/widgets/nexa_chat_sheet.dart';

/// Global application overlay wrapper for the floating, draggable Nexa Chatbot Assistant.
class FloatingChatbotOverlay extends StatefulWidget {
  final Widget child;

  const FloatingChatbotOverlay({super.key, required this.child});

  @override
  State<FloatingChatbotOverlay> createState() => _FloatingChatbotOverlayState();
}

class _FloatingChatbotOverlayState extends State<FloatingChatbotOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  double _dragDistance = 0.0;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        precacheImage(const AssetImage(AppAssets.chatbotIcon), context);
      }
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  bool _isScreenExcluded(String route) {
    final excludedRoutes = [
      '/',
      '/splash',
      '/intro',
      '/onboarding',
      '/login',
      '/register',
      '/forgot-password',
      '/otp',
      '/setup-wizard',
    ];
    return excludedRoutes.contains(route);
  }

  bool _isCameraOrScannerScreen(String route) {
    final cameraRoutes = [
      '/student/qr-attendance',
      '/student/scan',
      '/student/face-attendance',
      '/teacher/qr-generator',
      '/teacher/train-faces',
      '/attendance/live-monitor',
    ];
    return cameraRoutes.any((r) => route.startsWith(r));
  }

  void _openNexaSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const NexaChatSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionManager>();
    final chatbot = context.watch<ChatbotController>();

    final String currentRoute = GoRouterState.of(context).matchedLocation;

    // Do not show on unauthenticated routes or when disabled in Settings
    if (!session.isLoggedIn ||
        !chatbot.isEnabled ||
        _isScreenExcluded(currentRoute)) {
      return widget.child;
    }

    final mediaQuery = MediaQuery.of(context);
    final screenWidth = mediaQuery.size.width;
    final screenHeight = mediaQuery.size.height;

    // Default position: Bottom-Right above bottom nav bar
    final defaultX = screenWidth - 70.0;
    final defaultY = screenHeight - 170.0;

    final double currentX = chatbot.posX ?? defaultX;
    final double currentY = chatbot.posY ?? defaultY;

    // Reposition safely on camera/QR scanner screens so button doesn't obscure preview
    final bool isCameraScreen = _isCameraOrScannerScreen(currentRoute);

    return Stack(
      children: [
        widget.child,

        // Floating Draggable Assistant Button
        Positioned(
          left: isCameraScreen
              ? 16.0
              : currentX.clamp(16.0, screenWidth - 70.0),
          top: isCameraScreen
              ? (mediaQuery.padding.top + 16.0)
              : currentY.clamp(60.0, screenHeight - 160.0),
          child: Semantics(
            button: true,
            label: 'Nexa Attendance Assistant floating help button',
            child: GestureDetector(
              onPanStart: (_) {
                _dragDistance = 0.0;
              },
              onPanUpdate: (details) {
                _dragDistance += details.delta.distance;
                chatbot.updatePosition(
                  currentX + details.delta.dx,
                  currentY + details.delta.dy,
                  screenWidth,
                  screenHeight,
                  snap: false,
                );
              },
              onPanEnd: (details) {
                chatbot.updatePosition(
                  currentX,
                  currentY,
                  screenWidth,
                  screenHeight,
                  snap: true,
                );
              },
              onTap: () {
                if (_dragDistance < 10.0) {
                  chatbot.openChat();
                  _openNexaSheet(context);
                }
              },
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final bool isReducedMotion = mediaQuery.disableAnimations;
                  final double pulse = isReducedMotion
                      ? 1.0
                      : 1.0 + (_pulseController.value * 0.06);

                  return Transform.scale(
                    scale: pulse,
                    child: Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [AppColors.primary, AppColors.cyan],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.4),
                            blurRadius: 12,
                            spreadRadius: 2,
                            offset: const Offset(0, 4),
                          ),
                        ],
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.5),
                          width: 1.5,
                        ),
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          ClipOval(
                            child: Padding(
                              padding: const EdgeInsets.all(5.0),
                              child: Image.asset(
                                AppAssets.chatbotIcon,
                                fit: BoxFit.contain,
                                filterQuality: FilterQuality.high,
                                errorBuilder: (_, _, _) => const Icon(
                                  Icons.auto_awesome,
                                  color: Colors.white,
                                  size: 26,
                                ),
                              ),
                            ),
                          ),

                          // Unread notification badge
                          if (chatbot.unreadCount > 0)
                            Positioned(
                              top: 4,
                              right: 4,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFEF4444),
                                  shape: BoxShape.circle,
                                ),
                                child: Text(
                                  '${chatbot.unreadCount}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ],
    );
  }
}
