import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/constants.dart';

enum ToastType { success, error, info, warning }

/// Global in-app toast notification system.
/// Usage: AppToast.show(context, message: '...', type: ToastType.success);
class AppToast {
  static final _queue = <OverlayEntry>[];
  static bool _isShowing = false;

  static void show(
    BuildContext context, {
    required String message,
    ToastType type = ToastType.info,
    String? title,
    Duration duration = const Duration(seconds: 3),
    VoidCallback? onTap,
  }) {
    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (_) => _ToastWidget(
        message: message,
        title: title,
        type: type,
        duration: duration,
        onDismiss: () {
          if (entry.mounted) entry.remove();
          _queue.remove(entry);
          _isShowing = false;
          _processNext(context);
        },
        onTap: onTap,
      ),
    );

    _queue.add(entry);
    if (!_isShowing) _processNext(context);
  }

  static void _processNext(BuildContext context) {
    if (_queue.isEmpty) return;
    _isShowing = true;
    final entry = _queue.first;
    try {
      Overlay.of(context).insert(entry);
    } catch (_) {}
  }
}

class _ToastWidget extends StatefulWidget {
  final String message;
  final String? title;
  final ToastType type;
  final Duration duration;
  final VoidCallback onDismiss;
  final VoidCallback? onTap;

  const _ToastWidget({
    required this.message,
    required this.title,
    required this.type,
    required this.duration,
    required this.onDismiss,
    this.onTap,
  });

  @override
  State<_ToastWidget> createState() => _ToastWidgetState();
}

class _ToastWidgetState extends State<_ToastWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: 250.ms);
    _ctrl.forward();
    Future.delayed(widget.duration, _dismiss);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _dismiss() async {
    if (!mounted) return;
    await _ctrl.reverse();
    widget.onDismiss();
  }

  Color get _color {
    switch (widget.type) {
      case ToastType.success: return AppColors.success;
      case ToastType.error: return AppColors.error;
      case ToastType.warning: return AppColors.warning;
      case ToastType.info: return AppColors.info;
    }
  }

  IconData get _icon {
    switch (widget.type) {
      case ToastType.success: return Icons.check_circle_outline_rounded;
      case ToastType.error: return Icons.error_outline_rounded;
      case ToastType.warning: return Icons.warning_amber_rounded;
      case ToastType.info: return Icons.info_outline_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 12,
      left: 16,
      right: 16,
      child: Material(
        color: Colors.transparent,
        child: AnimatedBuilder(
          animation: _ctrl,
          builder: (_, child) => Transform.translate(
            offset: Offset(0, -30 * (1 - _ctrl.value)),
            child: Opacity(opacity: _ctrl.value, child: child),
          ),
          child: GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              widget.onTap?.call();
              _dismiss();
            },
            onVerticalDragEnd: (d) {
              if (d.primaryVelocity! < -100) _dismiss();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF111528),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _color.withValues(alpha: 0.4), width: 1),
                boxShadow: [
                  BoxShadow(
                    color: _color.withValues(alpha: 0.2),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.5),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(_icon, color: _color, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (widget.title != null)
                          Text(
                            widget.title!,
                            style: AppText.subheading(
                              color: Colors.white,
                              weight: FontWeight.bold,
                            ),
                          ),
                        Text(
                          widget.message,
                          style: AppText.body(
                            color: widget.title != null
                                ? AppColors.white70
                                : Colors.white,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.close_rounded,
                      color: AppColors.white38, size: 18),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  ANIMATED PRESS BUTTON
// ──────────────────────────────────────────────
enum AnimatedButtonState { idle, loading, success, error }

class AnimatedPressButton extends StatefulWidget {
  final String label;
  final Future<bool> Function() onPressed;
  final double? width;
  final Color? color;
  final Color? textColor;
  final IconData? icon;

  const AnimatedPressButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.width,
    this.color,
    this.textColor,
    this.icon,
  });

  @override
  State<AnimatedPressButton> createState() => _AnimatedPressButtonState();
}

class _AnimatedPressButtonState extends State<AnimatedPressButton>
    with SingleTickerProviderStateMixin {
  AnimatedButtonState _state = AnimatedButtonState.idle;
  late AnimationController _scaleCtrl;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _scaleCtrl = AnimationController(
      vsync: this,
      duration: 120.ms,
      lowerBound: 0.93,
      upperBound: 1.0,
      value: 1.0,
    );
    _scaleAnim = _scaleCtrl;
  }

  @override
  void dispose() {
    _scaleCtrl.dispose();
    super.dispose();
  }

  Future<void> _handlePress() async {
    if (_state != AnimatedButtonState.idle) return;
    HapticFeedback.mediumImpact();
    await _scaleCtrl.reverse();
    await _scaleCtrl.forward();

    setState(() => _state = AnimatedButtonState.loading);

    final success = await widget.onPressed();

    setState(() =>
        _state = success ? AnimatedButtonState.success : AnimatedButtonState.error);

    HapticFeedback.lightImpact();
    await Future.delayed(1200.ms);
    if (mounted) setState(() => _state = AnimatedButtonState.idle);
  }

  @override
  Widget build(BuildContext context) {
    final bg = widget.color ?? AppColors.gold;
    final fg = widget.textColor ?? Colors.black;

    Color effectiveBg;
    Widget child;

    switch (_state) {
      case AnimatedButtonState.loading:
        effectiveBg = bg;
        child = SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            valueColor: AlwaysStoppedAnimation<Color>(fg),
          ),
        );
        break;
      case AnimatedButtonState.success:
        effectiveBg = AppColors.success;
        child = const Icon(Icons.check_rounded, color: Colors.white, size: 24);
        break;
      case AnimatedButtonState.error:
        effectiveBg = AppColors.error;
        child = const Icon(Icons.close_rounded, color: Colors.white, size: 24);
        break;
      default:
        effectiveBg = bg;
        child = Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.icon != null) ...[
              Icon(widget.icon, color: fg, size: 20),
              const SizedBox(width: 8),
            ],
            Text(widget.label, style: AppText.button(color: fg)),
          ],
        );
    }

    return ScaleTransition(
      scale: _scaleAnim,
      child: GestureDetector(
        onTap: _handlePress,
        child: AnimatedContainer(
          duration: 250.ms,
          width: widget.width ?? double.infinity,
          height: 56,
          decoration: BoxDecoration(
            color: effectiveBg,
            borderRadius: BorderRadius.circular(AppRadius.md),
            boxShadow: AppShadows.glow(effectiveBg, intensity: 0.35),
          ),
          child: Center(child: child),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  ROLE BADGE
// ──────────────────────────────────────────────
class RoleBadge extends StatelessWidget {
  final UserRole role;
  final bool compact;

  const RoleBadge({super.key, required this.role, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: role.color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: role.color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(role.icon, color: role.color, size: compact ? 12 : 14),
          const SizedBox(width: 5),
          Text(
            role.label.toUpperCase(),
            style: AppText.label(color: role.color),
          ),
        ],
      ),
    );
  }
}
