import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';

class IntroScreen extends StatefulWidget {
  const IntroScreen({super.key});

  @override
  State<IntroScreen> createState() => _IntroScreenState();
}

class _IntroScreenState extends State<IntroScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final int _totalPages = 3;

  final List<IntroPageData> _introPages = [
    IntroPageData(
      title: 'AI Face Recognition',
      subtitle: 'Our advanced neural network registers your facial profile parameters locally and matches it securely with the institution database in milliseconds.',
      icon: Icons.face_unlock_outlined,
      iconColor: AppColors.gold,
    ),
    IntroPageData(
      title: 'Dynamic QR Attendance',
      subtitle: 'Anti-spoofing dynamic rotating QR codes prevent location sharing and attendance proxy check-ins. Keep your app scanner active near the terminal.',
      icon: Icons.qr_code_2_outlined,
      iconColor: const Color(0xFF3559E0),
    ),
    IntroPageData(
      title: 'Reports & Analytics',
      subtitle: 'Gain detailed insights into your attendance trends. Generate and export official reports directly to PDF, CSV, or Excel formats anytime.',
      icon: Icons.bar_chart_outlined,
      iconColor: AppColors.success,
    ),
  ];

  Future<void> _completeIntro() async {
    await sl<SessionManager>().setIntroCompleted(true);
  }

  void _nextPage() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _completeIntro();
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
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
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          const AuthBlobBackground(),
          SafeArea(
            child: Column(
              children: [
                // Header with Skip Button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.md),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'GETTING STARTED',
                        style: GoogleFonts.outfit(
                          color: Colors.white60,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2.0,
                        ),
                      ),
                      TextButton(
                        onPressed: _completeIntro,
                        child: Text(
                          'SKIP',
                          style: GoogleFonts.inter(
                            color: Colors.white70,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Cards inside PageView
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
                      final page = _introPages[index];
                      return _buildIntroPage(page);
                    },
                  ),
                ),

                // Bottom Indicators and Navigation buttons
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Back Button
                      Opacity(
                        opacity: _currentPage > 0 ? 1.0 : 0.0,
                        child: TextButton(
                          onPressed: _currentPage > 0 ? _prevPage : null,
                          child: Text(
                            'BACK',
                            style: GoogleFonts.inter(
                              color: Colors.white70,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                      ),

                      // Page Indicators (Dots)
                      Row(
                        children: List.generate(_totalPages, (index) {
                          final isSelected = _currentPage == index;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 260),
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            height: 6,
                            width: isSelected ? 24 : 6,
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.gold : Colors.white38,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          );
                        }),
                      ),

                      // Next or Get Started Button
                      SizedBox(
                        height: 48,
                        width: _currentPage == _totalPages - 1 ? 140 : 110,
                        child: GlowButton(
                          onPressed: _nextPage,
                          color: const Color(0xFF3559E0),
                          glowColor: const Color(0x663559E0),
                          borderRadius: 12,
                          padding: EdgeInsets.zero,
                          child: Text(
                            _currentPage == _totalPages - 1 ? 'GET STARTED' : 'NEXT',
                            style: GoogleFonts.inter(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
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

  Widget _buildIntroPage(IntroPageData page) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Center(
        child: GlassCard(
          borderRadius: 28,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.xxl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon display with Tech outer ring
              Container(
                height: 110,
                width: 110,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: page.iconColor.withValues(alpha: 0.1),
                  border: Border.all(
                    color: page.iconColor.withValues(alpha: 0.25),
                    width: 1.5,
                  ),
                ),
                child: Icon(
                  page.icon,
                  size: 48,
                  color: page.iconColor,
                ),
              ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),

              const SizedBox(height: 32),

              // Title
              Text(
                page.title,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),

              const SizedBox(height: 16),

              // Subtitle description
              Text(
                page.subtitle,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  color: Colors.white70,
                  fontSize: 14,
                  height: 1.5,
                ),
              ).animate().fadeIn(delay: 350.ms),
            ],
          ),
        ),
      ),
    );
  }
}

class IntroPageData {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;

  IntroPageData({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
  });
}
