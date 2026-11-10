import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:animated_icon/animated_icon.dart';
import '../../shared/widgets/modern_animated_icon.dart';
import 'app_colors.dart';

/// The model representing a single bottom navigation item.
class BottomNavItemData {
  final IconData icon;
  final IconData? activeIcon;
  final AnimateIcons? animateIcon;
  final String label;
  final String route;

  const BottomNavItemData({
    required this.icon,
    this.activeIcon,
    this.animateIcon,
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
    super.animateIcon,
    required super.label,
    super.route = '',
  });
}

/// ============================================================================
/// SmartBottomNav — Modern, premium floating bottom navigation bar with:
/// - Frosted glassmorphic surface with blur
/// - Spring-animated active indicator pill with subtle glow
/// - Bouncy icon scale + vertical float on active
/// - Smooth color transitions between states
/// - Ripple effect on tap with haptic feedback
/// - Responsive layout (hides labels on small screens)
/// - Gradient accent glow on active tab
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
    final brightness = dark ? Brightness.dark : Theme.of(context).brightness;
    final bool isDarkMode = brightness == Brightness.dark;

    const Color activeColor = AppColors.primary;
    final Color inactiveColor = isDarkMode
        ? const Color(0xFF5C6390)
        : const Color(0xFF8A90AE);
    final Color containerColor = isGlass
        ? (isDarkMode
              ? const Color(0xFF0A0F24).withValues(alpha: 0.78)
              : const Color(0xFFFFFFFF).withValues(alpha: 0.78))
        : (isDarkMode ? const Color(0xFF1A2040) : const Color(0xFFFFFFFF));
    final Color borderColor = isDarkMode
        ? const Color(0xFF1E2848).withValues(alpha: 0.6)
        : const Color(0xFFE5E7F0).withValues(alpha: 0.7);

    final double screenWidth = MediaQuery.of(context).size.width;
    final bool hideText = !showLabels || screenWidth < 320;
    final double horizontalMargin = screenWidth < 380 ? 8 : 16;
    final double internalPaddingHorizontal = screenWidth < 380 ? 6 : 12;
    final double barHeight = hideText ? 62.0 : 68.0;
    final double borderRadius = hideText ? 22.0 : 24.0;

    return SafeArea(
      top: false,
      minimum: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom > 0 ? 4 : 8,
      ),
      child: Container(
        margin: EdgeInsets.fromLTRB(
          horizontalMargin,
          0,
          horizontalMargin,
          hideText ? 4 : 6,
        ),
        height: barHeight,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(borderRadius),
          boxShadow: [
            BoxShadow(
              color: isDarkMode
                  ? Colors.black.withValues(alpha: 0.5)
                  : const Color(0xFF8794C8).withValues(alpha: 0.20),
              blurRadius: 32,
              offset: const Offset(0, 10),
              spreadRadius: 0,
            ),
            BoxShadow(
              color: isDarkMode
                  ? Colors.black.withValues(alpha: 0.3)
                  : const Color(0xFF4F46E5).withValues(alpha: 0.04),
              blurRadius: 16,
              offset: const Offset(0, 4),
              spreadRadius: 0,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius),
          child: BackdropFilter(
            filter: ImageFilter.blur(
              sigmaX: isGlass ? 20.0 : 0.0,
              sigmaY: isGlass ? 20.0 : 0.0,
            ),
            child: Container(
              padding: EdgeInsets.symmetric(
                horizontal: internalPaddingHorizontal,
              ),
              decoration: BoxDecoration(
                color: containerColor,
                borderRadius: BorderRadius.circular(borderRadius),
                border: Border.all(color: borderColor, width: 1.0),
              ),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final double width = constraints.maxWidth;
                  final int n = items.length;
                  final double itemWidth = width / n;

                  return Stack(
                    alignment: Alignment.centerLeft,
                    children: [
                      // ── Spring-Animated Active Indicator Pill ─────────
                      AnimatedPositioned(
                        duration: animationEnabled
                            ? const Duration(milliseconds: 260)
                            : Duration.zero,
                        curve: Curves.fastOutSlowIn,
                        left: currentIndex * itemWidth + 3,
                        width: itemWidth - 6,
                        top: 4,
                        bottom: 4,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                activeColor.withValues(alpha: 0.22),
                                activeColor.withValues(alpha: 0.08),
                              ],
                            ),
                            border: Border.all(
                              color: activeColor.withValues(alpha: 0.40),
                              width: 1.2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: activeColor.withValues(alpha: 0.16),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                                spreadRadius: 0.5,
                              ),
                            ],
                          ),
                        ),
                      ),

                      // ── Tab Items ─────────────────────────────────────
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: List.generate(items.length, (i) {
                          final item = items[i];
                          final selected = i == currentIndex;

                          return Expanded(
                            child: _NavItem(
                              item: item,
                              selected: selected,
                              hideText: hideText,
                              activeColor: activeColor,
                              inactiveColor: inactiveColor,
                              borderRadius: borderRadius,
                              animationEnabled: animationEnabled,
                              onTap: () {
                                if (currentIndex != i) {
                                  HapticFeedback.selectionClick();
                                  onTap(i);
                                }
                              },
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

/// Individual nav item with spring animations
class _NavItem extends StatefulWidget {
  final BottomNavItemData item;
  final bool selected;
  final bool hideText;
  final Color activeColor;
  final Color inactiveColor;
  final double borderRadius;
  final bool animationEnabled;
  final VoidCallback onTap;

  const _NavItem({
    required this.item,
    required this.selected,
    required this.hideText,
    required this.activeColor,
    required this.inactiveColor,
    required this.borderRadius,
    required this.animationEnabled,
    required this.onTap,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 260),
    );
    _pulseAnimation = CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeOutBack,
    );

    if (widget.selected) {
      _pulseController.forward(from: 0.0);
    }
  }

  @override
  void didUpdateWidget(covariant _NavItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selected && !oldWidget.selected) {
      _pulseController.forward(from: 0.0);
    } else if (!widget.selected && oldWidget.selected) {
      _pulseController.reverse();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: widget.onTap,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      borderRadius: BorderRadius.circular(widget.borderRadius - 6),
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, _) {
          final pulse = _pulseAnimation.value;
          final scale = 1.0 + (widget.selected ? pulse * 0.08 : 0.0);

          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                // ── Icon with subtle spring scale ─────────────────────
                Transform.scale(
                  scale: scale.clamp(1.0, 1.1),
                  child: widget.item.animateIcon != null
                      ? ModernAnimatedIcon(
                          animateIcon: widget.item.animateIcon!,
                          fallbackIcon: widget.selected
                              ? (widget.item.activeIcon ?? widget.item.icon)
                              : widget.item.icon,
                          size: widget.hideText ? 24 : 21,
                          activeColor: widget.activeColor,
                          inactiveColor: widget.inactiveColor,
                          isActive: widget.selected,
                          iconType: IconType.animatedOnTap,
                          semanticLabel: widget.item.label,
                          constraints: BoxConstraints.tightFor(
                            width: widget.hideText ? 24 : 21,
                            height: widget.hideText ? 24 : 21,
                          ),
                        )
                      : Icon(
                          widget.selected
                              ? (widget.item.activeIcon ?? widget.item.icon)
                              : widget.item.icon,
                          size: widget.hideText ? 24 : 21,
                          color: widget.selected
                              ? widget.activeColor
                              : widget.inactiveColor,
                        ),
                ),

                // ── Label with minimal gap, enclosed cleanly in box ────
                if (!widget.hideText) ...[
                  const SizedBox(height: 2.5),
                  AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 240),
                    curve: Curves.fastOutSlowIn,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 9.5,
                      height: 1.1,
                      fontWeight: widget.selected
                          ? FontWeight.w700
                          : FontWeight.w500,
                      letterSpacing: widget.selected ? 0.15 : 0.05,
                      color: widget.selected
                          ? widget.activeColor
                          : widget.inactiveColor,
                    ),
                    child: Text(
                      widget.item.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

/// ============================================================================
/// TabTransitionWrapper — premium spring-slide + fade transition for shell tabs.
/// Preserves state inside IndexedStack with smooth motion on tab switches.
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
      duration: const Duration(milliseconds: 350),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Cubic(0.16, 1.0, 0.3, 1.0),
    );
    _slideAnimation =
        Tween<Offset>(
          begin: const Offset(0.035, 0.0),
          end: Offset.zero,
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Cubic(0.16, 1.0, 0.3, 1.0),
          ),
        );
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
      child: SlideTransition(position: _slideAnimation, child: widget.child),
    );
  }
}
