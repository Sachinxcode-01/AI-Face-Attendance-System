import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../core/session_manager.dart';
import '../../services/notification_service.dart';
import 'dart:async';

class LiveMonitorScreen extends StatefulWidget {
  const LiveMonitorScreen({super.key});

  @override
  State<LiveMonitorScreen> createState() => _LiveMonitorScreenState();
}

class _LiveMonitorScreenState extends State<LiveMonitorScreen> {
  final NotificationService _notificationService = NotificationService();
  StreamSubscription? _subscription;
  
  bool _isIntruderAlertActive = false;
  int _presentCount = 38;
  int _aiDetectedCount = 36;
  final List<Map<String, String>> _recentCheckins = [];

  @override
  void initState() {
    super.initState();
    final session = Provider.of<SessionManager>(context, listen: false);
    _notificationService.connect(token: session.token);
    _subscription = _notificationService.stream.listen((data) {
      if (data['type'] == 'attendance_update') {
        setState(() {
          _presentCount++;
          if (_presentCount % 3 == 0) _aiDetectedCount++; // Simulate AI detection lag
          _recentCheckins.insert(0, {
            'email': data['student_email'],
            'status': data['status'],
            'time': 'Just now'
          });
          if (_recentCheckins.length > 5) _recentCheckins.removeLast();
        });
      } else if (data['type'] == 'intruder_alert') {
        setState(() => _isIntruderAlertActive = true);
        Future.delayed(const Duration(seconds: 10), () {
          if (mounted) setState(() => _isIntruderAlertActive = false);
        });
      }
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.bgDeep,
            AppColors.bgDark,
          ],
        ),
        image: DecorationImage(
          image: const NetworkImage('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            Colors.black.withValues(alpha: 0.15),
            BlendMode.dstATop,
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
        title: Text('Live Monitor', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        actions: [
          _buildIntruderBadge(),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildLiveFeed(),
            const SizedBox(height: 30),
            _buildStatsRow(),
            const SizedBox(height: 30),
            if (_recentCheckins.isNotEmpty) ...[
              Text(
                'LIVE CHECK-INS',
                style: GoogleFonts.inter(fontSize: 12, letterSpacing: 2, color: Colors.greenAccent),
              ),
              const SizedBox(height: 15),
              ..._recentCheckins.map((checkin) => _buildCheckinItem(checkin)),
              const SizedBox(height: 20),
            ],
            _buildAbsenteeList(),
          ],
        ),
      ),
    ),
    );
  }

  Widget _buildCheckinItem(Map<String, String> checkin) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.greenAccent.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.greenAccent.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Colors.greenAccent, size: 16),
          const SizedBox(width: 12),
          Expanded(child: Text(checkin['email']!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
          Text(checkin['time']!, style: const TextStyle(color: Colors.white24, fontSize: 10)),
        ],
      ),
    ).animate().slideX(begin: -0.1).fadeIn();
  }

  Widget _buildIntruderBadge() {
    return Container(
      margin: const EdgeInsets.only(right: 16),
      child: Chip(
        avatar: Icon(Icons.security, color: _isIntruderAlertActive ? Colors.white : Colors.greenAccent, size: 16),
        label: Text(
          _isIntruderAlertActive ? 'INTRUDER DETECTED' : 'SECURE',
          style: TextStyle(
            color: _isIntruderAlertActive ? Colors.white : Colors.greenAccent,
            fontWeight: FontWeight.bold,
            fontSize: 10,
          ),
        ),
        backgroundColor: _isIntruderAlertActive ? Colors.redAccent : Colors.white.withValues(alpha: 0.05),
      ),
    ).animate(target: _isIntruderAlertActive ? 1 : 0)
     .shimmer(duration: 1.seconds);
  }

  Widget _buildLiveFeed() {
    return Container(
      height: 250,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white10),
        boxShadow: [
          const BoxShadow(color: Colors.black54, blurRadius: 20, spreadRadius: 5),
        ],
      ),
      child: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.videocam_off_outlined, color: Colors.white24, size: 48),
                const SizedBox(height: 10),
                Text('LIVE FEED ENCRYPTED', style: GoogleFonts.inter(color: Colors.white24, fontSize: 12, letterSpacing: 2)),
              ],
            ),
          ),
          Positioned(
            top: 20,
            left: 20,
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                ).animate(onPlay: (c) => c.repeat()).fadeOut(duration: 1.seconds),
                const SizedBox(width: 8),
                const Text('REC', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 12)),
              ],
            ),
          ),
          Positioned(
            bottom: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(10)),
              child: const Text('CAM_01: MAIN HALL', style: TextStyle(color: Colors.white70, fontSize: 10)),
            ),
          ),
        ],
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        Expanded(child: _buildMiniStat('Students Present', '$_presentCount', Icons.people_outline, Colors.greenAccent)),
        const SizedBox(width: 15),
        Expanded(child: _buildMiniStat('AI Detected', '$_aiDetectedCount', Icons.face_retouching_natural, AppColors.gold)),
      ],
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: Colors.white38, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildAbsenteeList() {
    final absentees = [
      {'name': 'James Wilson', 'id': 'STU-992', 'risk': 'High'},
      {'name': 'Emily Chen', 'id': 'STU-104', 'risk': 'Medium'},
      {'name': 'Marcus Miller', 'id': 'STU-552', 'risk': 'Low'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'AI ABSENTEE DETECTION',
              style: GoogleFonts.inter(fontSize: 12, letterSpacing: 2, color: AppColors.gold),
            ),
            const Icon(Icons.auto_awesome, color: AppColors.gold, size: 16),
          ],
        ),
        const SizedBox(height: 20),
        ...absentees.map((student) => _buildAbsenteeItem(student)),
      ],
    );
  }

  Widget _buildAbsenteeItem(Map<String, String> student) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: Colors.white10,
            child: Text(student['name']![0], style: const TextStyle(color: Colors.white70)),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(student['name']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(student['id']!, style: const TextStyle(color: Colors.white38, fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _getRiskColor(student['risk']!).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '${student['risk']} Risk',
              style: TextStyle(color: _getRiskColor(student['risk']!), fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Color _getRiskColor(String risk) {
    switch (risk) {
      case 'High': return Colors.redAccent;
      case 'Medium': return Colors.orangeAccent;
      default: return Colors.blueAccent;
    }
  }
}
