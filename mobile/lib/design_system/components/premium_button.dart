import 'package:flutter/material.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';

enum PremiumButtonVariant {
  primary,
  glass,
}

/// Upgraded tactile button with spring physics, haptics, and loading states.
class PremiumButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final double borderRadius;
  final bool isLoading;
  final Widget? leadingIcon;
  final Widget? trailingIcon;
  final double? height;
  final bool isFullWidth;
  final Gradient? gradient;
  final List<BoxShadow>? boxShadow;
  final PremiumButtonVariant variant;

  const PremiumButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.borderRadius = 12,
    this.isLoading = false,
    this.leadingIcon,
    this.trailingIcon,
    this.height,
    this.isFullWidth = true,
    this.gradient,
    this.boxShadow,
  }) : variant = PremiumButtonVariant.primary;

  const PremiumButton.glass({
    super.key,
    required this.onPressed,
    required this.child,
    this.borderRadius = 12,
    this.isLoading = false,
    this.leadingIcon,
    this.trailingIcon,
    this.height,
    this.isFullWidth = true,
    this.boxShadow,
  })  : variant = PremiumButtonVariant.glass,
        gradient = null;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !isLoading;

    final contentColor = variant == PremiumButtonVariant.glass
        ? (enabled ? Colors.white : Colors.white38)
        : (enabled ? Colors.black : Colors.black54);

    BoxDecoration decoration;
    if (variant == PremiumButtonVariant.glass) {
      decoration = BoxDecoration(
        color: enabled
            ? Colors.white.withValues(alpha: 0.08)
            : Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: enabled
              ? Colors.white.withValues(alpha: 0.18)
              : Colors.white.withValues(alpha: 0.06),
          width: 1.2,
        ),
        boxShadow: boxShadow ?? [],
      );
    } else {
      decoration = BoxDecoration(
        gradient: gradient ??
            (enabled
                ? AppGradients.gold
                : LinearGradient(
                    colors: [Colors.grey.shade600, Colors.grey.shade500],
                  )),
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: boxShadow ?? (enabled ? AppShadows.goldGlow() : []),
      );
    }

    Widget innerContent = AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      child: isLoading
          ? SizedBox(
              key: const ValueKey('button_loading'),
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                valueColor: AlwaysStoppedAnimation<Color>(contentColor),
              ),
            )
          : Row(
              key: const ValueKey('button_content'),
              mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (leadingIcon != null) ...[
                  leadingIcon!,
                  const SizedBox(width: 8),
                ],
                Flexible(
                  child: DefaultTextStyle(
                    style: (Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: contentColor,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.3,
                            ) ??
                            const TextStyle())
                        .copyWith(color: contentColor),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    child: child,
                  ),
                ),
                if (trailingIcon != null) ...[
                  const SizedBox(width: 8),
                  trailingIcon!,
                ],
              ],
            ),
    );

    Widget buttonBody = Container(
      decoration: decoration,
      height: height,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        child: Center(child: innerContent),
      ),
    );

    return PressableScale(
      onTap: enabled ? onPressed : null,
      pressedScale: 0.97,
      haptic: enabled,
      child: buttonBody,
    );
  }
}
