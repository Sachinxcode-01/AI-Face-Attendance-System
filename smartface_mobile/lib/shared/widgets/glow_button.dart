import 'package:flutter/material.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

/// Premium interactive primary Call-To-Action (CTA) button.
///
/// Features:
/// - Shrinks down to scale `0.97` on press-down.
/// - Springs back to scale `1.0` using a spring curve ([Curves.easeOutBack]) on release.
/// - Dynamic glow shadow that intensifies (increased blur and spread) while pressed.
/// - Gracefully falls back to disabled styling when [onPressed] is null.
class GlowButton extends StatefulWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final Color? color;
  final Color? glowColor;
  final double borderRadius;
  final EdgeInsetsGeometry padding;

  const GlowButton({
    super.key,
    required this.child,
    this.onPressed,
    this.color,
    this.glowColor,
    this.borderRadius = AppRadius.md,
    this.padding = const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
  });

  @override
  State<GlowButton> createState() => _GlowButtonState();
}

class _GlowButtonState extends State<GlowButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    // Compact duration for responsive and clicky tactile feedback
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 140),
    );

    // Apply an ease-in curve for press-down, and a springy curve for the release bounce back
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeIn,
        reverseCurve: Curves.easeOutBack, // Releases with spring-back
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (widget.onPressed != null) {
      setState(() => _isPressed = true);
      _controller.forward();
    }
  }

  void _handleTapUp(TapUpDetails details) {
    if (widget.onPressed != null) {
      setState(() => _isPressed = false);
      _controller.reverse();
      widget.onPressed!();
    }
  }

  void _handleTapCancel() {
    if (widget.onPressed != null) {
      setState(() => _isPressed = false);
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appColors = theme.extension<DarkAppColors>();
    final isDark = theme.brightness == Brightness.dark;

    final isEnabled = widget.onPressed != null;

    // Base colors pulling from DarkAppColors or general theme scheme
    final buttonColor = isEnabled
        ? (widget.color ?? appColors?.primary ?? theme.colorScheme.primary)
        : (isDark
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.black.withValues(alpha: 0.08));

    final baseGlowColor =
        widget.glowColor ??
        appColors?.primaryGlow ??
        theme.colorScheme.secondary;

    // Glowing shadow configuration that increases in intensity when pressed
    final shadowColor = _isPressed
        ? baseGlowColor.withValues(alpha: 0.60) // Intensified glow
        : baseGlowColor.withValues(alpha: 0.35); // Base glow

    final blurRadius = _isPressed ? 28.0 : 18.0;
    final spreadRadius = _isPressed ? 3.0 : 1.0;

    return GestureDetector(
      onTapDown: isEnabled ? _handleTapDown : null,
      onTapUp: isEnabled ? _handleTapUp : null,
      onTapCancel: isEnabled ? _handleTapCancel : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          curve: Curves.easeInOut,
          padding: widget.padding,
          decoration: BoxDecoration(
            color: buttonColor,
            borderRadius: BorderRadius.circular(widget.borderRadius),
            boxShadow: isEnabled
                ? [
                    BoxShadow(
                      color: shadowColor,
                      blurRadius: blurRadius,
                      spreadRadius: spreadRadius,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: DefaultTextStyle.merge(
            style: AppText.button(
              color: isEnabled
                  ? Colors.white
                  : (isDark ? Colors.white24 : Colors.black26),
            ),
            child: IconTheme.merge(
              data: IconThemeData(
                color: isEnabled
                    ? Colors.white
                    : (isDark ? Colors.white24 : Colors.black26),
              ),
              child: Center(
                widthFactor: 1,
                heightFactor: 1,
                child: widget.child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
