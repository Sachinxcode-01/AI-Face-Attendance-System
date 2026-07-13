import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_colors.dart';

/// The model representing a single bottom navigation item.
class BottomNavItemData {
  final IconData icon;
  final IconData? activeIcon;
  final String label;
  final String route;

  const BottomNavItemData({
    required this.icon,
    this.activeIcon,
    required this.label,
    required this.route,
  });
}

/// Backwards-compatible subclass of [BottomNavItemData] to prevent breaking other views
/// that still reference [SmartNavItem].
class SmartNavItem extends BottomNavItemData {
  const SmartNavItem({
    required super.icon,
    super.activeIcon,
    required super.label,
    super.route = '',
  });
}

/// ============================================================================
/// SmartBottomNav — Redesigned floating, premium bottom navigation bar:
/// glassmorphic frosted surface, soft shadow, sliding background active indicator,
/// responsive widths, active tab micro-animations, and haptic feedback.
/// ============================================================================
class SmartBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<BottomNavItemData> items;
  final String role;
  final bool showLabels;
  final bool isGlass;
  final bool animationEnabled;
  final bool dark;

  const SmartBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
    this.role = 'unknown',
    this.showLabels = true,
    this.isGlass = true,
    this.animationEnabled = true,
    this.dark = false,
  });

  @override
  Widget build(BuildContext context) {
    final Brightness brightness = dark ? Brightness.dark : Theme.of(context).brightness;
    final bool isDarkMode = brightness == Brightness.dark;

    // Premium Color Palette
    const Color activeColor = AppColors.primary;
    final Color inactiveColor = isDarkMode ? const Color(0xFF8B91B4) : const Color(0xFF8A90AE);
    final Color containerColor = isGlass
        ? (isDarkMode
            ? const Color(0xFF0F172A).withValues(alpha: 0.65)
            : const Color(0xFFFFFFFF).withValues(alpha: 0.72))
        : (isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFFFFFFF));

    final double screenWidth = MediaQuery.of(context).size.width;
    // Responsive adjustments
    final bool hideText = !showLabels || screenWidth < 350;
    final double horizontalMargin = screenWidth < 380 ? 12 : 16;
    final double internalPaddingHorizontal = screenWidth < 380 ? 8 : 12;
    final double barHeight = hideText ? 64.0 : 74.0;
    final double borderRadius = screenWidth < 380 ? 24.0 : 28.0;

    return SafeArea(
      top: false,
      child: Container(
        margin: EdgeInsets.fromLTRB(horizontalMargin, 0, horizontalMargin, 12),
        height: barHeight,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(borderRadius),
          boxShadow: [
            BoxShadow(
              color: isDarkMode
                  ? Colors.black.withValues(alpha: 0.35)
                  : const Color(0xFF8794C8).withValues(alpha: 0.18),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius),
          child: BackdropFilter(
            filter: ImageFilter.blur(
              sigmaX: isGlass ? 18.0 : 0.0,
              sigmaY: isGlass ? 18.0 : 0.0,
            ),
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: internalPaddingHorizontal),
              decoration: BoxDecoration(
                color: containerColor,
                borderRadius: BorderRadius.circular(borderRadius),
                border: Border.all(
                  color: isDarkMode
                      ? const Color(0xFF2C3560).withValues(alpha: 0.4)
                      : const Color(0xFFE6E8F2).withValues(alpha: 0.7),
                  width: 1.2,
                ),
              ),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final double width = constraints.maxWidth;
                  final int n = items.length;
                  final double itemWidth = width / n;

                  return Stack(
                    alignment: Alignment.centerLeft,
                    children: [
                      // Sliding Active Highlight Pill
                      AnimatedPositioned(
                        duration: animationEnabled
                            ? const Duration(milliseconds: 320)
                            : Duration.zero,
                        curve: Curves.easeOutCubic,
                        left: currentIndex * itemWidth + 4,
                        width: itemWidth - 8,
                        top: 6,
                        bottom: 6,
                        child: Container(
                          decoration: BoxDecoration(
                            color: activeColor.withValues(alpha: 0.09),
                            borderRadius: BorderRadius.circular(borderRadius - 8),
                            border: Border.all(
                              color: activeColor.withValues(alpha: 0.15),
                              width: 1.0,
                            ),
                          ),
                        ),
                      ),
                      // Tab Items Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: List.generate(items.length, (i) {
                          final item = items[i];
                          final selected = i == currentIndex;

                          return Expanded(
                            child: InkWell(
                              onTap: () {
                                if (currentIndex != i) {
                                  HapticFeedback.selectionClick();
                                  onTap(i);
                                }
                              },
                              splashColor: Colors.transparent,
                              highlightColor: Colors.transparent,
                              borderRadius: BorderRadius.circular(borderRadius - 8),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  // Icon Micro-Animation
                                  AnimatedScale(
                                    scale: selected ? 1.15 : 1.0,
                                    duration: const Duration(milliseconds: 240),
                                    curve: Curves.easeOutBack,
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 240),
                                      transform: Matrix4.translationValues(
                                        0.0,
                                        selected && !hideText ? -2.0 : 0.0,
                                        0.0,
                                      ),
                                      child: Icon(
                                        selected ? (item.activeIcon ?? item.icon) : item.icon,
                                        size: hideText ? 24 : 22,
                                        color: selected ? activeColor : inactiveColor,
                                      ),
                                    ),
                                  ),
                                  if (!hideText) ...[
                                    const SizedBox(height: 3),
                                    // Text micro-fade / slide transition
                                    AnimatedDefaultTextStyle(
                                      duration: const Duration(milliseconds: 240),
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontSize: 9.5,
                                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                                        letterSpacing: 0.1,
                                        color: selected ? activeColor : inactiveColor,
                                      ),
                                      child: Text(
                                        item.label,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        }),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// ============================================================================
/// TabTransitionWrapper — unified light slide + fade transition for shell tab switches.
/// Preserves state inside IndexedStack, but refreshes screen visibility with motion.
/// ============================================================================
class TabTransitionWrapper extends StatefulWidget {
  final Widget child;
  final int index;
  final bool enabled;

  const TabTransitionWrapper({
    super.key,
    required this.child,
    required this.index,
    this.enabled = true,
  });

  @override
  State<TabTransitionWrapper> createState() => _TabTransitionWrapperState();
}

class _TabTransitionWrapperState extends State<TabTransitionWrapper>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 260),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.03, 0.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));
    _controller.forward(from: 0.0);
  }

  @override
  void didUpdateWidget(covariant TabTransitionWrapper oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.index != oldWidget.index) {
      if (widget.enabled) {
        _controller.forward(from: 0.0);
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
    if (!widget.enabled) return widget.child;
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: widget.child,
      ),
    );
  }
}
