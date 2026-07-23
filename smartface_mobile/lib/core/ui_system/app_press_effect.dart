import 'package:flutter/material.dart';
import 'app_motion.dart';

/// AppPressEffect — Press scale down feedback for cards and buttons.
class AppPressEffect extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scaleFactor;

  const AppPressEffect({
    super.key,
    required this.child,
    this.onTap,
    this.scaleFactor = 0.96,
  });

  @override
  State<AppPressEffect> createState() => _AppPressEffectState();
}

class _AppPressEffectState extends State<AppPressEffect>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppMotion.instantDuration,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.scaleFactor,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    if (!AppMotion.isReducedMotion(context)) {
      _controller.forward();
    }
  }

  void _onTapUp(TapUpDetails details) {
    if (!AppMotion.isReducedMotion(context)) {
      _controller.reverse();
    }
    widget.onTap?.call();
  }

  void _onTapCancel() {
    if (!AppMotion.isReducedMotion(context)) {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.onTap == null || AppMotion.isReducedMotion(context)) {
      return widget.child;
    }

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: ScaleTransition(scale: _scaleAnimation, child: widget.child),
    );
  }
}
