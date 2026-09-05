import 'dart:async';

import 'package:flutter/material.dart';

/// PremiumScaffold wraps app content with an animated premium background.
class PremiumScaffold extends StatefulWidget {
  final Widget child;
  const PremiumScaffold({super.key, required this.child});

  @override
  State<PremiumScaffold> createState() => _PremiumScaffoldState();
}

class _PremiumScaffoldState extends State<PremiumScaffold>
    with SingleTickerProviderStateMixin {
  Alignment _begin = Alignment.topLeft;
  Alignment _end = Alignment.bottomRight;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(
      const Duration(seconds: 6),
      (_) => _toggleGradient(),
    );
  }

  void _toggleGradient() {
    setState(() {
      if (_begin == Alignment.topLeft) {
        _begin = const Alignment(-0.8, -0.6);
        _end = const Alignment(0.8, 0.6);
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
                const Color(0xFF020617), // bgDeep
                const Color(0xFF0F172A).withValues(alpha: 0.9), // bgDark
                const Color(0xFF1E3A8A).withValues(alpha: 0.06), // indigo
              ],
            ),
          ),
        ),
        widget.child,
      ],
    );
  }
}
