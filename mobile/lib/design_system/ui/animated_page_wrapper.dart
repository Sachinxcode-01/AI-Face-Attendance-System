import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// ============================================================================
/// AnimatedPageWrapper — wraps screen bodies with an entry fade-and-slide
/// transition to ensure unified page-load feel. Fast & lightweight.
/// ============================================================================
class AnimatedPageWrapper extends StatelessWidget {
  final Widget child;
  final Duration duration;

  const AnimatedPageWrapper({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 350),
  });

  @override
  Widget build(BuildContext context) {
    // Check if reduce motion is enabled (prevents accessibility issues)
    final disableAnimations =
        MediaQuery.maybeOf(context)?.disableAnimations ?? false;

    if (disableAnimations) return child;

    return child
        .animate()
        .fadeIn(duration: duration, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.03,
          end: 0,
          duration: duration,
          curve: Curves.easeOutCubic,
        );
  }
}
