import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';

/// A single item for [SmartBottomNav].
class SmartNavItem {
  final IconData icon;
  final IconData? activeIcon;
  final String label;
  const SmartNavItem({required this.icon, this.activeIcon, required this.label});
}

/// ============================================================================
/// SmartBottomNav — rounded floating navigation bar matching the reference:
/// white surface, soft shadow, blue active icon + label, smooth transition,
/// haptic feedback and SafeArea support.
/// ============================================================================
class SmartBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<SmartNavItem> items;

  /// When true, uses the dark surface variant. Defaults to the reference
  /// white/light rounded bar shown on every screen in the design.
  final bool dark;

  const SmartBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
    this.dark = false,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = dark ? Brightness.dark : Brightness.light;
    final surface = AppColors.card(brightness);

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(14, 0, 14, 12),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: AppColors.border(brightness)),
          boxShadow: [
            BoxShadow(
              color: brightness == Brightness.dark
                  ? Colors.black.withValues(alpha: 0.4)
                  : const Color(0xFF8794C8).withValues(alpha: 0.22),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: List.generate(items.length, (i) {
            final selected = i == currentIndex;
            final item = items[i];
            return Expanded(
              child: InkWell(
                onTap: () {
                  HapticFeedback.selectionClick();
                  onTap(i);
                },
                borderRadius: BorderRadius.circular(18),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 240),
                  curve: Curves.easeOutCubic,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      AnimatedScale(
                        scale: selected ? 1.12 : 1.0,
                        duration: const Duration(milliseconds: 240),
                        curve: Curves.easeOutBack,
                        child: Icon(
                          selected ? (item.activeIcon ?? item.icon) : item.icon,
                          size: 23,
                          color: selected
                              ? AppColors.primary
                              : AppColors.muted(brightness),
                        ),
                      ),
                      const SizedBox(height: 4),
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 240),
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: selected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: selected
                              ? AppColors.primary
                              : AppColors.muted(brightness),
                        ),
                        child: Text(item.label),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
