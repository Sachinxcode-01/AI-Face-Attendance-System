import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'app_motion.dart';

/// AppLottieState — Component for rendering Lottie micro-animations
/// with asset verification, error boundaries, and static fallback support.
class AppLottieState extends StatelessWidget {
  final String assetPath;
  final double? width;
  final double? height;
  final bool repeat;
  final IconData fallbackIcon;
  final Color? fallbackColor;
  final String? message;

  const AppLottieState({
    super.key,
    required this.assetPath,
    this.width = 120,
    this.height = 120,
    this.repeat = true,
    this.fallbackIcon = Icons.info_outline_rounded,
    this.fallbackColor,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    final isReducedMotion = AppMotion.isReducedMotion(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: width,
          height: height,
          child: Lottie.asset(
            assetPath,
            repeat: repeat && !isReducedMotion,
            errorBuilder: (context, error, stackTrace) {
              return Icon(
                fallbackIcon,
                size: (width ?? 120) * 0.6,
                color: fallbackColor ?? Theme.of(context).primaryColor,
              );
            },
          ),
        ),
        if (message != null) ...[
          const SizedBox(height: 8),
          Text(
            message!,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 12.5,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white70
                  : const Color(0xFF64748B),
            ),
          ),
        ],
      ],
    );
  }
}
