import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Centralized Motion & Animation Design System for Smart Attendance AI.
/// Provides standardized durations, curves, accessibility guards, and reusable
/// motion extension wrappers.
class AppMotion {
  AppMotion._();

  // ── Standard Durations ───────────────────────────────────────────────────
  static const Duration instantDuration = Duration(milliseconds: 120);
  static const Duration fastDuration = Duration(milliseconds: 180);
  static const Duration normalDuration = Duration(milliseconds: 320);
  static const Duration mediumDuration = Duration(milliseconds: 450);
  static const Duration slowDuration = Duration(milliseconds: 650);
  static const Duration staggerDelay = Duration(milliseconds: 70);

  // ── Standard Curves ──────────────────────────────────────────────────────
  static const Curve standardCurve = Curves.easeOutCubic;
  static const Curve entranceCurve = Curves.easeOutBack;
  static const Curve exitCurve = Curves.easeInCubic;

  // ── Reduced Motion Accessibility Check ────────────────────────────────────
  static bool isReducedMotion(BuildContext context) {
    return MediaQuery.of(context).accessibleNavigation;
  }
}

/// AppFadeIn — Reusable fade entrance wrapper with reduced-motion support.
class AppFadeIn extends StatelessWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;

  const AppFadeIn({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = AppMotion.normalDuration,
  });

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) return child;
    return child
        .animate(delay: delay)
        .fadeIn(duration: duration, curve: AppMotion.standardCurve);
  }
}

/// AppSlideUp — Reusable vertical slide-up + fade entrance wrapper.
class AppSlideUp extends StatelessWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;
  final double beginY;

  const AppSlideUp({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = AppMotion.normalDuration,
    this.beginY = 0.08,
  });

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) return child;
    return child
        .animate(delay: delay)
        .fadeIn(duration: duration, curve: AppMotion.standardCurve)
        .slideY(
          begin: beginY,
          end: 0.0,
          duration: duration,
          curve: AppMotion.standardCurve,
        );
  }
}

/// AppScaleIn — Reusable scale-in entrance wrapper.
class AppScaleIn extends StatelessWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;
  final double beginScale;

  const AppScaleIn({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = AppMotion.normalDuration,
    this.beginScale = 0.95,
  });

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) return child;
    return child
        .animate(delay: delay)
        .fadeIn(duration: duration, curve: AppMotion.standardCurve)
        .scale(
          begin: Offset(beginScale, beginScale),
          end: const Offset(1.0, 1.0),
          duration: duration,
          curve: AppMotion.standardCurve,
        );
  }
}

/// AppStaggeredItem — Staggered entrance based on index in a grid/list.
class AppStaggeredItem extends StatelessWidget {
  final int index;
  final Widget child;
  final Duration? baseDelay;
  final Duration duration;
  final double beginY;

  const AppStaggeredItem({
    super.key,
    required this.index,
    required this.child,
    this.baseDelay,
    this.duration = AppMotion.normalDuration,
    this.beginY = 0.08,
  });

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) return child;
    final totalDelay =
        (baseDelay ?? Duration.zero) + (AppMotion.staggerDelay * index);
    return child
        .animate(delay: totalDelay)
        .fadeIn(duration: duration, curve: AppMotion.standardCurve)
        .slideY(
          begin: beginY,
          end: 0.0,
          duration: duration,
          curve: AppMotion.standardCurve,
        );
  }
}

/// AppAnimatedPage — Wrapper for screen pages with clean entrance.
class AppAnimatedPage extends StatelessWidget {
  final Widget child;

  const AppAnimatedPage({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) return child;
    return child.animate().fadeIn(
      duration: AppMotion.normalDuration,
      curve: AppMotion.standardCurve,
    );
  }
}

/// AppSuccessAnimation — Success feedback animation (scale pop + fade).
class AppSuccessAnimation extends StatelessWidget {
  final Widget child;

  const AppSuccessAnimation({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) return child;
    return child
        .animate()
        .fadeIn(duration: AppMotion.fastDuration)
        .scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1.0, 1.0),
          duration: AppMotion.normalDuration,
          curve: AppMotion.entranceCurve,
        );
  }
}

/// AppErrorAnimation — Error shake effect.
class AppErrorAnimation extends StatelessWidget {
  final Widget child;
  final bool trigger;

  const AppErrorAnimation({
    super.key,
    required this.child,
    this.trigger = true,
  });

  @override
  Widget build(BuildContext context) {
    if (!trigger || AppMotion.isReducedMotion(context)) return child;
    return child.animate().shakeX(
      amount: 8.0,
      duration: AppMotion.normalDuration,
      curve: Curves.elasticIn,
    );
  }
}

/// AppShimmerAnimation — Subtle shimmer loading pulse animation.
class AppShimmerAnimation extends StatelessWidget {
  final Widget child;

  const AppShimmerAnimation({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) return child;
    return child
        .animate(onPlay: (controller) => controller.repeat())
        .shimmer(
          duration: const Duration(milliseconds: 1500),
          color: Colors.white24,
        );
  }
}

/// Flutter Animate extension utility for quick inline app motion
extension WidgetAppMotionExtension on Widget {
  Widget animateAppFadeIn({Duration delay = Duration.zero}) {
    return AppFadeIn(delay: delay, child: this);
  }

  Widget animateAppSlideUp({
    Duration delay = Duration.zero,
    double beginY = 0.08,
  }) {
    return AppSlideUp(delay: delay, beginY: beginY, child: this);
  }

  Widget animateAppScaleIn({
    Duration delay = Duration.zero,
    double beginScale = 0.95,
  }) {
    return AppScaleIn(delay: delay, beginScale: beginScale, child: this);
  }

  Widget animateAppStaggered(int index, {Duration? baseDelay}) {
    return AppStaggeredItem(index: index, baseDelay: baseDelay, child: this);
  }
}
