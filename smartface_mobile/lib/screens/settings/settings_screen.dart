import 'package:flutter/material.dart';

import '../../services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final TextEditingController _hostController;
  late final TextEditingController _portController;
  bool _isChecking = false;
  String? _status;

  @override
  void initState() {
    super.initState();
    _hostController = TextEditingController(text: ApiService.serverHost);
    _portController = TextEditingController(text: ApiService.serverPort);
  }

  @override
  void dispose() {
    _hostController.dispose();
    _portController.dispose();
    super.dispose();
  }

  Future<void> _saveAndCheck() async {
    final host = _hostController.text.trim();
    final port = _portController.text.trim();
    if (host.isEmpty || port.isEmpty) {
      setState(() => _status = 'Host and port are required.');
      return;
    }

    setState(() {
      _isChecking = true;
      _status = null;
    });

    await ApiService.saveServerSettings(host, port);
    final online = await ApiService.isServerOnline();
    if (!mounted) return;
    setState(() {
      _isChecking = false;
      _status = online ? 'Backend is online.' : 'Backend is offline.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _hostController,
            decoration: const InputDecoration(
              labelText: 'Backend host',
              hintText: '192.168.1.10',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _portController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Backend port',
              hintText: '8000',
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _isChecking ? null : _saveAndCheck,
            icon: _isChecking
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.network_check),
            label: const Text('Save and Test'),
          ),
          if (_status != null) ...[const SizedBox(height: 16), Text(_status!)],
        ],
      ),
    );
  }
}
