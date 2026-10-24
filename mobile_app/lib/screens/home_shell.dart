import 'package:flutter/material.dart';
import '../services/app_session.dart';
import 'device_status_screen.dart';
import 'history_screen.dart';
import 'overview_screen.dart';

class HomeShell extends StatefulWidget {
  final AppSession session;
  const HomeShell({super.key, required this.session});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  @override
  Widget build(BuildContext context) {
    final session = widget.session;
    final repository = session.repository!;
    final pages = [
      OverviewScreen(
        repository: repository,
        username: session.user!.username,
        demo: session.demo,
      ),
      HistoryScreen(repository: repository, demo: session.demo),
      DeviceStatusScreen(repository: repository),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Companion'),
        actions: [
          IconButton(
            tooltip: session.demo ? 'Exit demo' : 'Sign out',
            onPressed: () => session.logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Column(
        children: [
          if (session.demo)
            Container(
              width: double.infinity,
              color: const Color(0xFFFFEDC8),
              padding: const EdgeInsets.all(10),
              child: const Text(
                'DEMO MODE · Invented examples · No server connection',
                textAlign: TextAlign.center,
              ),
            ),
          if (session.notice != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(session.notice!),
            ),
          Expanded(
            child: SingleChildScrollView(
              key: ValueKey(_tab),
              padding: const EdgeInsets.all(16),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 760),
                  child: pages[_tab],
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Overview',
          ),
          NavigationDestination(icon: Icon(Icons.history), label: 'History'),
          NavigationDestination(icon: Icon(Icons.sensors), label: 'Device'),
        ],
      ),
    );
  }
}
