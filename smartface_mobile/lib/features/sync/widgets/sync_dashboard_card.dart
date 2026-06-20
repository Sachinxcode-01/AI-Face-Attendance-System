/*
|--------------------------------------------------------------------------
| File: sync_dashboard_card.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| High-fidelity dashboard card component displaying local queue metrics,
| network connectivity, success rates, and quick action controls.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/features/sync/controllers/sync_controller.dart';
import 'package:smartface_attendance/features/sync/models/sync_state.dart';

class SyncDashboardCard extends StatelessWidget {
  const SyncDashboardCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<SyncController>(
      builder: (context, controller, child) {
        final lastSyncStr = controller.lastSyncTime != null
            ? DateFormat('hh:mm a').format(controller.lastSyncTime!)
            : 'Never';

        final avgDurationStr = controller.averageSyncDuration != null
            ? '${controller.averageSyncDuration!.toStringAsFixed(0)}ms'
            : 'N/A';

        final successRateStr = '${controller.successRate.toStringAsFixed(1)}%';

        return GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.lg),
          borderColor: controller.isSyncing
              ? AppColors.accent.withValues(alpha: 0.3)
              : AppColors.success.withValues(alpha: 0.2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'OFFLINE ENGINE',
                        style: GoogleFonts.outfit(
                          color: AppColors.gold,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            controller.connectivity == ConnectivityStatus.offline
                                ? Icons.cloud_off_rounded
                                : Icons.cloud_done_rounded,
                            color: controller.connectivity == ConnectivityStatus.offline
                                ? Colors.grey
                                : AppColors.success,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            controller.connectivity == ConnectivityStatus.offline
                                ? 'Offline mode active'
                                : controller.isSyncing
                                    ? 'Synchronizing...'
                                    : 'Connected & secure',
                            style: GoogleFonts.outfit(
                              color: isDark ? Colors.white70 : Colors.black87,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  _buildSyncButton(context, controller),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),

              // Metrics Row (Pending, Failed, Synced)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildMiniMetric(
                    context,
                    label: 'Pending',
                    value: controller.pendingCount.toString(),
                    color: AppColors.gold,
                    icon: Icons.hourglass_empty_rounded,
                  ),
                  _buildMiniMetric(
                    context,
                    label: 'Failed',
                    value: controller.failedCount.toString(),
                    color: Colors.red.shade400,
                    icon: Icons.error_outline_rounded,
                  ),
                  _buildMiniMetric(
                    context,
                    label: 'Synced',
                    value: controller.syncedCount.toString(),
                    color: AppColors.success,
                    icon: Icons.check_circle_outline_rounded,
                  ),
                ],
              ),
              const Divider(color: Colors.white12, height: AppSpacing.lg),

              // Meta metrics (Avg duration, Success rate, Last sync)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildMetaText('Last Sync', lastSyncStr),
                  _buildMetaText('Avg Latency', avgDurationStr),
                  _buildMetaText('Success Rate', successRateStr),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMiniMetric(
    BuildContext context, {
    required String label,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: color.withValues(alpha: 0.8), size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              color: Colors.white54,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaText(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            color: Colors.white38,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.outfit(
            color: Colors.white70,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildSyncButton(BuildContext context, SyncController controller) {
    final isSyncing = controller.isSyncing;
    return Container(
      decoration: BoxDecoration(
        color: isSyncing ? AppColors.accent.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.05),
        shape: BoxShape.circle,
        border: Border.all(
          color: isSyncing ? AppColors.accent.withValues(alpha: 0.3) : Colors.white12,
        ),
      ),
      child: IconButton(
        icon: Icon(
          isSyncing ? Icons.sync_rounded : Icons.refresh_rounded,
          color: isSyncing ? AppColors.accent : Colors.white70,
        ),
        onPressed: isSyncing || controller.connectivity == ConnectivityStatus.offline
            ? null
            : () => controller.syncNow(),
      ),
    );
  }
}
