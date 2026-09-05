/*
|--------------------------------------------------------------------------
| File: sync_status_banner.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Premium animated status banner that displays the current offline queue
| and network sync state with high-fidelity visual indicators.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/sync/controllers/sync_controller.dart';
import 'package:smartface_attendance/features/sync/models/sync_state.dart';

class SyncStatusBanner extends StatelessWidget {
  const SyncStatusBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SyncController>(
      builder: (context, controller, child) {
        // Decide what state to render
        final connectivity = controller.connectivity;
        final pending = controller.pendingCount;
        final failed = controller.failedCount;
        final isSyncing = controller.isSyncing;

        // If completely synced and online, we don't necessarily need an intrusive banner,
        // but let's show a beautiful, slim badge or banner that collapses nicely.
        // Let's create specific states.
        Widget bannerContent;
        Color bannerColor;
        Color textColor;
        IconData iconData;
        String message;
        bool shouldPulse = false;
        // Always allow navigation to Sync Dashboard on tap
        void onTap() {
          context.push('/settings/sync');
        }

        if (connectivity == ConnectivityStatus.offline) {
          bannerColor = Colors.grey.shade900.withValues(alpha: 0.8);
          textColor = Colors.grey.shade400;
          iconData = Icons.cloud_off_rounded;
          message = 'Offline Mode — Attendance will queue locally';
        } else if (isSyncing) {
          bannerColor = AppColors.accent.withValues(alpha: 0.15);
          textColor = AppColors.accent;
          iconData = Icons.sync_rounded;
          message = 'Syncing attendance records...';
          shouldPulse = true;
        } else if (failed > 0) {
          bannerColor = Colors.red.shade900.withValues(alpha: 0.2);
          textColor = Colors.red.shade400;
          iconData = Icons.warning_amber_rounded;
          message = '$failed sync failed. Tap to retry.';
        } else if (pending > 0) {
          bannerColor = AppColors.gold.withValues(alpha: 0.15);
          textColor = AppColors.gold;
          iconData = Icons.hourglass_empty_rounded;
          message = '$pending records pending sync';
          shouldPulse = true;
        } else {
          // All Synced - return a very subtle, slim green banner
          bannerColor = AppColors.success.withValues(alpha: 0.1);
          textColor = AppColors.success;
          iconData = Icons.check_circle_outline_rounded;
          message = 'All changes synced';
        }

        bannerContent = InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _buildAnimatedIcon(iconData, textColor, shouldPulse),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    message,
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: textColor.withValues(alpha: 0.6),
                  size: 20,
                ),
              ],
            ),
          ),
        );

        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: Container(
            key: ValueKey(
              '${connectivity.name}_${pending}_${failed}_$isSyncing',
            ),
            margin: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: bannerColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: textColor.withValues(alpha: 0.25),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: textColor.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: bannerContent,
          ),
        );
      },
    );
  }

  Widget _buildAnimatedIcon(IconData icon, Color color, bool shouldPulse) {
    final iconWidget = Icon(icon, color: color, size: 20);

    if (shouldPulse) {
      if (icon == Icons.sync_rounded) {
        return iconWidget
            .animate(onPlay: (controller) => controller.repeat())
            .rotate(duration: const Duration(seconds: 2));
      }
      return iconWidget
          .animate(onPlay: (controller) => controller.repeat(reverse: true))
          .scale(
            begin: const Offset(0.9, 0.9),
            end: const Offset(1.1, 1.1),
            duration: const Duration(milliseconds: 800),
            curve: Curves.easeInOut,
          )
          .then()
          .fadeOut(duration: const Duration(milliseconds: 200))
          .fadeIn(duration: const Duration(milliseconds: 200));
    }

    return iconWidget;
  }
}
