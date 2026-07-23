import 'package:flutter/material.dart';
import 'package:salomon_bottom_bar/salomon_bottom_bar.dart';
import 'package:animated_icon/animated_icon.dart';
import 'app_animated_icon.dart';

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

/// AppBottomNavigation — Shared Salomon bottom bar component for Student, Teacher, Parent, Admin.
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final Color effectiveActiveColor = activeColor ?? const Color(0xFF3559E0);
    final Color effectiveInactiveColor =
        inactiveColor ??
        (isDark ? const Color(0xFF6C7593) : const Color(0xFF8A90AE));
    final Color backgroundColor = isDark
        ? const Color(0xFF0F152B)
        : Colors.white;

    return SafeArea(
      top: false,
      minimum: const EdgeInsets.only(bottom: 6),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF1E2848) : const Color(0xFFE5E7F0),
          ),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.4)
                  : const Color(0xFF8794C8).withValues(alpha: 0.18),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: SalomonBottomBar(
          currentIndex: currentIndex,
          onTap: onTap,
          unselectedItemColor: effectiveInactiveColor,
          items: items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isSelected = index == currentIndex;

            Widget iconWidget;
            if (item.animateIcon != null) {
              iconWidget = AppAnimatedIconWrapper(
                animateIcon: item.animateIcon!,
                fallbackIcon: isSelected
                    ? (item.activeIcon ?? item.icon)
                    : item.icon,
                size: 20,
                activeColor: item.selectedColor ?? effectiveActiveColor,
                inactiveColor: effectiveInactiveColor,
                isActive: isSelected,
                semanticLabel: item.title,
              );
            } else {
              iconWidget = Icon(
                isSelected ? (item.activeIcon ?? item.icon) : item.icon,
                size: 20,
              );
            }

            return SalomonBottomBarItem(
              icon: iconWidget,
              title: Text(
                item.title,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
              selectedColor: item.selectedColor ?? effectiveActiveColor,
            );
          }).toList(),
        ),
      ),
    );
  }
}
