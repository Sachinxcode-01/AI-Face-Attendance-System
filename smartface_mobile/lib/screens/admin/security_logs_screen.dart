import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../core/session_manager.dart';
import '../../services/api_service.dart';

class SecurityLogsScreen extends StatefulWidget {
  const SecurityLogsScreen({super.key});

  @override
  State<SecurityLogsScreen> createState() => _SecurityLogsScreenState();
}

class _SecurityLogsScreenState extends State<SecurityLogsScreen> {
  List<dynamic> logs = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLogs();
  }

  Future<void> _fetchLogs() async {
    try {
      final token = context.read<SessionManager>().token;
      final result = await ApiService.getSecurityLogs(token);
      setState(() {
        logs = result;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
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
          title: const Text('Security Protocols'),
          backgroundColor: Colors.transparent,
        ),
        body: isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Color(0xFFFFD700)),
              )
            : logs.isEmpty
            ? const Center(
                child: Text(
                  'No security breaches detected.',
                  style: TextStyle(color: Colors.white38),
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: logs.length,
                itemBuilder: (context, index) {
                  final log = logs[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 15),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.redAccent.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.warning_amber_rounded,
                          color: Colors.redAccent,
                          size: 30,
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Intruder Alert',
                                style: TextStyle(
                                  color: Colors.redAccent,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                'Camera: ${log['camera_id'] ?? 'Main Entrance'}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                '${log['timestamp']}',
                                style: const TextStyle(
                                  color: Colors.white38,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.info_outline,
                            color: Colors.white54,
                          ),
                          onPressed: () {},
                        ),
                      ],
                    ),
                  ).animate().fadeIn().slideY(begin: 0.1);
                },
              ),
      ),
    );
  }
}
