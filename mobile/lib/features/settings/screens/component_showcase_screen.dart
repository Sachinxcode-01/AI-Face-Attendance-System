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

/// Component showcase screen to preview and test shared widgets,
/// micro-interactions, haptic feedback, and toast variants.
class ComponentShowcaseScreen extends StatefulWidget {
  const ComponentShowcaseScreen({super.key});

  @override
  State<ComponentShowcaseScreen> createState() => _ComponentShowcaseScreenState();
}

class _ComponentShowcaseScreenState extends State<ComponentShowcaseScreen> {
  bool _isLoading = false;
  int _bouncyCounter = 0;

  void _triggerSimulatedAction() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 1400));
    if (mounted) {
      setState(() => _isLoading = false);
      context.showSuccessToast(
        'Neural weights synchronized with InsightFace core.',
        title: 'Sync Complete',
        actionLabel: 'VIEW',
        onAction: () {},
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: PremiumAppBar(
        title: 'SmartFace Component Showcase',
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            ),
            tooltip: 'Toggle Theme',
            onPressed: () => themeCtrl.toggle(),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.lg,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // SECTION 1: Semantic Feedback Toasts (NEW)
              _buildSectionHeader('Interactive Semantic Feedback Toasts'),
              Text(
                'Frosted glassmorphism, spring physics, tactile haptics & swipe-to-dismiss gesture.',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: isDark ? Colors.white60 : Colors.black54,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  ElevatedButton.icon(
                    onPressed: () {
                      context.showSuccessToast(
                        'Attendance verified with 99.4% ArcFace confidence.',
                        title: 'Attendance Marked',
                      );
                    },
                    icon: const Icon(Icons.check_circle_outline, size: 16),
                    label: const Text('Success Toast'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.18),
                      foregroundColor: const Color(0xFF34D399),
                      elevation: 0,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      context.showErrorToast(
                        'Unregistered face detected hovering in frame.',
                        title: 'Security Alert',
                        actionLabel: 'INSPECT',
                        onAction: () {},
                      );
                    },
                    icon: const Icon(Icons.error_outline, size: 16),
                    label: const Text('Error Toast'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEF4444).withValues(alpha: 0.18),
                      foregroundColor: const Color(0xFFF87171),
                      elevation: 0,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      context.showWarningToast(
                        'Class attendance session expires in 30 seconds.',
                        title: 'Token Expiring',
                      );
                    },
                    icon: const Icon(Icons.warning_amber_outlined, size: 16),
                    label: const Text('Warning Toast'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF59E0B).withValues(alpha: 0.18),
                      foregroundColor: const Color(0xFFFBBF24),
                      elevation: 0,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      context.showInfoToast(
                        'WebSocket connected to ws://localhost:8000/ws/live-logs',
                        title: 'Telemetry Connected',
                      );
                    },
                    icon: const Icon(Icons.info_outline, size: 16),
                    label: const Text('Info Toast'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6).withValues(alpha: 0.18),
                      foregroundColor: const Color(0xFF60A5FA),
                      elevation: 0,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // SECTION 2: Micro-Interactions & Motion Primitives (NEW)
              _buildSectionHeader('Micro-Interactions: PulseGlow & BouncyScale'),
              GlassContainer(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        const PulseGlow(
                          glowColor: AppColors.success,
                          maxBlur: 18,
                          maxSpread: 5,
                          child: CircleAvatar(
                            radius: 24,
                            backgroundColor: Color(0xFF10B981),
                            child: Icon(Icons.videocam_rounded, color: Colors.white, size: 22),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Active Sensor',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      children: [
                        const PulseGlow(
                          glowColor: AppColors.gold,
                          maxBlur: 16,
                          maxSpread: 4,
                          child: CircleAvatar(
                            radius: 24,
                            backgroundColor: AppColors.gold,
                            child: Icon(Icons.qr_code_2_rounded, color: Colors.black, size: 22),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Rolling QR',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () {
                        AppHaptics.medium();
                        setState(() => _bouncyCounter++);
                      },
                      child: Column(
                        children: [
                          BouncyScale(
                            key: ValueKey(_bouncyCounter),
                            child: const CircleAvatar(
                              radius: 24,
                              backgroundColor: AppColors.primary,
                              child: Icon(Icons.touch_app_rounded, color: Colors.white, size: 22),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Tap Bounce',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white70 : Colors.black87,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // SECTION 3: Tactile Glow & Glass Buttons (ENHANCED)
              _buildSectionHeader('Tactile Buttons (Spring Physics & Loading Crossfade)'),
              Row(
                children: [
                  Expanded(
                    child: PremiumButton(
                      isLoading: _isLoading,
                      onPressed: _triggerSimulatedAction,
                      leadingIcon: const Icon(Icons.bolt, size: 20),
                      child: const Text('INITIALIZE FACE SCANNER'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: PremiumButton.glass(
                      onPressed: () {
                        context.showInfoToast('Secondary glass button pressed');
                      },
                      leadingIcon: const Icon(Icons.tune_rounded, size: 18, color: Colors.white),
                      child: const Text('CONFIGURE SENSORS'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: PremiumButton(
                      onPressed: null, // Disabled State
                      child: Text('DISABLED BUTTON'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // SECTION 4: Status Badges & Info
              _buildSectionHeader('Status Badges & Chips'),
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

              // SECTION 5: Glass Container & AI Engine Presentation
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
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.87)
                                : Colors.black87,
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
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.60)
                            : Colors.black54,
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
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.60)
                                : Colors.black54,
                          ),
                        ),
                        Text(
                          'FPS: 60.0',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.60)
                                : Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // SECTION 6: Animated Attendance Rings
              _buildSectionHeader('Tween-Animated Attendance Rings'),
              GlassContainer(
                child: Column(
                  children: [
                    Text(
                      'Color-Banded Performance Overviews',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.87)
                            : Colors.black87,
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

              // SECTION 7: Shimmer Skeleton
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
                          ShimmerSkeleton(
                            width: 150,
                            height: 16,
                            borderRadius: 4,
                          ),
                          SizedBox(height: 8),
                          ShimmerSkeleton(
                            width: double.infinity,
                            height: 12,
                            borderRadius: 4,
                          ),
                          SizedBox(height: 6),
                          ShimmerSkeleton(
                            width: 100,
                            height: 12,
                            borderRadius: 4,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    final isDark = context.read<ThemeController>().isDark;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
          color: isDark ? AppColors.gold : AppColors.primary,
        ),
      ),
    );
  }
}
