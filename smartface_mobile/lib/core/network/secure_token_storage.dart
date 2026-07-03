import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureTokenStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const String _keyToken = 'sf_auth_token';
  static const String _keyRefreshToken = 'sf_refresh_token';

  static Future<String?> getAccessToken() async => await _storage.read(key: _keyToken);
  static Future<String?> getRefreshToken() async => await _storage.read(key: _keyRefreshToken);

  static Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    await _storage.write(key: _keyToken, value: accessToken);
    await _storage.write(key: _keyRefreshToken, value: refreshToken);
  }

  static Future<void> saveAccessToken(String accessToken) async {
    await _storage.write(key: _keyToken, value: accessToken);
  }

  static Future<void> clearTokens() async {
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyRefreshToken);
  }
}
