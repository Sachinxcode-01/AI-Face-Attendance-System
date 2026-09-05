import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:get_it/get_it.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:smartface_attendance/features/sync/repositories/sync_repository.dart';
import 'package:smartface_attendance/features/sync/models/attendance_queue_record.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/shared/widgets/glow_refresh_indicator.dart';
import 'package:smartface_attendance/features/attendance/screens/qr_scanner_screen.dart';

// Mock SyncRepository stub
class MockSyncRepository implements SyncRepository {
  bool failNext = false;

  @override
  Future<AttendanceQueueRecord> recordAttendance({
    required String studentEmail,
    required String sessionId,
    required String qrToken,
    String verificationMethod = 'qr',
  }) async {
    // Add a short delay to simulate network/IO latency and allow verifying the loading state
    await Future.delayed(const Duration(milliseconds: 50));
    if (failNext) {
      throw Exception('Failed to record attendance');
    }
    return AttendanceQueueRecord(
      id: 'mock-record-id-123',
      studentEmail: studentEmail,
      sessionId: sessionId,
      qrToken: qrToken,
      timestamp: DateTime.now(),
      verificationMethod: verificationMethod,
      createdAt: DateTime.now(),
      syncStatus: SyncStatus.pending,
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

// Mock SessionManager stub extends SessionManager to inherit ChangeNotifier listening capabilities
class MockSessionManager extends SessionManager {
  @override
  String? get email => 'student@test.com';

  @override
  String? get token => 'mock-jwt-token';

  @override
  bool get isAdmin => false;

  @override
  bool get isStudent => true;

  @override
  bool get isTeacher => false;
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  group('GlowRefreshIndicator Widget Tests', () {
    testWidgets(
      'GlowRefreshIndicator triggers onRefresh when dragged beyond threshold',
      (WidgetTester tester) async {
        bool refreshCalled = false;

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: GlowRefreshIndicator(
                onRefresh: () async {
                  refreshCalled = true;
                },
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    SizedBox(height: 100, child: Text('Item 1')),
                    SizedBox(height: 100, child: Text('Item 2')),
                  ],
                ),
              ),
            ),
          ),
        );

        expect(refreshCalled, isFalse);

        // Drag ListView down to trigger refresh gesture
        final listFinder = find.byType(ListView);
        final gesture = await tester.startGesture(tester.getCenter(listFinder));
        await gesture.moveBy(const Offset(0.0, 150.0));
        await tester.pump(); // Start of drag / update
        await gesture.up();
        await tester.pump(); // Triggers ScrollEndNotification -> refresh start
        await tester.pumpAndSettle(); // Settle the refresh callback Future

        expect(refreshCalled, isTrue);
      },
    );
  });

  group('QRScannerScreen Widget Tests', () {
    late MockSyncRepository mockSyncRepository;
    late MockSessionManager mockSessionManager;

    setUp(() {
      mockSyncRepository = MockSyncRepository();
      mockSessionManager = MockSessionManager();

      GetIt.instance.allowReassignment = true;
      GetIt.instance.registerSingleton<SyncRepository>(mockSyncRepository);
    });

    testWidgets('QRScannerScreen renders HUD elements and top info card', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<SessionManager>.value(
            value: mockSessionManager,
            child: const QRScannerScreen(),
          ),
        ),
      );

      // Verify the MobileScanner is present
      expect(find.byType(MobileScanner), findsOneWidget);

      // Verify the Top Instruction Card is rendered
      expect(
        find.textContaining('Align the classroom attendance QR code'),
        findsOneWidget,
      );

      // Verify ScannerHUDPainter is present
      expect(find.byType(CustomPaint), findsAtLeastNWidgets(1));

      // Pump to let the zero-duration startup timers of flutter_animate run
      await tester.pump(const Duration(milliseconds: 100));

      // Clean up / dispose to prevent pending timers from loop animations
      await tester.pumpWidget(const SizedBox());
      await tester.pump(const Duration(milliseconds: 100));
    });

    testWidgets(
      'QRScannerScreen triggers success checkmark directly on cutout on successful scan',
      (WidgetTester tester) async {
        mockSyncRepository.failNext = false;

        await tester.pumpWidget(
          MaterialApp(
            home: ChangeNotifierProvider<SessionManager>.value(
              value: mockSessionManager,
              child: const QRScannerScreen(),
            ),
          ),
        );

        // Let initial startup timers of flutter_animate run
        await tester.pump(const Duration(milliseconds: 100));

        final scannerFinder = find.byType(MobileScanner);
        expect(scannerFinder, findsOneWidget);

        final MobileScanner scannerWidget = tester.widget<MobileScanner>(
          scannerFinder,
        );

        // Simulate a barcode detection
        const mockCapture = BarcodeCapture(
          barcodes: [
            Barcode(
              rawValue:
                  '{"session_id": "session-456", "token": "qr-token-abc"}',
            ),
          ],
        );

        // Call the detection callback
        scannerWidget.onDetect!(mockCapture);
        await tester.pump(); // Triggers state change to loading

        // Verify it displays loading spinner inside cutout
        expect(find.byType(CircularProgressIndicator), findsOneWidget);

        // Advance clock to let mock recordAttendance future finish and trigger success transition
        await tester.pump(
          const Duration(milliseconds: 100),
        ); // triggers mock finish and setState(success)
        await tester.pump(
          const Duration(milliseconds: 500),
        ); // renders checkmark drawing

        // Verify that AnimatedCheckmark success state is rendered directly on cutout
        expect(find.byType(AnimatedCheckmark), findsOneWidget);

        // Verify NO AlertDialog popup was rendered
        expect(find.byType(AlertDialog), findsNothing);

        // Clean up / dispose to prevent pending timers
        await tester.pumpWidget(const SizedBox());
        // Advance clock to let the 1.5s delayed redirect future run and clear itself from the timer queue
        await tester.pump(const Duration(milliseconds: 1600));
      },
    );

    testWidgets(
      'QRScannerScreen triggers error cross directly on cutout on failed scan',
      (WidgetTester tester) async {
        mockSyncRepository.failNext = true;

        await tester.pumpWidget(
          MaterialApp(
            home: ChangeNotifierProvider<SessionManager>.value(
              value: mockSessionManager,
              child: const QRScannerScreen(),
            ),
          ),
        );

        // Let initial startup timers of flutter_animate run
        await tester.pump(const Duration(milliseconds: 100));

        final scannerFinder = find.byType(MobileScanner);
        expect(scannerFinder, findsOneWidget);

        final MobileScanner scannerWidget = tester.widget<MobileScanner>(
          scannerFinder,
        );

        // Simulate a barcode detection
        const mockCapture = BarcodeCapture(
          barcodes: [
            Barcode(
              rawValue:
                  '{"session_id": "session-456", "token": "qr-token-abc"}',
            ),
          ],
        );

        // Call the detection callback
        scannerWidget.onDetect!(mockCapture);
        await tester.pump(); // Triggers loading

        // Verify it displays loading spinner inside cutout
        expect(find.byType(CircularProgressIndicator), findsOneWidget);

        // Advance clock to let mock recordAttendance future fail and trigger error state
        await tester.pump(
          const Duration(milliseconds: 100),
        ); // triggers mock fail and setState(error)
        await tester.pump(
          const Duration(milliseconds: 500),
        ); // renders error cross

        // Verify that close cross icon is rendered directly on cutout
        expect(find.byIcon(Icons.close_rounded), findsOneWidget);

        // Verify NO AlertDialog popup was rendered
        expect(find.byType(AlertDialog), findsNothing);

        // Clean up / dispose to prevent pending timers
        await tester.pumpWidget(const SizedBox());
        // Advance clock to let the 2.0s delayed error reset future run and clear itself from the timer queue
        await tester.pump(const Duration(milliseconds: 2100));
      },
    );
  });
}
