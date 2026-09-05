import 'package:flutter/material.dart';
import 'package:animated_icon/animated_icon.dart';
import 'package:smartface_attendance/design_system/ui/smart_bottom_nav.dart';

/// Item data model for SmartSalomonBottomBar.
class SmartSalomonNavItemData {
  final IconData icon;
  final IconData? activeIcon;
  final AnimateIcons? animateIcon;
  final String title;
  final String route;
  final Color? selectedColor;

  const SmartSalomonNavItemData({
    required this.icon,
    this.activeIcon,
    this.animateIcon,
    required this.title,
    required this.route,
    this.selectedColor,
  });
}

/// SmartSalomonBottomBar — Premium Bottom Navigation implementation for Smart Attendance AI.
/// Built with SmartBottomNav for fixed-width grid spacing, spring indicator pill,
/// frosted glassmorphism, animated icons, and accessibility compliant touch targets.
class SmartSalomonBottomBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<SmartSalomonNavItemData> items;
  final String role;
  final bool showLabels;
  final Duration animationDuration;
  final Color? activeColor;
  final Color? inactiveColor;

  const SmartSalomonBottomBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
    this.role = 'unknown',
    this.showLabels = true,
    this.animationDuration = const Duration(milliseconds: 350),
    this.activeColor,
    this.inactiveColor,
  });

  @override
  Widget build(BuildContext context) {
    return SmartBottomNav(
      currentIndex: currentIndex,
      onTap: onTap,
      role: role,
      showLabels: showLabels,
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
