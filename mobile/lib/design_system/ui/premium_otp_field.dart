import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';
import 'app_theme.dart';

/// ============================================================================
/// PremiumOtpField — 6 centered animated boxes with auto-advance, backspace,
/// paste support, focus accent, shake-on-error and success highlight.
///
/// Drive error/success via [errorTrigger] and [success]:
///   - increment [errorTrigger] to play a shake animation
///   - set [success] true to turn all boxes green
/// ============================================================================
class PremiumOtpField extends StatefulWidget {
  final int length;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onCompleted;
  final int errorTrigger;
  final bool success;

  const PremiumOtpField({
    super.key,
    this.length = 6,
    this.onChanged,
    this.onCompleted,
    this.errorTrigger = 0,
    this.success = false,
  });

  @override
  State<PremiumOtpField> createState() => PremiumOtpFieldState();
}

class PremiumOtpFieldState extends State<PremiumOtpField>
    with SingleTickerProviderStateMixin {
  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _nodes;
  late final AnimationController _shake;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(widget.length, (_) => TextEditingController());
    _nodes = List.generate(widget.length, (_) => FocusNode());
    _shake = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
  }

  @override
  void didUpdateWidget(covariant PremiumOtpField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.errorTrigger != oldWidget.errorTrigger) {
      _shake.forward(from: 0);
      HapticFeedback.heavyImpact();
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final n in _nodes) {
      n.dispose();
    }
    _shake.dispose();
    super.dispose();
  }

  String get value => _controllers.map((c) => c.text).join();

  /// Clear all boxes (useful after a wrong code).
  void clear() {
    for (final c in _controllers) {
      c.clear();
    }
    _nodes.first.requestFocus();
    setState(() {});
  }

  void _distribute(String pasted, int startIndex) {
    final digits = pasted.replaceAll(RegExp(r'\D'), '');
    for (int i = 0; i < digits.length && startIndex + i < widget.length; i++) {
      _controllers[startIndex + i].text = digits[i];
    }
    final next = (startIndex + digits.length).clamp(0, widget.length - 1);
    _nodes[next].requestFocus();
    _emit();
  }

  void _emit() {
    final v = value;
    widget.onChanged?.call(v);
    if (v.length == widget.length &&
        _controllers.every((c) => c.text.isNotEmpty)) {
      FocusScope.of(context).unfocus();
      widget.onCompleted?.call(v);
    }
    setState(() {});
  }

  void _onChanged(int index, String value) {
    if (value.length > 1) {
      _distribute(value, index);
      return;
    }
    if (value.isNotEmpty && index < widget.length - 1) {
      _nodes[index + 1].requestFocus();
    }
    _emit();
  }

  KeyEventResult _onKey(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _nodes[index - 1].requestFocus();
      _controllers[index - 1].clear();
      _emit();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _shake,
      builder: (context, child) {
        final dx = _shake.isAnimating
            ? 8 * (1 - _shake.value) * math.sin(_shake.value * math.pi * 6)
            : 0.0;
        return Transform.translate(offset: Offset(dx, 0), child: child);
      },
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(widget.length, (i) => _box(i)),
      ),
    );
  }

  Widget _box(int index) {
    final brightness = Theme.of(context).brightness;
    final focused = _nodes[index].hasFocus;
    final filled = _controllers[index].text.isNotEmpty;

    Color borderColor = AppColors.border(brightness);
    if (widget.success) {
      borderColor = AppColors.success;
    } else if (focused) {
      borderColor = AppColors.primary;
    } else if (filled) {
      borderColor = AppColors.primarySoft;
    }

    return Focus(
      onKeyEvent: (node, event) => _onKey(index, event),
      child: Container(
        width: 48,
        height: 56,
        margin: const EdgeInsets.symmetric(horizontal: 5),
        decoration: BoxDecoration(
          color: widget.success
              ? AppColors.successSoft
              : AppColors.card(brightness),
          borderRadius: BorderRadius.circular(AppTheme.radiusSm),
          border: Border.all(color: borderColor, width: focused ? 1.8 : 1.2),
          boxShadow: focused
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.18),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: TextField(
            controller: _controllers[index],
            focusNode: _nodes[index],
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            maxLength: index == 0 ? widget.length : 1,
            showCursor: true,
            cursorColor: AppColors.primary,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: widget.success
                  ? AppColors.success
                  : AppColors.heading(brightness),
            ),
            decoration: const InputDecoration(
              counterText: '',
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
            ),
            onChanged: (v) => _onChanged(index, v),
          ),
        ),
      ),
    );
  }
}
