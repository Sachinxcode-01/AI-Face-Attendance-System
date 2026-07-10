import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  Future<void> _navigateTo(String route) async {
    await sl<SessionManager>().setOnboardingCompleted(true);
    if (mounted) {
      context.go(route);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PremiumBackground(
        immersive: true,
        child: AnimatedPageWrapper(
          child: SafeArea(
            child: Column(
              children: [
                const Spacer(flex: 3),
                // Premium Centered Logo
                Center(
                  child: Hero(
                    tag: 'logo',
                    child: Container(
                      height: 120,
                      width: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF0A1024),
                        border: Border.all(
                          color: AppColors.primary,
                          width: 2.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.30),
                            blurRadius: 24,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Transform.scale(
                          scale: 1.2,
                          child: Image.asset(
                            'assets/images/logo.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 35),
                // Heading Text
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Text(
                    'Welcome to\nSmart Attendance',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.display(context, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 12),
                // Subtitle Text
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32.0),
                  child: Text(
                    'AI-powered attendance, marked in seconds',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.subheading(context, color: Colors.white.withValues(alpha: 0.8)),
                  ),
                ),
                const Spacer(flex: 4),
                // Bottom Split Button Bar
                Container(
                  height: 64,
                  width: double.infinity,
                  color: Colors.transparent,
                  child: Row(
                    children: [
                      // Left Half: Sign In (Transparent/Glass style)
                      Expanded(
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () => _navigateTo('/auth/login'),
                            borderRadius: const BorderRadius.only(
                              topRight: Radius.circular(26),
                            ),
                            child: Center(
                              child: Text(
                                'Sign in',
                                style: AppTextStyles.button(context, color: Colors.white),
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
                            height: 64,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(26),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 10,
                                  offset: Offset(-2, -2),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                'Sign up',
                                style: AppTextStyles.button(context, color: AppColors.primary),
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
