/*
|--------------------------------------------------------------------------
| File: constants.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Design system tokens and styling configurations for the Nexa AI mobile client.
|
| Responsibilities:
| - Declares color palette, gradients, and shadow metrics.
| - Holds typography guidelines and google font mappings.
| - Exposes layout boundaries (spacings, card dimensions, corner radius).
| - Holds global actor enum declarations (UserRole, UserRoleExt helper).
|
| Dependencies:
| - package:google_fonts/google_fonts.dart
| - package:flutter/material.dart
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/design_system/ui/app_colors.dart';

// ======================================================
// Color Palette Design System
// ======================================================

export 'package:smartface_attendance/design_system/ui/app_colors.dart';

// ======================================================
// Gradients Design System
// ======================================================

/// Global Gradients Setup
///
/// Contains linear gradients for cards, background templates, and states.
class AppGradients {
  static const darkBg = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.bgDeep, AppColors.bgDark, Color(0xFF111827)],
  );

  static const gold = LinearGradient(
    colors: [AppColors.goldLight, AppColors.gold, AppColors.goldDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const cardGlass = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x24FFFFFF), Color(0x05FFFFFF)],
  );

  static const successGlow = LinearGradient(
    colors: [AppColors.success, AppColors.successLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const errorGlow = LinearGradient(
    colors: [AppColors.error, AppColors.errorLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

// ======================================================
// Typography System
// ======================================================

/// App Typography Guidelines
///
/// Maps text displays to dynamic Inter scale.
class AppText {
  static TextStyle display({Color? color, FontWeight? weight}) =>
      GoogleFonts.inter(
        fontSize: 32,
        fontWeight: weight ?? FontWeight.bold,
        color: color ?? AppColors.white,
        letterSpacing: -0.5,
      );

  static TextStyle heading({Color? color, FontWeight? weight}) =>
      GoogleFonts.inter(
        fontSize: 22,
        fontWeight: weight ?? FontWeight.bold,
        color: color ?? AppColors.white,
      );

  static TextStyle subheading({Color? color, FontWeight? weight}) =>
      GoogleFonts.inter(
        fontSize: 16,
        fontWeight: weight ?? FontWeight.w600,
        color: color ?? AppColors.white70,
      );

  static TextStyle body({Color? color, FontWeight? weight}) =>
      GoogleFonts.inter(
        fontSize: 14,
        fontWeight: weight ?? FontWeight.normal,
        color: color ?? AppColors.white70,
      );

  static TextStyle caption({Color? color}) => GoogleFonts.inter(
    fontSize: 11,
    color: color ?? AppColors.white38,
    letterSpacing: 0.4,
  );

  static TextStyle label({Color? color}) => GoogleFonts.inter(
    fontSize: 10,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.2,
    color: color ?? AppColors.white38,
  );

  static TextStyle button({Color? color}) => GoogleFonts.inter(
    fontSize: 15,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.0,
    color: color ?? Colors.black,
  );
}

// ======================================================
// Elevation & Box Shadows
// ======================================================

/// Global Styling Shadows
///
/// Houses box shadow definitions.
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

// ======================================================
// Layout Padding Spacings
// ======================================================

/// Standard Layout Spacing Constants
class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

// ======================================================
// Corner Radius Configurations
// ======================================================

/// Layout Corner Border Radius Configs
class AppRadius {
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double full = 999;
}

// ======================================================
// Security Roles Enum & Mappings
// ======================================================

/// User Security Actor Role
enum UserRole { admin, teacher, student, parent, hod, principal, management, unknown }

/// UserRole Mappings Extension
///
/// Handles displaying localized strings, colors, icons, and routes.
extension UserRoleExt on UserRole {
  /// Localized UI label.
  String get label {
    switch (this) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.teacher:
        return 'Teacher';
      case UserRole.student:
        return 'Student';
      case UserRole.parent:
        return 'Parent';
      case UserRole.hod:
        return 'HOD';
      case UserRole.principal:
        return 'Principal';
      case UserRole.management:
        return 'Management';
      case UserRole.unknown:
        return 'Unknown';
    }
  }

  /// Unique status indicator color.
  Color get color {
    switch (this) {
      case UserRole.admin:
        return AppColors.errorLight;
      case UserRole.teacher:
        return AppColors.cyan;
      case UserRole.student:
        return AppColors.gold;
      case UserRole.parent:
        return const Color(0xFF0EA5E9); // Sky Blue for Parents
      case UserRole.hod:
        return const Color(0xFFA855F7); // Purple
      case UserRole.principal:
        return const Color(0xFFF97316); // Deep Orange
      case UserRole.management:
        return const Color(0xFF0D9488); // Teal
      case UserRole.unknown:
        return AppColors.white38;
    }
  }

  /// Standard icon representation.
  IconData get icon {
    switch (this) {
      case UserRole.admin:
        return Icons.shield_outlined;
      case UserRole.teacher:
        return Icons.school_outlined;
      case UserRole.student:
        return Icons.person_outline;
      case UserRole.parent:
        return Icons.family_restroom_outlined;
      case UserRole.hod:
        return Icons.badge_outlined;
      case UserRole.principal:
        return Icons.account_balance_outlined;
      case UserRole.management:
        return Icons.insights_outlined;
      case UserRole.unknown:
        return Icons.help_outline;
    }
  }

  /// Initial landing page route name.
  String get dashboardRoute {
    switch (this) {
      case UserRole.admin:
        return '/admin/home';
      case UserRole.teacher:
        return '/teacher/home';
      case UserRole.student:
        return '/student/home';
      case UserRole.parent:
        return '/parent/home';
      case UserRole.hod:
      case UserRole.principal:
      case UserRole.management:
        return '/management/dashboard';
      case UserRole.unknown:
        return '/auth/login';
    }
  }

  /// Maps backend payload string to concrete UserRole enum.
  static UserRole fromString(String? s) {
    switch (s?.toLowerCase()) {
      case 'admin':
        return UserRole.admin;
      case 'teacher':
        return UserRole.teacher;
      case 'student':
        return UserRole.student;
      case 'parent':
        return UserRole.parent;
      case 'hod':
        return UserRole.hod;
      case 'principal':
        return UserRole.principal;
      case 'management':
        return UserRole.management;
      default:
        return UserRole.unknown;
    }
  }
}
