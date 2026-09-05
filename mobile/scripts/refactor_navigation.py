import os
import re

ROOT_DIR = r"c:\Users\kalin\OneDrive\Documents\Projects\SmartFace-attendance\smartface_mobile"

def refactor_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content
    modified = False

    # 1. login_screen.dart specific replacements
    if "login_screen.dart" in file_path:
        # Replace the targetRoute block and Navigator call in login_screen.dart
        pattern = r"final\s+String\s+targetRoute\s*=\s*biometricRegistered\s*\?\s*'/dashboard'\s*:\s*'/auth/setup';\s*Navigator\.pushReplacementNamed\(\s*context,\s*targetRoute,\s*arguments:\s*\{[^}]+\},?\s*\);"
        replacement = """final String targetRoute = biometricRegistered
              ? (result['role']?.toString().toLowerCase() == 'admin'
                  ? '/admin/home'
                  : (result['role']?.toString().toLowerCase() == 'teacher' || result['role']?.toString().toLowerCase() == 'faculty' || result['role']?.toString().toLowerCase() == 'lecturer'
                      ? '/teacher/home'
                      : '/student/home'))
              : '/auth/setup';
          context.go(targetRoute);"""
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True

        # Simple navigation to register page
        if "Navigator.pushNamed(context, '/auth/register')" in content:
            content = content.replace("Navigator.pushNamed(context, '/auth/register')", "context.push('/auth/register')")
            modified = True

    # 2. splash_screen.dart specific replacements
    if "splash_screen.dart" in file_path:
        pattern = r"final\s+String\s+targetRoute\s*=\s*session\.biometricRegistered\s*\?\s*'/dashboard'\s*:\s*'/auth/setup';\s*Navigator\.pushReplacementNamed\(\s*context,\s*targetRoute,\s*arguments:\s*\{[^}]+\},?\s*\);"
        replacement = """final String targetRoute = session.biometricRegistered
              ? (session.role?.toLowerCase() == 'admin'
                  ? '/admin/home'
                  : (session.role?.toLowerCase() == 'teacher' || session.role?.toLowerCase() == 'faculty' || session.role?.toLowerCase() == 'lecturer'
                      ? '/teacher/home'
                      : '/student/home'))
              : '/auth/setup';
          context.go(targetRoute);"""
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True

        content = content.replace("Navigator.pushReplacementNamed(context, '/auth/login')", "context.go('/auth/login')")
        content = content.replace("Navigator.pushReplacementNamed(context, '/auth/login'),", "context.go('/auth/login'),")
        modified = True

    # 3. setup_wizard_screen.dart specific replacements
    if "setup_wizard_screen.dart" in file_path:
        pattern = r"Navigator\.pushReplacementNamed\(\s*context,\s*'/dashboard',\s*arguments:\s*\{\s*'role':\s*role\s*\},?\s*\);"
        replacement = """final targetRoute = role.toLowerCase() == 'admin'
          ? '/admin/home'
          : (role.toLowerCase() == 'teacher' || role.toLowerCase() == 'faculty' || role.toLowerCase() == 'lecturer' ? '/teacher/home' : '/student/home');
      context.go(targetRoute);"""
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True

    # 4. register_screen.dart specific replacements
    if "register_screen.dart" in file_path:
        content = content.replace("Navigator.pushNamedAndRemoveUntil(\n              context,\n              '/auth/login',\n              (_) => false,\n            )", "context.go('/auth/login')")
        content = content.replace("Navigator.pushNamedAndRemoveUntil(context, '/auth/login', (_) => false)", "context.go('/auth/login')")
        
        pattern = r"Navigator\.pushReplacementNamed\(\s*context,\s*'/dashboard',\s*arguments:\s*\{[^}]+\},?\s*\);"
        replacement = """final role = result['role']?.toString().toLowerCase() ?? 'student';
          final targetRoute = role == 'admin'
              ? '/admin/home'
              : (role == 'teacher' || role == 'faculty' || role == 'lecturer' ? '/teacher/home' : '/student/home');
          context.go(targetRoute);"""
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
        
        content = content.replace("Navigator.pushReplacementNamed(\n          context,\n          '/auth/login',\n        )", "context.go('/auth/login')")
        modified = True

    # 5. otp_screen.dart specific replacements
    if "otp_screen.dart" in file_path:
        pattern = r"Navigator\.pushReplacementNamed\(\s*context,\s*'/dashboard',\s*arguments:\s*\{[^}]+\},?\s*\);"
        replacement = """final role = result['role']?.toString().toLowerCase() ?? 'student';
        final targetRoute = role == 'admin'
            ? '/admin/home'
            : (role == 'teacher' || role == 'faculty' || role == 'lecturer' ? '/teacher/home' : '/student/home');
        context.go(targetRoute);"""
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True

    # 6. forgot_password_screen.dart specific replacements
    if "forgot_password_screen.dart" in file_path:
        content = content.replace("Navigator.pushNamedAndRemoveUntil(context, '/auth/login', (_) => false)", "context.go('/auth/login')")
        modified = True

    # 7. admin_home_screen.dart specific replacements
    if "admin_home_screen.dart" in file_path:
        # Approvals
        content = content.replace("Navigator.pushNamed(\n                          context,\n                          '/leave/review',\n                          arguments: ModalRoute.of(context)?.settings.arguments,\n                        )", "context.go('/admin/approvals')")
        # Security logs
        content = content.replace("Navigator.pushNamed(context, '/admin/security-logs')", "context.go('/admin/security')")
        # Advanced analytics
        content = content.replace("Navigator.pushNamed(\n                          context,\n                          '/analytics/general',\n                          arguments: ModalRoute.of(context)?.settings.arguments,\n                        )", "context.go('/admin/analytics')")
        # System settings
        content = content.replace("onTap: () {},", "onTap: () => context.push('/settings'),")
        # Notifications
        content = content.replace("Navigator.pushNamed(\n                      context,\n                      '/notifications/nexus',\n                      arguments: ModalRoute.of(context)?.settings.arguments,\n                    )", "context.push('/notifications/nexus')")
        # Logout
        content = content.replace("navigator.pushNamedAndRemoveUntil(\n                              '/auth/login',\n                              (_) => false,\n                            );", "context.go('/auth/login');")
        modified = True

    # 8. teacher_dashboard_screen.dart specific replacements
    if "teacher_dashboard_screen.dart" in file_path:
        # Notifications
        content = content.replace("Navigator.pushNamed(context, '/notifications/nexus')", "context.push('/notifications/nexus')")
        # Train faces
        content = content.replace("Navigator.pushNamed(\n              context,\n              '/teacher/train-faces',\n              arguments: ModalRoute.of(context)?.settings.arguments,\n            )", "context.push('/teacher/train-faces')")
        # Live monitor
        content = content.replace("Navigator.pushNamed(context, '/attendance/live-monitor')", "context.go('/teacher/feed')")
        # System health / other console items
        content = content.replace("onTap: () => Navigator.pushNamed(context, route),", "onTap: () => context.push(route),")
        # Profile / Logout
        content = content.replace("navigator.pushNamedAndRemoveUntil(\n                              '/auth/login',\n                              (_) => false,\n                            );", "context.go('/auth/login');")
        modified = True

    # 9. student_home_screen.dart specific replacements
    if "student_home_screen.dart" in file_path:
        # Scanner dialog
        content = content.replace("Navigator.pushNamed(context, '/attendance/qr-scanner', arguments: args);", "context.go('/student/scan');")
        # Profile
        content = content.replace("Navigator.pushNamed(\n              context,\n              '/profile/student',\n              arguments: ModalRoute.of(context)?.settings.arguments,\n            )", "context.go('/student/profile')")
        # Notifications
        content = content.replace("Navigator.pushNamed(\n              context,\n              '/notifications/nexus',\n              arguments: ModalRoute.of(context)?.settings.arguments,\n            )", "context.go('/student/alerts')")
        # Leave history
        content = content.replace("Navigator.pushNamed(context, '/leave/history', arguments: args);", "context.go('/student/leave');")
        # Leave apply
        content = content.replace("Navigator.pushNamed(context, '/leave/apply', arguments: args);", "context.push('/student/leave/apply');")
        # AI Analyst
        content = content.replace("Navigator.pushNamed(context, '/analytics/analyst', arguments: args);", "context.push('/analytics/analyst');")
        # Logout
        content = content.replace("navigator.pushNamedAndRemoveUntil(\n                              '/auth/login',\n                              (_) => false,\n                            );", "context.go('/auth/login');")
        modified = True

    # 10. profile_screen.dart specific replacements
    if "profile_screen.dart" in file_path:
        content = content.replace("Navigator.pushNamedAndRemoveUntil(\n                          context,\n                          '/auth/login',\n                          (_) => false,\n                        )", "context.go('/auth/login')")
        modified = True

    # 11. leave_history_screen.dart specific replacements
    if "leave_history_screen.dart" in file_path:
        content = content.replace("Navigator.pushNamed(\n              context,\n              '/leave/apply',\n              arguments: _args,\n            )", "context.push('/student/leave/apply')")
        modified = True

    # 12. notification_nexus_screen.dart specific replacements
    if "notification_nexus_screen.dart" in file_path:
        content = content.replace("Navigator.pushNamed(\n                      context,\n                      '/leave/review',\n                      arguments: ModalRoute.of(context)?.settings.arguments,\n                    )", "context.go('/admin/approvals')")
        modified = True

    # Generic replace pop if it makes sense, but Navigator.pop is fine. Let's replace Navigator.pop to context.pop where go_router is imported
    # Add go_router import if we modified the file and it doesn't have it
    if modified:
        if "import 'package:go_router/go_router.dart';" not in content:
            # Insert import after the last import statement or package:flutter/material.dart
            if "import 'package:flutter/material.dart';" in content:
                content = content.replace(
                    "import 'package:flutter/material.dart';",
                    "import 'package:flutter/material.dart';\nimport 'package:go_router/go_router.dart';"
                )
            else:
                # Fallback to top-level insert after purpose comment
                lines = content.splitlines()
                idx = 0
                for i, line in enumerate(lines):
                    if "import " in line:
                        idx = i
                        break
                lines.insert(idx, "import 'package:go_router/go_router.dart';")
                content = "\n".join(lines)

        with open(file_path, "w", encoding="utf-8", newline="") as f:
            f.write(content)
        print(f"Refactored navigation in: {os.path.relpath(file_path, ROOT_DIR)}")
        return True

    return False

def run_navigation_refactor():
    print("--- Phase 2 Navigation Refactoring ---")
    refactored_count = 0
    for root, _, files in os.walk(os.path.join(ROOT_DIR, "lib")):
        for file in files:
            if file.endswith(".dart"):
                file_path = os.path.join(root, file)
                if refactor_file(file_path):
                    refactored_count += 1
    print(f"Total screens refactored: {refactored_count}")

if __name__ == "__main__":
    run_navigation_refactor()
