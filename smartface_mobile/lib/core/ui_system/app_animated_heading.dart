import 'package:flutter/material.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'app_motion.dart';

/// AppAnimatedHeading — Headline component leveraging animated_text_kit
/// for splash titles, onboarding headlines, greetings, and AI analyst text.
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
    final effectiveStyle =
        style ??
        TextStyle(
          fontFamily: 'Outfit',
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.onSurface,
        );

    if (AppMotion.isReducedMotion(context)) {
      return Text(text, style: effectiveStyle);
    }

    if (isTypingEffect) {
      return AnimatedTextKit(
        animatedTexts: [
          TypewriterAnimatedText(
            text,
            textStyle: effectiveStyle,
            speed: const Duration(milliseconds: 40),
          ),
        ],
        totalRepeatCount: 1,
        displayFullTextOnTap: true,
      );
    }

    return AnimatedTextKit(
      animatedTexts: [
        FadeAnimatedText(
          text,
          textStyle: effectiveStyle,
          duration: totalDuration,
        ),
      ],
      totalRepeatCount: 1,
      displayFullTextOnTap: true,
    );
  }
}
