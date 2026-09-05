import 'package:flutter/material.dart';
import 'package:animated_icon/animated_icon.dart';

/// Reusable Animated Icon component for Smart Attendance AI platform.
/// Wraps [AnimateIcon] with theme adaptivity, reduced-motion accessibility,
/// minimum 48x48 tap target compliance, and fallback static icon rendering.
class ModernAnimatedIcon extends StatelessWidget {
  final AnimateIcons animateIcon;
  final IconData? fallbackIcon;
  final double size;
  final Color? activeColor;
  final Color? inactiveColor;
  final bool isActive;
  final IconType iconType;
  final VoidCallback? onTap;
  final String? semanticLabel;
  final String? toolTip;
  final bool animateOnTap;

  const ModernAnimatedIcon({
    super.key,
    required this.animateIcon,
    this.fallbackIcon,
    this.size = 24.0,
    this.activeColor,
    this.inactiveColor,
    this.isActive = false,
    this.iconType = IconType.animatedOnTap,
    this.onTap,
    this.semanticLabel,
    this.toolTip,
    this.animateOnTap = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    final effectiveActiveColor = activeColor ?? colorScheme.primary;
    final effectiveInactiveColor =
        inactiveColor ?? (isDark ? Colors.white70 : Colors.black54);

    final currentColor = isActive
        ? effectiveActiveColor
        : effectiveInactiveColor;
    final isReducedMotion = MediaQuery.of(context).accessibleNavigation;

    Widget iconWidget;

    if (isReducedMotion && fallbackIcon != null) {
      iconWidget = Icon(
        fallbackIcon,
        size: size,
        color: currentColor,
        semanticLabel: semanticLabel,
      );
    } else {
      iconWidget = AnimateIcon(
        key: ValueKey('${animateIcon.name}_$isActive'),
        onTap: onTap ?? () {},
        iconType: isReducedMotion ? IconType.onlyIcon : iconType,
        animateIcon: animateIcon,
        height: size,
        width: size,
        color: currentColor,
        toolTip: toolTip,
      );
    }

    final animatedScaleWidget = AnimatedScale(
      scale: isActive ? 1.0 : 0.92,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOutCubic,
      child: iconWidget,
    );

    return Semantics(
      label: semanticLabel ?? toolTip ?? animateIcon.name,
      button: onTap != null,
      selected: isActive,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(size),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minWidth: 48.0, minHeight: 48.0),
          child: Center(child: animatedScaleWidget),
        ),
      ),
    );
  }
}
