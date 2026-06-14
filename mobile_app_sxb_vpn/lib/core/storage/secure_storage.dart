import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _tokenKey = 'auth_token';
  static const _userIdKey = 'user_id';
  static const _userEmailKey = 'user_email';

  Future<void> saveToken(String token) async =>
      _storage.write(key: _tokenKey, value: token);

  Future<String?> getToken() async =>
      _storage.read(key: _tokenKey);

  Future<void> clearToken() async =>
      _storage.delete(key: _tokenKey);

  Future<void> saveUserId(String id) async =>
      _storage.write(key: _userIdKey, value: id);

  Future<String?> getUserId() async =>
      _storage.read(key: _userIdKey);

  Future<void> saveUserEmail(String email) async =>
      _storage.write(key: _userEmailKey, value: email);

  Future<String?> getUserEmail() async =>
      _storage.read(key: _userEmailKey);

  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> clearAll() async => _storage.deleteAll();
}
