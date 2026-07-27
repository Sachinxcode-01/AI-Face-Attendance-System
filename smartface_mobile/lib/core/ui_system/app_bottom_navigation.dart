import 'package:flutter/material.dart';
import 'package:animated_icon/animated_icon.dart';
import 'package:smartface_attendance/design_system/ui/smart_bottom_nav.dart';

class AppSalomonNavItemData {
  final IconData icon;
  final IconData? activeIcon;
  final AnimateIcons? animateIcon;
  final String title;
  final String route;
  final Color? selectedColor;

  const AppSalomonNavItemData({
    required this.icon,
    this.activeIcon,
    this.animateIcon,
    required this.title,
    required this.route,
    this.selectedColor,
  });
}

/// AppBottomNavigation — Shared bottom navigation bar for Student, Teacher, Parent, Admin.
class AppBottomNavigation extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<AppSalomonNavItemData> items;
  final String role;
  final Color? activeColor;
  final Color? inactiveColor;

  const AppBottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
    this.role = 'unknown',
    this.activeColor,
    this.inactiveColor,
  });

  @override
  Widget build(BuildContext context) {
    return SmartBottomNav(
      currentIndex: currentIndex,
      onTap: onTap,
      role: role,
      items: items.map((item) {
        return BottomNavItemData(
          icon: item.icon,
          activeIcon: item.activeIcon,
          animateIcon: item.animateIcon,
          label: item.title,
          route: item.route,
        );
      }).toList(),
    );
  }
}

