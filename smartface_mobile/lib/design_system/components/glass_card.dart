import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  const GlassCard({super.key, required this.child, this.borderRadius = 20, this.padding = const EdgeInsets.all(16)});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            gradient: AppGradients.cardGlass,
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(color: Colors.white.withOpacity(0.06), width: 1),
          ),
          child: child,
        ),
      ),
    );
  }
}
