import 'package:flutter/material.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'app_motion.dart';

/// AppStaggeredList — Wrapper widget leveraging flutter_staggered_animations
/// for list item entrance animations with reduced-motion compliance.
class AppStaggeredList extends StatelessWidget {
  final int itemCount;
  final Widget Function(BuildContext context, int index) itemBuilder;
  final ScrollController? controller;
  final EdgeInsetsGeometry? padding;
  final Duration duration;

  const AppStaggeredList({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.controller,
    this.padding,
    this.duration = AppMotion.normalDuration,
  });

  @override
  Widget build(BuildContext context) {
    if (AppMotion.isReducedMotion(context)) {
      return ListView.builder(
        controller: controller,
        padding: padding,
        itemCount: itemCount,
        itemBuilder: itemBuilder,
      );
    }

    return AnimationLimiter(
      child: ListView.builder(
        controller: controller,
        padding: padding,
        itemCount: itemCount,
        itemBuilder: (context, index) {
          return AnimationConfiguration.staggeredList(
            position: index,
            duration: duration,
            child: SlideAnimation(
              verticalOffset: 30.0,
              child: FadeInAnimation(child: itemBuilder(context, index)),
            ),
          );
        },
      ),
    );
  }
}
