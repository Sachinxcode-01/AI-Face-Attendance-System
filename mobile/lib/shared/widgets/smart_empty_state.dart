/*
|--------------------------------------------------------------------------
| File: smart_empty_state.dart
|--------------------------------------------------------------------------
| SmartFace Attendance — Professional Animated Empty State
| Features smooth Lottie illustrations with responsive typography,
| theme-adaptability, and optional action buttons.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'smart_lottie.dart';

class SmartEmptyState extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? lottieAsset;
  final IconData? fallbackIcon;
  final double animationSize;
  final String? actionLabel;
  final VoidCallback? onAction;

  const SmartEmptyState({
    super.key,
    required this.title,
    required this.subtitle,
    this.lottieAsset,
    this.fallbackIcon = Icons.inbox_rounded,
    this.animationSize = 160,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1E293B);
    final textSub = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Lottie Animation
            SmartLottie(
              assetPath: lottieAsset ?? 'assets/lottie/empty.json',
              width: animationSize,
              height: animationSize,
              fallback: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEEF2FF),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  fallbackIcon,
                  size: animationSize * 0.45,
                  color: const Color(0xFF6366F1),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: textHeading,
              ),
            ),
            const SizedBox(height: 6),

            // Subtitle
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: textSub,
                height: 1.4,
              ),
            ),

            // Optional CTA Action
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: onAction,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  actionLabel!,
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13.5),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
