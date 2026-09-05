import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';
import 'app_theme.dart';

/// ============================================================================
/// PrimaryButton — the premium gradient button with a press-scale animation
/// and built-in loading state. Matches the reference "Sign in" button.
/// ============================================================================
class PrimaryButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final bool expand;
  final double height;

  const PrimaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.expand = true,
    this.height = 52,
  });

  @override
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton> {
  double _scale = 1.0;

  bool get _enabled => widget.onPressed != null && !widget.isLoading;

  void _setPressed(bool pressed) {
    if (!_enabled) return;
    setState(() => _scale = pressed ? 0.97 : 1.0);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _setPressed(true),
      onTapUp: (_) => _setPressed(false),
      onTapCancel: () => _setPressed(false),
      onTap: _enabled
          ? () {
              HapticFeedback.mediumImpact();
              widget.onPressed!.call();
            }
          : null,
      child: AnimatedScale(
        scale: _scale,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: Container(
          width: widget.expand ? double.infinity : null,
          height: widget.height,
          padding: widget.expand
              ? null
              : const EdgeInsets.symmetric(horizontal: 26),
          decoration: BoxDecoration(
            gradient: _enabled
                ? AppColors.primaryGradient
                : LinearGradient(
                    colors: [Colors.grey.shade400, Colors.grey.shade300],
                  ),
            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
            boxShadow: _enabled
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.32),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ]
                : null,
          ),
          child: Center(
            child: widget.isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2.4,
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (widget.icon != null) ...[
                        Icon(widget.icon, color: Colors.white, size: 20),
                        const SizedBox(width: 10),
                      ],
                      Text(
                        widget.text,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
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

/// Secondary outlined button variant.
class SecondaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final IconData? icon;
  final double height;
  const SecondaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.icon,
    this.height = 52,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: height,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: icon == null
            ? const SizedBox.shrink()
            : Icon(icon, size: 20, color: AppColors.primary),
        label: Text(
          text,
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.primary, width: 1.4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
          ),
        ),
      ),
    );
  }
}

/// Circular back button used on auth headers.
class CircularBackButton extends StatelessWidget {
  final VoidCallback onTap;
  final Color? color;
  const CircularBackButton({super.key, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: (color ?? Colors.white).withValues(alpha: 0.18),
      shape: const CircleBorder(),
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        customBorder: const CircleBorder(),
        child: const SizedBox(
          width: 42,
          height: 42,
          child: Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 16),
        ),
      ),
    );
  }
}
