import 'dart:async';
import 'package:flutter/material.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';

/// Premium custom refresh indicator featuring a looping glowing neon bar
/// that pulses during reload operations, replacing default material spinners.
class GlowRefreshIndicator extends StatefulWidget {
  final Widget child;
  final Future<void> Function() onRefresh;

  const GlowRefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
  });

  @override
  State<GlowRefreshIndicator> createState() => _GlowRefreshIndicatorState();
}

class _GlowRefreshIndicatorState extends State<GlowRefreshIndicator>
    with SingleTickerProviderStateMixin {
  double _dragOffset = 0.0;
  bool _isRefreshing = false;
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _startRefreshing() async {
    if (_isRefreshing) return;
    setState(() {
      _isRefreshing = true;
    });
    _pulseController.repeat(reverse: true);
    try {
      await widget.onRefresh();
    } finally {
      if (mounted) {
        setState(() {
          _isRefreshing = false;
          _dragOffset = 0.0;
        });
        _pulseController.stop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appColors = theme.extension<DarkAppColors>();
    final primaryColor = appColors?.primary ?? const Color(0xFF2563EB);
    final glowColor = appColors?.primaryGlow ?? const Color(0x332563EB);

    const double triggerThreshold = 80.0;

    return NotificationListener<ScrollNotification>(
      onNotification: (ScrollNotification notification) {
        if (_isRefreshing) return false;

        if (notification is ScrollUpdateNotification) {
          final pixels = notification.metrics.pixels;
          if (pixels < 0) {
            setState(() {
              _dragOffset = -pixels;
            });
          }
        } else if (notification is OverscrollNotification) {
          final overscroll = notification.overscroll;
          if (overscroll < 0) {
            setState(() {
              _dragOffset -= overscroll;
            });
          }
        } else if (notification is ScrollEndNotification) {
          if (_dragOffset >= triggerThreshold) {
            _startRefreshing();
          } else {
            setState(() {
              _dragOffset = 0.0;
            });
          }
        }
        return false;
      },
      child: Stack(
        children: [
          widget.child,
          if (_dragOffset > 0 || _isRefreshing)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final progress = (_dragOffset / triggerThreshold).clamp(0.0, 1.0);
                  final pulseValue = _isRefreshing ? _pulseController.value : 1.0;
                  final height = _isRefreshing ? 4.0 : (progress * 4.0);

                  return Container(
                    height: height,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: primaryColor.withValues(alpha: pulseValue * 0.85),
                      boxShadow: [
                        BoxShadow(
                          color: glowColor.withValues(alpha: pulseValue * 0.65),
                          blurRadius: _isRefreshing ? 14.0 : (progress * 14.0),
                          spreadRadius: _isRefreshing ? 2.5 : (progress * 2.5),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
