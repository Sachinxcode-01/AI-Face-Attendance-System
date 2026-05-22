import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../core/constants.dart';

/// Generic shimmer skeleton wrapper
class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double radius;

  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.radius = AppRadius.md,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? const Color(0xFF1E2440) : const Color(0xFFE0E0E0),
      highlightColor: isDark ? const Color(0xFF2E3660) : const Color(0xFFF5F5F5),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

/// Profile page skeleton loader
class ProfileShimmer extends StatelessWidget {
  const ProfileShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        children: [
          const SizedBox(height: 12),
          // Avatar circle
          Center(
            child: ShimmerBox(width: 140, height: 140, radius: 70),
          ),
          const SizedBox(height: 18),
          // Name
          Center(child: ShimmerBox(width: 180, height: 24)),
          const SizedBox(height: 10),
          Center(child: ShimmerBox(width: 130, height: 16)),
          const SizedBox(height: 36),
          // Profile cards
          for (int i = 0; i < 7; i++) ...[
            ShimmerBox(width: w, height: 72),
            const SizedBox(height: 14),
          ],
        ],
      ),
    );
  }
}

/// Dashboard skeleton loader
class DashboardShimmer extends StatelessWidget {
  const DashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              ShimmerBox(width: 48, height: 48, radius: 24),
              const SizedBox(width: 14),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                ShimmerBox(width: 120, height: 16),
                const SizedBox(height: 8),
                ShimmerBox(width: 80, height: 12),
              ]),
            ],
          ),
          const SizedBox(height: 28),
          // Stats row
          Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 2 ? 12 : 0),
                  child: ShimmerBox(width: double.infinity, height: 96),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          // Chart placeholder
          ShimmerBox(width: w, height: 200),
          const SizedBox(height: 24),
          // List items
          for (int i = 0; i < 4; i++) ...[
            ShimmerBox(width: w, height: 68),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

/// Notification list skeleton loader
class NotificationShimmer extends StatelessWidget {
  const NotificationShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      itemCount: 6,
      itemBuilder: (_, i) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Row(
          children: [
            ShimmerBox(width: 48, height: 48, radius: 12),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerBox(width: w * 0.55, height: 14),
                  const SizedBox(height: 8),
                  ShimmerBox(width: w * 0.8, height: 12),
                  const SizedBox(height: 6),
                  ShimmerBox(width: 80, height: 10),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
