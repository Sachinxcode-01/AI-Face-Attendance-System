/*
|--------------------------------------------------------------------------
| File: cache_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Implements a high-performance, TTL-based caching layer with disk persistence fallback.
|
| Responsibilities:
| - Provides fast, in-memory cache indexing with entry limits (LRU-like deletion).
| - Persists specific high-priority keys (e.g. settings) to SharedPreferences.
| - Manages key invalidation, prefix-based wiping, and full database clears.
|
| Dependencies:
| - package:shared_preferences/shared_preferences.dart
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';

// ======================================================
// Services: Cache Service
// ======================================================

/// Local Cache Service
///
/// Implements dual-layer caching:
/// 1. Fast in-memory LRU storage.
/// 2. SharedPreferences disk persistence fallback.
///
/// Features dynamic TTL (Time-To-Live) validation on read operations.
class CacheService {
  static final _memory = <String, _CacheEntry>{};
  static const int _maxEntries = 100;
  static const _diskKeyPrefix = 'cache_';

  // ======================================================
  // Write Operations
  // ======================================================

  /// Writes an entry to the cache with an expiration timeout.
  ///
  /// Parameters:
  /// - [key]: Target identifier string
  /// - [value]: Value payload (JSON serializable if persisting)
  /// - [ttl]: Timeout duration (defaults to 5 minutes)
  /// - [persist]: Saves payload to local flash memory if true
  static Future<void> set(
    String key,
    dynamic value, {
    Duration? ttl,
    bool persist = false,
  }) async {
    final duration = ttl ?? (persist ? const Duration(days: 36500) : const Duration(minutes: 5));
    final expiry = DateTime.now().add(duration);
    _memory[key] = _CacheEntry(value: value, expiry: expiry);

    // Enforce max entry count limit by removing the earliest expiring entry
    if (_memory.length > _maxEntries) {
      final oldest = _memory.entries.reduce(
        (a, b) => a.value.expiry.isBefore(b.value.expiry) ? a : b,
      );
      _memory.remove(oldest.key);
    }

    if (persist) {
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(
          '$_diskKeyPrefix$key',
          jsonEncode({'value': value, 'expiry': expiry.toIso8601String()}),
        );
      } catch (e) {
        debugPrint('[Cache] persist error: $e');
      }
    }
  }

  // ======================================================
  // Read Operations
  // ======================================================

  /// Reads a value from memory cache, falling back to flash storage.
  ///
  /// Parameters:
  /// - [key]: Target identifier string
  ///
  /// Returns:
  /// The cached value typed as [T], or null if missing or expired.
  static Future<T?> get<T>(String key) async {
    // Check memory cache first
    final memEntry = _memory[key];
    if (memEntry != null) {
      if (DateTime.now().isBefore(memEntry.expiry)) {
        return memEntry.value as T?;
      } else {
        _memory.remove(key); // Evict expired entry
      }
    }

    // Check disk storage fallback
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('$_diskKeyPrefix$key');
      if (raw != null) {
        final parsed = jsonDecode(raw);
        final expiry = DateTime.parse(parsed['expiry']);
        if (DateTime.now().isBefore(expiry)) {
          final value = parsed['value'] as T?;
          // Restore back to memory for faster subsequent fetches
          _memory[key] = _CacheEntry(value: value, expiry: expiry);
          return value;
        } else {
          await prefs.remove('$_diskKeyPrefix$key'); // Clean expired disk key
        }
      }
    } catch (e) {
      debugPrint('[Cache] disk read error: $e');
    }
    return null;
  }

  // ======================================================
  // Deletion Operations
  // ======================================================

  /// Invalidates and deletes a specific cache entry.
  ///
  /// Parameters:
  /// - [key]: Target identifier string
  static Future<void> invalidate(String key) async {
    _memory.remove(key);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_diskKeyPrefix$key');
    } catch (_) {}
  }

  /// Wipes all cached keys beginning with a matching prefix string.
  ///
  /// Parameters:
  /// - [prefix]: Namespace prefix string
  static Future<void> invalidatePrefix(String prefix) async {
    _memory.removeWhere((k, _) => k.startsWith(prefix));
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where(
        (k) => k.startsWith('$_diskKeyPrefix$prefix'),
      );
      for (final k in keys) {
        await prefs.remove(k);
      }
    } catch (_) {}
  }

  /// Wipes the entire cache database (both memory and disk variables).
  static Future<void> clearAll() async {
    _memory.clear();
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((k) => k.startsWith(_diskKeyPrefix));
      for (final k in keys) {
        await prefs.remove(k);
      }
    } catch (_) {}
  }
}

// ======================================================
// Internal Support Structs
// ======================================================

/// Internal Cache Envelope Class
class _CacheEntry {
  final dynamic value;
  final DateTime expiry;
  _CacheEntry({required this.value, required this.expiry});
}
