import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../services/api_service.dart';

class LeaveReviewScreen extends StatefulWidget {
  const LeaveReviewScreen({super.key});

  @override
  State<LeaveReviewScreen> createState() => _LeaveReviewScreenState();
}

class _LeaveReviewScreenState extends State<LeaveReviewScreen> {
  List<dynamic> _pendingLeaves = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchPendingLeaves();
  }

  Future<void> _fetchPendingLeaves() async {
    final leaves = await ApiService.getPendingLeaves();
    if (mounted) {
      setState(() {
        _pendingLeaves = leaves;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleAction(String leaveId, String status) async {
    final result = await ApiService.actionLeave(leaveId, status, "Processed via Teacher Portal");
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Action successful')),
      );
      _fetchPendingLeaves();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0A0E21),
            Color(0xFF1D2671),
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
        title: Text('Leave Approval', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFFD700)))
          : _pendingLeaves.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _pendingLeaves.length,
                  itemBuilder: (context, index) {
                    return _buildReviewCard(_pendingLeaves[index])
                        .animate()
                        .fadeIn(delay: (index * 150).ms)
                        .slideY(begin: 0.1);
                  },
                ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.done_all_rounded, color: Colors.greenAccent.withValues(alpha: 0.5), size: 64),
          const SizedBox(height: 16),
          Text('All caught up!', style: GoogleFonts.inter(fontSize: 18, color: Colors.white54)),
          const Text('No pending leave requests.', style: TextStyle(color: Colors.white24, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildReviewCard(Map<String, dynamic> request) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFFFFD700),
                child: Text(request['user_id']?[0].toUpperCase() ?? 'S', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(request['user_id'] ?? 'Student', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    const Text('Request Details', style: TextStyle(color: Colors.white38, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'DURATION: ${request['start_date']} to ${request['end_date']}',
            style: const TextStyle(color: Color(0xFFFFD700), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
          ),
          const SizedBox(height: 12),
          Text(
            request['reason'] ?? 'No reason provided',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _handleAction(request['id'], 'Rejected'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.redAccent,
                    side: const BorderSide(color: Colors.redAccent),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('REJECT'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => _handleAction(request['id'], 'Approved'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.greenAccent,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('APPROVE', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
