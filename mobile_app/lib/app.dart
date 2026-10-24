import 'package:flutter/material.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'services/app_session.dart';
import 'theme/app_theme.dart';

class DriverCompanionApp extends StatelessWidget {
  final AppSession session;
  const DriverCompanionApp({super.key, required this.session});
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: session,
    builder: (context, _) => MaterialApp(
      // Recreate the navigator on sign-out so a back button cannot reopen data.
      key: ValueKey(session.navigationVersion),
      title: 'Driver Companion',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: session.initializing
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : session.user == null
          ? LoginScreen(session: session)
          : HomeShell(session: session),
    ),
  );
}
