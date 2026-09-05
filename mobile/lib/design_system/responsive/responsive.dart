import 'package:flutter/widgets.dart';

/// Responsive helpers & breakpoints
class Breakpoints {
  static const double mobile = 600;
  static const double tablet = 1024;
}

class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget tablet;
  final Widget desktop;
  const ResponsiveLayout({
    super.key,
    required this.mobile,
    Widget? tablet,
    Widget? desktop,
  }) : tablet = tablet ?? mobile,
       desktop = desktop ?? tablet ?? mobile;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        if (w >= Breakpoints.tablet) return desktop;
        if (w >= Breakpoints.mobile) return tablet;
        return mobile;
      },
    );
  }
}
