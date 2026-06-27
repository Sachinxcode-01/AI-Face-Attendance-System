import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/screens/auth/welcome_screen.dart';
import 'package:smartface_attendance/screens/route_error_screen.dart';
import 'package:smartface_attendance/screens/settings/settings_screen.dart';

void main() {
  testWidgets('welcome screen exposes sign in and sign up navigation', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        routes: {
          '/login': (_) => const Scaffold(body: Text('Login route')),
          '/register': (_) => const Scaffold(body: Text('Register route')),
        },
        home: const WelcomeScreen(),
      ),
    );

    expect(find.text('SmartFace AI'), findsOneWidget);
    expect(find.text('SIGN IN'), findsOneWidget);
    expect(find.text('CREATE ACCOUNT'), findsOneWidget);

    await tester.tap(find.text('SIGN IN'));
    await tester.pumpAndSettle();
    expect(find.text('Login route'), findsOneWidget);
  });

  testWidgets('settings route renders backend controls', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SettingsScreen()));

    expect(find.text('Settings'), findsOneWidget);
    expect(find.text('Backend host'), findsOneWidget);
    expect(find.text('Backend port'), findsOneWidget);
  });

  testWidgets('unknown route screen can return to welcome', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        routes: {'/welcome': (_) => const WelcomeScreen()},
        home: const RouteErrorScreen(
          title: 'Route not found',
          message: 'Missing route',
        ),
      ),
    );

    expect(find.text('Route not found'), findsOneWidget);
    await tester.tap(find.text('Go to Welcome'));
    await tester.pumpAndSettle();
    expect(find.text('SmartFace AI'), findsOneWidget);
  });
}
