import 'package:flutter/material.dart';
import 'package:salomon_bottom_bar/salomon_bottom_bar.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:animated_icon/animated_icon.dart';
import 'modern_animated_icon.dart';

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

/// SmartSalomonBottomBar — Premium Salomon Bottom Bar implementation for Smart Attendance AI.
/// Supports role-based navigation, smooth active color transitions, animated icons,
/// and accessibility compliant 48x48 touch target area inside SafeArea.
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final Color effectiveActiveColor = activeColor ?? AppColors.primary;
    final Color effectiveInactiveColor =
        inactiveColor ??
        (isDark ? const Color(0xFF6C7593) : const Color(0xFF8A90AE));
    final Color backgroundColor = isDark
        ? const Color(0xFF0F152B)
        : Colors.white;
    final Color borderColor = isDark
        ? const Color(0xFF1E2848).withValues(alpha: 0.6)
        : const Color(0xFFE5E7F0).withValues(alpha: 0.7);

    final double screenWidth = MediaQuery.of(context).size.width;
    final double horizontalMargin = screenWidth < 380 ? 8 : 16;

    return SafeArea(
      top: false,
      minimum: const EdgeInsets.only(bottom: 6),
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: horizontalMargin),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: borderColor, width: 1.0),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.4)
                  : const Color(0xFF8794C8).withValues(alpha: 0.18),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: SalomonBottomBar(
          currentIndex: currentIndex,
          onTap: onTap,
          duration: animationDuration,
          unselectedItemColor: effectiveInactiveColor,
          items: items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isSelected = index == currentIndex;

            Widget iconWidget;
            if (item.animateIcon != null) {
              iconWidget = ModernAnimatedIcon(
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
