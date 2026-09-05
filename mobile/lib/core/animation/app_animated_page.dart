import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'app_motion.dart';

/// AppAnimatedPageWrapper — Page transition wrapper applying flutter_animate
/// entrance transitions with reduced motion guard.
class AppAnimatedPageWrapper extends StatelessWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;

  const AppAnimatedPageWrapper({
    super.key,
    required this.child,
    this.duration = AppMotion.normalDuration,
    this.curve = AppMotion.standardCurve,
  });

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) return child;
    return child
        .animate()
        .fadeIn(duration: duration, curve: curve)
        .slideY(begin: 0.04, end: 0.0, duration: duration, curve: curve);
  }
}
