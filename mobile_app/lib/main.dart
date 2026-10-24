import 'package:flutter/material.dart';
import 'app.dart';
import 'services/app_session.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final session = AppSession();
  runApp(DriverCompanionApp(session: session));
  session.restore();
}
