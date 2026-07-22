import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_theme.dart';

/// ============================================================================
/// ModernCard — a solid-color premium card with rounded corners and a soft glow.
///
/// Features:
/// - Rounded borders (using [AppTheme.radiusLg])
/// - Subtle borders that read well in both light and dark mode.
/// - Pressed / tap feedback when [onTap] is specified.
/// ============================================================================
class ModernCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final VoidCallback? onTap;
  final Color? color;
  final EdgeInsetsGeometry? margin;
  final Border? border;

  const ModernCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.radius = AppTheme.radiusLg,
    this.onTap,
    this.color,
    this.margin,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;

    final card = Container(
      padding: padding,
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? AppColors.card(brightness),
        borderRadius: BorderRadius.circular(radius),
        border:
            border ??
            Border.all(
              color: AppColors.border(brightness).withValues(alpha: 0.6),
              width: 1,
            ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.4)
                : const Color(0xFF8B98CE).withValues(alpha: 0.14),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: card,
      ),
    );
  }
}
