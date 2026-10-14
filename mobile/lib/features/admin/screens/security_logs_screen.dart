/*
|--------------------------------------------------------------------------
| File: security_logs_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the Intruder Detection Center screen for teachers and faculty.
| Fetches and displays security logs detailing suspected intruder incidents.
|
| Responsibilities:
| - Fetches lists of security/intruder logs from ApiService.getSecurityLogs.
| - Renders logs in interactive glassmorphic cards, showing image snapshot if available.
| - Supports pinch-to-zoom Dialog modal for analyzing captured intruder snapshots.
| - Triggers acknowledgment actions via ApiService.acknowledgeIntruderAlert.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter_animate/flutter_animate.dart
| - package:google_fonts/google_fonts.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/data/services/api_service.dart
| - package:smartface_attendance/shared/widgets/shimmer_loader.dart
| - package:smartface_attendance/shared/widgets/glassmorphic_card.dart
|--------------------------------------------------------------------------
*/

// ======================================================
// Standard Library & Typed Data Imports
// ======================================================
import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

// ======================================================
// External Packages
// ======================================================
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

// ======================================================
// Core State & Constants
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

// ======================================================
// Services & Widgets
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/glassmorphic_card.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// Screen displaying a security log dashboard for managing dynamic threat detections and intruders.
class SecurityLogsScreen extends StatefulWidget {
  const SecurityLogsScreen({super.key});

  @override
  State<SecurityLogsScreen> createState() => _SecurityLogsScreenState();
}

class _SecurityLogsScreenState extends State<SecurityLogsScreen> {
  bool _isLoading = true;
  List<dynamic> _logs = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadLogs();
      }
    });
  }

  Future<void> _loadLogs() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final session = context.read<SessionManager>();
      if (session.token == null) return;

      final logsList = await ApiService.getSecurityLogs();
      if (mounted) {
        setState(() {
          _logs = logsList;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading security logs: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _acknowledgeAlert(String logId) async {
    try {
      final session = context.read<SessionManager>();
      if (session.token == null) return;

      final result = await ApiService.acknowledgeIntruderAlert(
        logId,
        session.token!,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message'] ?? 'Alert acknowledged successfully',
            ),
            backgroundColor: const Color(0xFF0C1033),
          ),
        );
        _loadLogs();
      }
    } catch (e) {
      debugPrint('Acknowledge alert error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuroraBackground(
      baseColor: AppColors.bgDark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Intruder Detection Center',
          leading: IconButton(
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: AppColors.gold),
              onPressed: _loadLogs,
            ),
          ],
        ),
        body: _isLoading
            ? const NotificationShimmer()
            : RefreshIndicator(
                onRefresh: _loadLogs,
                color: AppColors.gold,
                backgroundColor: const Color(0xFF070B1A),
                child: _logs.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(20),
                        itemCount: _logs.length,
                        itemBuilder: (context, index) {
                          final log = _logs[index];
                          return _buildSecurityLogItem(log);
                        },
                      ),
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.7,
        alignment: Alignment.center,
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.verified_user_rounded,
              color: Colors.greenAccent,
              size: 70,
            ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 2.seconds),
            const SizedBox(height: 20),
            Text(
              'FACULTY CAMERA NETWORK SECURE',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Zero suspicious active threat signatures detected.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: Colors.white38, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecurityLogItem(Map<String, dynamic> log) {
    final logId = log['id'] ?? '';
    final location = log['location'] ?? 'Unknown Location';
    final type = log['type'] ?? 'intruder';
    final timestamp = log['timestamp'] ?? '';
    final status = log['status'] ?? 'Active';
    final base64Image = log['image_base64'] as String?;

    final isAcknow = status == 'Acknowledged';
    final dateStr = timestamp.split('T')[0];
    final timeStr = timestamp.contains('T')
        ? timestamp.split('T')[1].substring(0, 5)
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      child: GlassmorphicCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.warning_amber_rounded,
                      color: isAcknow
                          ? Colors.greenAccent
                          : const Color(0xFFF05050),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      type.toString().toUpperCase(),
                      style: GoogleFonts.inter(
                        color: isAcknow
                            ? Colors.greenAccent
                            : const Color(0xFFF05050),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color:
                        (isAcknow
                                ? Colors.greenAccent
                                : const Color(0xFFF05050))
                            .withValues(alpha: 0.1),
                    border: Border.all(
                      color:
                          (isAcknow
                                  ? Colors.greenAccent
                                  : const Color(0xFFF05050))
                              .withValues(alpha: 0.3),
                    ),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    status.toString().toUpperCase(),
                    style: TextStyle(
                      color: isAcknow
                          ? Colors.greenAccent
                          : const Color(0xFFF05050),
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Image Snapshot Preview
            if (base64Image != null && base64Image.isNotEmpty)
              GestureDetector(
                onTap: () => _showPinchZoomDialog(base64Image),
                child: Container(
                  height: 180,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.1),
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: _buildBase64Image(base64Image),
                  ),
                ),
              )
            else
              Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.02),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.broken_image_rounded,
                      color: Colors.white24,
                      size: 36,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'IMAGE CAPTURE CORRUPTED OR INCOMPLETE',
                      style: TextStyle(
                        color: Colors.white24,
                        fontSize: 8,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      location,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Detected: $dateStr at $timeStr',
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
                if (!isAcknow)
                  ElevatedButton(
                    onPressed: () => _acknowledgeAlert(logId),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white.withValues(alpha: 0.05),
                      foregroundColor: AppColors.gold,
                      side: const BorderSide(color: AppColors.gold, width: 1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                    child: const Text(
                      'ACKNOWLEDGE',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBase64Image(String base64Str) {
    try {
      final cleanBase64 = base64Str.contains(',')
          ? base64Str.split(',')[1]
          : base64Str;
      Uint8List bytes = base64Decode(cleanBase64.trim());
      return Image.memory(
        bytes,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return const Center(
            child: Icon(Icons.broken_image_rounded, color: Colors.white24),
          );
        },
      );
    } catch (e) {
      return const Center(
        child: Icon(Icons.broken_image_rounded, color: Colors.white24),
      );
    }
  }

  void _showPinchZoomDialog(String base64Str) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: const EdgeInsets.all(10),
        child: Stack(
          alignment: Alignment.center,
          children: [
            InteractiveViewer(
              panEnabled: true,
              boundaryMargin: const EdgeInsets.all(20),
              minScale: 0.5,
              maxScale: 4.0,
              child: _buildBase64Image(base64Str),
            ),
            Positioned(
              top: 20,
              right: 20,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
