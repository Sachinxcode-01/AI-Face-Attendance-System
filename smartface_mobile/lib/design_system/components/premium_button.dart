import 'package:flutter/material.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

class PremiumButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final double borderRadius;
  const PremiumButton({super.key, required this.onPressed, required this.child, this.borderRadius = 12});

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(borderRadius),
        child: Ink(
          decoration: BoxDecoration(
            gradient: enabled
                ? AppGradients.gold
                : LinearGradient(colors: [Colors.grey.shade400, Colors.grey.shade300]),
            borderRadius: BorderRadius.circular(borderRadius),
            boxShadow: enabled ? AppShadows.goldGlow() : [],
          ),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            child: DefaultTextStyle(
              style: Theme.of(context).textTheme.labelLarge?.copyWith(color: enabled ? Colors.black : Colors.black54) ?? const TextStyle(),
              child: Center(child: child),
            ),
          ),
        ),
      ),
    );
  }
}
