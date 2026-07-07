import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';

/// Secure Storage Service for storing sensitive data
class StorageService {
  static StorageService? _instance;
  final FlutterSecureStorage _secureStorage;
  
  // Storage Keys
  static const String _keyDeviceId = 'device_id';
  static const String _keyDeviceToken = 'device_token';
  static const String _keyAuthToken = 'auth_token';
  static const String _keyDeviceData = 'device_data';
  static const String _keyUserData = 'user_data';
  static const String _keyQuotaData = 'quota_data';
  static const String _keyVpnConfig = 'vpn_config';
  static const String _keyLastSync = 'last_sync';
  static const String _keyLanguage = 'language';
  static const String _keyTheme = 'theme';
  static const String _keyNotificationsEnabled = 'notifications_enabled';
  static const String _keyAutoSyncEnabled = 'auto_sync_enabled';
  static const String _keyAutoLaunchEnabled = 'auto_launch_enabled';

  StorageService._() : _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
  );

  static StorageService get instance {
    _instance ??= StorageService._();
    return _instance!;
  }

  // ============ DEVICE ============

  /// Save device ID
  Future<void> saveDeviceId(String deviceId) async {
    await _secureStorage.write(key: _keyDeviceId, value: deviceId);
  }

  /// Get device ID
  Future<String?> getDeviceId() async {
    return await _secureStorage.read(key: _keyDeviceId);
  }

  /// Save device token
  Future<void> saveDeviceToken(String token) async {
    await _secureStorage.write(key: _keyDeviceToken, value: token);
  }

  /// Get device token
  Future<String?> getDeviceToken() async {
    return await _secureStorage.read(key: _keyDeviceToken);
  }

  /// Save auth token
  Future<void> saveAuthToken(String token) async {
    await _secureStorage.write(key: _keyAuthToken, value: token);
  }

  /// Get auth token
  Future<String?> getAuthToken() async {
    return await _secureStorage.read(key: _keyAuthToken);
  }

  /// Save device data
  Future<void> saveDevice(Device device) async {
    await _secureStorage.write(key: _keyDeviceData, value: jsonEncode(device.toJson()));
  }

  /// Get device data
  Future<Device?> getDevice() async {
    final data = await _secureStorage.read(key: _keyDeviceData);
    if (data != null) {
      return Device.fromJson(jsonDecode(data) as Map<String, dynamic>);
    }
    return null;
  }

  /// Clear device data (on logout/reset)
  Future<void> clearDeviceData() async {
    await _secureStorage.delete(key: _keyDeviceId);
    await _secureStorage.delete(key: _keyDeviceToken);
    await _secureStorage.delete(key: _keyAuthToken);
    await _secureStorage.delete(key: _keyDeviceData);
  }

  // ============ USER ============

  /// Save user data
  Future<void> saveUser(User user) async {
    await _secureStorage.write(key: _keyUserData, value: jsonEncode(user.toJson()));
  }

  /// Get user data
  Future<User?> getUser() async {
    final data = await _secureStorage.read(key: _keyUserData);
    if (data != null) {
      return User.fromJson(jsonDecode(data) as Map<String, dynamic>);
    }
    return null;
  }

  /// Clear user data
  Future<void> clearUserData() async {
    await _secureStorage.delete(key: _keyUserData);
  }

  // ============ QUOTA ============

  /// Save quota data
  Future<void> saveQuota(Quota quota) async {
    await _secureStorage.write(key: _keyQuotaData, value: jsonEncode(quota.toJson()));
  }

  /// Get quota data
  Future<Quota?> getQuota() async {
    final data = await _secureStorage.read(key: _keyQuotaData);
    if (data != null) {
      return Quota.fromJson(jsonDecode(data) as Map<String, dynamic>);
    }
    return null;
  }

  // ============ VPN CONFIG ============

  /// Save VPN configuration
  Future<void> saveVpnConfig(VpnConfig config) async {
    await _secureStorage.write(key: _keyVpnConfig, value: jsonEncode(config.toJson()));
  }

  /// Get VPN configuration
  Future<VpnConfig?> getVpnConfig() async {
    final data = await _secureStorage.read(key: _keyVpnConfig);
    if (data != null) {
      return VpnConfig.fromJson(jsonDecode(data) as Map<String, dynamic>);
    }
    return null;
  }

  // ============ SYNC ============

  /// Save last sync time
  Future<void> saveLastSync(DateTime dateTime) async {
    await _secureStorage.write(key: _keyLastSync, value: dateTime.toIso8601String());
  }

  /// Get last sync time
  Future<DateTime?> getLastSync() async {
    final data = await _secureStorage.read(key: _keyLastSync);
    if (data != null) {
      return DateTime.parse(data);
    }
    return null;
  }

  // ============ SETTINGS ============

  /// Save language preference
  Future<void> saveLanguage(String languageCode) async {
    await _secureStorage.write(key: _keyLanguage, value: languageCode);
  }

  /// Get language preference
  Future<String> getLanguage() async {
    final lang = await _secureStorage.read(key: _keyLanguage);
    return lang ?? 'fr';
  }

  /// Save theme preference
  Future<void> saveTheme(String theme) async {
    await _secureStorage.write(key: _keyTheme, value: theme);
  }

  /// Get theme preference
  Future<String> getTheme() async {
    final theme = await _secureStorage.read(key: _keyTheme);
    return theme ?? 'dark';
  }

  /// Save notifications enabled setting
  Future<void> saveNotificationsEnabled(bool enabled) async {
    await _secureStorage.write(key: _keyNotificationsEnabled, value: enabled.toString());
  }

  /// Get notifications enabled setting
  Future<bool> getNotificationsEnabled() async {
    final enabled = await _secureStorage.read(key: _keyNotificationsEnabled);
    return enabled != 'false';
  }

  /// Save auto sync enabled setting
  Future<void> saveAutoSyncEnabled(bool enabled) async {
    await _secureStorage.write(key: _keyAutoSyncEnabled, value: enabled.toString());
  }

  /// Get auto sync enabled setting
  Future<bool> getAutoSyncEnabled() async {
    final enabled = await _secureStorage.read(key: _keyAutoSyncEnabled);
    return enabled != 'false';
  }

  /// Save auto launch enabled setting
  Future<void> saveAutoLaunchEnabled(bool enabled) async {
    await _secureStorage.write(key: _keyAutoLaunchEnabled, value: enabled.toString());
  }

  /// Get auto launch enabled setting
  Future<bool> getAutoLaunchEnabled() async {
    final enabled = await _secureStorage.read(key: _keyAutoLaunchEnabled);
    return enabled != 'false';
  }

  // ============ CLEAR ALL ============

  /// Clear all stored data
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
  }
}
