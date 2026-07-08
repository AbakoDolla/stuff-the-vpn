import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/models.dart';

/// API Service for communicating with the SXB VPN backend
class ApiService {
  // Use environment variable for security - this is obfuscated in release builds
  static String get _baseUrl {
    // In debug mode, use localhost or env var
    // In release, use the build-time injected URL
    if (kDebugMode) {
      return const String.fromEnvironment(
        'BACKEND_URL',
        defaultValue: 'https://vpnsxb.afrihall.com/api',
      );
    }
    // In release, the URL is injected at build time
    return const String.fromEnvironment(
      'BACKEND_URL',
      defaultValue: 'https://vpnsxb.afrihall.com/api',
    );
  }
  
  String? _authToken;
  static ApiService? _instance;

  ApiService._();

  static ApiService get instance {
    _instance ??= ApiService._();
    return _instance!;
  }

  void setAuthToken(String? token) {
    _authToken = token;
  }

  Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    
    final error = body['message'] ?? body['error'] ?? 'Unknown error';
    throw ApiException(error.toString(), response.statusCode);
  }

  // ============ AUTHENTICATION ============

  /// Activate a device with a token
  Future<Device> activateDevice({
    required String deviceId,
    required String token,
    String? deviceName,
    String? brand,
    String? model,
    String? osVersion,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/devices/activate'),
      headers: _headers,
      body: jsonEncode({
        'deviceId': deviceId,
        'token': token,
        'deviceName': deviceName,
        'brand': brand,
        'model': model,
        'osVersion': osVersion,
      }),
    );
    
    final data = await _handleResponse(response);
    return Device.fromJson(data['data'] ?? data);
  }

  /// Check if a device is authorized
  Future<Device?> checkDeviceAuthorization(String deviceId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/devices/$deviceId/status'),
        headers: _headers,
      );
      
      if (response.statusCode == 404) {
        return null;
      }
      
      final data = await _handleResponse(response);
      return Device.fromJson(data['data'] ?? data);
    } catch (e) {
      return null;
    }
  }

  // ============ SYNC & DATA ============

  /// Sync device data with backend
  Future<Map<String, dynamic>> syncDevice(String deviceId) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/devices/$deviceId/sync'),
      headers: _headers,
    );
    
    return await _handleResponse(response);
  }

  /// Get user quota information
  Future<Quota> getQuota() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/quotas'),
      headers: _headers,
    );
    
    final data = await _handleResponse(response);
    final quotas = data['data'] as List<dynamic>?;
    if (quotas != null && quotas.isNotEmpty) {
      return Quota.fromJson(quotas.first as Map<String, dynamic>);
    }
    throw ApiException('No quota data found', 404);
  }

  /// Get user profile
  Future<User> getUserProfile() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/users/me'),
      headers: _headers,
    );
    
    final data = await _handleResponse(response);
    return User.fromJson(data['data'] ?? data);
  }

  /// Get notifications
  Future<List<AppNotification>> getNotifications({int limit = 50}) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/notifications?limit=$limit'),
      headers: _headers,
    );
    
    final data = await _handleResponse(response);
    final notifications = data['data'] as List<dynamic>?;
    return notifications
        ?.map((n) => AppNotification.fromJson(n as Map<String, dynamic>))
        .toList() ?? [];
  }

  /// Mark notification as read
  Future<void> markNotificationRead(String notificationId) async {
    await http.patch(
      Uri.parse('$_baseUrl/notifications/$notificationId/read'),
      headers: _headers,
    );
  }

  /// Mark all notifications as read
  Future<void> markAllNotificationsRead() async {
    await http.patch(
      Uri.parse('$_baseUrl/notifications/read-all'),
      headers: _headers,
    );
  }

  // ============ VPN CONFIGURATION ============

  /// Get VPN configuration for the device
  Future<VpnConfig?> getVpnConfig() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/vpn/config'),
        headers: _headers,
      );
      
      if (response.statusCode == 404) {
        return null;
      }
      
      final data = await _handleResponse(response);
      return VpnConfig.fromJson(data['data'] ?? data);
    } catch (e) {
      return null;
    }
  }

  /// Get public IP address
  Future<String> getPublicIp() async {
    try {
      final response = await http.get(
        Uri.parse('https://api.ipify.org?format=json'),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data['ip'] as String;
      }
    } catch (e) {
      // Fallback
    }
    return 'Unknown';
  }

  // ============ CONNECTION HISTORY ============

  /// Get connection history
  Future<List<ConnectionHistory>> getConnectionHistory({int limit = 50}) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/devices/history?limit=$limit'),
      headers: _headers,
    );
    
    final data = await _handleResponse(response);
    final history = data['data'] as List<dynamic>?;
    return history
        ?.map((h) => ConnectionHistory.fromJson(h as Map<String, dynamic>))
        .toList() ?? [];
  }

  // ============ APP INFO ============

  /// Get app version info
  Future<Map<String, dynamic>> getAppVersion() async {
    // This would typically fetch from backend
    // For now, return current version
    return {
      'version': '1.0.0',
      'buildNumber': 1,
      'minSupportedVersion': '1.0.0',
      'updateAvailable': false,
    };
  }
}

/// Custom API Exception
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}
