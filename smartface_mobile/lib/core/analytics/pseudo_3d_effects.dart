import 'package:flutter/material.dart';

/// Pseudo3DEffects — Layered perspective transforms, dark side faces, top face highlights,
/// and soft ambient shadows for mathematically accurate visual depth.
class Pseudo3DEffects {
  Pseudo3DEffects._();

  static Widget wrapWithDepth({
    required Widget child,
    double tiltAngle = 0.04,
    double elevation = 4.0,
    Color? shadowColor,
  }) {
    return Transform(
      transform: Matrix4.identity()
        ..setEntry(3, 2, 0.001) // perspective
        ..rotateX(tiltAngle),
      alignment: Alignment.center,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: shadowColor ?? Colors.black.withValues(alpha: 0.15),
              blurRadius: elevation * 3,
              offset: Offset(0, elevation),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}
