import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/session_manager.dart';

class ParentDashboard extends StatelessWidget {
  const ParentDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionManager>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Parent Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Profile',
            onPressed: () => Navigator.pushNamed(context, '/profile'),
            icon: const Icon(Icons.account_circle_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Welcome${session.name == null ? '' : ', ${session.name}'}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Parent attendance views require a linked child profile from the backend. No linked child data was returned for this session.',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
