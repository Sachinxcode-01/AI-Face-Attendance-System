/*
|--------------------------------------------------------------------------
| File: route_guards.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Implements authentication and authorization route guards for GoRouter.
| Replaces manual routing redirects with declarative security filters.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/router/route_names.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

class RouteGuards {
  static String? handleRedirect(BuildContext context, GoRouterState state) {
    final session = sl<SessionManager>();
    final isLoggedIn = session.isLoggedIn;
    final role = session.userRole;
    final path = state.uri.path;

    final isGuestOnlyRoute = path == AppRoutes.onboardingPath ||
        path == AppRoutes.loginPath ||
        path == AppRoutes.registerPath ||
        path == AppRoutes.forgotPasswordPath ||
        path == AppRoutes.otpPath ||
        path == AppRoutes.splashPath ||
        path == '/reset-password';

    // 1. Unauthenticated users must go to guest-only routes (or splash)
    if (!isLoggedIn) {
      if (!isGuestOnlyRoute) {
        debugPrint('[RouteGuard] Guest trying to access "$path". Redirecting to Login.');
        return AppRoutes.loginPath;
      }
      return null;
    }

    // 2. Authenticated users: evaluate flow completion
    final roleLower = session.role?.toLowerCase() ?? 'student';

    if (!session.introCompleted) {
      if (path != AppRoutes.introPath) {
        debugPrint('[RouteGuard] Intro not completed. Redirecting to Intro.');
        return AppRoutes.introPath;
      }
      return null;
    }

    if (!session.wizardCompleted) {
      final isOnSetupRoute = path == AppRoutes.setupWizardPath || path.startsWith('/setup/');
      if (!isOnSetupRoute) {
        debugPrint('[RouteGuard] Wizard not completed. Redirecting to setup for role: $roleLower');
        return '/setup/$roleLower';
      }
      return null;
    }

    // 3. User has completed all steps. Prevent accessing auth/setup pages.
    final isFlowSetupRoute = isGuestOnlyRoute || 
        path == AppRoutes.introPath || 
        path == AppRoutes.setupWizardPath || 
        path.startsWith('/setup/');
        
    if (isFlowSetupRoute) {
      final dashboard = _getDashboardPathForRole(role);
      debugPrint('[RouteGuard] User completed onboarding, guest route accessed. Redirecting to: $dashboard');
      return dashboard;
    }

    // 4. Role-based path access control
    if (path.startsWith('/student') && role != UserRole.student) {
      debugPrint('[RouteGuard] Blocked non-student user ($role) from "$path"');
      return AppRoutes.unauthorizedPath;
    }

    if (path.startsWith('/teacher') && role != UserRole.teacher) {
      debugPrint('[RouteGuard] Blocked non-teacher user ($role) from "$path"');
      return AppRoutes.unauthorizedPath;
    }

    if (path.startsWith('/parent') && role != UserRole.parent) {
      debugPrint('[RouteGuard] Blocked non-parent user ($role) from "$path"');
      return AppRoutes.unauthorizedPath;
    }

    if (path.startsWith('/admin') && role != UserRole.admin) {
      debugPrint('[RouteGuard] Blocked non-admin user ($role) from "$path"');
      return AppRoutes.unauthorizedPath;
    }

    if (path.startsWith('/management') &&
        role != UserRole.hod &&
        role != UserRole.principal &&
        role != UserRole.management &&
        role != UserRole.admin) {
      debugPrint('[RouteGuard] Blocked user ($role) from "$path"');
      return AppRoutes.unauthorizedPath;
    }

    return null;
  }

  /// Maps a concrete user role to their landing dashboard page.
  static String _getDashboardPathForRole(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return AppRoutes.adminHomePath;
      case UserRole.teacher:
        return AppRoutes.teacherHomePath;
      case UserRole.student:
        return AppRoutes.studentHomePath;
      case UserRole.parent:
        return AppRoutes.parentHomePath;
      case UserRole.hod:
      case UserRole.principal:
      case UserRole.management:
        return AppRoutes.managementDashboardPath;
      default:
        return AppRoutes.loginPath;
    }
  }
}
