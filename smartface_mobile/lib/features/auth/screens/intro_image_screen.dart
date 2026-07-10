import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';

/// Full-screen responsive introduction image pager screen.
class IntroImageScreen extends StatefulWidget {
  const IntroImageScreen({super.key});

  @override
  State<IntroImageScreen> createState() => _IntroImageScreenState();
}

class _IntroImageScreenState extends State<IntroImageScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final int _totalPages = 3;

  final List<String> _images = [
    'assets/background/Intro_1.jpeg',
    'assets/background/Intro_2.jpeg',
    'assets/background/Intro_3.jpeg',
  ];

  Future<void> _completeIntro() async {
    final session = sl<SessionManager>();
    await session.setIntroImagesCompleted(true);
    if (mounted) {
      context.go('/auth/login');
    }
  }

  void _nextPage() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _completeIntro();
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDark,
      body: AnimatedPageWrapper(
        child: Stack(
          children: [
            // ── 1. RESPONSIVE IMAGE BACKGROUND (PAGEVIEW) ──
            Positioned.fill(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _totalPages,
                itemBuilder: (context, index) {
                  return Image.asset(
                    _images[index],
                    fit: BoxFit.cover,
                    width: double.infinity,
                    height: double.infinity,
                  );
                },
              ),
            ),

            // ── 2. BOTTOM SOFT GRADIENT OVERLAY ──
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      AppColors.bgDark.withValues(alpha: 0.15),
                      AppColors.bgDark.withValues(alpha: 0.65),
                      AppColors.bgDark.withValues(alpha: 0.92),
                      AppColors.bgDark,
                    ],
                    stops: const [0.0, 0.35, 0.65, 0.85, 1.0],
                  ),
                ),
              ),
            ),

            // ── 3. SAFE AREA HUD OVERLAY ──
            SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Top Header (Skip Button)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: _completeIntro,
                          child: Text(
                            'SKIP',
                            style: AppTextStyles.label(
                              context,
                              color: Colors.white.withValues(alpha: 0.85),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),

                  // Bottom Content Area
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        // Page Indicators (Dots)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(_totalPages, (index) {
                            final isSelected = _currentPage == index;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 260),
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              height: 6,
                              width: isSelected ? 24 : 6,
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.white : Colors.white38,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: 32),

                        // Navigation Buttons
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Back Button (hidden on first page with transition opacity)
                            AnimatedOpacity(
                              duration: const Duration(milliseconds: 200),
                              opacity: _currentPage > 0 ? 1.0 : 0.0,
                              child: TextButton(
                                onPressed: _currentPage > 0 ? _prevPage : null,
                                child: Text(
                                  'BACK',
                                  style: AppTextStyles.label(
                                    context,
                                    color: Colors.white.withValues(alpha: 0.7),
                                  ),
                                ),
                              ),
                            ),

                            // Next or Let's Get Started Button
                            SizedBox(
                              height: 48,
                              width: _currentPage == _totalPages - 1 ? 190 : 110,
                              child: PrimaryButton(
                                onPressed: _nextPage,
                                text: _currentPage == _totalPages - 1
                                    ? "LET'S START"
                                    : 'NEXT',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
