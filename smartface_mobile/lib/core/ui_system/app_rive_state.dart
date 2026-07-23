import 'package:flutter/material.dart';
import 'package:rive/rive.dart';
import 'app_motion.dart';

/// AppRiveState — Interactive Rive state machine wrapper for hero visuals,
/// face recognition, QR scanning, and system health status visuals.
class AppRiveState extends StatelessWidget {
  final String assetPath;
  final String? stateMachineName;
  final String? artboardName;
  final double width;
  final double height;
  final IconData fallbackIcon;
  final Color? fallbackColor;

  const AppRiveState({
    super.key,
    required this.assetPath,
    this.stateMachineName,
    this.artboardName,
    this.width = 140,
    this.height = 140,
    this.fallbackIcon = Icons.camera_front_rounded,
    this.fallbackColor,
  });

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) {
      return SizedBox(
        width: width,
        height: height,
        child: Icon(
          fallbackIcon,
          size: width * 0.5,
          color: fallbackColor ?? Theme.of(context).primaryColor,
        ),
      );
    }

    return SizedBox(
      width: width,
      height: height,
      child: RiveAnimation.asset(
        assetPath,
        stateMachines: stateMachineName != null
            ? [stateMachineName!]
            : const [],
        artboard: artboardName,
        fit: BoxFit.contain,
        placeHolder: Center(
          child: Icon(
            fallbackIcon,
            size: width * 0.4,
            color: fallbackColor ?? Theme.of(context).primaryColor,
          ),
        ),
      ),
    );
  }
}
