import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'primary_button.dart';

/// ============================================================================
/// ErrorState — friendly empty / error placeholder with an optional retry.
/// ============================================================================
class ErrorState extends StatelessWidget {
  final String title;
  final String? message;
  final IconData icon;
  final VoidCallback? onRetry;
  final String retryLabel;

  const ErrorState({
    super.key,
    this.title = 'Something went wrong',
    this.message,
    this.icon = Icons.cloud_off_rounded,
    this.onRetry,
    this.retryLabel = 'Try again',
  });

  /// Empty-list variant.
  const ErrorState.empty({
    super.key,
    this.title = 'Nothing here yet',
    this.message,
    this.icon = Icons.inbox_outlined,
    this.onRetry,
    this.retryLabel = 'Refresh',
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.10),
              ),
              child: Icon(icon, size: 40, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.heading(brightness),
              ),
            ),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: AppColors.muted(brightness),
                ),
              ),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: 22),
              PrimaryButton(
                text: retryLabel,
                icon: Icons.refresh_rounded,
                expand: false,
                onPressed: onRetry,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
