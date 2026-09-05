/*
|--------------------------------------------------------------------------
| File: app.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Declares the root SmartAttendanceApp widget, binding MaterialApp.router
| to GoRouter and configuring app-wide theme controller settings.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/app/router/app_router.dart';

class SmartAttendanceApp extends StatelessWidget {
  const SmartAttendanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();

    return MaterialApp.router(
      title: 'Smart Attendance AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeController.lightTheme,
      darkTheme: ThemeController.darkTheme,
      themeMode: themeCtrl.mode,
      routerConfig: appRouter,
      builder: (context, child) =>
          PremiumScaffold(child: child ?? const SizedBox.shrink()),
    );
  }
}
