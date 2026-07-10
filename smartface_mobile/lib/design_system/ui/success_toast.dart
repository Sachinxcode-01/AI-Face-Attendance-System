import 'package:flutter/material.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';

/// ============================================================================
/// SuccessToast — Helper utility to show success toasts matching the theme.
/// Refers back to the central thread-safe queue-based AppToast controller.
/// ============================================================================
class SuccessToast {
  SuccessToast._();

  /// Displays a success toast overlay.
  static void show(BuildContext context, String message, {String? title, Duration duration = const Duration(seconds: 3)}) {
    AppToast.show(
      context,
      message: message,
      title: title,
      type: ToastType.success,
      duration: duration,
    );
  }
}
