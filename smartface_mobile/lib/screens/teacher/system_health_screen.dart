import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/session_manager.dart';
import '../../services/api_service.dart';

class SystemHealthScreen extends StatefulWidget {
  const SystemHealthScreen({super.key});

  @override
  State<SystemHealthScreen> createState() => _SystemHealthScreenState();
}

class _SystemHealthScreenState extends State<SystemHealthScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _telemetry = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadTelemetry());
  }

  Future<void> _loadTelemetry() async {
    final token = context.read<SessionManager>().token;
    if (token == null || token.isEmpty) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    final telemetry = await ApiService.getSystemTelemetry(token);
    if (!mounted) return;
    setState(() {
      _telemetry = telemetry;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('System Health')),
      body: RefreshIndicator(
        onRefresh: _loadTelemetry,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _HealthTile(
                    title: 'AI Engine',
                    value: _value('ai_engine_status', fallback: 'Unknown'),
                    icon: Icons.psychology_outlined,
                  ),
                  _HealthTile(
                    title: 'Database',
                    value: _value('mongodb_connection', fallback: 'Unknown'),
                    icon: Icons.storage_outlined,
                  ),
                  _HealthTile(
                    title: 'CPU Usage',
                    value: '${_value('cpu_usage', fallback: '0')}%',
                    icon: Icons.memory_outlined,
                  ),
                  _HealthTile(
                    title: 'Memory Usage',
                    value: '${_value('memory_usage', fallback: '0')}%',
                    icon: Icons.speed_outlined,
                  ),
                  _HealthTile(
                    title: 'API Response',
                    value: '${_value('api_response_time', fallback: '0')} ms',
                    icon: Icons.network_check_outlined,
                  ),
                ],
              ),
      ),
    );
  }

  String _value(String key, {required String fallback}) {
    final value = _telemetry[key];
    if (value == null) return fallback;
    return value.toString();
  }
}

class _HealthTile extends StatelessWidget {
  const _HealthTile({
    required this.title,
    required this.value,
    required this.icon,
  });

  final String title;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: Text(
          value,
          style: Theme.of(context).textTheme.titleMedium,
        ),
      ),
    );
  }
}
