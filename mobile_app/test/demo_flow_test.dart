import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:driver_companion/app.dart';
import 'package:driver_companion/services/app_session.dart';

void main() {
  testWidgets('Demo navigation reaches graph and sign-out resets navigation', (
    tester,
  ) async {
    final session = AppSession()..initializing = false;
    await tester.pumpWidget(DriverCompanionApp(session: session));
    await tester.ensureVisible(find.text('Explore demo interface'));
    await tester.tap(find.text('Explore demo interface'));
    await tester.pumpAndSettle();
    expect(find.textContaining('DEMO MODE'), findsOneWidget);
    await tester.ensureVisible(find.text('View journey and graph'));
    await tester.tap(find.text('View journey and graph'));
    await tester.pumpAndSettle();
    expect(find.text('Journey details'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Exit demo'));
    await tester.pumpAndSettle();
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('Journey details'), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
    session.dispose();
  });
}
