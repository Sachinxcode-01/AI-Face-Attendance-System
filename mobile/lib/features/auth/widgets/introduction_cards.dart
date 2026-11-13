import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import 'package:rive/rive.dart' hide LinearGradient, RadialGradient;
import 'package:smartface_attendance/design_system/design_system.dart';

/// Data class holding text and illustration details for each introduction card.
class IntroCardData {
  final int index;
  final String category;
  final String title;
  final String highlightedText;
  final String description;
  final String? lottieAsset;
  final String? riveAsset;

  const IntroCardData({
    required this.index,
    required this.category,
    required this.title,
    required this.highlightedText,
    required this.description,
    this.lottieAsset,
    this.riveAsset,
  });
}

/// List of the exactly three introduction cards.
const List<IntroCardData> kIntroCardsData = [
  IntroCardData(
    index: 0,
    category: 'SMART ATTENDANCE',
    title: 'Smart Attendance',
    highlightedText: 'Smart Attendance',
    description:
        'Mark and manage attendance quickly using intelligent QR and face-verification technology.',
    lottieAsset: 'assets/lottie/face_scan.json',
  ),
  IntroCardData(
    index: 1,
    category: 'SECURE VERIFICATION',
    title: 'Secure Verification',
    highlightedText: 'Secure Verification',
    description:
        'Prevent proxy and duplicate attendance with secure, real-time identity verification.',
    lottieAsset: 'assets/lottie/scanning.json',
  ),
  IntroCardData(
    index: 2,
    category: 'INSIGHTS FOR EVERYONE',
    title: 'Insights for Everyone',
    highlightedText: 'Insights for Everyone',
    description:
        'Students, teachers, parents, and admins can access attendance, reports, schedules, and alerts.',
    lottieAsset: 'assets/lottie/success.json',
  ),
];

/// Renders an individual Introduction Card with responsive glassmorphism,
/// staggered animations, and accessibility options.
class IntroductionCardView extends StatelessWidget {
  final IntroCardData data;
  final bool isActive;
  final bool isReducedMotion;

  const IntroductionCardView({
    super.key,
    required this.data,
    required this.isActive,
    required this.isReducedMotion,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;

    return LayoutBuilder(
      builder: (context, constraints) {
        final screenWidth = constraints.maxWidth;
        final isNarrow = screenWidth < 350;

        return Semantics(
          label: '${data.category}. ${data.title}. ${data.description}',
          child: Container(
            margin: EdgeInsets.symmetric(
              horizontal: isNarrow ? 12.0 : 20.0,
              vertical: 8.0,
            ),
            padding: EdgeInsets.symmetric(
              horizontal: isNarrow ? 16.0 : 24.0,
              vertical: isNarrow ? 20.0 : 28.0,
            ),
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.bgModal.withValues(alpha: 0.85)
                  : Colors.white.withValues(alpha: 0.90),
              borderRadius: BorderRadius.circular(28.0),
              border: Border.all(
                color: isDark
                    ? AppColors.primaryBright.withValues(alpha: 0.30)
                    : AppColors.primary.withValues(alpha: 0.20),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: isDark
                      ? AppColors.primary.withValues(alpha: 0.20)
                      : AppColors.orbLight.withValues(alpha: 0.15),
                  blurRadius: 28,
                  spreadRadius: 2,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: AnimationLimiter(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: AnimationConfiguration.toStaggeredList(
                  duration: isReducedMotion
                      ? const Duration(milliseconds: 200)
                      : const Duration(milliseconds: 600),
                  childAnimationBuilder: (widget) => isReducedMotion
                      ? FadeInAnimation(child: widget)
                      : SlideAnimation(
                          verticalOffset: 20.0,
                          child: FadeInAnimation(child: widget),
                        ),
                  children: [
                    // Top Illustration Container
                    SizedBox(
                      height: constraints.maxHeight > 550 ? 170 : 130,
                      child: Center(child: _buildIllustration(context)),
                    ),
                    const SizedBox(height: 16),

                    // Category Label
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primaryBright.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppColors.primaryBright.withValues(alpha: 0.35),
                        ),
                      ),
                      child: Text(
                        data.category,
                        style: GoogleFonts.inter(
                          fontSize: isNarrow ? 10 : 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.4,
                          color: isDark
                              ? AppColors.primaryLight
                              : AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Title with Highlighted/Gradient Text
                    _buildTitleText(context, isDark, isNarrow),
                    const SizedBox(height: 10),

                    // Short Description (Max 3 lines)
                    _buildDescriptionText(context, isDark, isNarrow),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildIllustration(BuildContext context) {
    Widget illustrationFallback;

    switch (data.index) {
      case 0:
        illustrationFallback = SmartAttendanceIllustration(
          isActive: isActive,
          isReducedMotion: isReducedMotion,
        );
        break;
      case 1:
        illustrationFallback = SecureVerificationIllustration(
          isActive: isActive,
          isReducedMotion: isReducedMotion,
        );
        break;
      case 2:
      default:
        illustrationFallback = InsightsIllustration(
          isActive: isActive,
          isReducedMotion: isReducedMotion,
        );
        break;
    }

    // Try loading Lottie/Rive asset with fallback
    if (data.lottieAsset != null) {
      return Lottie.asset(
        data.lottieAsset!,
        errorBuilder: (context, error, stackTrace) => illustrationFallback,
      );
    } else if (data.riveAsset != null) {
      return RiveAnimation.asset(
        data.riveAsset!,
        onInit: (_) {},
        placeHolder: illustrationFallback,
      );
    }

    return illustrationFallback;
  }

  Widget _buildTitleText(BuildContext context, bool isDark, bool isNarrow) {
    final titleStyle = GoogleFonts.inter(
      fontSize: isNarrow ? 22 : 26,
      fontWeight: FontWeight.bold,
      color: isDark ? Colors.white : AppColors.textHeading,
      height: 1.2,
    );

    final reduced =
        isReducedMotion || AppStaggeredAnimations.isReducedMotion(context);

    if (!isActive || reduced) {
      return ShaderMask(
        shaderCallback: (bounds) => const LinearGradient(
          colors: [Colors.white, AppColors.accentLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ).createShader(bounds),
        child: Text(
          data.title,
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: titleStyle,
        ),
      );
    }

    // Card 1 Typing / Title reveal effect
    if (data.index == 0) {
      return AnimatedTextKit(
        animatedTexts: [
          TypewriterAnimatedText(
            data.title,
            textAlign: TextAlign.center,
            textStyle: titleStyle.copyWith(color: AppColors.accentLight),
            speed: const Duration(milliseconds: 70),
          ),
        ],
        totalRepeatCount: 1,
        displayFullTextOnTap: true,
      );
    }

    // Card 2 & Card 3 Fade-in reveal
    return ShaderMask(
          shaderCallback: (bounds) => LinearGradient(
            colors: isDark
                ? [Colors.white, AppColors.accentLight]
                : [AppColors.primaryDark, AppColors.accentDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ).createShader(bounds),
          child: Text(
            data.title,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: titleStyle,
          ),
        )
        .animate()
        .fadeIn(duration: 400.ms)
        .scale(begin: const Offset(0.95, 0.95), end: const Offset(1.0, 1.0));
  }

  Widget _buildDescriptionText(
    BuildContext context,
    bool isDark,
    bool isNarrow,
  ) {
    final descStyle = GoogleFonts.inter(
      fontSize: isNarrow ? 13 : 14,
      fontWeight: FontWeight.w500,
      color: isDark ? Colors.white.withValues(alpha: 0.82) : AppColors.textBody,
      height: 1.45,
    );

    final reduced =
        isReducedMotion || AppStaggeredAnimations.isReducedMotion(context);

    // Card 3 Word-by-word animation requirement
    if (data.index == 2 && isActive && !reduced) {
      return AnimatedTextKit(
        animatedTexts: [
          FadeAnimatedText(
            data.description,
            textAlign: TextAlign.center,
            textStyle: descStyle,
            duration: const Duration(milliseconds: 2500),
          ),
        ],
        totalRepeatCount: 1,
        displayFullTextOnTap: true,
      );
    }

    // Standard Slide-up for Card 1 & 2
    final textWidget = Text(
      data.description,
      textAlign: TextAlign.center,
      maxLines: 3,
      overflow: TextOverflow.ellipsis,
      style: descStyle,
    );

    if (isReducedMotion) {
      return textWidget;
    }

    return textWidget
        .animate()
        .fadeIn(duration: 500.ms, delay: 150.ms)
        .slideY(begin: 0.15, end: 0.0, curve: Curves.easeOutCubic);
  }
}

// ============================================================================
// ILLUSTRATION 1: Smart Attendance Illustration
// ============================================================================
class SmartAttendanceIllustration extends StatefulWidget {
  final bool isActive;
  final bool isReducedMotion;

  const SmartAttendanceIllustration({
    super.key,
    required this.isActive,
    required this.isReducedMotion,
  });

  @override
  State<SmartAttendanceIllustration> createState() =>
      _SmartAttendanceIllustrationState();
}

class _SmartAttendanceIllustrationState
    extends State<SmartAttendanceIllustration>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );
    if (widget.isActive && !widget.isReducedMotion) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(SmartAttendanceIllustration oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !widget.isReducedMotion) {
      if (!_controller.isAnimating) _controller.repeat(reverse: true);
    } else {
      if (_controller.isAnimating) _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduced =
        widget.isReducedMotion ||
        AppStaggeredAnimations.isReducedMotion(context);

    final centralWidget = Container(
      width: 110,
      height: 110,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.bgDeep,
        border: Border.all(
          color: AppColors.accentLight.withValues(alpha: 0.6),
          width: 2.0,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withValues(alpha: 0.3),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Student / Classroom Central Icon
          const Icon(
            Icons.school_rounded,
            size: 52,
            color: AppColors.accentLight,
          ),

          // Small floating badges (QR & Face)
          Positioned(
            top: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.qr_code_2_rounded,
                size: 14,
                color: Colors.white,
              ),
            ),
          ),
          Positioned(
            bottom: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: AppColors.accent,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.face_retouching_natural_rounded,
                size: 14,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );

    return Stack(
      alignment: Alignment.center,
      children: [
        // Floating particles / Background subtle motion
        if (widget.isActive && !reduced)
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Transform.rotate(
                angle: _controller.value * 0.1,
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppColors.accent.withValues(alpha: 0.25),
                        AppColors.primary.withValues(alpha: 0.05),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              );
            },
          ),

        if (reduced)
          centralWidget
        else
          centralWidget
              .animate(target: widget.isActive ? 1.0 : 0.0)
              .scale(duration: 600.ms, curve: Curves.easeOutBack)
              .fadeIn(duration: 400.ms),
      ],
    );
  }
}

// ============================================================================
// ILLUSTRATION 2: Secure Verification Illustration
// ============================================================================
class SecureVerificationIllustration extends StatefulWidget {
  final bool isActive;
  final bool isReducedMotion;

  const SecureVerificationIllustration({
    super.key,
    required this.isActive,
    required this.isReducedMotion,
  });

  @override
  State<SecureVerificationIllustration> createState() =>
      _SecureVerificationIllustrationState();
}

class _SecureVerificationIllustrationState
    extends State<SecureVerificationIllustration>
    with SingleTickerProviderStateMixin {
  late AnimationController _scanController;

  @override
  void initState() {
    super.initState();
    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    if (widget.isActive && !widget.isReducedMotion) {
      _scanController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(SecureVerificationIllustration oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !widget.isReducedMotion) {
      if (!_scanController.isAnimating) _scanController.repeat(reverse: true);
    } else {
      if (_scanController.isAnimating) _scanController.stop();
    }
  }

  @override
  void dispose() {
    _scanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduced =
        widget.isReducedMotion ||
        AppStaggeredAnimations.isReducedMotion(context);

    final shieldWidget = Container(
      width: 105,
      height: 105,
      decoration: BoxDecoration(
        color: AppColors.bgModal,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.accentLight, width: 2.0),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.security_rounded,
                size: 42,
                color: AppColors.accentLight,
              ),
              SizedBox(height: 2),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.qr_code_scanner, size: 14, color: Colors.white70),
                  SizedBox(width: 4),
                  Icon(
                    Icons.lock_outline_rounded,
                    size: 14,
                    color: AppColors.goldLight,
                  ),
                ],
              ),
            ],
          ),

          // Face-scan line animation moving vertically
          if (widget.isActive && !reduced)
            AnimatedBuilder(
              animation: _scanController,
              builder: (context, child) {
                return Positioned(
                  top: 15 + (_scanController.value * 65),
                  left: 12,
                  right: 12,
                  child: Container(
                    height: 2.5,
                    decoration: BoxDecoration(
                      color: AppColors.accentLight,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.accentLight.withValues(alpha: 0.8),
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

          // Security Verification Badge
          Positioned(
            bottom: 6,
            right: 6,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.verified_rounded,
                size: 16,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );

    return Stack(
      alignment: Alignment.center,
      children: [
        // Security glow background
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.accent.withValues(alpha: 0.1),
            boxShadow: [
              BoxShadow(
                color: AppColors.accent.withValues(alpha: 0.25),
                blurRadius: 24,
                spreadRadius: 4,
              ),
            ],
          ),
        ),

        if (reduced)
          shieldWidget
        else
          shieldWidget
              .animate(target: widget.isActive ? 1.0 : 0.0)
              .scale(duration: 550.ms, curve: Curves.easeOutBack),
      ],
    );
  }
}

// ============================================================================
// ILLUSTRATION 3: Insights for Everyone Illustration
// ============================================================================
class InsightsIllustration extends StatelessWidget {
  final bool isActive;
  final bool isReducedMotion;

  const InsightsIllustration({
    super.key,
    required this.isActive,
    required this.isReducedMotion,
  });

  @override
  Widget build(BuildContext context) {
    final roleIcons = [
      {
        'icon': Icons.person_rounded,
        'label': 'Student',
        'color': AppColors.accentLight,
      },
      {
        'icon': Icons.school_rounded,
        'label': 'Teacher',
        'color': AppColors.goldLight,
      },
      {
        'icon': Icons.family_restroom_rounded,
        'label': 'Parent',
        'color': AppColors.accentLight,
      },
      {
        'icon': Icons.admin_panel_settings_rounded,
        'label': 'Admin',
        'color': AppColors.primarySoft,
      },
    ];

    return Container(
      width: 220,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.bgModal,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.primaryLight.withValues(alpha: 0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.2),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Staggered Role Icons Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(roleIcons.length, (index) {
              final item = roleIcons[index];
              final iconWidget = Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: (item['color'] as Color).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  item['icon'] as IconData,
                  size: 18,
                  color: item['color'] as Color,
                ),
              );

              if (isReducedMotion || !isActive) return iconWidget;

              return iconWidget
                  .animate()
                  .scale(
                    delay: (100 * index).ms,
                    duration: 350.ms,
                    curve: Curves.easeOutBack,
                  )
                  .fadeIn(delay: (100 * index).ms);
            }),
          ),
          const SizedBox(height: 10),

          // Rising Analytics Chart Icon / Visual
          Container(
            height: 38,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Icon(
                  Icons.analytics_rounded,
                  size: 20,
                  color: AppColors.accentLight,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      _buildBar(
                        0.4,
                        AppColors.accent,
                        isActive,
                        isReducedMotion,
                        0,
                      ),
                      _buildBar(
                        0.7,
                        AppColors.goldLight,
                        isActive,
                        isReducedMotion,
                        1,
                      ),
                      _buildBar(
                        0.55,
                        AppColors.primarySoft,
                        isActive,
                        isReducedMotion,
                        2,
                      ),
                      _buildBar(
                        0.9,
                        AppColors.successLight,
                        isActive,
                        isReducedMotion,
                        3,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBar(
    double heightFactor,
    Color color,
    bool isActive,
    bool isReducedMotion,
    int index,
  ) {
    final barWidget = Container(
      width: 10,
      height: 28 * heightFactor,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
    );

    if (isReducedMotion || !isActive) return barWidget;

    return barWidget.animate().scaleY(
      begin: 0.0,
      end: 1.0,
      alignment: Alignment.bottomCenter,
      delay: (200 + index * 100).ms,
      duration: 450.ms,
      curve: Curves.easeOutCubic,
    );
  }
}

// ============================================================================
// Animated Page Indicator (Pill + Dots)
// ============================================================================
class AnimatedPageIndicator extends StatelessWidget {
  final int count;
  final int currentIndex;
  final ValueChanged<int>? onDotTapped;

  const AnimatedPageIndicator({
    super.key,
    required this.count,
    required this.currentIndex,
    this.onDotTapped,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(count, (index) {
        final isSelected = currentIndex == index;
        return GestureDetector(
          onTap: () => onDotTapped?.call(index),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOutCubic,
            margin: const EdgeInsets.symmetric(horizontal: 4.0),
            height: 8.0,
            width: isSelected ? 28.0 : 8.0,
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primaryBright
                  : Colors.white.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(4.0),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: AppColors.primaryBright.withValues(alpha: 0.5),
                        blurRadius: 8,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
          ),
        );
      }),
    );
  }
}
