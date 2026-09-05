import 'package:flutter/material.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'app_motion.dart';

/// AppCarouselSlider — Generic carousel slider leveraging carousel_slider package
/// with dot page indicators, viewport fraction options, and reduced motion guards.
class AppCarouselSlider<T> extends StatefulWidget {
  final List<T> items;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final double height;
  final double viewportFraction;
  final bool autoPlay;
  final Duration autoPlayInterval;
  final bool infiniteScroll;
  final int initialPage;
  final ValueChanged<int>? onPageChanged;
  final bool showIndicators;
  final String? semanticLabel;

  const AppCarouselSlider({
    super.key,
    required this.items,
    required this.itemBuilder,
    this.height = 180.0,
    this.viewportFraction = 0.90,
    this.autoPlay = false,
    this.autoPlayInterval = const Duration(seconds: 5),
    this.infiniteScroll = false,
    this.initialPage = 0,
    this.onPageChanged,
    this.showIndicators = true,
    this.semanticLabel,
  });

  @override
  State<AppCarouselSlider<T>> createState() => _AppCarouselSliderState<T>();
}

class _AppCarouselSliderState<T> extends State<AppCarouselSlider<T>> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialPage;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) return const SizedBox.shrink();
    final isReducedMotion = AppMotion.isReducedMotion(context);

    return Semantics(
      label: widget.semanticLabel ?? 'Carousel Pager',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CarouselSlider.builder(
            itemCount: widget.items.length,
            itemBuilder: (context, index, realIndex) {
              return widget.itemBuilder(context, widget.items[index], index);
            },
            options: CarouselOptions(
              height: widget.height,
              viewportFraction: widget.viewportFraction,
              enlargeCenterPage: !isReducedMotion,
              autoPlay: widget.autoPlay && !isReducedMotion,
              autoPlayInterval: widget.autoPlayInterval,
              enableInfiniteScroll: widget.infiniteScroll,
              initialPage: widget.initialPage,
              onPageChanged: (index, reason) {
                setState(() {
                  _currentIndex = index;
                });
                widget.onPageChanged?.call(index);
              },
            ),
          ),
          if (widget.showIndicators && widget.items.length > 1) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(widget.items.length, (index) {
                final isSelected = _currentIndex == index;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  margin: const EdgeInsets.symmetric(horizontal: 3.5),
                  height: 6.0,
                  width: isSelected ? 18.0 : 6.0,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Theme.of(context).colorScheme.primary
                        : Colors.grey.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(3.0),
                  ),
                );
              }),
            ),
          ],
        ],
      ),
    );
  }
}
