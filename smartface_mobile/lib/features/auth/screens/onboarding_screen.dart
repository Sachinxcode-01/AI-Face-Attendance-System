import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/app/config/cache_service.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  Future<void> _navigateTo(String route) async {
    // Save completion flags in local storage to prevent showing onboarding/intro again
    await CacheService.set('sf_onboarding_completed', true, persist: true);
    await CacheService.set('sf_intro_completed', true, persist: true);
    if (mounted) {
      context.go(route);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: AuthDesign.themeData,
      child: Scaffold(
        body: HeroOrbBackground(
          isCompact: false,
          child: SafeArea(
            child: Column(
              children: [
                const Spacer(flex: 3),
                // Heading Text
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Text(
                    'Welcome to\nSmart Attendance',
                    textAlign: TextAlign.center,
                    style: AuthDesign.fontPoppins(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Subtitle Text
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32.0),
                  child: Text(
                    'AI-powered attendance, marked in seconds',
                    textAlign: TextAlign.center,
                    style: AuthDesign.fontPoppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                      color: Colors.white,
                      opacity: 0.85,
                    ),
                  ),
                ),
                const Spacer(flex: 4),
                // Bottom Split Button Bar
                Container(
                  height: 56,
                  width: double.infinity,
                  color: Colors.transparent,
                  child: Row(
                    children: [
                      // Left Half: Sign In (Transparent)
                      Expanded(
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () => _navigateTo('/auth/login'),
                            child: Center(
                              child: Text(
                                'Sign in',
                                style: AuthDesign.fontPoppins(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      // Right Half: Sign Up (White BG, Rounded Top-Left)
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _navigateTo('/auth/register'),
                          child: Container(
                            height: 56,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(26),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                'Sign up',
                                style: AuthDesign.fontPoppins(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AuthDesign.primaryIndigo,
                                ),
                              ),
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
        ),
      ),
    );
  }
}
