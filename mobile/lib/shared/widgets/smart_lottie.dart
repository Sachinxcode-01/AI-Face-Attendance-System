/*
|--------------------------------------------------------------------------
| File: smart_lottie.dart
|--------------------------------------------------------------------------
| SmartFace Attendance — Professional Lottie Player & Design System Widget
| Provides resilient, accessible Lottie animation loading with offline
| fallbacks, reduced-motion compliance, and pre-built design presets.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

/// Supported asset presets for SmartFace attendance system
enum LottiePreset {
  faceScan,
  success,
  celebration,
  empty,
  loading,
}

class SmartLottie extends StatelessWidget {
  final String? assetPath;
  final String? networkUrl;
  final LottiePreset? preset;
  final double? width;
  final double? height;
  final BoxFit fit;
  final bool repeat;
  final bool animate;
  final AnimationController? controller;
  final Widget? fallback;
  final VoidCallback? onLoaded;

  const SmartLottie({
    super.key,
    this.assetPath,
    this.networkUrl,
    this.preset,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
    this.repeat = true,
    this.animate = true,
    this.controller,
    this.fallback,
    this.onLoaded,
  });

  /// Factory: Face biometric scanner animation
  factory SmartLottie.faceScan({
    Key? key,
    double size = 180,
    bool repeat = true,
    AnimationController? controller,
  }) {
    return SmartLottie(
      key: key,
      preset: LottiePreset.faceScan,
      assetPath: 'assets/lottie/face_scan.json',
      width: size,
      height: size,
      repeat: repeat,
      controller: controller,
      fallback: Icon(
        Icons.face_retouching_natural_rounded,
        size: size * 0.7,
        color: const Color(0xFF6366F1),
      ),
    );
  }

  /// Factory: Attendance success checkmark & thumbs up
  factory SmartLottie.success({
    Key? key,
    double size = 150,
    bool repeat = false,
    AnimationController? controller,
  }) {
    return SmartLottie(
      key: key,
      preset: LottiePreset.success,
      assetPath: 'assets/lottie/success.json',
      width: size,
      height: size,
      repeat: repeat,
      controller: controller,
      fallback: Icon(
        Icons.check_circle_rounded,
        size: size * 0.7,
        color: const Color(0xFF10B981),
      ),
    );
  }

  /// Factory: Celebration / Attendance Streak Fireworks
  factory SmartLottie.celebration({
    Key? key,
    double size = 200,
    bool repeat = true,
    AnimationController? controller,
  }) {
    return SmartLottie(
      key: key,
      preset: LottiePreset.celebration,
      assetPath: 'assets/lottie/celebration.json',
      width: size,
      height: size,
      repeat: repeat,
      controller: controller,
      fallback: Icon(
        Icons.celebration_rounded,
        size: size * 0.7,
        color: const Color(0xFFF59E0B),
      ),
    );
  }

  /// Factory: Empty state illustrations
  factory SmartLottie.empty({
    Key? key,
    double size = 180,
    bool repeat = true,
  }) {
    return SmartLottie(
      key: key,
      preset: LottiePreset.empty,
      assetPath: 'assets/lottie/empty.json',
      width: size,
      height: size,
      repeat: repeat,
      fallback: Icon(
        Icons.inbox_rounded,
        size: size * 0.6,
        color: const Color(0xFF6366F1),
      ),
    );
  }

  /// Factory: Smooth biometric loading radar
  factory SmartLottie.loading({
    Key? key,
    double size = 64,
  }) {
    return SmartLottie(
      key: key,
      preset: LottiePreset.loading,
      assetPath: 'assets/lottie/loading.json',
      width: size,
      height: size,
      repeat: true,
      fallback: SizedBox(
        width: size,
        height: size,
        child: const CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
        ),
      ),
    );
  }

  String _resolveAssetPath() {
    if (assetPath != null && assetPath!.isNotEmpty) return assetPath!;
    switch (preset) {
      case LottiePreset.faceScan:
        return 'assets/lottie/face_scan.json';
      case LottiePreset.success:
        return 'assets/lottie/success.json';
      case LottiePreset.celebration:
        return 'assets/lottie/celebration.json';
      case LottiePreset.empty:
        return 'assets/lottie/empty.json';
      case LottiePreset.loading:
      default:
        return 'assets/lottie/loading.json';
    }
  }

  @override
  Widget build(BuildContext context) {
    // Respect reduced motion accessibility
    final isReducedMotion = MediaQuery.of(context).accessibleNavigation;
    if (isReducedMotion && fallback != null) {
      return SizedBox(
        width: width,
        height: height,
        child: Center(child: fallback),
      );
    }

    Widget content;
    final resolvedAsset = _resolveAssetPath();

    if (networkUrl != null && networkUrl!.isNotEmpty) {
      content = Lottie.network(
        networkUrl!,
        width: width,
        height: height,
        fit: fit,
        repeat: repeat,
        animate: animate,
        controller: controller,
        errorBuilder: (context, error, stackTrace) {
          return Center(child: fallback ?? const SizedBox.shrink());
        },
      );
    } else {
      content = Lottie.asset(
        resolvedAsset,
        width: width,
        height: height,
        fit: fit,
        repeat: repeat,
        animate: animate,
        controller: controller,
        errorBuilder: (context, error, stackTrace) {
          return Center(child: fallback ?? const SizedBox.shrink());
        },
      );
    }

    return SizedBox(
      width: width,
      height: height,
      child: content,
    );
  }
}

