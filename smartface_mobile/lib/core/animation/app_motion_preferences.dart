import 'package:flutter/material.dart';

/// Motion & Animation preferences provider for Smart Attendance AI.
/// Allows dynamic toggling of motion effects, reduced motion compliance,
/// and lifecycle background pause/resume handling.
class AppMotionPreferences extends ChangeNotifier {
  bool _animationsEnabled = true;
  bool _reducedMotionOverride = false;

  bool get animationsEnabled => _animationsEnabled;
  bool get isReducedMotionOverride => _reducedMotionOverride;

  bool shouldAnimate(BuildContext context) {
    if (!_animationsEnabled) return false;
    if (_reducedMotionOverride) return false;
    return !MediaQuery.of(context).accessibleNavigation;
  }

  void setAnimationsEnabled(bool enabled) {
    if (_animationsEnabled != enabled) {
      _animationsEnabled = enabled;
      notifyListeners();
    }
  }

  void setReducedMotionOverride(bool override) {
    if (_reducedMotionOverride != override) {
      _reducedMotionOverride = override;
      notifyListeners();
    }
  }
}
