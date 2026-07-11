import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  // encryptedSharedPreferences désactivé : cause des crashs natifs au premier
  // lancement sur certains appareils/versions Android (bug connu du Keystore
  // AndroidX Security). Le stockage reste chiffré via le Keystore par défaut
  // du plugin (AES sur fichier), juste sans le wrapper EncryptedSharedPreferences.
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
  );

  static const _tokenKey          = 'auth_token';
  static const _userIdKey         = 'user_id';
  static const _userEmailKey      = 'user_email';
  static const _deviceIdKey       = 'device_id';
  static const _deviceStatusKey   = 'device_status';   // ACTIVE | INACTIVE | SUSPENDED
  static const _activationTokenKey = 'activation_token'; // raw token user typed

  // ── JWT ──────────────────────────────────────────────────────────────────
  Future<void> saveToken(String token) async {
    try { await _storage.write(key: _tokenKey, value: token); } catch (_) {}
  }

  Future<String?> getToken() async {
    try { return await _storage.read(key: _tokenKey); } catch (_) { return null; }
  }

  Future<void> clearToken() async {
    try { await _storage.delete(key: _tokenKey); } catch (_) {}
  }

  // ── User ─────────────────────────────────────────────────────────────────
  Future<void> saveUserId(String id) async {
    try { await _storage.write(key: _userIdKey, value: id); } catch (_) {}
  }

  Future<String?> getUserId() async {
    try { return await _storage.read(key: _userIdKey); } catch (_) { return null; }
  }

  Future<void> saveUserEmail(String email) async {
    try { await _storage.write(key: _userEmailKey, value: email); } catch (_) {}
  }

  Future<String?> getUserEmail() async {
    try { return await _storage.read(key: _userEmailKey); } catch (_) { return null; }
  }

  // ── Device ───────────────────────────────────────────────────────────────
  Future<void> saveDeviceId(String id) async {
    try { await _storage.write(key: _deviceIdKey, value: id); } catch (_) {}
  }

  Future<String?> getDeviceId() async {
    try { return await _storage.read(key: _deviceIdKey); } catch (_) { return null; }
  }

  Future<void> saveDeviceStatus(String status) async {
    try { await _storage.write(key: _deviceStatusKey, value: status); } catch (_) {}
  }

  Future<String?> getDeviceStatus() async {
    try { return await _storage.read(key: _deviceStatusKey); } catch (_) { return null; }
  }

  Future<void> saveActivationToken(String token) async {
    try { await _storage.write(key: _activationTokenKey, value: token); } catch (_) {}
  }

  Future<String?> getActivationToken() async {
    try { return await _storage.read(key: _activationTokenKey); } catch (_) { return null; }
  }

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

  Future<void> clearAll() async {
    try { await _storage.deleteAll(); } catch (_) {}
  }
}
