import 'package:flutter/material.dart';
export 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';

/// Central helper and wrapper widgets for flutter_staggered_animations.
/// Respects reduced-motion accessibility settings automatically.
class AppStaggeredAnimations {
  static bool isReducedMotion(BuildContext context) {
    final media = MediaQuery.of(context);
    return media.accessibleNavigation || media.disableAnimations;
  }

  /// Default durations and offsets
  static const Duration defaultDuration = Duration(milliseconds: 375);
  static const double defaultVerticalOffset = 30.0;
  static const double defaultHorizontalOffset = 30.0;
  static const double defaultScale = 0.94;
}

/// A wrapper for list items inside an AnimationLimiter & ListView.builder.
class StaggeredListItem extends StatelessWidget {
  final int position;
  final Widget child;
  final Duration duration;
  final double verticalOffset;
  final double horizontalOffset;

  const StaggeredListItem({
    super.key,
    required this.position,
    required this.child,
    this.duration = AppStaggeredAnimations.defaultDuration,
    this.verticalOffset = AppStaggeredAnimations.defaultVerticalOffset,
    this.horizontalOffset = 0.0,
  });

  @override
  Widget build(BuildContext context) {
    if (AppStaggeredAnimations.isReducedMotion(context)) {
      return child;
    }

    return AnimationConfiguration.staggeredList(
      position: position,
      duration: duration,
      child: SlideAnimation(
        verticalOffset: verticalOffset,
        horizontalOffset: horizontalOffset,
        child: FadeInAnimation(child: child),
      ),
    );
  }
}

/// A wrapper for grid items inside an AnimationLimiter & GridView.builder.
class StaggeredGridItem extends StatelessWidget {
  final int position;
  final int columnCount;
  final Widget child;
  final Duration duration;
  final double scale;

  const StaggeredGridItem({
    super.key,
    required this.position,
    required this.columnCount,
    required this.child,
    this.duration = AppStaggeredAnimations.defaultDuration,
    this.scale = AppStaggeredAnimations.defaultScale,
  });

  @override
  Widget build(BuildContext context) {
    if (AppStaggeredAnimations.isReducedMotion(context)) {
      return child;
    }

    return AnimationConfiguration.staggeredGrid(
      position: position,
      columnCount: columnCount <= 0 ? 1 : columnCount,
      duration: duration,
      child: ScaleAnimation(
        scale: scale,
        child: FadeInAnimation(child: child),
      ),
    );
  }
}

/// A column wrapper that staggers its children on entrance.
class StaggeredColumn extends StatelessWidget {
  final List<Widget> children;
  final MainAxisAlignment mainAxisAlignment;
  final CrossAxisAlignment crossAxisAlignment;
  final MainAxisSize mainAxisSize;
  final Duration duration;
  final double verticalOffset;

  const StaggeredColumn({
    super.key,
    required this.children,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.crossAxisAlignment = CrossAxisAlignment.start,
    this.mainAxisSize = MainAxisSize.max,
    this.duration = AppStaggeredAnimations.defaultDuration,
    this.verticalOffset = 25.0,
  });

  @override
  Widget build(BuildContext context) {
    if (AppStaggeredAnimations.isReducedMotion(context)) {
      return Column(
        mainAxisAlignment: mainAxisAlignment,
        crossAxisAlignment: crossAxisAlignment,
        mainAxisSize: mainAxisSize,
        children: children,
      );
    }

    return AnimationLimiter(
      child: Column(
        mainAxisAlignment: mainAxisAlignment,
        crossAxisAlignment: crossAxisAlignment,
        mainAxisSize: mainAxisSize,
        children: AnimationConfiguration.toStaggeredList(
          duration: duration,
          childAnimationBuilder: (widget) => SlideAnimation(
            verticalOffset: verticalOffset,
            child: FadeInAnimation(child: widget),
          ),
          children: children,
        ),
      ),
    );
  }
}

/// A row wrapper that staggers its children horizontally on entrance.
class StaggeredRow extends StatelessWidget {
  final List<Widget> children;
  final MainAxisAlignment mainAxisAlignment;
  final CrossAxisAlignment crossAxisAlignment;
  final MainAxisSize mainAxisSize;
  final Duration duration;
  final double horizontalOffset;

  const StaggeredRow({
    super.key,
    required this.children,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.crossAxisAlignment = CrossAxisAlignment.center,
    this.mainAxisSize = MainAxisSize.max,
    this.duration = const Duration(milliseconds: 300),
    this.horizontalOffset = 20.0,
  });

  @override
  Widget build(BuildContext context) {
    if (AppStaggeredAnimations.isReducedMotion(context)) {
      return Row(
        mainAxisAlignment: mainAxisAlignment,
        crossAxisAlignment: crossAxisAlignment,
        mainAxisSize: mainAxisSize,
        children: children,
      );
    }

    return AnimationLimiter(
      child: Row(
        mainAxisAlignment: mainAxisAlignment,
        crossAxisAlignment: crossAxisAlignment,
        mainAxisSize: mainAxisSize,
        children: AnimationConfiguration.toStaggeredList(
          duration: duration,
          childAnimationBuilder: (widget) => SlideAnimation(
            horizontalOffset: horizontalOffset,
            child: FadeInAnimation(child: widget),
          ),
          children: children,
        ),
      ),
    );
  }
}
