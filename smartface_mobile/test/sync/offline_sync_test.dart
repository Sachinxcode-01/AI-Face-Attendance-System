/*
|--------------------------------------------------------------------------
| File: offline_sync_test.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Unit and integration tests for the Offline-First Attendance Engine.
| Validates queue persistence, HMAC security, backoff logic, and conflict resolution.
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:smartface_attendance/core/services/api_service.dart';
import 'package:smartface_attendance/features/sync/models/attendance_queue_record.dart';
import 'package:smartface_attendance/features/sync/models/sync_state.dart';
import 'package:smartface_attendance/features/sync/services/offline_queue_service.dart';
import 'package:smartface_attendance/features/sync/services/connectivity_service.dart';
import 'package:smartface_attendance/features/sync/services/sync_engine.dart';
import 'package:smartface_attendance/features/sync/repositories/sync_repository.dart';
import 'package:smartface_attendance/features/sync/controllers/sync_controller.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Mock Secure Storage Channel
  const secureStorageChannel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  final Map<String, String> mockSecureStorage = {};

  // Mock Connectivity Channel
  const connectivityChannel = MethodChannel('dev.fluttercommunity.plus/connectivity');

  late Directory tempDir;
  late OfflineQueueService queueService;
  late ConnectivityService connectivityService;
  late ApiService apiService;
  late SyncState syncState;
  late SyncEngine syncEngine;
  late SyncRepository syncRepository;
  late SyncController syncController;

  setUpAll(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageChannel, (MethodCall methodCall) async {
      switch (methodCall.method) {
        case 'read':
          final key = methodCall.arguments['key'] as String;
          return mockSecureStorage[key];
        case 'write':
          final key = methodCall.arguments['key'] as String;
          final value = methodCall.arguments['value'] as String;
          mockSecureStorage[key] = value;
          return null;
        case 'delete':
          final key = methodCall.arguments['key'] as String;
          mockSecureStorage.remove(key);
          return null;
        case 'deleteAll':
          mockSecureStorage.clear();
          return null;
        case 'readAll':
          return mockSecureStorage;
        default:
          return null;
      }
    });

    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(connectivityChannel, (MethodCall methodCall) async {
      if (methodCall.method == 'check') {
        return ['wifi']; // ConnectivityResult.wifi
      }
      return null;
    });
  });

  setUp(() async {
    mockSecureStorage.clear();
    tempDir = await Directory.systemTemp.createTemp('hive_test_');
    Hive.init(tempDir.path);

    queueService = OfflineQueueService();
    await queueService.init();

    connectivityService = ConnectivityService();
    await connectivityService.init();

    // Setup basic API service mock client
    final mockHttpClient = MockClient((request) async {
      return http.Response(jsonEncode({'message': 'Success'}), 200);
    });
    apiService = ApiService(client: mockHttpClient);

    syncState = SyncState();
    syncEngine = SyncEngine(
      queueService: queueService,
      connectivityService: connectivityService,
      apiService: apiService,
      syncState: syncState,
    );

    syncRepository = SyncRepository(
      queueService: queueService,
      syncEngine: syncEngine,
    );

    syncController = SyncController(
      repository: syncRepository,
      syncState: syncState,
    );
  });

  tearDown(() async {
    await queueService.dispose();
    connectivityService.dispose();
    await Hive.close();
    if (await tempDir.exists()) {
      await tempDir.delete(recursive: true);
    }
  });

  group('AttendanceQueueRecord tests', () {
    test('HMAC computation and verification', () {
      final record = AttendanceQueueRecord(
        id: 'rec-123',
        studentEmail: 'student@example.com',
        sessionId: 'session-456',
        qrToken: 'token-abc',
        timestamp: DateTime(2026, 6, 17, 10, 0),
        verificationMethod: 'qr',
      );

      const key = 'secret-key-123';
      final hmac = record.computeHmac(key);
      record.hmacSignature = hmac;

      expect(record.validateHmac(key), isTrue);
      expect(record.validateHmac('wrong-key'), isFalse);

      final tampered = record.copyWith(
        serverResponse: 'altered',
      );
      expect(tampered.validateHmac(key), isTrue); // ServerResponse not signed

      final tamperedRecord = AttendanceQueueRecord(
        id: 'rec-123',
        studentEmail: 'tampered@example.com', // Altered
        sessionId: 'session-456',
        qrToken: 'token-abc',
        timestamp: DateTime(2026, 6, 17, 10, 0),
        verificationMethod: 'qr',
        hmacSignature: hmac,
      );
      expect(tamperedRecord.validateHmac(key), isFalse);
    });
  });

  group('OfflineQueueService tests', () {
    test('Enqueue and get records', () async {
      final record = await queueService.enqueue(
        studentEmail: 's@example.com',
        sessionId: 'sess-1',
        qrToken: 't-1',
      );

      expect(record.studentEmail, 's@example.com');
      expect(record.sessionId, 'sess-1');
      expect(record.syncStatus, SyncStatus.pending);

      final list = queueService.getAll();
      expect(list.length, 1);
      expect(list.first.id, record.id);
    });

    test('Duplicate prevention', () async {
      final r1 = await queueService.enqueue(
        studentEmail: 's@example.com',
        sessionId: 'sess-1',
        qrToken: 't-1',
      );

      final r2 = await queueService.enqueue(
        studentEmail: 's@example.com',
        sessionId: 'sess-1',
        qrToken: 't-2',
      );

      expect(r1.id, r2.id); // Same ID due to duplicate filter
      expect(queueService.getAll().length, 1);
    });

    test('Eviction strategy on queue limit', () async {
      // Enqueue 500 items
      for (int i = 0; i < 500; i++) {
        final rec = await queueService.enqueue(
          studentEmail: 'student_$i@example.com',
          sessionId: 'sess_$i',
          qrToken: 'token_$i',
        );
        if (i < 50) {
          await queueService.markSynced(rec.id);
        }
      }

      expect(queueService.getAll().length, 500);

      // Enqueue one more, should evict one synced item
      await queueService.enqueue(
        studentEmail: 'extra@example.com',
        sessionId: 'sess-extra',
        qrToken: 'token-extra',
      );

      expect(queueService.getAll().length, 500);
      final syncedCount = queueService.getAll().where((r) => r.syncStatus == SyncStatus.synced).length;
      expect(syncedCount, 49); // Evicted 1 synced item
    });
  });

  group('ConnectivityService tests', () {
    test('Offline and online transitions', () async {
      expect(connectivityService.isOnline, isTrue);

      connectivityService.setSyncing();
      expect(connectivityService.currentStatus, ConnectivityStatus.syncing);

      connectivityService.setSyncFailed();
      expect(connectivityService.currentStatus, ConnectivityStatus.syncFailed);

      connectivityService.setSynced();
      expect(connectivityService.currentStatus, ConnectivityStatus.online);
    });
  });

  group('SyncEngine & Controller Integration', () {
    test('Successful sequential sync', () async {
      await queueService.enqueue(
        studentEmail: 's@example.com',
        sessionId: 'sess-1',
        qrToken: 't-1',
      );

      expect(queueService.getCounts()[SyncStatus.pending], 1);

      await syncEngine.syncAll();

      expect(syncState.pendingCount, 0);
      expect(syncState.failedCount, 0);
      expect(syncState.syncedCount, 1);

      final updated = queueService.getAll().first;
      expect(updated.syncStatus, SyncStatus.synced);
    });

    test('Conflict resolution - duplicate handling (409)', () async {
      final conflictClient = MockClient((request) async {
        return http.Response(jsonEncode({'detail': 'Attendance already marked'}), 409);
      });
      final conflictApiService = ApiService(client: conflictClient);

      final customSyncEngine = SyncEngine(
        queueService: queueService,
        connectivityService: connectivityService,
        apiService: conflictApiService,
        syncState: syncState,
      );

      await queueService.enqueue(
        studentEmail: 's@example.com',
        sessionId: 'sess-2',
        qrToken: 't-2',
      );

      await customSyncEngine.syncAll();

      expect(syncState.syncedCount, 1);
      expect(syncState.failedCount, 0);
      expect(queueService.getAll().first.syncStatus, SyncStatus.synced);
    });

    test('Manual action triggers in controller', () async {
      await queueService.enqueue(
        studentEmail: 's@example.com',
        sessionId: 'sess-3',
        qrToken: 't-3',
      );

      await syncController.syncNow();
      expect(syncController.syncedCount, 1);
      expect(syncController.isFullySynced, isTrue);
    });
  });
}
