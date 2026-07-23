import 'package:flutter/material.dart';

/// AppReducedMotion — Helper for accessibility and reduced motion compliance.
class AppReducedMotion {
  AppReducedMotion._();

  static bool check(BuildContext context) {
    return MediaQuery.of(context).accessibleNavigation;
  }

  static Widget guard({
    required BuildContext context,
    required Widget animated,
    required Widget fallback,
  }) {
    if (check(context)) return fallback;
    return animated;
  }
}
