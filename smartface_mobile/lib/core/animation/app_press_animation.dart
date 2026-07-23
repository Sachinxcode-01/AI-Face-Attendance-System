import 'package:flutter/material.dart';
import 'app_motion.dart';

/// AppPressAnimation — Smooth scale & tap press animation wrapper for cards and buttons.
class AppPressAnimation extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scaleDownFactor;

  const AppPressAnimation({
    super.key,
    required this.child,
    this.onTap,
    this.scaleDownFactor = 0.96,
  });

  @override
  State<AppPressAnimation> createState() => _AppPressAnimationState();
}

class _AppPressAnimationState extends State<AppPressAnimation>
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
      end: widget.scaleDownFactor,
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
