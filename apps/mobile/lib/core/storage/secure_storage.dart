import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _tokenKey          = 'auth_token';
  static const _userIdKey         = 'user_id';
  static const _userEmailKey      = 'user_email';
  static const _deviceIdKey       = 'device_id';
  static const _deviceStatusKey   = 'device_status';   // ACTIVE | INACTIVE | SUSPENDED
  static const _activationTokenKey = 'activation_token'; // raw token user typed

  // ── JWT ──────────────────────────────────────────────────────────────────
  Future<void> saveToken(String token) async =>
      _storage.write(key: _tokenKey, value: token);

  Future<String?> getToken() async =>
      _storage.read(key: _tokenKey);

  Future<void> clearToken() async =>
      _storage.delete(key: _tokenKey);

  // ── User ─────────────────────────────────────────────────────────────────
  Future<void> saveUserId(String id) async =>
      _storage.write(key: _userIdKey, value: id);

  Future<String?> getUserId() async =>
      _storage.read(key: _userIdKey);

  Future<void> saveUserEmail(String email) async =>
      _storage.write(key: _userEmailKey, value: email);

  Future<String?> getUserEmail() async =>
      _storage.read(key: _userEmailKey);

  // ── Device ───────────────────────────────────────────────────────────────
  Future<void> saveDeviceId(String id) async =>
      _storage.write(key: _deviceIdKey, value: id);

  Future<String?> getDeviceId() async =>
      _storage.read(key: _deviceIdKey);

  Future<void> saveDeviceStatus(String status) async =>
      _storage.write(key: _deviceStatusKey, value: status);

  Future<String?> getDeviceStatus() async =>
      _storage.read(key: _deviceStatusKey);

  Future<void> saveActivationToken(String token) async =>
      _storage.write(key: _activationTokenKey, value: token);

  Future<String?> getActivationToken() async =>
      _storage.read(key: _activationTokenKey);

  // ── Helpers ──────────────────────────────────────────────────────────────
  Future<bool> isAuthenticated() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  Future<bool> isDeviceActivated() async {
    final status = await getDeviceStatus();
    final token  = await getToken();
    return status == 'ACTIVE' && token != null && token.isNotEmpty;
  }

  Future<void> clearAll() async => _storage.deleteAll();
}
