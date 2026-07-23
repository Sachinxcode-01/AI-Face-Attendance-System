import 'package:flutter/material.dart';

/// AnalyticsTheme — Color palettes and glass card decoration tokens for pseudo-3D analytics.
class AnalyticsTheme {
  AnalyticsTheme._();

  static const Color primaryBlue = Color(0xFF3559E0);
  static const Color accentCyan = Color(0xFF00F2FE);
  static const Color accentIndigo = Color(0xFF4F46E5);
  static const Color successGreen = Color(0xFF10B981);
  static const Color warningGold = Color(0xFFF59E0B);
  static const Color errorRed = Color(0xFFEF4444);

  static const List<Color> gradientPrimary = [
    Color(0xFF3B82F6),
    Color(0xFF1D4ED8),
  ];
  static const List<Color> gradientCyan = [
    Color(0xFF06B6D4),
    Color(0xFF0891B2),
  ];
  static const List<Color> gradientSuccess = [
    Color(0xFF34D399),
    Color(0xFF059669),
  ];

  static BoxDecoration glassDecoration(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: isDark ? const Color(0xFF13182E) : Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(
        color: isDark
            ? Colors.white.withValues(alpha: 0.1)
            : const Color(0xFFE2E8F0),
      ),
      boxShadow: [
        BoxShadow(
          color: isDark
              ? Colors.black.withValues(alpha: 0.4)
              : const Color(0xFF8794C8).withValues(alpha: 0.15),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ],
    );
  }
}
