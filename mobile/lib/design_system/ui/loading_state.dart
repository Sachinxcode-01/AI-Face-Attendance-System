import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import 'app_colors.dart';
import 'app_theme.dart';

/// ============================================================================
/// LoadingState — shimmer placeholder cards used while data loads.
/// Theme aware so the shimmer reads well in both light and dark mode.
/// ============================================================================
class LoadingState extends StatelessWidget {
  final int itemCount;
  final EdgeInsetsGeometry padding;
  const LoadingState({
    super.key,
    this.itemCount = 4,
    this.padding = const EdgeInsets.symmetric(horizontal: 18),
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? AppColors.surfaceDark : const Color(0xFFE4E8F5);
    final highlight = isDark ? AppColors.cardDark : Colors.white;

    return Shimmer.fromColors(
      baseColor: base,
      highlightColor: highlight,
      child: ListView.separated(
        padding: padding,
        physics: const NeverScrollableScrollPhysics(),
        shrinkWrap: true,
        itemCount: itemCount,
        separatorBuilder: (context, index) => const SizedBox(height: 14),
        itemBuilder: (context, index) => Container(
          height: 78,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          ),
        ),
      ),
    );
  }
}

/// A simple centered branded spinner.
class LoadingSpinner extends StatelessWidget {
  final String? message;
  const LoadingSpinner({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 34,
            height: 34,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: AppColors.primary,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 14),
            Text(
              message!,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.muted(brightness),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
