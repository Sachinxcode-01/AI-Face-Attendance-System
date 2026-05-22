import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';

class ThemeController extends ChangeNotifier {
  static const _prefKey = 'sf_theme_mode';

  ThemeMode _mode = ThemeMode.dark;
  ThemeMode get mode => _mode;
  bool get isDark => _mode == ThemeMode.dark ||
      (_mode == ThemeMode.system &&
          WidgetsBinding.instance.platformDispatcher.platformBrightness ==
              Brightness.dark);

  // ─── Load persisted preference ──────────────────────────────────
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_prefKey) ?? 'dark';
    _mode = _modeFromString(saved);
    _updateSystemUI();
    notifyListeners();
  }

  // ─── Toggle between dark and light ──────────────────────────────
  Future<void> toggle() async {
    _mode = _mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, _modeToString(_mode));
    _updateSystemUI();
    notifyListeners();
  }

  Future<void> setMode(ThemeMode mode) async {
    _mode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, _modeToString(mode));
    _updateSystemUI();
    notifyListeners();
  }

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

  // ─── Dark ThemeData ─────────────────────────────────────────────
  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.bgDark,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.gold,
          secondary: AppColors.indigo,
          surface: AppColors.bgSurface,
          onPrimary: Colors.black,
          onSurface: Colors.white,
          error: AppColors.errorLight,
        ),
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).apply(
          bodyColor: Colors.white,
          displayColor: AppColors.gold,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.gold,
            foregroundColor: Colors.black,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            padding: const EdgeInsets.symmetric(vertical: 16),
            elevation: 8,
            shadowColor: AppColors.gold.withValues(alpha: 0.4),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.white,
            side: const BorderSide(color: AppColors.white38),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.white06,
          labelStyle: GoogleFonts.outfit(color: AppColors.white38, fontSize: 13),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            borderSide: const BorderSide(color: AppColors.white12),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            borderSide: const BorderSide(color: AppColors.gold, width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            borderSide: const BorderSide(color: AppColors.errorLight, width: 1.2),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            borderSide: const BorderSide(color: AppColors.errorLight, width: 1.5),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          iconTheme: IconThemeData(color: Colors.white),
        ),
        cardTheme: CardThemeData(
          color: AppColors.bgCard,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        ),
        dividerTheme: const DividerThemeData(color: AppColors.white12),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          contentTextStyle: GoogleFonts.outfit(color: Colors.white),
        ),
      );

  // ─── Light ThemeData ─────────────────────────────────────────────
  static ThemeData get lightTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: AppColors.bgLight,
        colorScheme: const ColorScheme.light(
          primary: AppColors.indigo,
          secondary: AppColors.gold,
          surface: AppColors.bgCardLight,
          onPrimary: Colors.white,
          onSurface: Color(0xFF1A1F38),
          error: AppColors.error,
        ),
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme).apply(
          bodyColor: const Color(0xFF1A1F38),
          displayColor: AppColors.indigo,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.indigo,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            padding: const EdgeInsets.symmetric(vertical: 16),
            elevation: 4,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          labelStyle: GoogleFonts.outfit(color: const Color(0xFF9E9E9E), fontSize: 13),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            borderSide: const BorderSide(color: AppColors.indigo, width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            borderSide: const BorderSide(color: AppColors.error, width: 1.2),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            borderSide: const BorderSide(color: AppColors.error, width: 1.5),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          iconTheme: IconThemeData(color: Color(0xFF1A1F38)),
        ),
        cardTheme: CardThemeData(
          color: AppColors.bgCardLight,
          elevation: 2,
          shadowColor: Colors.black12,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        ),
        dividerTheme: const DividerThemeData(color: Color(0xFFE0E0E0)),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          contentTextStyle: GoogleFonts.outfit(color: Colors.white),
        ),
      );

  ThemeMode _modeFromString(String s) {
    switch (s) {
      case 'light': return ThemeMode.light;
      case 'system': return ThemeMode.system;
      default: return ThemeMode.dark;
    }
  }

  String _modeToString(ThemeMode m) {
    switch (m) {
      case ThemeMode.light: return 'light';
      case ThemeMode.system: return 'system';
      default: return 'dark';
    }
  }
}
