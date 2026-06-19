import 'dart:async';

import 'package:flutter/material.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// PremiumScaffold wraps app content with an animated premium background.
class PremiumScaffold extends StatefulWidget {
  final Widget child;
  const PremiumScaffold({super.key, required this.child});

  @override
  State<PremiumScaffold> createState() => _PremiumScaffoldState();
}

class _PremiumScaffoldState extends State<PremiumScaffold> with SingleTickerProviderStateMixin {
  Alignment _begin = Alignment.topLeft;
  Alignment _end = Alignment.bottomRight;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 6), (_) => _toggleGradient());
  }

  void _toggleGradient() {
    setState(() {
      if (_begin == Alignment.topLeft) {
        _begin = Alignment(-0.8, -0.6);
        _end = Alignment(0.8, 0.6);
      } else {
        _begin = Alignment.topLeft;
        _end = Alignment.bottomRight;
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        AnimatedContainer(
          duration: const Duration(seconds: 6),
          curve: Curves.easeInOut,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: _begin,
              end: _end,
              colors: [
                AppColors.bgDeep,
                AppColors.bgDark.withOpacity(0.9),
                AppColors.indigo.withOpacity(0.06),
              ],
            ),
          ),
        ),
        widget.child,
      ],
    );
  }
}
