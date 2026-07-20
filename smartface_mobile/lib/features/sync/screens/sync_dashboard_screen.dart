/*
|--------------------------------------------------------------------------
| File: sync_dashboard_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Premium analytics and management screen for the offline sync engine.
| Provides real-time metrics, logs, and queue maintenance tools.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/features/sync/controllers/sync_controller.dart';
import 'package:smartface_attendance/features/sync/models/attendance_queue_record.dart';
import 'package:smartface_attendance/features/sync/widgets/sync_dashboard_card.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class SyncDashboardScreen extends StatelessWidget {
  const SyncDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDeep,
      appBar: PremiumAppBar(
        title: 'Offline Sync Engine',
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Consumer<SyncController>(
          builder: (context, controller, child) {
            final history = controller.queueHistory;

            return ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: [
                // Dashboard summary card
                const SyncDashboardCard(),
                const SizedBox(height: AppSpacing.lg),

                // Control Buttons
                if (controller.failedCount > 0) ...[
                  Row(
                    children: [
                      Expanded(
                        child: TextButton.icon(
                          onPressed: controller.isSyncing
                              ? null
                              : () => controller.retryFailed(),
                          icon: const Icon(Icons.replay_rounded, size: 18),
                          label: const Text('Retry Failed'),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.gold,
                            backgroundColor: AppColors.gold.withValues(
                              alpha: 0.1,
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextButton.icon(
                          onPressed: controller.isSyncing
                              ? null
                              : () => controller.clearFailed(),
                          icon: const Icon(
                            Icons.delete_sweep_rounded,
                            size: 18,
                          ),
                          label: const Text('Clear Failed'),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.red.shade400,
                            backgroundColor: Colors.red.shade400.withValues(
                              alpha: 0.1,
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.lg),
                ],

                // Logs Header
                Text(
                  'SYNC QUEUE LOGS (${history.length})',
                  style: GoogleFonts.outfit(
                    color: Colors.white54,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // History Logs
                if (history.isEmpty)
                  _buildEmptyState()
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: history.length,
                    separatorBuilder: (_, index) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      return _buildQueueLogTile(context, history[index]);
                    },
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 32),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        children: [
          // Animated cloud icon with glow
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.success.withValues(alpha: 0.08),
              border: Border.all(
                color: AppColors.success.withValues(alpha: 0.15),
              ),
            ),
            child: const Icon(
              Icons.cloud_done_rounded,
              color: AppColors.success,
              size: 40,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'All Synced Up!',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your attendance queue is clear. Offline scans\nwill appear here automatically when captured.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              color: Colors.white38,
              fontSize: 13,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          // Status pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppColors.success.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Engine Ready',
                  style: GoogleFonts.inter(
                    color: AppColors.success,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQueueLogTile(
    BuildContext context,
    AttendanceQueueRecord record,
  ) {
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (record.syncStatus) {
      case SyncStatus.synced:
        statusColor = AppColors.success;
        statusIcon = Icons.check_circle_outline_rounded;
        statusText = 'Synced';
        break;
      case SyncStatus.pending:
        statusColor = AppColors.gold;
        statusIcon = Icons.hourglass_empty_rounded;
        statusText = 'Pending';
        break;
      case SyncStatus.syncing:
        statusColor = AppColors.accent;
        statusIcon = Icons.sync_rounded;
        statusText = 'Syncing';
        break;
      case SyncStatus.failed:
        statusColor = Colors.red.shade400;
        statusIcon = Icons.error_outline_rounded;
        statusText = 'Failed (Try ${record.retryCount})';
        break;
    }

    final formattedTime = DateFormat(
      'MMM dd, hh:mm a',
    ).format(record.timestamp);

    return GlassContainer(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderColor: statusColor.withValues(alpha: 0.15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Session: ${record.sessionId}',
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, color: statusColor, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      statusText,
                      style: GoogleFonts.inter(
                        color: statusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Detail list
          _buildDetailRow('Student', record.studentEmail),
          const SizedBox(height: 4),
          _buildDetailRow('Timestamp', formattedTime),
          const SizedBox(height: 4),
          _buildDetailRow('Method', record.verificationMethod.toUpperCase()),

          // Error / Server response
          if (record.serverResponse != null &&
              record.syncStatus == SyncStatus.failed) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.shade900.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: Colors.red.shade900.withValues(alpha: 0.2),
                ),
              ),
              child: Text(
                'Server Response: ${record.serverResponse}',
                style: GoogleFonts.inter(
                  color: Colors.red.shade200,
                  fontSize: 11,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(color: Colors.white38, fontSize: 12),
        ),
        Text(
          value,
          style: GoogleFonts.inter(
            color: Colors.white70,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
