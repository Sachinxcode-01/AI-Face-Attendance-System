import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

/// Centralized haptic helper so feedback is consistent everywhere.
class AppHaptics {
  static void light() => HapticFeedback.lightImpact();
  static void medium() => HapticFeedback.mediumImpact();
  static void selection() => HapticFeedback.selectionClick();
  static void success() => HapticFeedback.mediumImpact();
  static void error() => HapticFeedback.heavyImpact();
}

/// Wraps any widget with a spring-like scale-down on press plus optional
/// haptic feedback.
class PressableScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final double pressedScale;
  final Duration duration;
  final bool haptic;

  const PressableScale({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.pressedScale = 0.96,
    this.duration = const Duration(milliseconds: 120),
    this.haptic = true,
  });

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  bool _pressed = false;

  bool get _interactive => widget.onTap != null || widget.onLongPress != null;

  void _setPressed(bool value) {
    if (!_interactive) return;
    if (_pressed != value) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => _setPressed(true),
      onTapUp: (_) => _setPressed(false),
      onTapCancel: () => _setPressed(false),
      onTap: widget.onTap == null
          ? null
          : () {
              if (widget.haptic) AppHaptics.light();
              widget.onTap!();
            },
      onLongPress: widget.onLongPress == null
          ? null
          : () {
              if (widget.haptic) AppHaptics.medium();
              widget.onLongPress!();
            },
      child: AnimatedScale(
        scale: _pressed ? widget.pressedScale : 1.0,
        duration: widget.duration,
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// A performant, offline animated "aurora" backdrop.
class AuroraBackground extends StatefulWidget {
  final Widget? child;
  final bool animate;
  final Color baseColor;
  final List<Color>? blobColors;

  const AuroraBackground({
    super.key,
    this.child,
    this.animate = true,
    this.baseColor = AppColors.bgDeep,
    this.blobColors,
  });

  @override
  State<AuroraBackground> createState() => _AuroraBackgroundState();
}

class _AuroraBackgroundState extends State<AuroraBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 22),
  );

  @override
  void initState() {
    super.initState();
    if (widget.animate) _ctrl.repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion =
        MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    final colors =
        widget.blobColors ??
        const [AppColors.indigoLight, Color(0xFF7C3AED), AppColors.cyan];

    return RepaintBoundary(
      child: Stack(
        fit: StackFit.expand,
        children: [
          ColoredBox(color: widget.baseColor),
          if (reduceMotion || !widget.animate)
            CustomPaint(painter: _AuroraPainter(t: 0.18, colors: colors))
          else
            AnimatedBuilder(
              animation: _ctrl,
              builder: (context, _) => CustomPaint(
                painter: _AuroraPainter(t: _ctrl.value, colors: colors),
              ),
            ),
          if (widget.child != null) widget.child!,
        ],
      ),
    );
  }
}

class _AuroraPainter extends CustomPainter {
  final double t;
  final List<Color> colors;

  _AuroraPainter({required this.t, required this.colors});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    const tau = 2 * math.pi;

    void blob(double phase, Color color, double radiusFactor, double speed) {
      final cx = w * (0.5 + 0.34 * math.cos(tau * (t * speed + phase)));
      final cy = h * (0.42 + 0.30 * math.sin(tau * (t * speed + phase) * 1.27));
      final radius = math.max(w, h) * radiusFactor;
      final rect = Rect.fromCircle(center: Offset(cx, cy), radius: radius);
      final paint = Paint()
        ..shader = RadialGradient(
          colors: [color.withValues(alpha: 0.34), color.withValues(alpha: 0.0)],
        ).createShader(rect)
        ..blendMode = BlendMode.plus;
      canvas.drawRect(rect, paint);
    }

    blob(0.00, colors[0], 0.58, 1.0);
    blob(0.37, colors[1 % colors.length], 0.50, 0.8);
    blob(0.71, colors[2 % colors.length], 0.46, 1.2);
  }

  @override
  bool shouldRepaint(covariant _AuroraPainter old) =>
      old.t != t || old.colors != colors;
}

/// Animates a number from 0 up to [value] on first build.
class CountUpText extends StatelessWidget {
  final double value;
  final String Function(double) formatter;
  final Duration duration;
  final TextStyle? style;

  const CountUpText({
    super.key,
    required this.value,
    required this.formatter,
    this.duration = const Duration(milliseconds: 900),
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: value),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, v, _) => Text(formatter(v), style: style),
    );
  }
}

/// Shows a modern rounded, draggable bottom sheet.
Future<T?> showModernSheet<T>({
  required BuildContext context,
  required Widget child,
  bool isScrollControlled = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: isScrollControlled,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return Container(
        decoration: BoxDecoration(
          color: AppColors.bgModal,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        padding: EdgeInsets.only(
          left: AppSpacing.lg,
          right: AppSpacing.lg,
          top: AppSpacing.md,
          bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.lg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppSpacing.md),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(99),
              ),
            ),
            child,
          ],
        ),
      );
    },
  );
}

/// Animated breathing glow indicator for live status badges, recording, and active sensors.
class PulseGlow extends StatefulWidget {
  final Widget child;
  final Color glowColor;
  final double maxBlur;
  final double maxSpread;
  final Duration duration;
  final bool active;
  final BoxShape shape;

  const PulseGlow({
    super.key,
    required this.child,
    this.glowColor = AppColors.primary,
    this.maxBlur = 16.0,
    this.maxSpread = 4.0,
    this.duration = const Duration(milliseconds: 1800),
    this.active = true,
    this.shape = BoxShape.circle,
  });

  @override
  State<PulseGlow> createState() => _PulseGlowState();
}

class _PulseGlowState extends State<PulseGlow>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );
    if (widget.active) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant PulseGlow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.active != oldWidget.active) {
      if (widget.active) {
        _controller.repeat(reverse: true);
      } else {
        _controller.stop();
        _controller.reset();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.active) return widget.child;

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        final t = _animation.value;
        return DecoratedBox(
          decoration: BoxDecoration(
            shape: widget.shape,
            boxShadow: [
              BoxShadow(
                color: widget.glowColor.withValues(alpha: 0.2 + 0.45 * t),
                blurRadius: widget.maxBlur * t,
                spreadRadius: widget.maxSpread * t,
              ),
            ],
          ),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// Animated scale entrance with a subtle physics bounce (spring overshoot).
class BouncyScale extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Duration delay;
  final Curve curve;

  const BouncyScale({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 600),
    this.delay = Duration.zero,
    this.curve = Curves.elasticOut,
  });

  @override
  State<BouncyScale> createState() => _BouncyScaleState();
}

class _BouncyScaleState extends State<BouncyScale>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;
  Timer? _delayTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation = CurvedAnimation(parent: _controller, curve: widget.curve);

    if (widget.delay == Duration.zero) {
      _controller.forward();
    } else {
      _delayTimer = Timer(widget.delay, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _delayTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _animation,
      child: widget.child,
    );
  }
}

/// Pre-configured physics-curved transition switcher for toggling between states.
class SmoothAnimatedSwitcher extends StatelessWidget {
  final Widget child;
  final Duration duration;
  final Duration reverseDuration;

  const SmoothAnimatedSwitcher({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 280),
    this.reverseDuration = const Duration(milliseconds: 200),
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: duration,
      reverseDuration: reverseDuration,
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, animation) {
        return FadeTransition(
          opacity: animation,
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.95, end: 1.0).animate(animation),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}

/// Animated headline for splash, greeting and empty-state copy.
/// Respects the platform reduced-motion setting.
class AppAnimatedHeading extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final Duration totalDuration;
  final bool isTypingEffect;

  const AppAnimatedHeading({
    super.key,
    required this.text,
    this.style,
    this.totalDuration = const Duration(milliseconds: 1800),
    this.isTypingEffect = false,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveStyle = style ??
        TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: Theme.of(context).colorScheme.onSurface,
        );

    if (MediaQuery.disableAnimationsOf(context)) {
      return Text(text, style: effectiveStyle);
    }

    final AnimatedText animatedText = isTypingEffect
        ? TypewriterAnimatedText(
            text,
            textStyle: effectiveStyle,
            speed: const Duration(milliseconds: 40),
          )
        : FadeAnimatedText(
            text,
            textStyle: effectiveStyle,
            duration: totalDuration,
          );

    return AnimatedTextKit(
      animatedTexts: [animatedText],
      totalRepeatCount: 1,
      displayFullTextOnTap: true,
    );
  }
}
