import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─────────────────────────────────────────────
//  COLOR PALETTE
// ─────────────────────────────────────────────
class AppColors {
  // Gold accent
  static const gold = Color(0xFFFFD700);
  static const goldLight = Color(0xFFFFE55C);
  static const goldDark = Color(0xFFB8960C);

  // Dark backgrounds
  static const bgDeep = Color(0xFF07090F);
  static const bgDark = Color(0xFF0A0E21);
  static const bgCard = Color(0xFF111528);
  static const bgSurface = Color(0xFF1A1F38);
  static const bgModal = Color(0xFF0F1532);

  // Indigo accents
  static const indigo = Color(0xFF1D2671);
  static const indigoLight = Color(0xFF3949AB);

  // Light backgrounds
  static const bgLight = Color(0xFFF5F7FF);
  static const bgCardLight = Color(0xFFFFFFFF);
  static const bgSurfaceLight = Color(0xFFEEF0FF);

  // Semantic
  static const success = Color(0xFF1A8F5E);
  static const successLight = Color(0xFF00C57A);
  static const error = Color(0xFFCF3030);
  static const errorLight = Color(0xFFFF5252);
  static const warning = Color(0xFFF57C00);
  static const info = Color(0xFF0277BD);

  // Neutrals
  static const white = Colors.white;
  static const white70 = Color(0xB3FFFFFF);
  static const white38 = Color(0x61FFFFFF);
  static const white12 = Color(0x1FFFFFFF);
  static const white06 = Color(0x0FFFFFFF);

  // Cyan accent for scan animations
  static const cyan = Color(0xFF00FFFF);
  static const cyanGlow = Color(0x3300FFFF);
}

// ─────────────────────────────────────────────
//  GRADIENTS
// ─────────────────────────────────────────────
class AppGradients {
  static const darkBg = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.bgDark, AppColors.indigo],
  );

  static const gold = LinearGradient(
    colors: [AppColors.goldLight, AppColors.gold, AppColors.goldDark],
  );

  static const cardGlass = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x14FFFFFF), Color(0x05FFFFFF)],
  );

  static const successGlow = LinearGradient(
    colors: [AppColors.success, AppColors.successLight],
  );

  static const errorGlow = LinearGradient(
    colors: [AppColors.error, AppColors.errorLight],
  );
}

// ─────────────────────────────────────────────
//  TYPOGRAPHY
// ─────────────────────────────────────────────
class AppText {
  static TextStyle display({Color? color, FontWeight? weight}) =>
      GoogleFonts.outfit(
        fontSize: 32,
        fontWeight: weight ?? FontWeight.bold,
        color: color ?? AppColors.white,
        letterSpacing: -0.5,
      );

  static TextStyle heading({Color? color, FontWeight? weight}) =>
      GoogleFonts.outfit(
        fontSize: 22,
        fontWeight: weight ?? FontWeight.bold,
        color: color ?? AppColors.white,
      );

  static TextStyle subheading({Color? color, FontWeight? weight}) =>
      GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: weight ?? FontWeight.w600,
        color: color ?? AppColors.white70,
      );

  static TextStyle body({Color? color, FontWeight? weight}) =>
      GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: weight ?? FontWeight.normal,
        color: color ?? AppColors.white70,
      );

  static TextStyle caption({Color? color}) =>
      GoogleFonts.outfit(
        fontSize: 11,
        color: color ?? AppColors.white38,
        letterSpacing: 0.4,
      );

  static TextStyle label({Color? color}) =>
      GoogleFonts.outfit(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.2,
        color: color ?? AppColors.white38,
      );

  static TextStyle button({Color? color}) =>
      GoogleFonts.outfit(
        fontSize: 15,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.0,
        color: color ?? Colors.black,
      );
}

// ─────────────────────────────────────────────
//  SHADOWS & DECORATIONS
// ─────────────────────────────────────────────
class AppShadows {
  static List<BoxShadow> goldGlow({double intensity = 0.25}) => [
        BoxShadow(
          color: AppColors.gold.withValues(alpha: intensity),
          blurRadius: 24,
          spreadRadius: 4,
        ),
      ];

  static List<BoxShadow> card = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.4),
      blurRadius: 20,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> glow(Color color, {double intensity = 0.3}) => [
        BoxShadow(
          color: color.withValues(alpha: intensity),
          blurRadius: 20,
          spreadRadius: 2,
        ),
      ];
}

// ─────────────────────────────────────────────
//  SPACING
// ─────────────────────────────────────────────
class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

// ─────────────────────────────────────────────
//  BORDER RADIUS
// ─────────────────────────────────────────────
class AppRadius {
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double full = 999;
}

// ─────────────────────────────────────────────
//  ROLES
// ─────────────────────────────────────────────
enum UserRole { admin, teacher, student, unknown }

extension UserRoleExt on UserRole {
  String get label {
    switch (this) {
      case UserRole.admin: return 'Admin';
      case UserRole.teacher: return 'Teacher';
      case UserRole.student: return 'Student';
      case UserRole.unknown: return 'Unknown';
    }
  }

  Color get color {
    switch (this) {
      case UserRole.admin: return AppColors.errorLight;
      case UserRole.teacher: return AppColors.cyan;
      case UserRole.student: return AppColors.gold;
      case UserRole.unknown: return AppColors.white38;
    }
  }

  IconData get icon {
    switch (this) {
      case UserRole.admin: return Icons.shield_outlined;
      case UserRole.teacher: return Icons.school_outlined;
      case UserRole.student: return Icons.person_outline;
      case UserRole.unknown: return Icons.help_outline;
    }
  }

  String get dashboardRoute {
    switch (this) {
      case UserRole.admin: return '/admin-home';
      case UserRole.teacher: return '/teacher-home';
      case UserRole.student: return '/student-home';
      case UserRole.unknown: return '/';
    }
  }

  static UserRole fromString(String? s) {
    switch (s?.toLowerCase()) {
      case 'admin': return UserRole.admin;
      case 'teacher': return UserRole.teacher;
      case 'student': return UserRole.student;
      default: return UserRole.unknown;
    }
  }
}
