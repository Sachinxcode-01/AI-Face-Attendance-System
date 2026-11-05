import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Motion utilities: standardized durations and curves for micro-interactions.
class Motion {
  static const Duration short = Duration(milliseconds: 150);
  static const Duration medium = Duration(milliseconds: 300);
  static const Duration long = Duration(milliseconds: 600);

  static const Curve ease = Curves.ease;
  static const Curve easeInOut = Curves.easeInOutCubic;
  static const Curve softSpring = Curves.easeOutBack;
}

/// Adds a [glow] effect extension to [AnimateManager].
extension GlowEffectExtension<T extends AnimateManager<T>> on T {
  /// Adds a subtle animated glow effect using [BoxShadowEffect].
  T glow({
    Duration? delay,
    Duration? duration,
    Curve? curve,
    Color color = const Color(0xFF6366F1),
    double radius = 16.0,
    BorderRadius? borderRadius,
  }) {
    return boxShadow(
      delay: delay,
      duration: duration,
      curve: curve,
      end: BoxShadow(
        color: color.withValues(alpha: 0.4),
        blurRadius: radius,
        spreadRadius: 1.0,
      ),
      borderRadius: borderRadius,
    );
  }
}
