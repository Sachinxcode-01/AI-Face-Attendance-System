import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/session_manager.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        final session = context.read<SessionManager>();
        if (session.isLoggedIn) {
          Navigator.pushReplacementNamed(context, '/dashboard');
        } else {
          Navigator.pushReplacementNamed(context, '/');
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 🌌 Unified Breathing Ambient Glow Mesh Background
          _buildAmbientGlowBackground(),

          // 📡 Holographic Logo & System Info
          SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                
                // --- THE PERFECT CIRCLE LOGO ---
                Center(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Outer Glowing Ring Wave
                      Container(
                        height: 165,
                        width: 165,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFFFD700).withValues(alpha: 0.15), 
                            width: 1.5
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFFFD700).withValues(alpha: 0.08),
                              blurRadius: 40,
                              spreadRadius: 6,
                            ),
                          ],
                        ),
                      ).animate(onPlay: (c) => c.repeat(reverse: true))
                       .scale(begin: const Offset(1, 1), end: const Offset(1.12, 1.12), duration: 2.seconds, curve: Curves.easeInOut),

                      // Holographic Tracker Ring (Rotating)
                      Container(
                        height: 142,
                        width: 142,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFFFD700).withValues(alpha: 0.35), 
                            width: 1.5
                          ),
                        ),
                      ).animate(onPlay: (c) => c.repeat())
                       .rotate(duration: 10.seconds),

                      // Central glass logo case
                      Hero(
                        tag: 'logo',
                        child: Container(
                          height: 115,
                          width: 115,
                          padding: const EdgeInsets.all(22),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF030510),
                            border: Border.all(
                              color: const Color(0xFFFFD700).withValues(alpha: 0.6),
                              width: 2.0,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black45,
                                blurRadius: 10,
                                offset: const Offset(0, 5),
                              )
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(60),
                            child: Image.asset('assets/images/logo.png', fit: BoxFit.cover),
                          ),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 800.ms).scale(curve: Curves.elasticOut, duration: 1000.ms),

                const SizedBox(height: 45),

                // --- BRAND TEXT ---
                Text(
                  'SMARTFACE ELITE',
                  style: GoogleFonts.outfit(
                    fontSize: 34,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 7,
                    color: const Color(0xFFFFD700),
                    shadows: [
                      Shadow(
                        color: const Color(0xFFFFD700).withValues(alpha: 0.4), 
                        blurRadius: 18,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 300.ms, duration: 500.ms).slideY(begin: 0.25, end: 0, duration: 500.ms),

                const SizedBox(height: 8),
                
                Text(
                  'PRECISION ATTENDANCE AI',
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    color: Colors.white38,
                    letterSpacing: 4,
                    fontWeight: FontWeight.bold,
                  ),
                ).animate().fadeIn(delay: 600.ms, duration: 400.ms),

                const Spacer(),

                // --- STYLISH NEURAL LOADING ---
                _buildNeuralLoadingIndicator()
                    .animate()
                    .fadeIn(delay: 900.ms, duration: 500.ms),
                
                const SizedBox(height: 35),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Unified breathing mesh light design
  Widget _buildAmbientGlowBackground() {
    return Stack(
      children: [
        // Base dark space canvas
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF040613),
                Color(0xFF0C1033),
              ],
            ),
          ),
        ),
        
        // Floating Mesh Gold
        Positioned(
          top: -80,
          left: -40,
          child: Container(
            width: 280,
            height: 280,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFFFD700).withValues(alpha: 0.12),
            ),
          ).animate(onPlay: (c) => c.repeat(reverse: true))
           .scale(begin: const Offset(0.9, 0.9), end: const Offset(1.25, 1.25), duration: 5.seconds, curve: Curves.easeInOut)
           .move(begin: const Offset(0, 0), end: const Offset(20, 30), duration: 5.seconds, curve: Curves.easeInOut),
        ),

        // Floating Mesh Indigo
        Positioned(
          bottom: -100,
          right: -80,
          child: Container(
            width: 380,
            height: 380,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF1D2671).withValues(alpha: 0.28),
            ),
          ).animate(onPlay: (c) => c.repeat(reverse: true))
           .scale(begin: const Offset(1.15, 1.15), end: const Offset(0.85, 0.85), duration: 7.seconds, curve: Curves.easeInOut)
           .move(begin: const Offset(0, 0), end: const Offset(-30, -40), duration: 7.seconds, curve: Curves.easeInOut),
        ),

        // Blur Filter
        BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
          child: Container(
            color: Colors.transparent,
          ),
        ),

        // Glowing Face recognition grid mesh
        Opacity(
          opacity: 0.08,
          child: Container(
            decoration: const BoxDecoration(
              image: DecorationImage(
                image: AssetImage('assets/images/ai_face_grid.png'),
                fit: BoxFit.cover,
              ),
            ),
          ),
        ).animate(onPlay: (c) => c.repeat(reverse: true))
         .shimmer(duration: 5.seconds, color: const Color(0xFFFFD700).withValues(alpha: 0.25)),
      ],
    );
  }

  // Futuristic diagnostics & dots loader
  Widget _buildNeuralLoadingIndicator() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(3, (index) {
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 5),
              height: 7,
              width: 7,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFFFD700),
                boxShadow: [
                  BoxShadow(color: Color(0xFFFFD700), blurRadius: 8, spreadRadius: 1),
                ],
              ),
            ).animate(onPlay: (controller) => controller.repeat())
             .scale(delay: (index * 180).ms, duration: 600.ms, begin: const Offset(0.4, 0.4), end: const Offset(1.4, 1.4))
             .fadeIn(delay: (index * 180).ms, duration: 600.ms)
             .then()
             .fadeOut(duration: 600.ms);
          }),
        ),
        const SizedBox(height: 18),
        Text(
          'INITIALIZING NEURAL PIPELINE...',
          style: GoogleFonts.robotoMono(
            color: Colors.white30, 
            fontSize: 10, 
            letterSpacing: 2, 
            fontWeight: FontWeight.bold
          ),
        ).animate().shimmer(duration: 2.seconds),
      ],
    );
  }
}
