import 'package:flutter/material.dart';
export 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';

/// Central helper function to check whether animations are enabled.
/// Respects MediaQuery.disableAnimations, accessibleNavigation, and reduced-motion settings.
bool animationsEnabled(BuildContext context) {
  final media = MediaQuery.of(context);
  return !media.accessibleNavigation && !media.disableAnimations;
}

/// Central helper and wrapper widgets for flutter_staggered_animations.
class AppStaggeredAnimations {
  static bool isReducedMotion(BuildContext context) {
    return !animationsEnabled(context);
  }

  /// Default durations and offsets
  static const Duration defaultDuration = Duration(milliseconds: 360);
  static const double defaultVerticalOffset = 24.0;
  static const double defaultHorizontalOffset = 20.0;
  static const double defaultScale = 0.95;
  static const int maxStaggerIndex = 20;

  /// Cap position index for large lists to prevent long stagger delays
  static int capIndex(int position) {
    return position > maxStaggerIndex ? maxStaggerIndex : position;
  }
}

/// Reusable staggered animation item for ListViews.
class AppStaggeredListItem extends StatelessWidget {
  final int? index;
  final int? position;
  final Widget child;
  final Duration duration;
  final double verticalOffset;
  final double horizontalOffset;
  final bool enabled;

  const AppStaggeredListItem({
    super.key,
    this.index,
    this.position,
    required this.child,
    this.duration = AppStaggeredAnimations.defaultDuration,
    this.verticalOffset = AppStaggeredAnimations.defaultVerticalOffset,
    this.horizontalOffset = 0.0,
    this.enabled = true,
  });

  int get _effectiveIndex => index ?? position ?? 0;

  @override
  Widget build(BuildContext context) {
    if (!enabled || !animationsEnabled(context)) {
      return child;
    }

    final safePosition = AppStaggeredAnimations.capIndex(_effectiveIndex);

    return AnimationConfiguration.staggeredList(
      position: safePosition,
      duration: duration,
      child: SlideAnimation(
        verticalOffset: verticalOffset,
        horizontalOffset: horizontalOffset,
        child: FadeInAnimation(child: child),
      ),
    );
  }
}

/// Alias for backwards compatibility
typedef StaggeredListItem = AppStaggeredListItem;

/// Reusable staggered animation item for GridViews.
class AppStaggeredGridItem extends StatelessWidget {
  final int? index;
  final int? position;
  final int columnCount;
  final Widget child;
  final Duration duration;
  final double scale;
  final double verticalOffset;
  final bool enabled;

  const AppStaggeredGridItem({
    super.key,
    this.index,
    this.position,
    required this.columnCount,
    required this.child,
    this.duration = AppStaggeredAnimations.defaultDuration,
    this.scale = AppStaggeredAnimations.defaultScale,
    this.verticalOffset = 0.0,
    this.enabled = true,
  });

  int get _effectiveIndex => index ?? position ?? 0;

  @override
  Widget build(BuildContext context) {
    if (!enabled || !animationsEnabled(context)) {
      return child;
    }

    final safePosition = AppStaggeredAnimations.capIndex(_effectiveIndex);

    Widget item = ScaleAnimation(
      scale: scale,
      child: FadeInAnimation(child: child),
    );

    if (verticalOffset != 0.0) {
      item = SlideAnimation(verticalOffset: verticalOffset, child: item);
    }

    return AnimationConfiguration.staggeredGrid(
      position: safePosition,
      columnCount: columnCount <= 0 ? 1 : columnCount,
      duration: duration,
      child: item,
    );
  }
}

/// Alias for backwards compatibility
typedef StaggeredGridItem = AppStaggeredGridItem;

/// Reusable section wrapper that runs entrance animation once for static children.
class AppStaggeredSection extends StatelessWidget {
  final Widget child;
  final Duration duration;
  final double verticalOffset;
  final bool enabled;

  const AppStaggeredSection({
    super.key,
    required this.child,
    this.duration = AppStaggeredAnimations.defaultDuration,
    this.verticalOffset = 24.0,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled || !animationsEnabled(context)) {
      return child;
    }

    return AnimationLimiter(
      child: AnimationConfiguration.toStaggeredList(
        duration: duration,
        childAnimationBuilder: (widget) => SlideAnimation(
          verticalOffset: verticalOffset,
          child: FadeInAnimation(child: widget),
        ),
        children: [child],
      ).first,
    );
  }
}

/// Reusable staggered Column component.
class AppStaggeredColumn extends StatelessWidget {
  final List<Widget> children;
  final MainAxisAlignment mainAxisAlignment;
  final CrossAxisAlignment crossAxisAlignment;
  final MainAxisSize mainAxisSize;
  final Duration duration;
  final double verticalOffset;
  final bool enabled;

  const AppStaggeredColumn({
    super.key,
    required this.children,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.crossAxisAlignment = CrossAxisAlignment.start,
    this.mainAxisSize = MainAxisSize.max,
    this.duration = AppStaggeredAnimations.defaultDuration,
    this.verticalOffset = 24.0,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled || !animationsEnabled(context)) {
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

/// Alias for backwards compatibility
typedef StaggeredColumn = AppStaggeredColumn;

/// Reusable staggered Row component.
class AppStaggeredRow extends StatelessWidget {
  final List<Widget> children;
  final MainAxisAlignment mainAxisAlignment;
  final CrossAxisAlignment crossAxisAlignment;
  final MainAxisSize mainAxisSize;
  final Duration duration;
  final double horizontalOffset;
  final bool enabled;

  const AppStaggeredRow({
    super.key,
    required this.children,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.crossAxisAlignment = CrossAxisAlignment.center,
    this.mainAxisSize = MainAxisSize.max,
    this.duration = const Duration(milliseconds: 300),
    this.horizontalOffset = 20.0,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled || !animationsEnabled(context)) {
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

/// Alias for backwards compatibility
typedef StaggeredRow = AppStaggeredRow;

/// Reusable item wrapper for CustomScrollView & Slivers.
class AppAnimatedSliverItem extends StatelessWidget {
  final int? index;
  final int? position;
  final Widget child;
  final Duration duration;
  final double verticalOffset;
  final bool enabled;

  const AppAnimatedSliverItem({
    super.key,
    this.index,
    this.position,
    required this.child,
    this.duration = AppStaggeredAnimations.defaultDuration,
    this.verticalOffset = 24.0,
    this.enabled = true,
  });

  int get _effectiveIndex => index ?? position ?? 0;

  @override
  Widget build(BuildContext context) {
    if (!enabled || !animationsEnabled(context)) {
      return child;
    }

    final safePosition = AppStaggeredAnimations.capIndex(_effectiveIndex);

    return AnimationConfiguration.staggeredList(
      position: safePosition,
      duration: duration,
      child: SlideAnimation(
        verticalOffset: verticalOffset,
        child: FadeInAnimation(child: child),
      ),
    );
  }
}

/// Reusable animated empty state wrapper.
class AppAnimatedEmptyState extends StatelessWidget {
  final Widget child;

  const AppAnimatedEmptyState({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    if (!animationsEnabled(context)) return child;

    return AnimationConfiguration.staggeredList(
      position: 0,
      duration: const Duration(milliseconds: 400),
      child: SlideAnimation(
        verticalOffset: 16.0,
        child: FadeInAnimation(child: child),
      ),
    );
  }
}

/// Reusable animated error state wrapper.
class AppAnimatedErrorState extends StatelessWidget {
  final Widget child;

  const AppAnimatedErrorState({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    if (!animationsEnabled(context)) return child;

    return AnimationConfiguration.staggeredList(
      position: 0,
      duration: const Duration(milliseconds: 400),
      child: SlideAnimation(
        verticalOffset: 16.0,
        child: FadeInAnimation(child: child),
      ),
    );
  }
}
