import 'dart:async';
import 'package:flutter/material.dart';

/// Lightweight overlay toast used for premium UI.
void showPremiumToast(BuildContext context, String message, {Duration duration = const Duration(seconds: 3)}) {
  final overlay = Overlay.of(context);

  final entry = OverlayEntry(
    builder: (context) => Positioned(
      bottom: 24,
      left: 24,
      right: 24,
      child: Material(
        color: Colors.transparent,
        child: AnimatedOpacity(
          opacity: 1.0,
          duration: const Duration(milliseconds: 300),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.black87,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(message, style: const TextStyle(color: Colors.white)),
          ),
        ),
      ),
    ),
  );

  overlay.insert(entry);
  Timer(duration, () => entry.remove());
}
