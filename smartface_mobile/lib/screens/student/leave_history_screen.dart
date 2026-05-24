import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../services/api_service.dart';
import 'dart:developer' as developer;

class LeaveHistoryScreen extends StatefulWidget {
  const LeaveHistoryScreen({super.key});

  @override
  State<LeaveHistoryScreen> createState() => _LeaveHistoryScreenState();
}

class _LeaveHistoryScreenState extends State<LeaveHistoryScreen> {
  List<dynamic> _leaves = [];
  bool _isLoading = true;
  String _studentEmail = '';
  Map? _args;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_args == null) {
      _args = ModalRoute.of(context)?.settings.arguments as Map?;
      _studentEmail = _args?['email'] ?? 'student@example.com';
      _fetchLeaves();
    }
  }

  Future<void> _fetchLeaves() async {
    setState(() => _isLoading = true);
    try {
      final leaves = await ApiService.getStudentLeaves(_studentEmail);
      if (mounted) {
        setState(() {
          _leaves = leaves;
          _isLoading = false;
        });
      }
    } catch (e) {
      developer.log("Error fetching leaves: $e");
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return Colors.greenAccent;
      case 'rejected':
        return Colors.redAccent;
      case 'pending':
      case 'under review':
      default:
        return Colors.amberAccent;
    }
  }

  String _formatDateString(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A0E21), Color(0xFF1D2671)],
        ),
        image: DecorationImage(
          image: const NetworkImage(
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
          ),
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
          title: Text(
            'Leave Records',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          actions: [
            IconButton(
              onPressed: _fetchLeaves,
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Color(0xFFFFD700)),
              )
            : _leaves.isEmpty
            ? _buildEmptyState()
            : ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _leaves.length,
                itemBuilder: (context, index) {
                  final leave = _leaves[index];
                  return _buildLeaveCard(leave)
                      .animate()
                      .fadeIn(delay: (index * 100).ms)
                      .slideX(begin: 0.1);
                },
              ),
        floatingActionButton: FloatingActionButton(
          onPressed: () async {
            final result = await Navigator.pushNamed(
              context,
              '/leave-apply',
              arguments: _args,
            );
            if (result == true) {
              _fetchLeaves();
            }
          },
          backgroundColor: const Color(0xFFFFD700),
          child: const Icon(Icons.add, color: Colors.black),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.calendar_today_outlined, color: Colors.white24, size: 64),
          const SizedBox(height: 16),
          Text(
            'No leave records found',
            style: GoogleFonts.inter(fontSize: 18, color: Colors.white54),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tap the button below to submit a leave request.',
            style: TextStyle(color: Colors.white24, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildLeaveCard(Map<String, dynamic> leave) {
    final status = leave['status'] ?? 'Pending';
    final color = _getStatusColor(status);
    final startDateStr = _formatDateString(leave['start_date'] ?? '');
    final endDateStr = _formatDateString(leave['end_date'] ?? '');
    final dates = '$startDateStr - $endDateStr';

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatusBadge(status, color),
              Text(
                dates,
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            leave['reason'] ?? 'No reason provided',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            leave['remarks'] ?? 'Awaiting department head review.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
