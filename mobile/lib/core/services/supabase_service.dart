import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static SupabaseService? _instance;
  static SupabaseService get instance => _instance ??= SupabaseService._();

  SupabaseService._();

  bool _isInitialized = false;
  bool get isInitialized => _isInitialized;

  SupabaseClient get client => Supabase.instance.client;

  /// Initializes Supabase with project credentials from environment
  Future<void> initialize() async {
    if (_isInitialized) return;

    final url = dotenv.env['SUPABASE_URL'];
    final publishableKey = dotenv.env['SUPABASE_ANON_KEY'];

    if (url == null || publishableKey == null) {
      debugPrint('⚠️ Supabase credentials not found in environment');
      return;
    }

    try {
      await Supabase.initialize(
        url: url,
        publishableKey: publishableKey,
        debug: kDebugMode,
      );
      _isInitialized = true;
      debugPrint('✅ Supabase initialized successfully for SmartFace');
    } catch (e) {
      debugPrint('⚠️ Supabase initialization failed: $e');
    }
  }

  /// Listen to real-time attendance logs for a specific student
  Stream<List<Map<String, dynamic>>> streamStudentAttendance(String studentId) {
    return client
        .from('attendance_logs')
        .stream(primaryKey: ['id'])
        .eq('student_id', studentId)
        .order('marked_at', ascending: false);
  }

  /// Upload avatar or biometric capture image to Supabase Storage
  Future<String?> uploadAvatar({
    required String studentId,
    required File imageFile,
  }) async {
    try {
      final fileName = '$studentId/${DateTime.now().millisecondsSinceEpoch}.jpg';
      await client.storage.from('avatars').upload(
            fileName,
            imageFile,
            fileOptions: const FileOptions(cacheControl: '3600', upsert: true),
          );

      final publicUrl = client.storage.from('avatars').getPublicUrl(fileName);
      return publicUrl;
    } catch (e) {
      debugPrint('Error uploading image to Supabase storage: $e');
      return null;
    }
  }
}

