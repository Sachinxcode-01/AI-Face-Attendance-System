import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animated_icon/animated_icon.dart';
import 'modern_animated_icon.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';

/// Stagger fade-in + slide-up motion card wrapper.
class AnimatedCardWrapper extends StatelessWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;

  const AnimatedCardWrapper({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 320),
  });

  @override
  Widget build(BuildContext context) {
    return child
        .animate()
        .fadeIn(delay: delay, duration: duration, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.08,
          end: 0.0,
          delay: delay,
          duration: duration,
          curve: Curves.easeOutCubic,
        );
  }
}

/// The premium base card layout supporting soft shadows, custom borders, and scale-on-press gestures.
class ModernDashboardCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;
  final Color? borderColor;
  final Color? backgroundColor;
  final List<BoxShadow>? boxShadow;
  final double borderWidth;
  final VoidCallback? onTap;

  const ModernDashboardCard({
    super.key,
    required this.child,
    this.padding,
    this.borderRadius = 24.0,
    this.borderColor,
    this.backgroundColor,
    this.boxShadow,
    this.borderWidth = 1.0,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBgColor =
        backgroundColor ?? (isDark ? const Color(0xFF13182E) : Colors.white);

    final List<BoxShadow> effectiveBoxShadow =
        boxShadow ??
        [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.3)
                : const Color(0xFF9EAFD8).withValues(alpha: 0.14),
            blurRadius: 16,
            spreadRadius: 2,
            offset: const Offset(0, 8),
          ),
        ];

    final card = Container(
      padding: padding ?? const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cardBgColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color:
              borderColor ??
              (isDark
                  ? Colors.white.withValues(alpha: 0.06)
                  : const Color(0xFFE2E8F0)),
          width: borderWidth,
        ),
        boxShadow: effectiveBoxShadow,
      ),
      child: child,
    );

    if (onTap == null) return card;
    return PressableScale(onTap: onTap, child: card);
  }
}

/// Standardized statistics card with icon badge, title/subtitle, and trend alerts.
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final AnimateIcons? animateIcon;
  final Color? accentColor;
  final String? subtitle;
  final String? trend;
  final bool isTrendPositive;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.animateIcon,
    this.accentColor,
    this.subtitle,
    this.trend,
    this.isTrendPositive = true,
    this.onTap,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final color = accentColor ?? const Color(0xFF3559E0);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ModernDashboardCard(
      onTap: onTap,
      padding: padding ?? const EdgeInsets.all(AppSpacing.md),
      borderColor: color.withValues(alpha: 0.15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: animateIcon != null
                    ? ModernAnimatedIcon(
                        animateIcon: animateIcon!,
                        fallbackIcon: icon,
                        size: 20,
                        activeColor: color,
                        inactiveColor: color,
                        isActive: true,
                        iconType: IconType.animatedOnTap,
                        semanticLabel: label,
                      )
                    : Icon(icon, color: color, size: 20),
              ),
              if (trend != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isTrendPositive
                        ? AppColors.success.withValues(alpha: 0.1)
                        : AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isTrendPositive
                            ? Icons.arrow_upward
                            : Icons.arrow_downward,
                        color: isTrendPositive
                            ? AppColors.success
                            : AppColors.error,
                        size: 10,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        trend!,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isTrendPositive
                              ? AppColors.success
                              : AppColors.error,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF1B2C56),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white70 : const Color(0xFF7F8CA4),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: color,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
}

/// Standardized segment-swapping chart container card.
class AnalyticsCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget chart;
  final List<String> segments;
  final int selectedSegmentIndex;
  final ValueChanged<int>? onSegmentChanged;
  final Widget? trailing;

  const AnalyticsCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.chart,
    this.segments = const ['1W', '1M', '3M', 'ALL'],
    this.selectedSegmentIndex = 0,
    this.onSegmentChanged,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final trailingWidget = trailing;
    return ModernDashboardCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        color: isDark ? Colors.white : const Color(0xFF1B2C56),
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        color: isDark
                            ? Colors.white60
                            : const Color(0xFF7F8CA4),
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              trailingWidget ?? const SizedBox.shrink(),
            ],
          ),
          const SizedBox(height: 12),
          if (segments.isNotEmpty)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(segments.length, (index) {
                  final isSelected = index == selectedSegmentIndex;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: InkWell(
                      onTap: onSegmentChanged != null
                          ? () => onSegmentChanged!(index)
                          : null,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF3559E0).withValues(alpha: 0.15)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isSelected
                                ? const Color(0xFF3559E0).withValues(alpha: 0.4)
                                : Colors.transparent,
                            width: 1.0,
                          ),
                        ),
                        child: Text(
                          segments[index],
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isSelected
                                ? const Color(0xFF3559E0)
                                : const Color(0xFF7F8CA4),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          const SizedBox(height: 16),
          SizedBox(height: 180, child: chart),
        ],
      ),
    );
  }
}

/// Compact pressable grid card for quick action items.
class QuickActionCard extends StatelessWidget {
  final String label;
  final String description;
  final IconData icon;
  final AnimateIcons? animateIcon;
  final Color color;
  final VoidCallback onTap;

  const QuickActionCard({
    super.key,
    required this.label,
    required this.description,
    required this.icon,
    this.animateIcon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ModernDashboardCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      borderColor: color.withValues(alpha: 0.15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: animateIcon != null
                ? ModernAnimatedIcon(
                    animateIcon: animateIcon!,
                    fallbackIcon: icon,
                    size: 20,
                    activeColor: color,
                    inactiveColor: color,
                    isActive: true,
                    iconType: IconType.animatedOnTap,
                    semanticLabel: label,
                  )
                : Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF1B2C56),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            description,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: isDark ? Colors.white54 : const Color(0xFF7F8CA4),
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// Stat card utilizing CircularProgressIndicator to present a visual score.
class ProgressCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final double percentage;
  final Color? progressColor;
  final IconData? leadingIcon;
  final VoidCallback? onTap;

  const ProgressCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.percentage,
    this.progressColor,
    this.leadingIcon,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = progressColor ?? const Color(0xFF3559E0);
    final pct = (percentage * 100).round();

    return ModernDashboardCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      borderColor: color.withValues(alpha: 0.12),
      child: Row(
        children: [
          if (leadingIcon != null) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(leadingIcon, color: color, size: 22),
            ),
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : const Color(0xFF1B2C56),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    color: isDark ? Colors.white60 : const Color(0xFF7F8CA4),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 44,
            height: 44,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: percentage,
                  strokeWidth: 4.5,
                  backgroundColor: isDark
                      ? Colors.white12
                      : const Color(0xFFE6E8F2),
                  valueColor: AlwaysStoppedAnimation(color),
                ),
                Text(
                  '$pct',
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Alert warning banner with pulsing animation badge.
class AlertCard extends StatelessWidget {
  final String title;
  final String message;
  final Color color;
  final IconData icon;
  final Widget? action;

  const AlertCard({
    super.key,
    required this.title,
    required this.message,
    this.color = AppColors.error,
    this.icon = Icons.warning_amber_rounded,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ModernDashboardCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderColor: color.withValues(alpha: 0.25),
      backgroundColor: isDark
          ? Color.lerp(const Color(0xFF13182E), color, 0.08)
          : Color.lerp(Colors.white, color, 0.03),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                  )
                  .animate(
                    onPlay: (controller) => controller.repeat(reverse: true),
                  )
                  .scale(end: const Offset(1.5, 1.5), duration: 750.ms)
                  .boxShadow(
                    end: BoxShadow(
                      color: color.withValues(alpha: 0.6),
                      blurRadius: 8,
                    ),
                  ),
              const SizedBox(width: 8),
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                    color: color,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            message,
            style: GoogleFonts.inter(
              fontSize: 13,
              height: 1.4,
              color: isDark ? Colors.white70 : const Color(0xFF1B2C56),
            ),
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
          ),
          if (action != null) ...[const SizedBox(height: 12), action!],
        ],
      ),
    );
  }
}

/// Standardized title for dashboard page sections.
class SectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;

  const SectionHeader({super.key, required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final trailingWidget = trailing;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF1B2C56),
            ),
          ),
          trailingWidget ?? const SizedBox.shrink(),
        ],
      ),
    );
  }
}

/// A responsive Wrap grid that adapts child count to avoid RenderFlex boundary errors.
class DashboardGrid extends StatelessWidget {
  final List<Widget> children;
  final double spacing;
  final double runSpacing;
  final int crossAxisCount;

  const DashboardGrid({
    super.key,
    required this.children,
    this.spacing = AppSpacing.md,
    this.runSpacing = AppSpacing.md,
    this.crossAxisCount = 2,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double width = constraints.maxWidth;
        final int columns = width < 450 ? 1 : crossAxisCount;

        if (columns == 1) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: children
                .map(
                  (child) => Padding(
                    padding: EdgeInsets.only(bottom: runSpacing),
                    child: child,
                  ),
                )
                .toList(),
          );
        }

        final double itemWidth = (width - (spacing * (columns - 1))) / columns;

        return Wrap(
          spacing: spacing,
          runSpacing: runSpacing,
          children: children
              .map((child) => SizedBox(width: itemWidth, child: child))
              .toList(),
        );
      },
    );
  }
}
