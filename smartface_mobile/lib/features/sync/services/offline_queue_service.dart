/*
|--------------------------------------------------------------------------
| File: offline_queue_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Hive-backed encrypted queue manager for offline attendance records.
| Handles enqueue, dequeue, status updates, HMAC signing, and stale purge.
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:uuid/uuid.dart';

import 'package:smartface_attendance/features/sync/models/attendance_queue_record.dart';

/// Manages the local attendance queue using an encrypted Hive box.
///
/// Features:
/// - AES-256 encrypted storage at rest
/// - HMAC-SHA256 integrity signatures per record
/// - Stale record auto-purge (synced records > 7 days)
/// - Queue size cap (500 records max)
class OfflineQueueService {
  static const String _boxName = 'attendance_queue';
  static const String _hmacKeyId = 'sf_queue_hmac_key';
  static int maxQueueSize = 500;
  static const int _maxRetries = 5;
  static const Duration _staleDuration = Duration(days: 7);

  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  Box<String>? _box;
  String? _hmacKey;
  final _uuid = const Uuid();

  /// Whether the queue service has been initialized.
  bool get isInitialized => _box != null && _box!.isOpen;

  /// Initializes the encrypted Hive box and HMAC key.
  ///
  /// Must be called once during app startup after `Hive.initFlutter()`.
  Future<void> init() async {
    // Generate or retrieve the HMAC signing key
    _hmacKey = await _secureStorage.read(key: _hmacKeyId);
    if (_hmacKey == null) {
      _hmacKey = _uuid.v4(); // Use a fresh UUID as the signing secret
      await _secureStorage.write(key: _hmacKeyId, value: _hmacKey);
    }

    // Open the encrypted box
    // Hive encryption key is 32 bytes, stored in secure storage
    const encKeyId = 'sf_hive_enc_key';
    var encKeyBase64 = await _secureStorage.read(key: encKeyId);
    if (encKeyBase64 == null) {
      final encKey = Hive.generateSecureKey();
      encKeyBase64 = base64UrlEncode(encKey);
      await _secureStorage.write(key: encKeyId, value: encKeyBase64);
    }
    final encKey = base64Url.decode(encKeyBase64);

    _box = await Hive.openBox<String>(
      _boxName,
      encryptionCipher: HiveAesCipher(encKey),
    );

    debugPrint('[OfflineQueue] Initialized with ${_box!.length} records');
  }

  /// Enqueues a new attendance record into the local queue.
  ///
  /// Returns the created [AttendanceQueueRecord] with HMAC signature.
  Future<AttendanceQueueRecord> enqueue({
    required String studentEmail,
    required String sessionId,
    required String qrToken,
    String verificationMethod = 'qr',
  }) async {
    _ensureInitialized();

    // Check for duplicates (same student + session)
    final existing = getAll().where(
      (r) =>
          r.studentEmail == studentEmail &&
          r.sessionId == sessionId &&
          r.syncStatus != SyncStatus.failed,
    );
    if (existing.isNotEmpty) {
      debugPrint(
        '[OfflineQueue] Duplicate detected for $studentEmail/$sessionId',
      );
      return existing.first;
    }

    // Enforce queue size cap
    if (_box!.length >= maxQueueSize) {
      await _evictOldest();
    }

    final record = AttendanceQueueRecord(
      id: _uuid.v4(),
      studentEmail: studentEmail,
      sessionId: sessionId,
      qrToken: qrToken,
      verificationMethod: verificationMethod,
      timestamp: DateTime.now(),
    );

    // Sign the record
    record.hmacSignature = record.computeHmac(_hmacKey!);

    await _box!.put(record.id, jsonEncode(record.toJson()));
    debugPrint('[OfflineQueue] Enqueued: ${record.id}');
    return record;
  }

  /// Returns all records currently in the queue.
  List<AttendanceQueueRecord> getAll() {
    _ensureInitialized();
    return _box!.values
        .map(
          (raw) => AttendanceQueueRecord.fromJson(
            jsonDecode(raw) as Map<String, dynamic>,
          ),
        )
        .toList();
  }

  /// Returns all records eligible for sync (pending + failed with retries left).
  List<AttendanceQueueRecord> getPendingForSync() {
    return getAll().where((r) {
        if (r.syncStatus == SyncStatus.pending) return true;
        if (r.syncStatus == SyncStatus.failed && r.retryCount < _maxRetries) {
          return true;
        }
        return false;
      }).toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt)); // oldest first
  }

  /// Returns the count of records by sync status.
  Map<SyncStatus, int> getCounts() {
    final all = getAll();
    return {
      SyncStatus.pending: all
          .where((r) => r.syncStatus == SyncStatus.pending)
          .length,
      SyncStatus.syncing: all
          .where((r) => r.syncStatus == SyncStatus.syncing)
          .length,
      SyncStatus.synced: all
          .where((r) => r.syncStatus == SyncStatus.synced)
          .length,
      SyncStatus.failed: all
          .where((r) => r.syncStatus == SyncStatus.failed)
          .length,
    };
  }

  /// Updates a record's sync status.
  Future<void> updateStatus(
    String id,
    SyncStatus status, {
    String? serverResponse,
    int? retryCount,
  }) async {
    _ensureInitialized();
    final raw = _box!.get(id);
    if (raw == null) return;

    final record = AttendanceQueueRecord.fromJson(
      jsonDecode(raw) as Map<String, dynamic>,
    );
    final updated = record.copyWith(
      syncStatus: status,
      serverResponse: serverResponse,
      retryCount: retryCount ?? record.retryCount,
    );
    await _box!.put(id, jsonEncode(updated.toJson()));
  }

  /// Marks a record as synced.
  Future<void> markSynced(String id, {String? serverResponse}) async {
    await updateStatus(id, SyncStatus.synced, serverResponse: serverResponse);
  }

  /// Marks a record as failed and increments retry count.
  Future<void> markFailed(String id, {String? serverResponse}) async {
    _ensureInitialized();
    final raw = _box!.get(id);
    if (raw == null) return;

    final record = AttendanceQueueRecord.fromJson(
      jsonDecode(raw) as Map<String, dynamic>,
    );
    await updateStatus(
      id,
      SyncStatus.failed,
      serverResponse: serverResponse,
      retryCount: record.retryCount + 1,
    );
  }

  /// Validates HMAC integrity for a record. Returns false if tampered.
  bool validateRecord(AttendanceQueueRecord record) {
    if (_hmacKey == null) return false;
    return record.validateHmac(_hmacKey!);
  }

  /// Removes synced records older than [_staleDuration].
  Future<int> purgeStale() async {
    _ensureInitialized();
    final cutoff = DateTime.now().subtract(_staleDuration);
    final stale = getAll().where(
      (r) => r.syncStatus == SyncStatus.synced && r.createdAt.isBefore(cutoff),
    );
    int count = 0;
    for (final record in stale) {
      await _box!.delete(record.id);
      count++;
    }
    if (count > 0) {
      debugPrint('[OfflineQueue] Purged $count stale records');
    }
    return count;
  }

  /// Deletes a specific record from the queue.
  Future<void> delete(String id) async {
    _ensureInitialized();
    await _box!.delete(id);
  }

  /// Clears all records from the queue.
  Future<void> clearAll() async {
    _ensureInitialized();
    await _box!.clear();
  }

  /// Evicts the oldest synced record, or oldest failed if none synced.
  Future<void> _evictOldest() async {
    final all = getAll()..sort((a, b) => a.createdAt.compareTo(b.createdAt));
    // Prefer evicting synced records first
    final synced = all.where((r) => r.syncStatus == SyncStatus.synced);
    if (synced.isNotEmpty) {
      await _box!.delete(synced.first.id);
      debugPrint('[OfflineQueue] Evicted oldest synced record');
      return;
    }
    // Then evict permanently failed records (max retries exceeded)
    final permFailed = all.where(
      (r) => r.syncStatus == SyncStatus.failed && r.retryCount >= _maxRetries,
    );
    if (permFailed.isNotEmpty) {
      await _box!.delete(permFailed.first.id);
      debugPrint('[OfflineQueue] Evicted oldest permanently failed record');
    }
  }

  void _ensureInitialized() {
    if (!isInitialized) {
      throw StateError(
        'OfflineQueueService not initialized. Call init() first.',
      );
    }
  }

  /// Closes the Hive box. Called during app shutdown.
  Future<void> dispose() async {
    await _box?.close();
  }
}
