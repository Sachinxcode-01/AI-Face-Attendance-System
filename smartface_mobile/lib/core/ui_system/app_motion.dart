import 'package:flutter/material.dart';

/// Centralized Motion & Timing Constants for the UI System.
class AppMotion {
  AppMotion._();

  static const Duration instantDuration = Duration(milliseconds: 120);
  static const Duration fastDuration = Duration(milliseconds: 180);
  static const Duration normalDuration = Duration(milliseconds: 320);
  static const Duration mediumDuration = Duration(milliseconds: 450);
  static const Duration slowDuration = Duration(milliseconds: 650);
  static const Duration staggerDelay = Duration(milliseconds: 70);

  static const Curve standardCurve = Curves.easeOutCubic;
  static const Curve entranceCurve = Curves.easeOutBack;
  static const Curve exitCurve = Curves.easeInCubic;

  static bool isReducedMotion(BuildContext context) {
    return MediaQuery.of(context).accessibleNavigation;
  }
}
