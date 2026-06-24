/*
|--------------------------------------------------------------------------
| File: attendance_queue_record.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Data model for the local offline attendance queue. Each record represents
| a single attendance marking that may not yet be synced to the server.
|
| Fields are serialized to/from Hive JSON maps for encrypted storage.
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'package:crypto/crypto.dart';

/// Sync lifecycle states for a queued attendance record.
enum SyncStatus { pending, syncing, synced, failed }

/// Represents a single attendance record in the offline queue.
///
/// Records are created immediately when a student scans a QR code,
/// stored locally, and synced to the server when connectivity is available.
class AttendanceQueueRecord {
  /// Unique identifier (UUID v4).
  final String id;

  /// Email of the student marking attendance.
  final String studentEmail;

  /// The session being attended.
  final String sessionId;

  /// QR token scanned from the session code.
  final String qrToken;

  /// Local device timestamp when attendance was recorded.
  final DateTime timestamp;

  /// How the attendance was verified: 'qr', 'face', 'manual'.
  final String verificationMethod;

  /// Current sync lifecycle state.
  SyncStatus syncStatus;

  /// Number of upload attempts made.
  int retryCount;

  /// When this record was created in the queue.
  final DateTime createdAt;

  /// Server response body (stored after sync attempt).
  String? serverResponse;

  /// HMAC-SHA256 signature for tamper detection.
  String? hmacSignature;

  AttendanceQueueRecord({
    required this.id,
    required this.studentEmail,
    required this.sessionId,
    required this.qrToken,
    required this.timestamp,
    this.verificationMethod = 'qr',
    this.syncStatus = SyncStatus.pending,
    this.retryCount = 0,
    DateTime? createdAt,
    this.serverResponse,
    this.hmacSignature,
  }) : createdAt = createdAt ?? DateTime.now();

  /// Serializes this record to a JSON-compatible map for Hive storage.
  Map<String, dynamic> toJson() => {
    'id': id,
    'studentEmail': studentEmail,
    'sessionId': sessionId,
    'qrToken': qrToken,
    'timestamp': timestamp.toIso8601String(),
    'verificationMethod': verificationMethod,
    'syncStatus': syncStatus.name,
    'retryCount': retryCount,
    'createdAt': createdAt.toIso8601String(),
    'serverResponse': serverResponse,
    'hmacSignature': hmacSignature,
  };

  /// Deserializes a record from a JSON map.
  factory AttendanceQueueRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceQueueRecord(
      id: json['id'] as String,
      studentEmail: json['studentEmail'] as String,
      sessionId: json['sessionId'] as String,
      qrToken: json['qrToken'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      verificationMethod: json['verificationMethod'] as String? ?? 'qr',
      syncStatus: SyncStatus.values.firstWhere(
        (e) => e.name == json['syncStatus'],
        orElse: () => SyncStatus.pending,
      ),
      retryCount: json['retryCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      serverResponse: json['serverResponse'] as String?,
      hmacSignature: json['hmacSignature'] as String?,
    );
  }

  /// Generates an HMAC-SHA256 signature for this record using the provided [key].
  ///
  /// The signature covers all immutable fields to detect tampering.
  String computeHmac(String key) {
    final payload =
        '$id|$studentEmail|$sessionId|$qrToken|${timestamp.toIso8601String()}|$verificationMethod';
    final hmac = Hmac(sha256, utf8.encode(key));
    final digest = hmac.convert(utf8.encode(payload));
    return digest.toString();
  }

  /// Validates this record's HMAC signature against the provided [key].
  bool validateHmac(String key) {
    if (hmacSignature == null) return false;
    return hmacSignature == computeHmac(key);
  }

  /// Creates a copy with updated mutable fields.
  AttendanceQueueRecord copyWith({
    SyncStatus? syncStatus,
    int? retryCount,
    String? serverResponse,
    String? hmacSignature,
  }) {
    return AttendanceQueueRecord(
      id: id,
      studentEmail: studentEmail,
      sessionId: sessionId,
      qrToken: qrToken,
      timestamp: timestamp,
      verificationMethod: verificationMethod,
      syncStatus: syncStatus ?? this.syncStatus,
      retryCount: retryCount ?? this.retryCount,
      createdAt: createdAt,
      serverResponse: serverResponse ?? this.serverResponse,
      hmacSignature: hmacSignature ?? this.hmacSignature,
    );
  }

  @override
  String toString() =>
      'AttendanceQueueRecord(id: $id, student: $studentEmail, session: $sessionId, status: ${syncStatus.name}, retries: $retryCount)';
}
