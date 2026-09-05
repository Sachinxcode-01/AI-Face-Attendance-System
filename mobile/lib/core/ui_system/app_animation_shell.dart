import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'app_motion.dart';

/// AppAnimationShell — Every screen wrapper enforcing screen entrance,
/// reduced-motion checks, theme integration, and non-restarting page animation.
class AppAnimationShell extends StatelessWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;
  final double beginY;

  const AppAnimationShell({
    super.key,
    required this.child,
    this.duration = AppMotion.normalDuration,
    this.curve = AppMotion.standardCurve,
    this.beginY = 0.04,
  });

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) return child;

    return child
        .animate()
        .fadeIn(duration: duration, curve: curve)
        .slideY(begin: beginY, end: 0.0, duration: duration, curve: curve);
  }
}
