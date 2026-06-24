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
  /// Evaluates authentication state and role authorization to redirect users.
  static String? handleRedirect(BuildContext context, GoRouterState state) {
    final session = sl<SessionManager>();
    final isLoggedIn = session.isLoggedIn;
    final role = session.userRole;
    final path = state.uri.path;

    // Check if the route is an auth (guest) route
    final isAuthRoute = path.startsWith('/auth/');

    // 1. Unauthenticated users must be redirected to login unless they are already on an auth route
    if (!isLoggedIn) {
      if (!isAuthRoute) {
        debugPrint(
          '[RouteGuard] Redirecting guest trying to access "$path" to Login',
        );
        return AppRoutes.loginPath;
      }
      return null;
    }

    // 2. Authenticated users should not access auth pages (splash, login, register, etc.)
    if (isAuthRoute) {
      final dashboard = _getDashboardPathForRole(role);
      debugPrint(
        '[RouteGuard] Authenticated user on guest route. Redirecting to: $dashboard',
      );
      return dashboard;
    }

    // 3. Prevent cross-role access:
    // Student routes: only students allowed
    if (path.startsWith('/student') && role != UserRole.student) {
      debugPrint('[RouteGuard] Blocked non-student user ($role) from "$path"');
      return AppRoutes.unauthorizedPath;
    }

    // Teacher routes: only teachers allowed
    if (path.startsWith('/teacher') && role != UserRole.teacher) {
      debugPrint('[RouteGuard] Blocked non-teacher user ($role) from "$path"');
      return AppRoutes.unauthorizedPath;
    }

    // Admin routes: only admins allowed
    if (path.startsWith('/admin') && role != UserRole.admin) {
      debugPrint('[RouteGuard] Blocked non-admin user ($role) from "$path"');
      return AppRoutes.unauthorizedPath;
    }

    // Management routes: only management, principal, hod, and admin allowed
    if (path.startsWith('/management') &&
        role != UserRole.hod &&
        role != UserRole.principal &&
        role != UserRole.management &&
        role != UserRole.admin) {
      debugPrint('[RouteGuard] Blocked user ($role) from "$path"');
      return AppRoutes.unauthorizedPath;
    }

    // Allow navigation
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
      case UserRole.hod:
      case UserRole.principal:
      case UserRole.management:
        return AppRoutes.managementDashboardPath;
      default:
        return AppRoutes.loginPath;
    }
  }
}
