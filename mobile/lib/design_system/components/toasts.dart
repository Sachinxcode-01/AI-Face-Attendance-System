import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';

import 'package:smartface_attendance/shared/widgets/toast_system.dart' show ToastType;

/// Placement for toast rendering.
enum ToastPosition {
  top,
  bottom,
}

/// Upgraded high-fidelity feedback toast system for SmartFace.
///
/// Features:
/// - Frosted glassmorphism background with dynamic semantic glow
/// - Physics-based spring slide-in and smooth slide-out transitions
/// - Haptic feedback integration
/// - Swipe-to-dismiss gesture
/// - Optional contextual action button
void showSmartToast(
  BuildContext context, {
  required String message,
  String? title,
  ToastType type = ToastType.info,
  ToastPosition position = ToastPosition.top,
  Duration duration = const Duration(seconds: 3),
  String? actionLabel,
  VoidCallback? onAction,
}) {
  final overlay = Overlay.maybeOf(context);
  if (overlay == null) return;

  // Trigger tactile haptic feedback matching the toast sentiment
  switch (type) {
    case ToastType.success:
      AppHaptics.success();
      break;
    case ToastType.error:
      AppHaptics.error();
      break;
    case ToastType.warning:
      AppHaptics.medium();
      break;
    case ToastType.info:
      AppHaptics.light();
      break;
  }

  late final OverlayEntry entry;
  entry = OverlayEntry(
    builder: (context) => _ToastOverlayWidget(
      message: message,
      title: title,
      type: type,
      position: position,
      duration: duration,
      actionLabel: actionLabel,
      onAction: onAction,
      onDismiss: () {
        if (entry.mounted) {
          entry.remove();
        }
      },
    ),
  );

  overlay.insert(entry);
}

/// Drop-in backwards-compatible wrapper for existing [showPremiumToast] calls.
void showPremiumToast(
  BuildContext context,
  String message, {
  Duration duration = const Duration(seconds: 3),
  ToastType type = ToastType.info,
}) {
  showSmartToast(
    context,
    message: message,
    duration: duration,
    type: type,
    position: ToastPosition.top,
  );
}

/// Context extensions for effortless and idiomatic toast triggers.
extension ToastContextX on BuildContext {
  void showSuccessToast(
    String message, {
    String? title,
    Duration duration = const Duration(seconds: 3),
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    showSmartToast(
      this,
      message: message,
      title: title ?? 'Success',
      type: ToastType.success,
      duration: duration,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  void showErrorToast(
    String message, {
    String? title,
    Duration duration = const Duration(seconds: 4),
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    showSmartToast(
      this,
      message: message,
      title: title ?? 'Error',
      type: ToastType.error,
      duration: duration,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  void showWarningToast(
    String message, {
    String? title,
    Duration duration = const Duration(seconds: 3),
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    showSmartToast(
      this,
      message: message,
      title: title ?? 'Notice',
      type: ToastType.warning,
      duration: duration,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  void showInfoToast(
    String message, {
    String? title,
    Duration duration = const Duration(seconds: 3),
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    showSmartToast(
      this,
      message: message,
      title: title,
      type: ToastType.info,
      duration: duration,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }
}

class _ToastOverlayWidget extends StatefulWidget {
  final String message;
  final String? title;
  final ToastType type;
  final ToastPosition position;
  final Duration duration;
  final String? actionLabel;
  final VoidCallback? onAction;
  final VoidCallback onDismiss;

  const _ToastOverlayWidget({
    required this.message,
    this.title,
    required this.type,
    required this.position,
    required this.duration,
    this.actionLabel,
    this.onAction,
    required this.onDismiss,
  });

  @override
  State<_ToastOverlayWidget> createState() => _ToastOverlayWidgetState();
}

class _ToastOverlayWidgetState extends State<_ToastOverlayWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;
  Timer? _dismissTimer;
  double _dragOffset = 0.0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
      reverseDuration: const Duration(milliseconds: 300),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
      reverseCurve: Curves.easeIn,
    );

    final slideBegin = widget.position == ToastPosition.top
        ? const Offset(0.0, -0.6)
        : const Offset(0.0, 0.6);

    _slideAnimation = Tween<Offset>(
      begin: slideBegin,
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutBack,
        reverseCurve: Curves.easeInCubic,
      ),
    );

    _controller.forward();

    _dismissTimer = Timer(widget.duration, _dismiss);
  }

  void _dismiss() {
    _dismissTimer?.cancel();
    if (!mounted) return;
    _controller.reverse().then((_) {
      if (mounted) widget.onDismiss();
    });
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Color get _accentColor {
    switch (widget.type) {
      case ToastType.success:
        return AppColors.success;
      case ToastType.error:
        return AppColors.error;
      case ToastType.warning:
        return AppColors.warning;
      case ToastType.info:
        return AppColors.accent;
    }
  }

  IconData get _iconData {
    switch (widget.type) {
      case ToastType.success:
        return Icons.check_circle_rounded;
      case ToastType.error:
        return Icons.error_rounded;
      case ToastType.warning:
        return Icons.warning_amber_rounded;
      case ToastType.info:
        return Icons.info_outline_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final topPadding = mediaQuery.padding.top + 12;
    final bottomPadding = mediaQuery.padding.bottom + 16;

    final isTop = widget.position == ToastPosition.top;

    return Positioned(
      top: isTop ? topPadding : null,
      bottom: !isTop ? bottomPadding : null,
      left: 16,
      right: 16,
      child: Material(
        color: Colors.transparent,
        child: GestureDetector(
          onVerticalDragUpdate: (details) {
            setState(() {
              _dragOffset += details.primaryDelta ?? 0;
            });
          },
          onVerticalDragEnd: (details) {
            if ((isTop && _dragOffset < -20) || (!isTop && _dragOffset > 20)) {
              _dismiss();
            } else {
              setState(() => _dragOffset = 0);
            }
          },
          child: Transform.translate(
            offset: Offset(0, _dragOffset),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 480),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A).withValues(alpha: 0.88),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: _accentColor.withValues(alpha: 0.35),
                              width: 1.2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: _accentColor.withValues(alpha: 0.18),
                                blurRadius: 28,
                                spreadRadius: 0,
                                offset: const Offset(0, 8),
                              ),
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.45),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              // Icon badge
                              Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: _accentColor.withValues(alpha: 0.15),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: _accentColor.withValues(alpha: 0.35),
                                    width: 1,
                                  ),
                                ),
                                child: Icon(
                                  _iconData,
                                  color: _accentColor,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 14),

                              // Text content
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (widget.title != null) ...[
                                      Text(
                                        widget.title!,
                                        style: GoogleFonts.inter(
                                          color: Colors.white,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          letterSpacing: -0.2,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                    ],
                                    Text(
                                      widget.message,
                                      style: GoogleFonts.inter(
                                        color: widget.title != null
                                            ? const Color(0xFFCBD5E1)
                                            : Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w400,
                                        height: 1.3,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),

                              // Optional Action Button
                              if (widget.actionLabel != null) ...[
                                const SizedBox(width: 10),
                                TextButton(
                                  onPressed: () {
                                    widget.onAction?.call();
                                    _dismiss();
                                  },
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    minimumSize: Size.zero,
                                    tapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                    foregroundColor: _accentColor,
                                  ),
                                  child: Text(
                                    widget.actionLabel!,
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],

                              // Dismiss close button
                              const SizedBox(width: 6),
                              GestureDetector(
                                onTap: _dismiss,
                                behavior: HitTestBehavior.opaque,
                                child: Padding(
                                  padding: const EdgeInsets.all(4),
                                  child: Icon(
                                    Icons.close_rounded,
                                    size: 16,
                                    color: Colors.white.withValues(alpha: 0.45),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
