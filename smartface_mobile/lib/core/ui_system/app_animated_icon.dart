import 'package:flutter/material.dart';
import 'package:animated_icon/animated_icon.dart';
import 'app_motion.dart';

/// AppAnimatedIconWrapper — Reusable component utilizing animated_icon package
/// with fallback rendering for navigation, toggles, scan, and actions.
class AppAnimatedIconWrapper extends StatelessWidget {
  final AnimateIcons animateIcon;
  final IconData fallbackIcon;
  final double size;
  final Color activeColor;
  final Color inactiveColor;
  final bool isActive;
  final VoidCallback? onTap;
  final String? semanticLabel;

  const AppAnimatedIconWrapper({
    super.key,
    required this.animateIcon,
    required this.fallbackIcon,
    this.size = 22,
    this.activeColor = Colors.blue,
    this.inactiveColor = Colors.grey,
    this.isActive = false,
    this.onTap,
    this.semanticLabel,
  });

  @override
  Widget build(BuildContext context) {
    final isReduced = AppMotion.isReducedMotion(context);

    Widget iconWidget;
    if (isReduced) {
      iconWidget = Icon(
        fallbackIcon,
        size: size,
        color: isActive ? activeColor : inactiveColor,
      );
    } else {
      iconWidget = AnimateIcon(
        key: UniqueKey(),
        onTap: () {
          onTap?.call();
          return true;
        },
        iconType: IconType.animatedOnTap,
        animateIcon: animateIcon,
        color: isActive ? activeColor : inactiveColor,
        width: size,
        height: size,
      );
    }

    if (semanticLabel != null) {
      return Semantics(
        label: semanticLabel,
        button: onTap != null,
        child: iconWidget,
      );
    }

    return iconWidget;
  }
}
