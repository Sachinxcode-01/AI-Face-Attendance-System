import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';

/// Simple LRU-like in-memory cache with TTL + persistent fallback via SharedPreferences.
class CacheService {
  static final _memory = <String, _CacheEntry>{};
  static const int _maxEntries = 100;
  static const _diskKeyPrefix = 'cache_';

  // ─── Write ────────────────────────────────────────────────────────
  static Future<void> set(
    String key,
    dynamic value, {
    Duration ttl = const Duration(minutes: 5),
    bool persist = false,
  }) async {
    final expiry = DateTime.now().add(ttl);
    _memory[key] = _CacheEntry(value: value, expiry: expiry);

    // Enforce max entry count (remove oldest)
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

  // ─── Read ─────────────────────────────────────────────────────────
  static Future<T?> get<T>(String key) async {
    // Check memory first
    final memEntry = _memory[key];
    if (memEntry != null) {
      if (DateTime.now().isBefore(memEntry.expiry)) {
        return memEntry.value as T?;
      } else {
        _memory.remove(key); // Expired
      }
    }

    // Check disk
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('$_diskKeyPrefix$key');
      if (raw != null) {
        final parsed = jsonDecode(raw);
        final expiry = DateTime.parse(parsed['expiry']);
        if (DateTime.now().isBefore(expiry)) {
          final value = parsed['value'] as T?;
          // Restore to memory
          _memory[key] = _CacheEntry(value: value, expiry: expiry);
          return value;
        } else {
          await prefs.remove('$_diskKeyPrefix$key');
        }
      }
    } catch (e) {
      debugPrint('[Cache] disk read error: $e');
    }
    return null;
  }

  // ─── Invalidate ───────────────────────────────────────────────────
  static Future<void> invalidate(String key) async {
    _memory.remove(key);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_diskKeyPrefix$key');
    } catch (_) {}
  }

  // ─── Invalidate all keys with prefix ─────────────────────────────
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

  // ─── Clear all ────────────────────────────────────────────────────
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

class _CacheEntry {
  final dynamic value;
  final DateTime expiry;
  _CacheEntry({required this.value, required this.expiry});
}
