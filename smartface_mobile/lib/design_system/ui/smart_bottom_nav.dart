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
    final bool hideText = !showLabels || screenWidth < 360;
    final double horizontalMargin = screenWidth < 380 ? 8 : 16;
    final double internalPaddingHorizontal = screenWidth < 380 ? 6 : 12;
    final double barHeight = hideText ? 62.0 : 72.0;
    final double borderRadius = hideText ? 22.0 : 26.0;

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
                            ? const Duration(milliseconds: 400)
                            : Duration.zero,
                        curve: Curves.easeOutCubic,
                        left: currentIndex * itemWidth + 4,
                        width: itemWidth - 8,
                        top: hideText ? 4 : 3,
                        bottom: hideText ? 4 : 3,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(
                              borderRadius - 6,
                            ),
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                activeColor.withValues(alpha: 0.15),
                                activeColor.withValues(alpha: 0.05),
                              ],
                            ),
                            border: Border.all(
                              color: activeColor.withValues(alpha: 0.18),
                              width: 1.0,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: activeColor.withValues(alpha: 0.10),
                                blurRadius: 12,
                                offset: const Offset(0, 0),
                                spreadRadius: 0,
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
      duration: const Duration(milliseconds: 400),
    );
    _pulseAnimation = CurvedAnimation(
      parent: _pulseController,
      curve: Curves.elasticOut,
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
          final scale = 1.0 + (widget.selected ? pulse * 0.15 : 0.0);
          final translateY = widget.selected && !widget.hideText
              ? -2.0 * pulse
              : 0.0;

          return Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // ── Icon with spring animation ─────────────────────────
              Transform.translate(
                offset: Offset(0, translateY),
                child: Transform.scale(
                  scale: scale.clamp(1.0, 1.2),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutCubic,
                    padding: EdgeInsets.all(
                      widget.selected && !widget.hideText ? 2 : 0,
                    ),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: widget.selected
                          ? [
                              BoxShadow(
                                color: widget.activeColor.withValues(
                                  alpha: 0.20,
                                ),
                                blurRadius: pulse * 12,
                                spreadRadius: pulse * 2,
                              ),
                            ]
                          : null,
                    ),
                    child: Icon(
                      widget.selected
                          ? (widget.item.activeIcon ?? widget.item.icon)
                          : widget.item.icon,
                      size: widget.hideText ? 24 : 22,
                      color: widget.selected
                          ? widget.activeColor
                          : widget.inactiveColor,
                      shadows: widget.selected
                          ? [
                              Shadow(
                                color: widget.activeColor.withValues(
                                  alpha: 0.3,
                                ),
                                blurRadius: 4,
                              ),
                            ]
                          : null,
                    ),
                  ),
                ),
              ),

              // ── Label with color/shadow transition ──────────────────
              if (!widget.hideText) ...[
                const SizedBox(height: 4),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 9.5,
                    fontWeight: widget.selected
                        ? FontWeight.w700
                        : FontWeight.w500,
                    letterSpacing: widget.selected ? 0.2 : 0.1,
                    color: widget.selected
                        ? widget.activeColor
                        : widget.inactiveColor,
                  ),
                  child: Text(
                    widget.item.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
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
