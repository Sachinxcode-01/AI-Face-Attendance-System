import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/shared/widgets/glass_container.dart';
import 'package:smartface_attendance/shared/widgets/attendance_ring.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_skeleton.dart';
import 'package:smartface_attendance/shared/widgets/status_badge.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// Temporary showcase screen to verify all newly built shared widgets.
///
/// Overlays the component deck on top of [AnimatedMeshBackground] to demonstrate
/// frosted backdrop filtering in motion. Provides a toggle button to check light theme compatibility.
class ComponentShowcaseScreen extends StatelessWidget {
  const ComponentShowcaseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;

    return Scaffold(
        backgroundColor: Colors.transparent, // Required to let AnimatedMeshBackground shine through
        appBar: PremiumAppBar(
          title: Text(
            'SmartFace Component Showcase',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          actions: [
            IconButton(
              icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
              tooltip: 'Toggle Theme',
              onPressed: () => themeCtrl.toggle(),
            ),
          ],
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // SECTION 1: Status Badges & Theme Mode Info
                _buildSectionHeader('Status Badges & Info'),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    const StatusBadge(label: 'Live Feed', color: Color(0xFF10B981)),
                    const StatusBadge(label: 'Late Check-in', color: Color(0xFFF59E0B)),
                    const StatusBadge(label: 'Absent', color: Color(0xFFEF4444)),
                    StatusBadge(
                      label: 'System Active',
                      color: Theme.of(context).colorScheme.primary,
                      animateDot: true,
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // SECTION 2: Glass Container & Card Presentation
                _buildSectionHeader('Glass Containers (sigmaX/Y = 22)'),
                GlassContainer(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'AI Face Detection Engine',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white.withValues(alpha: 0.87) : Colors.black87,
                            ),
                          ),
                          const StatusBadge(label: 'Online', animateDot: true),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Model: ArcFace-v2 • Status: Listening on Node API port 8000. Undergoing neural recognition overlays.',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: isDark ? Colors.white.withValues(alpha: 0.60) : Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'GPU Load: 42%',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white.withValues(alpha: 0.60) : Colors.black54,
                            ),
                          ),
                          Text(
                            'FPS: 60.0',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white.withValues(alpha: 0.60) : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // SECTION 3: Animated Attendance Rings
                _buildSectionHeader('Tween-Animated Attendance Rings'),
                GlassContainer(
                  child: Column(
                    children: [
                      Text(
                        'Color-Banded Performance Overviews',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white.withValues(alpha: 0.87) : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          AttendanceRing(
                            percentage: 0.88,
                            size: 90,
                            strokeWidth: 8,
                            subtitle: 'HODs (>75%)',
                          ),
                          AttendanceRing(
                            percentage: 0.62,
                            size: 90,
                            strokeWidth: 8,
                            subtitle: 'Teachers (50-75%)',
                          ),
                          AttendanceRing(
                            percentage: 0.35,
                            size: 90,
                            strokeWidth: 8,
                            subtitle: 'Students (<50%)',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // SECTION 4: Interactive Glow Buttons
                _buildSectionHeader('Glow Buttons (Tactile Scaling CTA)'),
                Row(
                  children: [
                    Expanded(
                      child: PremiumButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('CTA Button Triggered')),
                          );
                        },
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.bolt, size: 20),
                            SizedBox(width: 8),
                            Text('INITIALIZE FACE SCANNER'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Row(
                  children: [
                    Expanded(
                      child: PremiumButton(
                        onPressed: null, // Disabled State
                        child: const Text('DISABLED ACTION BUTTON'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // SECTION 5: Dark-Optimized Shimmer Skeleton Loading
                _buildSectionHeader('Dark-Optimized Shimmer Loader'),
                const GlassContainer(
                  child: Row(
                    children: [
                      ShimmerSkeleton.circle(size: 50),
                      SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ShimmerSkeleton(width: 150, height: 16, borderRadius: 4),
                            SizedBox(height: 8),
                            ShimmerSkeleton(width: double.infinity, height: 12, borderRadius: 4),
                            SizedBox(height: 6),
                            ShimmerSkeleton(width: 100, height: 12, borderRadius: 4),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2,
          color: const Color(0xFF3B82F6),
        ),
      ),
    );
  }
}
