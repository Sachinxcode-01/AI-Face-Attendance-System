import 'package:flutter/material.dart';
import 'package:animated_icon/animated_icon.dart';
import 'package:smartface_attendance/core/ui_system/app_ui_package_registry.dart';

/// StudentScreenShell — Standard wrapper for all Student module screens.
class StudentScreenShell extends StatelessWidget {
  final Widget child;
  final String? title;
  final List<Widget>? actions;

  const StudentScreenShell({
    super.key,
    required this.child,
    this.title,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: title != null
          ? AppBar(
              title: AppAnimatedHeading(
                text: title!,
                style: const TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              actions: actions,
              elevation: 0,
              backgroundColor: Colors.transparent,
            )
          : null,
      body: AppAnimationShell(child: SafeArea(child: child)),
    );
  }
}

/// StudentGreetingHeader — Greeting headline with AnimatedTextKit.
class StudentGreetingHeader extends StatelessWidget {
  final String studentName;
  final String greeting;

  const StudentGreetingHeader({
    super.key,
    required this.studentName,
    this.greeting = 'Welcome back,',
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          greeting,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 13,
            color: Color(0xFF94A3B8),
          ),
        ),
        const SizedBox(height: 2),
        AppAnimatedHeading(
          text: studentName,
          style: const TextStyle(
            fontFamily: 'Outfit',
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ],
    );
  }
}

/// StudentSalomonBottomBar — Specialized Student navigation bar.
class StudentSalomonBottomBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const StudentSalomonBottomBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppBottomNavigation(
      currentIndex: currentIndex,
      onTap: onTap,
      role: 'student',
      items: const [
        AppSalomonNavItemData(
          icon: Icons.home_outlined,
          activeIcon: Icons.home_rounded,
          animateIcon: AnimateIcons.home,
          title: 'Home',
          route: '/student/home',
        ),
        AppSalomonNavItemData(
          icon: Icons.calendar_month_outlined,
          activeIcon: Icons.calendar_month_rounded,
          animateIcon: AnimateIcons.calendar,
          title: 'Schedule',
          route: '/student/timetable',
        ),
        AppSalomonNavItemData(
          icon: Icons.qr_code_scanner_outlined,
          activeIcon: Icons.qr_code_scanner_rounded,
          animateIcon: AnimateIcons.calendar,
          title: 'Scan',
          route: '/student/scan',
        ),
        AppSalomonNavItemData(
          icon: Icons.bar_chart_outlined,
          activeIcon: Icons.bar_chart_rounded,
          animateIcon: AnimateIcons.activity,
          title: 'Reports',
          route: '/student/attendance-hub',
        ),
        AppSalomonNavItemData(
          icon: Icons.person_outline_rounded,
          activeIcon: Icons.person_rounded,
          animateIcon: AnimateIcons.home,
          title: 'Profile',
          route: '/student/profile',
        ),
      ],
    );
  }
}
