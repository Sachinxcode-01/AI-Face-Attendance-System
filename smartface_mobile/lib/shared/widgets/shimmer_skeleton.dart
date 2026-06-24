import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

/// Supported shapes for ShimmerSkeleton
enum SkeletonShape { rectangle, circle }

/// Premium dark-theme optimized skeleton loading placeholder.
///
/// Wraps the [Shimmer] package, utilizing deep slate colors that harmoniously
/// flash against the deep dark background base (#020617) and glassmorphic cards.
class ShimmerSkeleton extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;
  final SkeletonShape shape;

  const ShimmerSkeleton({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = AppRadius.md,
    this.shape = SkeletonShape.rectangle,
  });

  /// Factory constructor for creating a circular skeleton placeholder (e.g. avatars)
  const ShimmerSkeleton.circle({super.key, required double size})
    : width = size,
      height = size,
      borderRadius = 0.0,
      shape = SkeletonShape.circle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Harmonious colors tuned for high-fidelity dark/light styling
    final Color baseColor = isDark
        ? const Color(
            0xFF1F2937,
          ) // Slate 800 (slightly lighter than #111827 card background)
        : const Color(0xFFE5E7EB); // Slate 200

    final Color highlightColor = isDark
        ? const Color(0xFF374151) // Slate 700 (premium glow highlight)
        : const Color(0xFFF3F4F6); // Slate 100

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      period: const Duration(milliseconds: 1400),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors
              .white, // Inner fill required by Shimmer to apply shader masks
          shape: shape == SkeletonShape.circle
              ? BoxShape.circle
              : BoxShape.rectangle,
          borderRadius: shape == SkeletonShape.circle
              ? null
              : BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}
