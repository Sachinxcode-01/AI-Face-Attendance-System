import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:smartface_attendance/app/config/app_state.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/features/auth/screens/login_screen.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../mocks/mock_api_service.dart';

// Pure Dart mock of FirebasePlatform to bypass native method channels
class TestFirebasePlatform extends FirebasePlatform {
  TestFirebasePlatform() : super();

  @override
  FirebaseAppPlatform app([String name = defaultFirebaseAppName]) {
    return FirebaseAppPlatform(
      name,
      const FirebaseOptions(
        apiKey: 'mock-key',
        appId: 'mock-id',
        messagingSenderId: 'mock-sender',
        projectId: 'mock-project',
      ),
    );
  }

  @override
  Future<FirebaseAppPlatform> initializeApp({
    String? name,
    FirebaseOptions? options,
  }) async {
    return FirebaseAppPlatform(
      name ?? defaultFirebaseAppName,
      options ??
          const FirebaseOptions(
            apiKey: 'mock-key',
            appId: 'mock-id',
            messagingSenderId: 'mock-sender',
            projectId: 'mock-project',
          ),
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Mock method channels for Secure Storage and Firebase Auth
  const secureStorageChannel = MethodChannel(
    'plugins.it_nomads.com/flutter_secure_storage',
  );
  const firebaseAuthChannel = MethodChannel('plugins.flutter.io/firebase_auth');

  final Map<String, String> mockSecureStorage = {};

  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    // Set custom mock Firebase platform
    FirebasePlatform.instance = TestFirebasePlatform();
    await Firebase.initializeApp();

    // Secure Storage Mocks
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageChannel, (
          MethodCall methodCall,
        ) async {
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
            default:
              return null;
          }
        });

    // Firebase Auth Mocks
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(firebaseAuthChannel, (
          MethodCall methodCall,
        ) async {
          return null;
        });
  });

  setUp(() {
    mockSecureStorage.clear();
    MockApiService.reset();
  });

  Widget createTestWidget() {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<SessionManager>(create: (_) => SessionManager()),
        ChangeNotifierProvider<ThemeController>(
          create: (_) => ThemeController(),
        ),
        ChangeNotifierProvider<AppState>(create: (_) => AppState()),
      ],
      child: const MaterialApp(home: LoginScreen()),
    );
  }

  group('LoginScreen Widget Tests', () {
    testWidgets('renders welcome title and login form fields correctly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pump(const Duration(seconds: 1)); // Let initial frame render

      // Verify the reference-styled auth card title is present
      expect(find.text('Welcome back'), findsOneWidget);
      expect(find.byType(AnimatedWavingHand), findsOneWidget);
      expect(find.text('👋'), findsOneWidget);

      // Verify form elements exist (Email & Password fields)
      expect(find.byType(TextField), findsAtLeast(2));
    });

    testWidgets('shows primary sign-in controls and account options', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pump(const Duration(seconds: 1)); // Let initial frame render

      // Primary sign-in action and account helpers are present
      expect(find.text('Sign in'), findsWidgets);
      expect(find.text('Remember me'), findsOneWidget);
      expect(find.text('Forgot password?'), findsOneWidget);
      expect(find.text('Sign in with OTP'), findsOneWidget);
    });
  });
}
