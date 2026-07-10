import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'app_colors.dart';

/// ============================================================================
/// LoadingShimmer — a reusable shimmer block that adapts to the current theme.
/// Use to assemble custom skeleton loaders.
/// ============================================================================
class LoadingShimmer extends StatelessWidget {
  final double width;
  final double height;
  final double radius;
  final BoxShape shape;

  const LoadingShimmer({
    super.key,
    required this.width,
    required this.height,
    this.radius = 12,
    this.shape = BoxShape.rectangle,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? AppColors.surfaceDark : const Color(0xFFE2E8F0);
    final highlight = isDark ? AppColors.cardDark : const Color(0xFFF1F5F9);

    return Shimmer.fromColors(
      baseColor: base,
      highlightColor: highlight,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: shape,
          borderRadius: shape == BoxShape.circle 
              ? null 
              : BorderRadius.circular(radius),
        ),
      ),
    );
  }
}
