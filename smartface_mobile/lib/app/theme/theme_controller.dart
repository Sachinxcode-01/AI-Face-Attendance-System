/*
|--------------------------------------------------------------------------
| File: theme_controller.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Manages application themes, dynamic dark/light mode switching, and system UI styles.
|
| Responsibilities:
| - Maintains user theme mode preference (dark, light, or system).
| - Persists selected theme mode locally to SharedPreferences.
| - Exports standard light and dark ThemeData systems for MaterialApp.
| - Dynamically updates system overlays (status bar and navigation bar).
|
| Dependencies:
| - package:shared_preferences/shared_preferences.dart
| - package:google_fonts/google_fonts.dart
| - package:smartface_attendance/core/constants.dart
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

// ======================================================
// State Management: Theme Controller
// ======================================================

/// Application Theme Controller
///
/// Handles:
/// - Dynamic dark mode toggle
/// - Local persistence of theme preferences
/// - Status/navigation bar styling synchronizations
/// - Material 3 theme scheme initialization
class ThemeController extends ChangeNotifier {
  static const _prefKey = 'sf_theme_mode';

  ThemeMode _mode = ThemeMode.dark;

  /// Gets the currently active [ThemeMode].
  ThemeMode get mode => _mode;

  /// Returns true if dark mode is active (either explicitly set or system default).
  bool get isDark =>
      _mode == ThemeMode.dark ||
      (_mode == ThemeMode.system &&
          WidgetsBinding.instance.platformDispatcher.platformBrightness ==
              Brightness.dark);

  // ======================================================
  // Lifecycle & Mode Actions
  // ======================================================

  /// Loads the persisted theme mode from local SharedPreferences.
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_prefKey) ?? 'dark';
    _mode = _modeFromString(saved);
    _updateSystemUI();
    notifyListeners();
  }

  /// Toggles the application between dark and light themes.
  Future<void> toggle() async {
    _mode = _mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, _modeToString(_mode));
    _updateSystemUI();
    notifyListeners();
  }

  /// Sets the application to a specific [ThemeMode] and persists it.
  ///
  /// Parameters:
  /// - [mode]: Selected theme mode
  Future<void> setMode(ThemeMode mode) async {
    _mode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, _modeToString(mode));
    _updateSystemUI();
    notifyListeners();
  }

  /// Updates system overlay colors (e.g. status bar and nav bar) based on theme.
  void _updateSystemUI() {
    SystemChrome.setSystemUIOverlayStyle(
      isDark
          ? SystemUiOverlayStyle.light.copyWith(
              statusBarColor: Colors.transparent,
              systemNavigationBarColor: AppColors.bgDeep,
            )
          : SystemUiOverlayStyle.dark.copyWith(
              statusBarColor: Colors.transparent,
              systemNavigationBarColor: Colors.white,
            ),
    );
  }

  // ======================================================
  // Theme Data: Dark Theme Configuration
  // ======================================================

  /// Configures and returns the dark theme parameters.
  static ThemeData get darkTheme => PremiumTheme.darkTheme;

  // ======================================================
  // Theme Data: Light Theme Configuration
  // ======================================================

  /// Configures and returns the light theme parameters.
  static ThemeData get lightTheme => PremiumTheme.lightTheme;

  // ======================================================
  // Helpers
  // ======================================================

  ThemeMode _modeFromString(String s) {
    switch (s) {
      case 'light':
        return ThemeMode.light;
      case 'system':
        return ThemeMode.system;
      default:
        return ThemeMode.dark;
    }
  }

  String _modeToString(ThemeMode m) {
    switch (m) {
      case ThemeMode.light:
        return 'light';
      case ThemeMode.system:
        return 'system';
      default:
        return 'dark';
    }
  }
}

