import 'package:flutter/animation.dart';

/// Motion utilities: standardized durations and curves for micro-interactions.
class Motion {
  static const Duration short = Duration(milliseconds: 150);
  static const Duration medium = Duration(milliseconds: 300);
  static const Duration long = Duration(milliseconds: 600);

  static const Curve ease = Curves.ease;
  static const Curve easeInOut = Curves.easeInOutCubic;
  static const Curve softSpring = Curves.easeOutBack;
}
