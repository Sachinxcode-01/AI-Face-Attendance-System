import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart'
    show AuthDesign;
import 'package:smartface_attendance/features/auth/widgets/introduction_cards.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  late final PageController _pageController;
  int _currentPage = 0;
  final int _totalPages = kIntroCardsData.length;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding([String targetRoute = '/auth/login']) async {
    await sl<SessionManager>().setOnboardingCompleted(true);
    if (mounted) {
      context.go(targetRoute);
    }
  }

  void _nextPage() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _completeOnboarding();
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  void _skipToFinalCard() {
    _pageController.animateToPage(
      _totalPages - 1,
      duration: const Duration(milliseconds: 450),
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final isReducedMotion = mediaQuery.disableAnimations;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: _currentPage == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _currentPage > 0) {
          _prevPage();
        }
      },
      child: Scaffold(
        backgroundColor: isDark ? AppColors.bgDark : AuthDesign.pageBg,
        body: PremiumBackground(
          immersive: true,
          child: SafeArea(
            child: Column(
              children: [
                // Top Bar Navigation with Logo and Skip Button
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20.0,
                    vertical: 10.0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // App Logo & Brand Header
                      Row(
                        children: [
                          Container(
                            height: 36,
                            width: 36,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFF0A1024),
                              border: Border.all(
                                color: AppColors.primaryBright,
                                width: 1.5,
                              ),
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/images/logo.png',
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Icon(
                                      Icons.fingerprint_rounded,
                                      size: 20,
                                      color: AppColors.primaryBright,
                                    ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            'SMARTFACE',
                            style:
                                AppTextStyles.label(
                                  context,
                                  color: Colors.white.withValues(alpha: 0.9),
                                ).copyWith(
                                  letterSpacing: 1.6,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ],
                      ),

                      // Skip Button (Visible on Card 1 & 2)
                      AnimatedOpacity(
                        duration: const Duration(milliseconds: 250),
                        opacity: _currentPage < _totalPages - 1 ? 1.0 : 0.0,
                        child: IgnorePointer(
                          ignoring: _currentPage >= _totalPages - 1,
                          child: Semantics(
                            button: true,
                            label: 'Skip introduction cards',
                            child: TextButton(
                              onPressed: _skipToFinalCard,
                              style: TextButton.styleFrom(
                                minimumSize: const Size(48, 48),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 8,
                                ),
                              ),
                              child: Text(
                                'SKIP',
                                style:
                                    AppTextStyles.label(
                                      context,
                                      color: AppColors.primaryBright,
                                    ).copyWith(
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.2,
                                    ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Middle PageView Carousel containing the 3 Introduction Cards
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemCount: _totalPages,
                    itemBuilder: (context, index) {
                      final cardData = kIntroCardsData[index];
                      final isActive = index == _currentPage;

                      return Center(
                        child: SingleChildScrollView(
                          physics: const ClampingScrollPhysics(),
                          child: IntroductionCardView(
                            data: cardData,
                            isActive: isActive,
                            isReducedMotion: isReducedMotion,
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // Bottom Navigation Control Bar
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Previous Navigation Button
                      SizedBox(
                        width: 85,
                        height: 48,
                        child: AnimatedOpacity(
                          duration: const Duration(milliseconds: 250),
                          opacity: _currentPage > 0 ? 1.0 : 0.0,
                          child: IgnorePointer(
                            ignoring: _currentPage == 0,
                            child: Semantics(
                              button: true,
                              label: 'Previous card',
                              child: TextButton.icon(
                                onPressed: _prevPage,
                                icon: const Icon(
                                  Icons.arrow_back_ios_rounded,
                                  size: 14,
                                  color: Colors.white70,
                                ),
                                label: Text(
                                  'PREV',
                                  style: AppTextStyles.label(
                                    context,
                                    color: Colors.white70,
                                  ).copyWith(fontWeight: FontWeight.bold),
                                ),
                                style: TextButton.styleFrom(
                                  minimumSize: const Size(48, 48),
                                  padding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Animated Page Indicator (Pill + Dots)
                      Semantics(
                        label: 'Page ${_currentPage + 1} of $_totalPages',
                        child: AnimatedPageIndicator(
                          count: _totalPages,
                          currentIndex: _currentPage,
                          onDotTapped: (index) {
                            _pageController.animateToPage(
                              index,
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeInOutCubic,
                            );
                          },
                        ),
                      ),

                      // Next or Get Started Button
                      SizedBox(
                        height: 48,
                        child: Semantics(
                          button: true,
                          label: _currentPage == _totalPages - 1
                              ? 'Get Started and complete introduction'
                              : 'Next introduction card',
                          child: Builder(
                            builder: (context) {
                              final button = ElevatedButton(
                                onPressed: _nextPage,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  elevation: 6,
                                  shadowColor: AppColors.primary.withValues(
                                    alpha: 0.35,
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                ),
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        _currentPage == _totalPages - 1
                                            ? 'GET STARTED'
                                            : 'NEXT',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 1.0,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Icon(
                                        _currentPage == _totalPages - 1
                                            ? Icons.rocket_launch_rounded
                                            : Icons.arrow_forward_ios_rounded,
                                        size: 14,
                                        color: Colors.white,
                                      ),
                                    ],
                                  ),
                                ),
                              );

                              if (isReducedMotion ||
                                  !animationsEnabled(context)) {
                                return button;
                              }

                              return button
                                  .animate(
                                    target: _currentPage == 2 ? 1.0 : 0.0,
                                  )
                                  .shimmer(
                                    duration: 1500.ms,
                                    curve: Curves.easeInOut,
                                  )
                                  .glow(
                                    delay: 800.ms,
                                    duration: 1200.ms,
                                    color: AppColors.primaryBright,
                                    radius: 20.0,
                                  );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
