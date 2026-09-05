import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';

/// ============================================================================
/// AnimatedAppBar — a lightweight app bar whose title + actions fade and
/// slide in on first paint. Theme aware and safe-area aware.
///
/// Implements [PreferredSizeWidget] so it can be dropped straight into a
/// Scaffold's `appBar:` slot.
/// ============================================================================
class AnimatedAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget> actions;
  final VoidCallback? onBack;
  final bool centerTitle;
  final Color? foreground;

  const AnimatedAppBar({
    super.key,
    required this.title,
    this.actions = const [],
    this.onBack,
    this.centerTitle = false,
    this.foreground,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final fg = foreground ?? AppColors.heading(brightness);

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeOutCubic,
      builder: (context, t, child) => Opacity(
        opacity: t.clamp(0.0, 1.0),
        child: Transform.translate(
          offset: Offset(0, (1 - t) * -8),
          child: child,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: kToolbarHeight,
          child: Row(
            children: [
              if (onBack != null)
                IconButton(
                  splashRadius: 22,
                  icon: Icon(Icons.arrow_back_ios_new, size: 18, color: fg),
                  onPressed: () {
                    HapticFeedback.selectionClick();
                    onBack!.call();
                  },
                )
              else
                const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  textAlign: centerTitle ? TextAlign.center : TextAlign.start,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: fg,
                  ),
                ),
              ),
              ...actions,
              const SizedBox(width: 8),
            ],
          ),
        ),
      ),
    );
  }
}
